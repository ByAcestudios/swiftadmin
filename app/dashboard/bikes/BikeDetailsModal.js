'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Edit2, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/lib/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

const BikeDetailsModal = ({ bikeId, onClose }) => {
  const [bikeDetails, setBikeDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [ridersData, setRidersData] = useState({
    riders: [],
    metadata: { totalRiders: 0, currentPage: 1, totalPages: 1 }
  });
  const [riderSearch, setRiderSearch] = useState('');
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [open, setOpen] = useState(false);

  const fetchRiders = useCallback(async () => {
    setIsLoadingRiders(true);
    try {
      const response = await api.get('/api/riders', {
        params: {
          page: 1,
          limit: 10,
          search: riderSearch || undefined,
          status: 'active'
        }
      });
      setRidersData({
        riders: response.data.riders || [],
        metadata: response.data.metadata || { totalRiders: 0, currentPage: 1, totalPages: 1 }
      });
    } catch (error) {
      console.error('Error fetching riders:', error);
    } finally {
      setIsLoadingRiders(false);
    }
  }, [riderSearch]);

  const fetchBikeDetails = async () => {
    try {
      const response = await api.get(`/api/bikes/${bikeId}`);
      setBikeDetails(response.data);
    } catch (error) {
      console.error('Error fetching bike details:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/api/bikes/${bikeId}/history`);
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (bikeId) {
      fetchBikeDetails();
      fetchHistory();
      fetchRiders();
    }
  }, [bikeId, fetchRiders]);

  // Search handler
  const handleSearch = (value) => {
    setRiderSearch(value);
    fetchRiders();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBikeDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await api.put(`/api/bikes/${bikeId}`, bikeDetails);
      setIsEditing(false);
      fetchBikeDetails();
      setSuccessMessage('Bike details updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving bike details:', error);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedRider) return;
    try {
      await api.post('/api/bikes/assign', {
        bikeId,
        riderId: selectedRider.value
      });
      fetchBikeDetails();
      fetchHistory();
      setSelectedRider(null);
      setSuccessMessage('Rider assigned successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error assigning rider:', error);
    }
  };

  if (!bikeDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Bike Details</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  name="name"
                  value={bikeDetails.name}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              {isEditing ? (
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={bikeDetails.vehicleType}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="bike">Bike</option>
                  <option value="van">Van</option>
                  <option value="car">Car</option>
                </select>
              ) : (
                <p className="text-gray-800">{bikeDetails.vehicleType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              {isEditing ? (
                <Input
                  id="model"
                  name="model"
                  value={bikeDetails.model}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.model}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              {isEditing ? (
                <Input
                  id="color"
                  name="color"
                  type="color"
                  value={bikeDetails.color}
                  onChange={handleChange}
                  className="h-10"
                />
              ) : (
                <div className="flex items-center">
                  <span
                    className="inline-block w-4 h-4 mr-2 rounded-full"
                    style={{ backgroundColor: bikeDetails.color }}
                  ></span>
                  <p className="text-gray-800">{bikeDetails.color}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number</Label>
              {isEditing ? (
                <Input
                  id="plateNumber"
                  name="plateNumber"
                  value={bikeDetails.plateNumber}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.plateNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              {isEditing ? (
                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  value={bikeDetails.registrationNumber}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.registrationNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfPurchase">Date of Purchase</Label>
              {isEditing ? (
                <Input
                  id="dateOfPurchase"
                  name="dateOfPurchase"
                  value={bikeDetails.dateOfPurchase}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{new Date(bikeDetails.dateOfPurchase).toLocaleDateString()}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextServiceDate">Next Service Date</Label>
              {isEditing ? (
                <Input
                  id="nextServiceDate"
                  name="nextServiceDate"
                  value={bikeDetails.nextServiceDate}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{new Date(bikeDetails.nextServiceDate).toLocaleDateString()}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              {isEditing ? (
                <select
                  id="status"
                  name="status"
                  value={bikeDetails.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_repair">Under Repair</option>
                </select>
              ) : (
                <p className="text-gray-800">{bikeDetails.status}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign Rider</Label>
            <div className="flex space-x-2">
              <div className="w-[300px]">
                <Select
                  onValueChange={(value) => {
                    const rider = ridersData.riders.find(r => r.id === value);
                    setSelectedRider({
                      value: rider.id,
                      label: `${rider.firstName} ${rider.lastName}`
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-3 py-2">
                      <Input
                        placeholder="Search riders..."
                        value={riderSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    {isLoadingRiders ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      ridersData.riders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          <div className="flex items-center space-x-2">
                            {rider.profilePictureUrl && (
                              <img 
                                src={rider.profilePictureUrl} 
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <span>{rider.firstName} {rider.lastName}</span>
                            <span className="text-gray-500 text-sm">({rider.phoneNumber})</span>
                            <span 
                              className={`ml-auto w-2 h-2 rounded-full ${
                                rider.details.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAssignRider} 
                className="bg-[#733E70] hover:bg-[#62275F] text-white"
                disabled={!selectedRider}
              >
                Assign Rider
              </Button>
            </div>
            {ridersData.metadata && (
              <div className="text-sm text-gray-500 mt-1">
                Showing {ridersData.riders.length} of {ridersData.metadata.totalRiders} riders
                {riderSearch && ' (filtered by search)'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>History</Label>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider's Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.Rider ? `${entry.Rider.firstName} ${entry.Rider.lastName}` : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.returnedAt ? new Date(entry.returnedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {!entry.returnedAt && <Check className="w-5 h-5 text-green-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={() => setIsEditing(!isEditing)} className="bg-gray-500 hover:bg-gray-600 text-white">
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            {isEditing && (
              <Button onClick={handleSave} className="bg-[#733E70] hover:bg-[#62275F] text-white">
                Save
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeDetailsModal;
