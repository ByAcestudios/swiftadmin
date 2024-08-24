'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TicketSlash } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    numberOfAddresses: '',
    bikeAvailabilityFrom: '',
    bikeAvailabilityTo: '',
    deliveryPricingRateKm: '',
    deliveryPricingRateSec: '',
    orderRejectionReasons: [],
    businessCategories: [],
    assigningOrderMethod: '',
    userCancellationReasons: [],
    maxRiderScore: '',
    ticketCategories: [],
    expenses: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({ ...prevSettings, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setSettings(prevSettings => ({ ...prevSettings, [name]: value }));
  };

  const handleAddItem = (name, item) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: [...prevSettings[name], item]
    }));
  };

  const handleRemoveItem = (name, item) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: prevSettings[name].filter(i => i !== item)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings Saved:', settings);
    // Add logic to handle settings save
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      <p className="text-sm text-gray-600">Changes are made here.</p>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numberOfAddresses">Number of addresses to accept</Label>
            <Input
              id="numberOfAddresses"
              name="numberOfAddresses"
              value={settings.numberOfAddresses}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Bike's availability</Label>
            <div className="flex space-x-2">
              <Select onValueChange={(value) => handleSelectChange('bikeAvailabilityFrom', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  {/* Add more options as needed */}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => handleSelectChange('bikeAvailabilityTo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="17:00">17:00</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                  <SelectItem value="19:00">19:00</SelectItem>
                  {/* Add more options as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Delivery Pricing rate</Label>
            <div className="flex space-x-2 items-center">
              <Input
                name="deliveryPricingRateKm"
                value={settings.deliveryPricingRateKm}
                onChange={handleChange}
                placeholder="₦ Value /kilometers"
                required
              />
              <Switch />
            </div>
            <div className="flex space-x-2 items-center">
              <Input
                name="deliveryPricingRateSec"
                value={settings.deliveryPricingRateSec}
                onChange={handleChange}
                placeholder="₦ Value /seconds"
                required
              />
              <Switch />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderRejectionReasons">Order rejection</Label>
            <div className="flex space-x-2">
              <Input
                id="orderRejectionReasons"
                name="orderRejectionReasons"
                placeholder="Type something new..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('orderRejectionReasons', e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button onClick={() => handleAddItem('orderRejectionReasons', document.getElementById('orderRejectionReasons').value)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.orderRejectionReasons.map((reason, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded">
                  <span>{reason}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveItem('orderRejectionReasons', reason)}>
                    x
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessCategories">Business category</Label>
            <div className="flex space-x-2">
              <Input
                id="businessCategories"
                name="businessCategories"
                placeholder="Type something new..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('businessCategories', e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button onClick={() => handleAddItem('businessCategories', document.getElementById('businessCategories').value)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.businessCategories.map((category, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded">
                  <span>{category}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveItem('businessCategories', category)}>
                    x
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigningOrderMethod">Assigning order</Label>
            <Select onValueChange={(value) => handleSelectChange('assigningOrderMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="userCancellationReasons">User cancellation</Label>
            <div className="flex space-x-2">
              <Input
                id="userCancellationReasons"
                name="userCancellationReasons"
                placeholder="Type something new..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('userCancellationReasons', e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button onClick={() => handleAddItem('userCancellationReasons', document.getElementById('userCancellationReasons').value)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.userCancellationReasons.map((reason, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded">
                  <span>{reason}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveItem('userCancellationReasons', reason)}>
                    x
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxRiderScore">Maximum Rider's Score</Label>
            <Input
              id="maxRiderScore"
              name="maxRiderScore"
              value={settings.maxRiderScore}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticketCategories">Ticket Category</Label>
            <div className="flex space-x-2">
              <Input
                id="ticketCategories"
                name="ticketCategories"
                placeholder="Type something new..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('ticketCategories', e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button onClick={() => handleAddItem('ticketCategories', document.getElementById('ticketCategories').value)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.ticketCategories.map((category, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded">
                  <span>{category}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveItem('ticketCategories', category)}>
                    x
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenses">Expenses</Label>
            <div className="flex space-x-2">
              <Input
                id="expenses"
                name="expenses"
                placeholder="Type something new..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('expenses', e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <Button onClick={() => handleAddItem('expenses', document.getElementById('expenses').value)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.expenses.map((expense, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded">
                  <span>{expense}</span>
                  <Button variant="outline" size="sm" onClick={() => handleRemoveItem('expenses', expense)}>
                    x
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Button type="submit" className="w-full bg-[#733E70] hover:bg-[#62275F] text-white">
          Save Changes
        </Button>
      </form>
    </div>
  );
};

export default SettingsPage;