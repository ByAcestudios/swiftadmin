import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from 'lucide-react';
import { getStatusColor } from "@/utils/settings";
import api from '@/lib/api';

import Image from 'next/image';

const EditOrderForm = ({ order, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    ...order,
    orderStatus: order.orderStatus || 'pending', // Ensure orderStatus is set
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
  const [orderTimeline, setOrderTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (order.riderId) {
      fetchRiderDetails();
    }
    if (order.userId) {
      fetchUserDetails();
    }
    if (order.id) {
      fetchOrderTimeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update formData when timeline loads to get current status from timeline
  useEffect(() => {
    if (orderTimeline?.order?.currentStatus?.value) {
      const timelineStatus = orderTimeline.order.currentStatus.value;
      setFormData(prev => {
        // Only update if different to avoid unnecessary re-renders
        if (prev.orderStatus === timelineStatus) {
          return prev;
        }
        return {
          ...prev,
          orderStatus: timelineStatus
        };
      });
    }
  }, [orderTimeline]);

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

  const fetchOrderTimeline = async () => {
    try {
      setLoadingTimeline(true);
      const response = await api.get(`/api/orders/${order.id}/timeline`);
      setOrderTimeline(response.data);
    } catch (error) {
      console.error('Error fetching order timeline:', error);
      // Don't show error, just continue without timeline
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Determine if order has been picked up (to distinguish in_transit phases)
  const hasBeenPickedUp = () => {
    if (!orderTimeline?.timeline) {
      // Fallback: check if current status is picked_up or delivered
      return formData.orderStatus === 'picked_up' || formData.orderStatus === 'delivered';
    }
    return orderTimeline.timeline.some(
      activity => activity.newStatus?.value === 'picked_up' || activity.newStatus === 'picked_up'
    );
  };

  // Get status label with phase indicator for in_transit
  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'in_transit': hasBeenPickedUp() ? 'In Transit (to dropoff)' : 'In Transit (to pickup)',
      'picked_up': 'Picked Up',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
  };

  // Get valid next statuses based on current status and timeline (no skipping allowed)
  const getValidNextStatuses = () => {
    const currentStatus = formData.orderStatus || order.orderStatus;
    const pickedUp = hasBeenPickedUp();

    // Define valid transitions based on status flow
    const statusFlow = {
      'pending': [
        { value: 'assigned', label: 'Assigned' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      'assigned': [
        { value: 'in_transit', label: 'In Transit (to pickup)' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      'in_transit': pickedUp 
        ? [
            // In transit to dropoff (picked_up exists in timeline)
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' }
          ]
        : [
            // In transit to pickup (picked_up doesn't exist in timeline)
            { value: 'picked_up', label: 'Picked Up' },
            { value: 'cancelled', label: 'Cancelled' }
          ],
      'picked_up': [
        { value: 'in_transit', label: 'In Transit (to dropoff)' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      'delivered': [], // Final status - no transitions
      'cancelled': []  // Final status - no transitions
    };

    return statusFlow[currentStatus] || [];
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Current:</span>
                  <Badge className={`${getStatusColor(formData.orderStatus || order.orderStatus)} text-white text-xs`}>
                    {getStatusLabel(formData.orderStatus || order.orderStatus)}
                  </Badge>
                </div>
                <Select 
                  name="orderStatus" 
                  value={formData.orderStatus || order.orderStatus || ''} 
                  onValueChange={(value) => {
                    handleChange({ target: { name: 'orderStatus', value } });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status">
                      {(() => {
                        const currentStatus = formData.orderStatus || order.orderStatus;
                        if (!currentStatus) return 'Select status';
                        // Try to find in valid next statuses first
                        const validStatuses = getValidNextStatuses();
                        const found = validStatuses.find(s => s.value === currentStatus);
                        if (found) return found.label;
                        // Otherwise show the status label
                        return getStatusLabel(currentStatus);
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {getValidNextStatuses().length > 0 ? (
                      <>
                        {/* Show current status as reference (disabled) */}
                        <SelectItem 
                          value={formData.orderStatus || order.orderStatus} 
                          disabled
                          className="opacity-50"
                        >
                          Current: {getStatusLabel(formData.orderStatus || order.orderStatus)}
                        </SelectItem>
                        {/* Show valid next statuses */}
                        {getValidNextStatuses().map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <SelectItem value={formData.orderStatus || order.orderStatus} disabled>
                        {getStatusLabel(formData.orderStatus || order.orderStatus)} (Final Status)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formData.orderStatus === 'in_transit' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {hasBeenPickedUp() 
                      ? 'Phase: Heading to dropoff location' 
                      : 'Phase: Heading to pickup location'}
                  </p>
                )}
              </div>
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
