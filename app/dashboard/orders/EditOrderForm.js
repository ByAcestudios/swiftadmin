import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from 'lucide-react';
import api from '@/utils/axiosIntercept';

import Image from 'next/image';

const EditOrderForm = ({ order, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    ...order,
    ratePerHour: Number(order.ratePerHour) || 0,
    rateSameDayDelivery: Number(order.rateSameDayDelivery) || 0,
    rateNextDayDelivery: Number(order.rateNextDayDelivery) || 0,
    rateInstantDelivery: Number(order.rateNextDayDelivery) || 0,

    DropOffs: order.DropOffs?.map(dropOff => ({
      ...dropOff,
      location: dropOff.location || { type: "Point", coordinates: [0, 0] }
    })) || []
  });

  const [assignedRider, setAssignedRider] = useState(null);
  const [orderUser, setOrderUser] = useState(null);

  useEffect(() => {
    if (order.riderId) {
      fetchRiderDetails();
    }
    if (order.userId) {
      fetchUserDetails();
    }
  }, [order.riderId, order.userId]);

  const fetchRiderDetails = async () => {
    try {
      const response = await api.get(`/api/riders/${order.riderId}`);
      setAssignedRider(response.data);
    } catch (error) {
      console.error('Error fetching rider details:', error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/api/users/${order.userId}`);
      setOrderUser(response.data?.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleChange = (e, index = null) => {
    const { name, value, type, checked } = e.target;
    if (index !== null) {
      // Handling DropOff changes
      setFormData(prev => ({
        ...prev,
        DropOffs: prev.DropOffs.map((dropOff, i) => {
          if (i !== index) return dropOff;
          if (name === 'latitude' || name === 'longitude') {
            const coordinates = dropOff.location?.coordinates || [0, 0];
            return {
              ...dropOff,
              location: {
                type: "Point",
                coordinates: name === 'latitude' 
                  ? [parseFloat(value) || 0, coordinates[1]]
                  : [coordinates[0], parseFloat(value) || 0]
              }
            };
          }
          return { ...dropOff, [name]: value };
        })
      }));
    } else {
      let processedValue = value;

      // Convert rate fields to numbers
      if (name.startsWith('rate')) {
        processedValue = Number(value) || 0;
      }

      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : processedValue
      }));
    }
  };

  const addDropOff = () => {
    setFormData(prev => ({
      ...prev,
      DropOffs: [...prev.DropOffs, {
        address: '',
        receiverName: '',
        receiverPhoneNumber: '',
        location: { type: "Point", coordinates: [0, 0] }
      }]
    }));
  };

  const removeDropOff = (index) => {
    setFormData(prev => ({
      ...prev,
      DropOffs: prev.DropOffs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Rider Column */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Assigned Rider</h3>
          {assignedRider ? (
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden">
                <Image
                  src={assignedRider.profilePictureUrl}
                  alt={`${assignedRider.firstName} ${assignedRider.lastName}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-lg">
                  {assignedRider.firstName} {assignedRider.lastName}
                </p>
                <p className="text-gray-600">{assignedRider.phoneNumber}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No rider assigned</p>
          )}
        </div>

        {/* User Column */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Order Created By</h3>
          {orderUser ? (
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden">
                <Image
                  src={orderUser.profilePictureUrl || '/default-avatar.png'} // Provide a default avatar
                  alt={`${orderUser.firstName} ${orderUser.lastName}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-lg">
                  {orderUser.firstName} {orderUser.lastName}
                </p>
                <p className="text-gray-600">{orderUser.phoneNumber}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No user found</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orderNumber">Order Number (Read-only)</Label>
          <Input id="orderNumber" name="orderNumber" value={formData.orderNumber} readOnly className="bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="createdAt">Created At (Read-only)</Label>
          <Input id="createdAt" name="createdAt" value={new Date(formData.createdAt).toLocaleString()} readOnly className="bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="senderName">Sender Name</Label>
          <Input id="senderName" name="senderName" value={formData.senderName} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
        </div>
      </div>

      <div>
        <Label htmlFor="pickupAddress">Pickup Address</Label>
        <Input id="pickupAddress" name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orderType">Order Type</Label>
          <Select name="orderType" value={formData.orderType} onValueChange={(value) => handleChange({ target: { name: 'orderType', value } })}>
            <SelectTrigger>
              <SelectValue placeholder="Select order type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="sameDay">Same Day</SelectItem>
              <SelectItem value="nextDay">Next Day</SelectItem>
              <SelectItem value="instant">Instant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          
          <Label htmlFor="status">Status</Label>
          <Select 
            name="orderStatus" 
            value={formData.orderStatus} 
            onValueChange={(value) => handleChange({ target: { name: 'orderStatus', value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isFragile"
          name="isFragile"
          checked={formData.isFragile}
          onCheckedChange={(checked) => handleChange({ target: { name: 'isFragile', type: 'checkbox', checked } })}
        />
        <Label htmlFor="isFragile">Is Fragile</Label>
      </div>

      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" value={formData.note} onChange={handleChange} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Drop-offs</h3>
        {formData.DropOffs.map((dropOff, index) => (
          <div key={index} className="mb-4 p-4 border rounded">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <Input
                name="address"
                value={dropOff.address || ''}
                onChange={(e) => handleChange(e, index)}
                placeholder="Address"
              />
              <Input
                name="receiverName"
                value={dropOff.receiverName || ''}
                onChange={(e) => handleChange(e, index)}
                placeholder="Receiver Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <Input
                name="receiverPhoneNumber"
                value={dropOff.receiverPhoneNumber || ''}
                onChange={(e) => handleChange(e, index)}
                placeholder="Receiver Phone Number"
              />
              <div className="flex space-x-2">
                <Input
                  name="latitude"
                  value={dropOff.location?.coordinates?.[0] || 0}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Latitude"
                  type="number"
                  step="any"
                />
                <Input
                  name="longitude"
                  value={dropOff.location?.coordinates?.[1] || 0}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Longitude"
                  type="number"
                  step="any"
                />
              </div>
            </div>
            <Button type="button" variant="destructive" size="sm" onClick={() => removeDropOff(index)}>
              <Trash2 className="h-4 w-4 mr-2" /> Remove Drop-off
            </Button>
          </div>
        ))}
        {/* <Button type="button" variant="outline" onClick={addDropOff} className="w-full"> */}
          {/* <Plus className="h-4 w-4 mr-2" /> Add Drop-off */}
        {/* </Button> */}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Order</Button>
      </div>

    </form>
  );
};

export default EditOrderForm;
