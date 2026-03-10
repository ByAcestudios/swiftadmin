'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Edit, Save, Info, Clock, Calendar, HelpCircle, Smartphone, Mail, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

/* eslint-disable react-hooks/exhaustive-deps */

const defaultPlatformVersion = () => ({
  minVersion: '',
  latestVersion: '',
  forceUpdate: false,
  releaseNotes: ''
});

const defaultAppVersions = () => ({
  rider: { android: defaultPlatformVersion(), ios: defaultPlatformVersion() },
  user: { android: defaultPlatformVersion(), ios: defaultPlatformVersion() }
});

const SettingsPage = () => {
  const [settingsData, setSettingsData] = useState({
    config: {},
    settings: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);

  // App Version Control (per docs/versionControl.md)
  const [appVersions, setAppVersions] = useState(null);
  const [versionControlLoading, setVersionControlLoading] = useState(true);
  const [versionControlSaving, setVersionControlSaving] = useState(false);
  const [versionControlEditing, setVersionControlEditing] = useState(false);

  // Admin Notifications (per docs/admin-notifications.md)
  const defaultAdminNotificationSettings = () => ({ enabled: false, emails: [] });
  const [adminNotificationSettings, setAdminNotificationSettings] = useState(defaultAdminNotificationSettings);
  const [adminNotificationSaving, setAdminNotificationSaving] = useState(false);
  const adminNotificationSyncedRef = useRef(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync admin notification settings from server once when settings load
  useEffect(() => {
    if (adminNotificationSyncedRef.current || !settingsData.settings?.length) return;
    const setting = settingsData.settings.find(s => s.key && s.key.toLowerCase() === 'adminnotificationsettings');
    const raw = setting?.value;
    const parsed = tryParseJSON(raw);
    if (parsed && typeof parsed === 'object') {
      adminNotificationSyncedRef.current = true;
      setAdminNotificationSettings({
        enabled: !!parsed.enabled,
        emails: Array.isArray(parsed.emails) ? parsed.emails.filter(e => typeof e === 'string' && e.trim()) : []
      });
    }
  }, [settingsData.settings]);

  useEffect(() => {
    const fetchAppVersions = async () => {
      try {
        setVersionControlLoading(true);
        const res = await api.get('/api/settings/app-versions');
        const data = res.data;
        if (data && (data.rider || data.user)) {
          setAppVersions({
            rider: {
              android: { ...defaultPlatformVersion(), ...data.rider?.android },
              ios: { ...defaultPlatformVersion(), ...data.rider?.ios }
            },
            user: {
              android: { ...defaultPlatformVersion(), ...data.user?.android },
              ios: { ...defaultPlatformVersion(), ...data.user?.ios }
            }
          });
        } else {
          setAppVersions(defaultAppVersions());
        }
      } catch (e) {
        console.error('Failed to load app versions:', e);
        setAppVersions(defaultAppVersions());
      } finally {
        setVersionControlLoading(false);
      }
    };
    fetchAppVersions();
  }, []);

  const slugify = (s) => (s || '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/[\s-]+/g, '-').replace(/^-|-$/g, '');

  const tryParseJSON = (str) => {
    try {
      // If it's already an object/array, return as is
      if (typeof str !== 'string') return str;

      // Try to parse once
      let parsed = JSON.parse(str);

      // Check if the result is still a stringified JSON
      if (typeof parsed === 'string') {
        try {
          // Try to parse again
          return JSON.parse(parsed);
        } catch {
          // If second parse fails, return first parse result
          return parsed;
        }
      }

      return parsed;
    } catch (e) {
      // If parsing fails, return original value
      return str;
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings');
      
      console.log('Settings response:', response.data);
      
      // Add defensive checks
      if (!response.data || !response.data.config || !response.data.settings) {
        console.error('Invalid settings response:', response.data);
        setError('Invalid settings data received');
        return;
      }

      // Create a map of existing settings with case-insensitive keys
      const existingSettings = response.data.settings.reduce((acc, setting) => {
        if (!setting || !setting.key) return acc;
        
        // Store settings with lowercase keys for case-insensitive matching
        const lowerKey = setting.key.toLowerCase();
        
        // Find the correct category from config
        const category = Object.keys(response.data.config || {}).find(cat => 
          response.data.config[cat]?.settings && 
          Object.keys(response.data.config[cat].settings)
            .map(k => k.toLowerCase())
            .includes(lowerKey)
        ) || setting.category || 'general';

        return {
          ...acc,
          [lowerKey]: {
            ...setting,
            category
          }
        };
      }, {});

      // Create settings array from config
      const configuredSettings = Object.entries(response.data.config || {}).flatMap(([category, categoryData]) => {
        if (!categoryData?.settings) return [];
        
        return Object.keys(categoryData.settings).map(key => {
          const lowerKey = key.toLowerCase();
          const existingSetting = existingSettings[lowerKey];
          
          return {
            key,
            value: existingSetting?.value ?? null,
            category,
            isPublic: existingSetting?.isPublic ?? true,
            description: existingSetting?.description ?? categoryData.settings[key]?.description ?? '',
            id: existingSetting?.id ?? null
          };
        });
      });

      // Merge with any existing settings that aren't in config
      const additionalSettings = response.data.settings.filter(
        setting => setting && setting.key && !configuredSettings.some(s => s.key.toLowerCase() === setting.key.toLowerCase())
      );

      setSettingsData({
        config: response.data.config || {},
        settings: [...configuredSettings, ...additionalSettings]
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Create a map of correct key cases from config
      const keyMap = Object.entries(settingsData.config).reduce((acc, [category, categoryData]) => {
        Object.keys(categoryData.settings || {}).forEach(key => {
          acc[key.toLowerCase()] = key;
        });
        return acc;
      }, {});

      // Use correct case when building settings object
      const settingsToUpdate = settingsData.settings.reduce((acc, setting) => {
        const correctKey = keyMap[setting.key.toLowerCase()] || setting.key;
        return {
          ...acc,
          [correctKey]: setting.value
        };
      }, {});

      console.log('Sending settings update:', { settings: settingsToUpdate });

      await api.post('/api/settings/bulk-update', { settings: settingsToUpdate });
      setIsEditing(false);
      await fetchSettings();
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Save error details:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    // Use the original case from config when updating state
    const correctKey = Object.entries(settingsData.config).reduce((acc, [category, categoryData]) => {
      const foundKey = Object.keys(categoryData.settings || {}).find(k => 
        k.toLowerCase() === key.toLowerCase()
      );
      return foundKey || acc;
    }, key);

    setSettingsData(prev => ({
      ...prev,
      settings: prev.settings.map(setting => 
        setting.key.toLowerCase() === key.toLowerCase()
          ? { ...setting, key: correctKey, value } 
          : setting
      )
    }));
  };

  const getSettingConfig = (category, key) => {
    // Find setting config case-insensitively
    const categoryConfig = settingsData.config[category];
    if (!categoryConfig?.settings) return {};

    const configKey = Object.keys(categoryConfig.settings).find(k => 
      k.toLowerCase() === key.toLowerCase()
    );
    
    return configKey ? categoryConfig.settings[configKey] : {};
  };

  const getSettingValue = (key) => {
    // Find setting case-insensitively
    const setting = settingsData.settings.find(s => 
      s.key.toLowerCase() === key.toLowerCase()
    );
    
    if (!setting) {
      console.log(`No setting found for key: ${key}`);
      const newSetting = {
        key,
        value: null,
        category: Object.keys(settingsData.config).find(category => 
          settingsData.config[category].settings[key]
        )
      };
      setSettingsData(prev => ({
        ...prev,
        settings: [...prev.settings, newSetting]
      }));
      return null;
    }
    
    console.log(`Found setting for ${key}:`, setting); // Debug log
    
    // For select fields, if value is empty string, return the default value from config
    const config = getSettingConfig(setting.category, key);
    if (config.type === 'select' && (setting.value === '' || setting.value === null)) {
      return config.defaultValue || '';
    }
    
    // For delivery restrictions, ensure proper structure
    const isDeliveryRestriction = config.type === 'deliveryRestriction' || 
                                  key.toLowerCase().includes('deliveryrestrictions') ||
                                  key.toLowerCase().includes('deliveryrestriction');
    
    if (isDeliveryRestriction) {
      if (!setting.value || typeof setting.value !== 'object') {
        return { enabled: true, pauseUntil: null, dailyCutoff: null, dailyStart: null };
      }
      return {
        enabled: setting.value.enabled ?? true,
        pauseUntil: setting.value.pauseUntil ?? null,
        dailyCutoff: setting.value.dailyCutoff ?? null,
        dailyStart: setting.value.dailyStart ?? null
      };
    }
    
    return setting.value;
  };

  const renderSettingInput = (category, key) => {
    const config = getSettingConfig(category, key);
    const value = getSettingValue(key);

    console.log(`Rendering input for ${key}:`, { config, value, category }); // Debug log

    // Check if this is a delivery restriction by key name (prioritize this over config type)
    const isDeliveryRestriction = key.toLowerCase().includes('deliveryrestrictions') || 
                                  key.toLowerCase().includes('deliveryrestriction');
    
    // For delivery restrictions, always use the custom renderer regardless of config type
    // Otherwise use config type if available, or infer from key name
    const inputType = isDeliveryRestriction ? 'deliveryRestriction' : (config.type || 'string');

    console.log(`Input type for ${key}:`, inputType, 'isDeliveryRestriction:', isDeliveryRestriction, 'config.type:', config.type);

    switch (inputType) {
      case 'number':
        return (
          <Input
            type="text"
            value={value?.toString() ?? ''}
            onChange={(e) => {
              const newValue = e.target.value.replace(/[^\d.]/g, '');
              if (newValue === '' || !isNaN(newValue)) {
                handleChange(key, newValue === '' ? '' : Number(newValue));
              }
            }}
            onBlur={(e) => {
              let num = Number(e.target.value);
              if (!isNaN(num)) {
                const { min, max } = config.validation || {};
                if (min !== undefined) num = Math.max(min, num);
                if (max !== undefined) num = Math.min(max, num);
                handleChange(key, num);
              }
            }}
            disabled={!isEditing}
            className="font-mono"
          />
        );

      case 'select':
        return (
          <Select
            value={value ?? config.defaultValue ?? ''}
            onValueChange={(value) => handleChange(key, value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${config.label}`} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map(option => {
                // Handle both string options and object options
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case 'timeRange':
        const times = value || { from: '09:00', to: '17:00' };
        return (
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <Label>From</Label>
              <Input
                type="time"
                value={times.from}
                onChange={(e) => handleChange(key, { ...times, from: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>To</Label>
              <Input
                type="time"
                value={times.to}
                onChange={(e) => handleChange(key, { ...times, to: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        );

      case 'array':
        const items = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index] = e.target.value;
                    handleChange(key, newItems);
                  }}
                  disabled={!isEditing}
                />
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newItems = items.filter((_, i) => i !== index);
                      handleChange(key, newItems);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => handleChange(key, [...items, ''])}
              >
                Add Item
              </Button>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={key}
              checked={value ?? false}
              onChange={(e) => handleChange(key, e.target.checked)}
              disabled={!isEditing}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor={key}>
              {value ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        );

      case 'deliveryRestriction':
        const restriction = value || { enabled: true, pauseUntil: null, dailyCutoff: null, dailyStart: null };
        const deliveryType = key.includes('instant') ? 'Instant' : key.includes('sameDay') ? 'Same Day' : 'Next Day';
        
        return (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            {/* Enabled Toggle */}
            <div className="flex items-center justify-between">
              <Label className="font-medium">Enable {deliveryType} Deliveries</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${key}-enabled`}
                  checked={restriction.enabled ?? true}
                  onChange={(e) => handleChange(key, { ...restriction, enabled: e.target.checked })}
                  disabled={!isEditing}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor={`${key}-enabled`} className="text-sm">
                  {restriction.enabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>

            {restriction.enabled && (
              <>
                {/* Pause Until */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Pause Until (Temporary)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="datetime-local"
                      value={restriction.pauseUntil ? new Date(restriction.pauseUntil).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          const isoString = new Date(dateValue).toISOString();
                          handleChange(key, { ...restriction, pauseUntil: isoString });
                        } else {
                          handleChange(key, { ...restriction, pauseUntil: null });
                        }
                      }}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    {restriction.pauseUntil && isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange(key, { ...restriction, pauseUntil: null })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {restriction.pauseUntil && (
                    <p className="text-xs text-blue-600">
                      Paused until: {new Date(restriction.pauseUntil).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Daily Start Time */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Start Time
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={restriction.dailyStart || ''}
                      onChange={(e) => handleChange(key, { ...restriction, dailyStart: e.target.value || null })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    {restriction.dailyStart && isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange(key, { ...restriction, dailyStart: null })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Start accepting orders from this time each day. Leave empty for no restriction.
                  </p>
                </div>

                {/* Daily Cutoff Time */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Cutoff Time
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={restriction.dailyCutoff || ''}
                      onChange={(e) => handleChange(key, { ...restriction, dailyCutoff: e.target.value || null })}
                      disabled={!isEditing}
                      className="flex-1"
                    />
                    {restriction.dailyCutoff && isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange(key, { ...restriction, dailyCutoff: null })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Stop accepting orders after this time each day. Leave empty for no restriction.
                  </p>
                </div>

                {/* Quick Actions */}
                {isEditing && (
                  <div className="pt-2 border-t flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                        handleChange(key, { ...restriction, pauseUntil: twoHoursLater.toISOString() });
                      }}
                      className="text-xs"
                    >
                      Pause 2 Hours
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                        handleChange(key, { ...restriction, pauseUntil: oneDayLater.toISOString() });
                      }}
                      className="text-xs"
                    >
                      Pause 24 Hours
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChange(key, { enabled: true, pauseUntil: null, dailyCutoff: null, dailyStart: null })}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        // If value is an object and it looks like a delivery restriction, render it as such
        if (isDeliveryRestriction && typeof value === 'object' && value !== null) {
          // Fallback: render delivery restriction UI even if type wasn't detected
          const restriction = value || { enabled: true, pauseUntil: null, dailyCutoff: null, dailyStart: null };
          const deliveryType = key.includes('instant') ? 'Instant' : key.includes('sameDay') ? 'Same Day' : 'Next Day';
          
          return (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              {/* Enabled Toggle */}
              <div className="flex items-center justify-between">
                <Label className="font-medium">Enable {deliveryType} Deliveries</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${key}-enabled`}
                    checked={restriction.enabled ?? true}
                    onChange={(e) => handleChange(key, { ...restriction, enabled: e.target.checked })}
                    disabled={!isEditing}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor={`${key}-enabled`} className="text-sm">
                    {restriction.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>

              {restriction.enabled && (
                <>
                  {/* Pause Until */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Pause Until (Temporary)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={restriction.pauseUntil ? new Date(restriction.pauseUntil).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          if (dateValue) {
                            const isoString = new Date(dateValue).toISOString();
                            handleChange(key, { ...restriction, pauseUntil: isoString });
                          } else {
                            handleChange(key, { ...restriction, pauseUntil: null });
                          }
                        }}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      {restriction.pauseUntil && isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange(key, { ...restriction, pauseUntil: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {restriction.pauseUntil && (
                      <p className="text-xs text-blue-600">
                        Paused until: {new Date(restriction.pauseUntil).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Daily Start Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Daily Start Time
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={restriction.dailyStart || ''}
                        onChange={(e) => handleChange(key, { ...restriction, dailyStart: e.target.value || null })}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      {restriction.dailyStart && isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange(key, { ...restriction, dailyStart: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Daily Cutoff Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Daily Cutoff Time
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={restriction.dailyCutoff || ''}
                        onChange={(e) => handleChange(key, { ...restriction, dailyCutoff: e.target.value || null })}
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      {restriction.dailyCutoff && isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange(key, { ...restriction, dailyCutoff: null })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {isEditing && (
                    <div className="pt-2 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                          handleChange(key, { ...restriction, pauseUntil: twoHoursLater.toISOString() });
                        }}
                        className="text-xs"
                      >
                        Pause 2 Hours
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                          handleChange(key, { ...restriction, pauseUntil: oneDayLater.toISOString() });
                        }}
                        className="text-xs"
                      >
                        Pause 24 Hours
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange(key, { enabled: true, pauseUntil: null, dailyCutoff: null, dailyStart: null })}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        }
        
        // Regular string input
        return (
          <Input
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value ?? '').toString()}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={!isEditing}
          />
        );
    }
  };

  const handleSectionEdit = (category) => {
    setIsEditing(true);
  };

  const handleSectionSave = async () => {
    await handleSave();
  };

  const setVersionField = (app, platform, field, value) => {
    setAppVersions(prev => {
      const next = prev ? { ...prev } : defaultAppVersions();
      const plat = next[app]?.[platform] ? { ...next[app][platform] } : defaultPlatformVersion();
      plat[field] = value;
      next[app] = { ...next[app], [platform]: plat };
      return next;
    });
  };

  const fetchAppVersions = async () => {
    try {
      const res = await api.get('/api/settings/app-versions');
      const data = res.data;
      if (data && (data.rider || data.user)) {
        setAppVersions({
          rider: {
            android: { ...defaultPlatformVersion(), ...data.rider?.android },
            ios: { ...defaultPlatformVersion(), ...data.rider?.ios }
          },
          user: {
            android: { ...defaultPlatformVersion(), ...data.user?.android },
            ios: { ...defaultPlatformVersion(), ...data.user?.ios }
          }
        });
      }
    } catch (e) {
      console.error('Failed to load app versions:', e);
    }
  };

  const saveAppVersionRider = async () => {
    if (!appVersions?.rider) return;
    try {
      setVersionControlSaving(true);
      await api.put('/api/settings/appVersionRider', { value: appVersions.rider });
      setSuccessMessage('Rider app versions saved.');
      setTimeout(() => setSuccessMessage(null), 3000);
      setVersionControlEditing(false);
      await fetchAppVersions();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save rider app versions.');
    } finally {
      setVersionControlSaving(false);
    }
  };

  const saveAppVersionUser = async () => {
    if (!appVersions?.user) return;
    try {
      setVersionControlSaving(true);
      await api.put('/api/settings/appVersionUser', { value: appVersions.user });
      setSuccessMessage('User app versions saved.');
      setTimeout(() => setSuccessMessage(null), 3000);
      setVersionControlEditing(false);
      await fetchAppVersions();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save user app versions.');
    } finally {
      setVersionControlSaving(false);
    }
  };

  const saveAllVersionControl = async () => {
    await saveAppVersionRider();
    await saveAppVersionUser();
  };

  // Admin Notifications: update local state
  const setAdminNotificationEnabled = (enabled) => {
    setAdminNotificationSettings(prev => ({ ...prev, enabled }));
  };
  const setAdminNotificationEmails = (emails) => {
    setAdminNotificationSettings(prev => ({ ...prev, emails }));
  };
  const addAdminNotificationEmail = () => {
    setAdminNotificationSettings(prev => ({ ...prev, emails: [...(prev.emails || []), ''] }));
  };
  const updateAdminNotificationEmail = (index, value) => {
    setAdminNotificationSettings(prev => {
      const next = [...(prev.emails || [])];
      next[index] = value;
      return { ...prev, emails: next };
    });
  };
  const removeAdminNotificationEmail = (index) => {
    setAdminNotificationSettings(prev => ({
      ...prev,
      emails: (prev.emails || []).filter((_, i) => i !== index)
    }));
  };

  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());

  const saveAdminNotificationSettings = async () => {
    const emails = (adminNotificationSettings.emails || [])
      .map(e => (e || '').trim())
      .filter(Boolean);
    const uniqueEmails = [...new Set(emails)];
    const invalid = uniqueEmails.filter(e => !isValidEmail(e));
    if (invalid.length > 0) {
      setError(`Invalid email(s): ${invalid.join(', ')}`);
      return;
    }
    try {
      setAdminNotificationSaving(true);
      setError(null);
      await api.put('/api/settings/adminNotificationSettings', {
        value: {
          enabled: !!adminNotificationSettings.enabled,
          emails: uniqueEmails
        }
      });
      setSuccessMessage('Admin notification settings saved.');
      setTimeout(() => setSuccessMessage(null), 3000);
      setAdminNotificationSettings(prev => ({ ...prev, emails: uniqueEmails }));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save admin notification settings.');
    } finally {
      setAdminNotificationSaving(false);
    }
  };

  // Scroll to section when URL has hash (e.g. from sidebar link)
  useEffect(() => {
    if (initialLoad || typeof window === 'undefined') return;
    const hash = window.location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialLoad]);

  if (initialLoad) return <div>Loading settings...</div>;
  if (error) return (
    <div className="p-4 text-red-500 bg-red-50 rounded">
      <h3 className="font-bold">Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button
          variant="outline"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <Info className="h-4 w-4 mr-2" />
          Help
        </Button>
      </div>

      {Object.entries(settingsData.config || {}).map(([category, categoryData]) => (
        <div key={category} id={slugify(category)} className="bg-white rounded-lg shadow p-6 scroll-mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{categoryData.label}</h2>
            <div>
              {isEditing ? (
                <Button 
                  onClick={handleSectionSave}
                  disabled={loading}
                  className="ml-2"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button 
                  onClick={() => handleSectionEdit(category)}
                  disabled={loading}
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Section
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(categoryData.settings || {}).map(([key, setting]) => {
              const existingSetting = settingsData.settings.find(s => 
                s.key.toLowerCase() === key.toLowerCase()
              );
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">
                        {setting.label}
                      </Label>
                      {setting.description && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label="Show description"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-3 text-sm">
                            <p className="text-gray-700">{setting.description}</p>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                  {renderSettingInput(category, key)}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Delivery Restrictions Section - Show even if not in config */}
      {(() => {
        const deliveryRestrictionKeys = [
          'instantDeliveryRestrictions',
          'sameDayDeliveryRestrictions',
          'nextDayDeliveryRestrictions'
        ];
        
        const deliveryRestrictions = deliveryRestrictionKeys
          .map(key => {
            const setting = settingsData.settings.find(s => 
              s.key.toLowerCase() === key.toLowerCase()
            );
            // Check if it's already shown in a config category
            const inConfig = Object.entries(settingsData.config || {}).some(([category, categoryData]) =>
              Object.keys(categoryData.settings || {}).some(k => k.toLowerCase() === key.toLowerCase())
            );
            
            if (!setting && !inConfig) {
              // Create a default setting if it doesn't exist
              return {
                key,
                value: { enabled: true, pauseUntil: null, dailyCutoff: null, dailyStart: null },
                category: 'deliveryRestrictions',
                isPublic: true,
                description: `Time-based restrictions for ${key.replace('Restrictions', '').replace(/([A-Z])/g, ' $1').trim()} deliveries`
              };
            }
            
            return setting && !inConfig ? { ...setting, category: 'deliveryRestrictions' } : null;
          })
          .filter(Boolean);
        
        if (deliveryRestrictions.length === 0) return null;
        
        return (
          <div id="delivery-restrictions" className="bg-white rounded-lg shadow p-6 scroll-mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delivery Restrictions</h2>
              <div>
                {isEditing ? (
                  <Button 
                    onClick={handleSectionSave}
                    disabled={loading}
                    className="ml-2"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSectionEdit('deliveryRestrictions')}
                    disabled={loading}
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Section
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {deliveryRestrictions.map((setting) => {
                const deliveryType = setting.key.includes('instant') ? 'Instant' : 
                                    setting.key.includes('sameDay') ? 'Same Day' : 'Next Day';
                
                return (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium text-lg">
                          {deliveryType} Delivery Restrictions
                        </Label>
                        {setting.description && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Show description"
                              >
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3 text-sm">
                              <p className="text-gray-700">{setting.description}</p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                    {renderSettingInput('deliveryRestrictions', setting.key)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* App Version Control (per docs/versionControl.md) */}
      <div id="app-version-control" className="bg-white rounded-lg shadow p-6 scroll-mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            App Version Control
          </h2>
          <div>
            {versionControlEditing ? (
              <Button
                onClick={saveAllVersionControl}
                disabled={versionControlSaving || !appVersions}
              >
                <Save className="h-4 w-4 mr-2" />
                {versionControlSaving ? 'Saving...' : 'Save All'}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setVersionControlEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Set minimum and latest app versions per platform for Rider/Driver and User (customer) apps. Apps compare their version and can show release notes.
        </p>
        {versionControlLoading ? (
          <p className="text-sm text-gray-500">Loading version settings...</p>
        ) : appVersions && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rider/Driver app */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-800">Rider / Driver app</h3>
              {['android', 'ios'].map((platform) => {
                const p = appVersions.rider?.[platform] || defaultPlatformVersion();
                return (
                  <div key={platform} className="space-y-3 pl-2 border-l-2 border-[#62275F]">
                    <h4 className="text-sm font-medium capitalize">{platform}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label className="text-xs">Min version</Label>
                        <Input
                          value={p.minVersion}
                          onChange={(e) => setVersionField('rider', platform, 'minVersion', e.target.value)}
                          placeholder="e.g. 1.2.0"
                          disabled={!versionControlEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Latest version</Label>
                        <Input
                          value={p.latestVersion}
                          onChange={(e) => setVersionField('rider', platform, 'latestVersion', e.target.value)}
                          placeholder="e.g. 1.3.0"
                          disabled={!versionControlEditing}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!p.forceUpdate}
                          onCheckedChange={(checked) => setVersionField('rider', platform, 'forceUpdate', checked)}
                          disabled={!versionControlEditing}
                        />
                        <Label className="text-xs">Force update (block until updated)</Label>
                      </div>
                      <div>
                        <Label className="text-xs">Release notes</Label>
                        <textarea
                          value={p.releaseNotes || ''}
                          onChange={(e) => setVersionField('rider', platform, 'releaseNotes', e.target.value)}
                          placeholder="What changed"
                          disabled={!versionControlEditing}
                          className="mt-1 w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* User (customer) app */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-800">User (customer) app</h3>
              {['android', 'ios'].map((platform) => {
                const p = appVersions.user?.[platform] || defaultPlatformVersion();
                return (
                  <div key={platform} className="space-y-3 pl-2 border-l-2 border-[#62275F]">
                    <h4 className="text-sm font-medium capitalize">{platform}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label className="text-xs">Min version</Label>
                        <Input
                          value={p.minVersion}
                          onChange={(e) => setVersionField('user', platform, 'minVersion', e.target.value)}
                          placeholder="e.g. 1.1.0"
                          disabled={!versionControlEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Latest version</Label>
                        <Input
                          value={p.latestVersion}
                          onChange={(e) => setVersionField('user', platform, 'latestVersion', e.target.value)}
                          placeholder="e.g. 1.2.0"
                          disabled={!versionControlEditing}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!p.forceUpdate}
                          onCheckedChange={(checked) => setVersionField('user', platform, 'forceUpdate', checked)}
                          disabled={!versionControlEditing}
                        />
                        <Label className="text-xs">Force update (block until updated)</Label>
                      </div>
                      <div>
                        <Label className="text-xs">Release notes</Label>
                        <textarea
                          value={p.releaseNotes || ''}
                          onChange={(e) => setVersionField('user', platform, 'releaseNotes', e.target.value)}
                          placeholder="What changed"
                          disabled={!versionControlEditing}
                          className="mt-1 w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Admin Notifications (per docs/admin-notifications.md) */}
      <div id="admin-notifications" className="bg-white rounded-lg shadow p-6 scroll-mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Notifications
          </h2>
          <Button
            onClick={saveAdminNotificationSettings}
            disabled={adminNotificationSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {adminNotificationSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          When auto-assign creates new ride requests, these admins can receive an email summary (order + riders). Turn off to disable for everyone.
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="admin-notif-enabled"
              checked={!!adminNotificationSettings.enabled}
              onCheckedChange={setAdminNotificationEnabled}
            />
            <Label htmlFor="admin-notif-enabled" className="font-medium">
              Enable admin notifications (email when new ride requests are created)
            </Label>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Admin emails (one per line or add below)</Label>
            <div className="space-y-2">
              {(adminNotificationSettings.emails || []).map((email, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateAdminNotificationEmail(index, e.target.value)}
                    placeholder="admin@example.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeAdminNotificationEmail(index)}
                    aria-label="Remove email"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addAdminNotificationEmail}>
                <Plus className="h-4 w-4 mr-2" />
                Add email
              </Button>
            </div>
            {!(adminNotificationSettings.emails || []).length && adminNotificationSettings.enabled && (
              <p className="text-xs text-amber-600 mt-2">Add at least one email to receive notifications.</p>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;