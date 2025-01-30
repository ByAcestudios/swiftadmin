'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Edit, Save, Info } from 'lucide-react';
import api from '@/lib/api';

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
      
      // Create a map of existing settings
      const existingSettings = response.data.settings.reduce((acc, setting) => {
        // Find the correct category from config
        const category = Object.keys(response.data.config).find(cat => 
          Object.keys(response.data.config[cat].settings).includes(setting.key)
        ) || setting.category;

        return {
          ...acc,
          [setting.key]: {
            ...setting,
            category
          }
        };
      }, {});

      // Create settings array from config with existing values
      const configuredSettings = Object.entries(response.data.config).flatMap(([category, { settings }]) => 
        Object.keys(settings).map(key => ({
          key,
          value: existingSettings[key]?.value ?? null,
          category,
          isPublic: existingSettings[key]?.isPublic ?? true,
          description: existingSettings[key]?.description ?? settings[key].description,
          id: existingSettings[key]?.id ?? null
        }))
      );

      // Merge with any existing settings that aren't in config
      const additionalSettings = response.data.settings.filter(
        setting => !configuredSettings.some(s => s.key === setting.key)
      );

      setSettingsData({
        config: response.data.config,
        settings: [...configuredSettings, ...additionalSettings]
      });
    } catch (error) {
      setError('Failed to load settings');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const settingsToUpdate = settingsData.settings.reduce((acc, setting) => ({
        ...acc,
        [setting.key]: setting.value
      }), {});

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
    setSettingsData(prev => ({
      ...prev,
      settings: prev.settings.map(setting => 
        setting.key === key 
          ? { ...setting, value } 
          : setting
      )
    }));
  };

  const getSettingConfig = (category, key) => {
    return settingsData.config[category]?.settings[key] || {};
  };

  const getSettingValue = (key) => {
    const setting = settingsData.settings.find(s => s.key === key);
    if (!setting) {
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
    return setting.value;
  };

  const renderSettingInput = (category, key) => {
    const config = getSettingConfig(category, key);
    const value = getSettingValue(key);

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

  if (initialLoad) return <div>Loading settings...</div>;
  if (error) return (
    <div className="p-4 text-red-500 bg-red-50 rounded">
      <h3 className="font-bold">Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <Info className="w-4 h-4 mr-2" /> Instructions
          </Button>
          {isEditing ? (
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Settings
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-6 space-y-4">
          <h3 className="font-bold text-lg">How to Use Settings</h3>
          
          <div>
            <p className="font-semibold">Basic Steps:</p>
            <ol className="list-decimal list-inside mt-2 space-y-2">
              <li>Click the "Edit Settings" button at the top right to start making changes</li>
              <li>Update any settings you need to change</li>
              <li>Click "Save Changes" when you're done</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">What Each Section Means:</p>
            
            <div className="ml-4 space-y-3">
              <div>
                <p className="font-medium">🛍️ Order Management</p>
                <p className="text-sm">Controls how orders work: cancellation reasons, maximum order values, and how long before orders auto-cancel.</p>
              </div>

              <div>
                <p className="font-medium">🚲 Rider Management</p>
                <p className="text-sm">Settings for delivery riders: their performance scores, how many orders they can handle, and their working area.</p>
              </div>

              <div>
                <p className="font-medium">🏪 Business Categories</p>
                <p className="text-sm">Manage what types of businesses can use the platform and what items they can/cannot deliver.</p>
              </div>

              <div>
                <p className="font-medium">⏰ Scheduling</p>
                <p className="text-sm">Control when bikes are available, peak hours, and how far in advance orders can be booked.</p>
              </div>

              <div>
                <p className="font-medium">💰 Pricing & Fees</p>
                <p className="text-sm">Set all delivery fees, rates per kilometer, waiting charges, and distance limits.</p>
              </div>

              <div>
                <p className="font-medium">⚙️ System Behavior</p>
                <p className="text-sm">Control how the system works: automatic order assignment, GPS tracking, and delivery limits.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold">Tips:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>For lists (like cancellation reasons), click "Add Item" to add more options</li>
              <li>Time ranges need both a start and end time</li>
              <li>Numbers will automatically stay within their allowed ranges</li>
              <li>Toggle switches can be turned on/off with a single click</li>
              <li>Don't forget to save your changes!</li>
            </ul>
          </div>

          <div className="mt-4 bg-yellow-50 p-3 rounded">
            <p className="font-semibold text-yellow-800">⚠️ Important Note:</p>
            <p className="text-sm text-yellow-800">Changes to these settings will affect how the entire delivery system works. If you're unsure about a setting, please check with your supervisor before making changes.</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(settingsData.config).map(([category, { label, settings: categorySettings }]) => (
          <div key={category} className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-semibold">{label}</h2>
            <div className="grid gap-6">
              {Object.entries(categorySettings).map(([key, config]) => (
                <div key={key} className="space-y-2">
                  <Label className="font-medium">{config.label}</Label>
                  <p className="text-sm text-gray-500">{config.description}</p>
                  {renderSettingInput(category, key)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;