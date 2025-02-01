import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from 'lucide-react';
import api from '@/utils/axiosIntercept';

import Image from 'next/image';

const EditOrderForm = ({ order, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    ...order,
    ratePerHour: Number(order.ratePerHour) || 0,
    rateSameDayDelivery: Number(order.rateSameDayDelivery) || 0,
    rateNextDayDelivery: Number(order.rateNextDayDelivery) || 0,
    rateInstantDelivery: Number(order.rateInstantDelivery) || 0,
    dropOffs: order.dropOffs?.map(dropOff => ({
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

  const getSenderInfo = () => {
    if (!formData.senderName) {
      return {
        name: formData.user?.name || 'Unknown User',
        phone: formData.user?.phoneNumber || formData.user?.email,
        isGuest: false
      };
    }
    return {
      name: formData.senderName,
      phone: formData.phoneNumber,
      isGuest: true
    };
  };

  const handleChange = (e, index = null) => {
    const { name, value, type, checked } = e.target;
    if (index !== null) {
      setFormData(prev => ({
        ...prev,
        dropOffs: prev.dropOffs.map((dropOff, i) => {
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
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const addDropOff = () => {
    setFormData(prev => ({
      ...prev,
      dropOffs: [...prev.dropOffs, {
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
      dropOffs: prev.dropOffs.filter((_, i) => i !== index)
    }));
  };

  const senderInfo = getSenderInfo();

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
        {/* Order Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input id="orderNumber" name="orderNumber" value={formData.orderNumber} readOnly className="bg-gray-50" />
            </div>
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
              <Label htmlFor="orderStatus">Status</Label>
              <Select name="orderStatus" value={formData.orderStatus} onValueChange={(value) => handleChange({ target: { name: 'orderStatus', value } })}>
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
        </div>

        {/* Sender Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Sender Information</h3>
            <Badge className={senderInfo.isGuest ? "bg-orange-500 text-white" : "bg-blue-500 text-white"}>
              {senderInfo.isGuest ? "Guest" : "Registered User"}
            </Badge>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="senderName">Name</Label>
              <Input id="senderName" name="senderName" value={formData.senderName || senderInfo.name} readOnly={!senderInfo.isGuest} className={!senderInfo.isGuest ? "bg-gray-50" : ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || senderInfo.phone} readOnly={!senderInfo.isGuest} className={!senderInfo.isGuest ? "bg-gray-50" : ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input id="pickupAddress" name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Delivery Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="isFragile">Is Fragile</Label>
            <div className="flex items-center space-x-2">
              <Switch id="isFragile" name="isFragile" checked={formData.isFragile} onCheckedChange={(checked) => handleChange({ target: { name: 'isFragile', type: 'checkbox', checked } })} />
              <span className="text-sm text-gray-600">{formData.isFragile ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div>
            <Label htmlFor="itemCategory">Item Category</Label>
            <Input id="itemCategory" name="itemCategory" value={formData.itemCategory} onChange={handleChange} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" name="note" value={formData.note} onChange={handleChange} />
        </div>
      </div>

      {/* Drop-offs */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Drop-offs</h3>
        {formData.dropOffs.map((dropOff, index) => (
          <div key={dropOff.id || index} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Receiver Name</Label>
                <Input name="receiverName" value={dropOff.receiverName || ''} onChange={(e) => handleChange(e, index)} />
              </div>
              <div>
                <Label>Receiver Phone</Label>
                <Input name="receiverPhoneNumber" value={dropOff.receiverPhoneNumber || ''} onChange={(e) => handleChange(e, index)} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input name="address" value={dropOff.address || ''} onChange={(e) => handleChange(e, index)} />
              </div>
            </div>
            <div className="mt-4">
              <Button type="button" variant="destructive" size="sm" onClick={() => removeDropOff(index)}>
                <Trash2 className="h-4 w-4 mr-2" /> Remove Drop-off
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Order</Button>
      </div>
    </form>
  );
};

export default EditOrderForm;
