'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Edit, Save, Trash, Info, Lock } from 'lucide-react';
import api from '@/lib/api';

const ESSENTIAL_SETTINGS = ['riderAssignment', 'operatingHours', 'ratePerKm', 'ratePerHour', 'orderAssignment', 'rateNextDayDelivery', 'rateSameDayDelivery', 'itemCategories', 'rateInstantDelivery', 'rateSameDayDelivery', 'rateNextDayDelivery'];

const SettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newSetting, setNewSetting] = useState({ key: '', value: '', description: '' });
  const [editingKey, setEditingKey] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings');
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to fetch settings. Please try again.');
      setLoading(false);
    }
  };

  const parseSettingValue = (setting) => {
    if (setting.key === 'itemCategories') {
      try {
        // First, check if it's already an array
        if (Array.isArray(setting.value)) {
          return setting.value;
        }
        // If it's a string, try to parse it
        const parsed = JSON.parse(setting.value);
        // If the parsed result is an array, return it
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // If it's still a string (double encoded), parse it again
        return JSON.parse(parsed);
      } catch (e) {
        console.error('Error parsing itemCategories:', e);
        return [];
      }
    }
    return setting.value;
  };

  const handleChange = (key, value) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const handleEdit = (key) => {
    setEditingKey(key);
  };

  const handleSave = async (setting) => {
    try {
      setLoading(true);
      let value = setting.value;
      if (setting.key === 'itemCategories') {
        value = JSON.stringify(value);
      } else if (setting.key === 'operatingHours') {
        value = JSON.stringify(value);
      }
      await api.put(`/api/settings/${setting.key}`, {
        value,
        description: setting.description
      });
      setSuccessMessage(`Setting "${setting.key}" updated successfully!`);
      setEditingKey(null);
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      setError(`Failed to update setting "${setting.key}". Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    if (ESSENTIAL_SETTINGS.includes(key)) {
      setError(`Cannot delete essential setting "${key}".`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      try {
        setLoading(true);
        await api.delete(`/api/settings/${key}`);
        setSuccessMessage(`Setting "${key}" deleted successfully!`);
        fetchSettings();
      } catch (error) {
        console.error('Error deleting setting:', error);
        setError(`Failed to delete setting "${key}". Please try again.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/api/settings', newSetting);
      setSuccessMessage(`New setting "${newSetting.key}" created successfully!`);
      setNewSetting({ key: '', value: '', description: '' });
      fetchSettings();
    } catch (error) {
      console.error('Error creating new setting:', error);
      setError('Failed to create new setting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    try {
      setLoading(true);
      const updatedSettings = settings.map(setting => ({
        ...setting,
        value: ['itemCategories', 'operatingHours'].includes(setting.key)
          ? JSON.stringify(setting.value)
          : setting.value
      }));
      await api.post('/api/settings/bulk-update', { settings: updatedSettings });
      setSuccessMessage('Settings updated successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      setError('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingInput = (setting) => {
    const isEditing = editingKey === setting.key;
    const value = parseSettingValue(setting);
    const isEssential = ESSENTIAL_SETTINGS.includes(setting.key);
    
    switch (setting.key) {
      case 'itemCategories':
        return (
          <div className="space-y-2">
            {Array.isArray(value) ? value.map((category, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={category}
                  onChange={(e) => {
                    const newCategories = [...value];
                    newCategories[index] = e.target.value;
                    handleChange(setting.key, newCategories);
                  }}
                  disabled={!isEditing}
                />
                {isEditing && (
                  <Button onClick={() => {
                    const newCategories = value.filter((_, i) => i !== index);
                    handleChange(setting.key, newCategories);
                  }}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )) : <p>Invalid format for item categories</p>}
            {isEditing && (
              <Button onClick={() => handleChange(setting.key, [...value, ''])}>
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            )}
          </div>
        );
      case 'riderAssignment':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Current value: {value}</p>
            {isEditing ? (
              <Select
                value={value}
                onValueChange={(newValue) => handleChange(setting.key, newValue)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select assignment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p>{value}</p>
            )}
          </div>
        );
      case 'operatingHours':
        return (
          <div className="flex space-x-2">
            <Input
              type="time"
              value={value.from}
              onChange={(e) => handleChange(setting.key, JSON.stringify({ ...value, from: e.target.value }))}
              disabled={!isEditing}
            />
            <Input
              type="time"
              value={value.to}
              onChange={(e) => handleChange(setting.key, JSON.stringify({ ...value, to: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
        );
      default:
        switch (typeof value) {
          case 'number':
            return (
              <Input
                type="number"
                value={value}
                onChange={(e) => handleChange(setting.key, Number(e.target.value))}
                disabled={!isEditing}
              />
            );
          case 'boolean':
            return (
              <Select
                value={value.toString()}
                onValueChange={(newValue) => handleChange(setting.key, newValue === 'true')}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            );
          case 'object':
            return (
              <Textarea
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                disabled={!isEditing}
              />
            );
          default:
            return (
              <Input
                value={value}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                disabled={!isEditing}
              />
            );
        }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <Button onClick={() => setShowInstructions(!showInstructions)}>
          <Info className="w-4 h-4 mr-2" /> Instructions
        </Button>
      </div>
      
      {showInstructions && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
          <p className="font-bold">Instructions for updating settings:</p>
          <ul className="list-disc list-inside">
            <li>Click the "Edit" button next to a setting to modify its value.</li>
            <li>For item categories, you can add or remove categories when editing.</li>
            <li>For operating hours, use the time inputs to set the "from" and "to" times.</li>
            <li>For rider assignment, choose between 'Automatic' (system assigns riders) or 'Manual' (administrators assign riders).</li>
            <li>After making changes, click "Save" to update the setting.</li>
            <li>Use the "Create New Setting" form at the top to add a new setting.</li>
            <li>Some settings are essential for the app's functionality and cannot be deleted. These are marked as "Essential".</li>
            <li>The "Bulk Update All Settings" button at the bottom will save all changes at once.</li>
          </ul>
        </div>
      )}

      <p className="text-sm text-gray-600">Manage your application settings here.</p>
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Create New Setting Form */}
      <form onSubmit={handleCreateNew} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">Create New Setting</h2>
        <div className="flex space-x-4">
          <Input
            placeholder="Key"
            value={newSetting.key}
            onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
            required
          />
          <Input
            placeholder="Value"
            value={newSetting.value}
            onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
            required
          />
          <Input
            placeholder="Description"
            value={newSetting.description}
            onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
          />
          <Button type="submit" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      </form>

      {/* Existing Settings */}
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">Current Settings</h2>
        {settings.map((setting) => (
          <div key={setting.id} className="space-y-2 border-b pb-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor={setting.key} className="font-semibold">{setting.key}</Label>
              {ESSENTIAL_SETTINGS.includes(setting.key) && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                  Essential
                </span>
              )}
            </div>
            {setting.key === 'riderAssignment' && (
              <p className="text-sm text-gray-600 mb-2">
                Choose how riders are assigned to orders. 'Automatic' lets the system assign riders, while 'Manual' allows administrators to assign riders manually.
              </p>
            )}
            {renderSettingInput(setting)}
            <p className="text-sm text-gray-500">{setting.description}</p>
            <div className="flex space-x-2">
              {editingKey === setting.key ? (
                <Button onClick={() => handleSave(setting)} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              ) : (
                <Button onClick={() => handleEdit(setting.key)} disabled={loading}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              )}
              {ESSENTIAL_SETTINGS.includes(setting.key) ? (
                <Button disabled variant="outline" className="text-gray-400">
                  <Lock className="w-4 h-4 mr-2" /> Essential
                </Button>
              ) : (
                <Button onClick={() => handleDelete(setting.key)} variant="destructive" disabled={loading}>
                  <Trash className="w-4 h-4 mr-2" /> Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Update Button */}
      <Button onClick={handleBulkUpdate} className="w-full bg-[#733E70] hover:bg-[#62275F] text-white" disabled={loading}>
        {loading ? 'Updating...' : 'Bulk Update All Settings'}
      </Button>
    </div>
  );
};

export default SettingsPage;