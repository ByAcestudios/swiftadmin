import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/utils/utils";
import { getStatusColor } from "@/utils/settings";
import { formatSettingsForSelect } from "@/utils/settings";
import { Edit, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

const OrderDetails = ({ order, onUpdate, onOrderUpdate }) => {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(order.orderStatus);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const getSenderInfo = () => {
    // If senderName is null, it's a registered user order
    if (!order.senderName) {
      return {
        name: order.user?.name || 'Unknown User',
        phone: order.phoneNumber || order.user?.phoneNumber || order.user?.email,
        isGuest: false
      };
    }
    // If senderName exists, it's a guest order
    return {
      name: order.senderName,
      phone: order.phoneNumber,
      isGuest: true
    };
  };

  const formatStatus = (status) => {
    const statusMap = {
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'pending': 'Pending',
      'assigned': 'Assigned',
      'picked_up': 'Picked Up',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  // Get available next statuses based on current status
  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      'pending': ['assigned', 'cancelled'],
      'assigned': ['in_transit', 'cancelled'],
      'in_transit': ['picked_up', 'cancelled'],
      'picked_up': ['in_transit', 'delivered', 'cancelled'],
      'delivered': [], // Final status
      'cancelled': [] // Final status
    };
    
    // Allow all statuses for admin override, but show recommended ones first
    const allStatuses = ['pending', 'assigned', 'in_transit', 'picked_up', 'delivered', 'cancelled'];
    const recommended = statusFlow[currentStatus] || [];
    const others = allStatuses.filter(s => !recommended.includes(s) && s !== currentStatus);
    
    return [...recommended, ...others];
  };

  // Check if status transition is recommended (first few in the list)
  const isRecommendedStatus = (status) => {
    const statusFlow = {
      'pending': ['assigned', 'cancelled'],
      'assigned': ['in_transit', 'cancelled'],
      'in_transit': ['picked_up', 'cancelled'],
      'picked_up': ['in_transit', 'delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };
    const recommended = statusFlow[order.orderStatus] || [];
    return recommended.includes(status);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.orderStatus) {
      setIsStatusDialogOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      const payload = {
        status: newStatus
      };
      
      if (reason.trim()) {
        payload.reason = reason.trim();
      }

      const response = await api.put(`/api/orders/${order.id}/status`, payload);
      
      toast({
        title: "Success",
        description: "Order status updated successfully!",
      });

      setIsStatusDialogOpen(false);
      setReason('');
      
      // Call the callback to refresh the order
      const updatedOrder = response.data.order || { ...order, orderStatus: newStatus };
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }
      if (onUpdate) {
        onUpdate(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatOrderType = (type) => {
    const typeMap = {
      'nextDay': 'Next Day',
      'sameDay': 'Same Day',
      'instant': 'Instant'
    };
    return typeMap[type] || type;
  };

  const senderInfo = getSenderInfo();

  const getDropOffStatusColor = (status) => {
    const statusMap = {
      'pending': 'bg-yellow-500',
      'delivered': 'bg-green-500',
      'in_transit': 'bg-blue-500',
      'cancelled': 'bg-red-500'
    };
    return statusMap[status] || 'bg-gray-500';
  };

  const getPaymentStatusColor = (status) => {
    const statusMap = {
      'paid': 'bg-green-500',
      'waiting': 'bg-yellow-500',
      'failed': 'bg-red-500'
    };
    return statusMap[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Order Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Information</h3>
          <div className="space-y-3">
            <p className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">{order.orderNumber}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Order Type:</span>
              <span className="font-medium">{formatOrderType(order.orderType)}</span>
            </p>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(order.orderStatus)} text-white`}>
                  {formatStatus(order.orderStatus)}
                </Badge>
                <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setNewStatus(order.orderStatus)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Order Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Current Status</Label>
                        <Badge className={`${getStatusColor(order.orderStatus)} text-white`}>
                          {formatStatus(order.orderStatus)}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newStatus">New Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger id="newStatus">
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableStatuses(order.orderStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newStatus !== order.orderStatus && (
                          <div className={`flex items-start gap-2 p-2 border rounded text-sm ${
                            isRecommendedStatus(newStatus) 
                              ? 'bg-blue-50 border-blue-200 text-blue-800' 
                              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          }`}>
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              {isRecommendedStatus(newStatus)
                                ? 'This is a recommended status transition following the normal flow.'
                                : 'You are overriding the normal status flow. Use with caution.'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Input
                          id="reason"
                          placeholder="Enter reason for status change..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Provide a reason for the status change (e.g., "Customer requested cancellation")
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsStatusDialogOpen(false);
                          setReason('');
                          setNewStatus(order.orderStatus);
                        }}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={isUpdating || newStatus === order.orderStatus}
                        className="bg-[#733E70] hover:bg-[#62275F] text-white"
                      >
                        {isUpdating ? 'Updating...' : 'Update Status'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <p className="flex justify-between">
              <span className="text-gray-600">Created At:</span>
              <span className="font-medium">{formatDate(order.orderDate)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-medium text-green-600">
                {order.currency || 'NGN'} {order.amount?.toLocaleString() || '0.00'}
              </span>
            </p>
          </div>
        </div>

        {/* Sender Information with Guest/Registered Tag */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Sender Information</h3>
            <Badge className={senderInfo.isGuest ? "bg-orange-500 text-white" : "bg-blue-500 text-white"}>
              {senderInfo.isGuest ? "Guest" : "Registered User"}
            </Badge>
          </div>
          <div className="space-y-3">
            <p className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{senderInfo.name}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Phone Number:</span>
              <a 
                href={`tel:${senderInfo.phone}`}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {senderInfo.phone}
              </a>
            </p>
            
            <p className="flex flex-col">
              <span className="text-gray-600">Pickup Address:</span>
              <span className="font-medium mt-1">{order.pickupAddress}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Delivery Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <p className="flex justify-between">
            <span className="text-gray-600">Delivery Date:</span>
            <span className="font-medium">{formatDate(order.deliveryDate)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Is Fragile:</span>
            <span className="font-medium">{order.isFragile ? 'Yes' : 'No'}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Item Category:</span>
            <span className="font-medium">{formatSettingsForSelect([order.itemCategory])[0].label}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-gray-600">Payment Status:</span>
            <Badge className={`${getPaymentStatusColor(order.paymentStatus)} text-white`}>
              {order.paymentStatus}
            </Badge>
          </p>
        </div>
      </div>

      {/* Drop-offs with colored status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Drop-offs</h3>
        {order.dropOffs && order.dropOffs.length > 0 ? (
          <div className="space-y-4">
            {order.dropOffs.map((dropOff, index) => (
              <div key={dropOff.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <p className="flex flex-col">
                    <span className="text-gray-600">Receiver Name:</span>
                    <span className="font-medium">{dropOff.receiverName}</span>
                  </p>
                  <p className="flex flex-col">
                    <span className="text-gray-600">Receiver Phone:</span>
                    <span className="font-medium">{dropOff.receiverPhoneNumber}</span>
                  </p>
                  <p className="flex flex-col col-span-2">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{dropOff.address}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="text-gray-600 mr-2">Status:</span>
                    <Badge className={`${getDropOffStatusColor(dropOff.status)} text-white`}>
                      {dropOff.status}
                    </Badge>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No drop-offs available for this order.</p>
        )}
      </div>

      {/* Improved Assigned Rider section */}
      {order.rider && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Assigned Rider</h3>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="h-12 w-12 bg-[#733E70] rounded-full flex items-center justify-center text-white font-medium text-lg">
              {order.rider.name.charAt(0)}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{order.rider.name}</p>
                  <p className="text-gray-600">{order.rider.phoneNumber}</p>
                </div>
                <Badge variant="outline" className="bg-[#733E70] text-white">
                  Active Rider
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;