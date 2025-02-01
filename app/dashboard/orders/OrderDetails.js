import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/utils";
import { getStatusColor } from "@/utils/settings";
import { formatSettingsForSelect } from "@/utils/settings";

const OrderDetails = ({ order }) => {
  const getSenderInfo = () => {
    // If senderName is null, it's a registered user order
    if (!order.senderName) {
      return {
        name: order.user?.name || 'Unknown User',
        phone: order.user?.phoneNumber || order.user?.email,
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
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
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
            <p className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              <Badge className={`${getStatusColor(order.orderStatus)} text-white`}>
                {formatStatus(order.orderStatus)}
              </Badge>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-600">Created At:</span>
              <span className="font-medium">{formatDate(order.orderDate)}</span>
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
              <span className="text-gray-600">Contact:</span>
              <span className="font-medium">{senderInfo.phone}</span>
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