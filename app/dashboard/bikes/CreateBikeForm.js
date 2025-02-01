'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import api from '@/lib/api';

const CreateBikeForm = ({ onClose }) => {
  const router = useRouter();
  const [bikeDetails, setBikeDetails] = useState({
    name: '',
    vehicleType: 'bike', // Default vehicle type
    model: '',
    color: '#000000', // Default color
    plateNumber: '',
    registrationNumber: '',
    dateOfPurchase: new Date(),
    nextServiceDate: new Date(),
  });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBikeDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setBikeDetails(prevDetails => ({ ...prevDetails, [name]: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...bikeDetails,
        dateOfPurchase: format(bikeDetails.dateOfPurchase, 'yyyy-MM-dd'),
        nextServiceDate: format(bikeDetails.nextServiceDate, 'yyyy-MM-dd'),
      };
      await api.post('/api/bikes', payload);
      setMessage('Bike created successfully!');
      setMessageType('success');
      // Redirect to bike list after a short delay
      setTimeout(() => {
        router.push('/dashboard/bikes');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error creating bike';
      setMessage(errorMessage);
      setMessageType('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800">Vehicle Information</h2>
      {message && (
        <div className={`p-4 mb-4 text-sm ${messageType === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'} rounded-lg`} role="alert">
          {message}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Vehicle Name</Label>
          <Input
            id="name"
            name="name"
            value={bikeDetails.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleType">Vehicle Type</Label>
          <select
            id="vehicleType"
            name="vehicleType"
            value={bikeDetails.vehicleType}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="bike">Bike</option>
            <option value="van">Van</option>
            <option value="car">Car</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            name="model"
            value={bikeDetails.model}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            type="color"
            id="color"
            name="color"
            value={bikeDetails.color}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plateNumber">Plate Number</Label>
          <Input
            id="plateNumber"
            name="plateNumber"
            value={bikeDetails.plateNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            name="registrationNumber"
            value={bikeDetails.registrationNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfPurchase">Date of Purchase</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {bikeDetails.dateOfPurchase ? format(bikeDetails.dateOfPurchase, 'yyyy-MM-dd') : 'Select Date'}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={bikeDetails.dateOfPurchase}
                onSelect={(date) => handleDateChange('dateOfPurchase', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextServiceDate">Next Service Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {bikeDetails.nextServiceDate ? format(bikeDetails.nextServiceDate, 'yyyy-MM-dd') : 'Select Date'}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={bikeDetails.nextServiceDate}
                onSelect={(date) => handleDateChange('nextServiceDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex justify-between">
        <Button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white">
          Go Back
        </Button>
        <Button type="submit" className="bg-[#733E70] hover:bg-[#62275F] text-white">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default CreateBikeForm;