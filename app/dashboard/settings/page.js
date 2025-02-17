'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Edit, Save, Info } from 'lucide-react';
import api from '@/lib/api';

/* eslint-disable react-hooks/exhaustive-deps */

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

  useEffect(() => {
    fetchSettings();
  }, []);

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
    return setting.value;
  };

  const renderSettingInput = (category, key) => {
    const config = getSettingConfig(category, key);
    const value = getSettingValue(key);

    console.log(`Rendering input for ${key}:`, { config, value }); // Debug log

    switch (config.type) {
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
            value={value ?? ''}
            onValueChange={(value) => handleChange(key, value)}
            disabled={!isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${config.label}`} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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

      default:
        return (
          <Input
            value={value ?? ''}
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
        <div key={category} className="bg-white rounded-lg shadow p-6">
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
                    <Label className="font-medium">
                      {setting.label}
                      {setting.description && (
                        <span className="block text-sm text-gray-500">
                          {setting.description}
                        </span>
                      )}
                    </Label>
                  </div>
                  {renderSettingInput(category, key)}
                </div>
              );
            })}
          </div>
        </div>
      ))}

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