import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/utils";

const OrderDetails = ({ order }) => {
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

  const getStatusColor = (status) => {
    const colorMap = {
      'in_transit': 'bg-blue-500',
      'delivered': 'bg-green-500',
      'pending': 'bg-yellow-500',
      'cancelled': 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Order Information</h3>
          <p><span className="font-medium">Order Number:</span> {order.orderNumber}</p>
          <p><span className="font-medium">Order Type:</span> {formatOrderType(order.orderType)}</p>
          <p><span className="font-medium">Status:</span> 
            <Badge className={`ml-2 ${getStatusColor(order.orderStatus)} text-white`}>
              {formatStatus(order.orderStatus)}
            </Badge>
          </p>
          <p><span className="font-medium">Created At:</span> {formatDate(order.createdAt)}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Sender Information</h3>
          <p><span className="font-medium">Name:</span> {order.senderName}</p>
          <p><span className="font-medium">Phone:</span> {order.phoneNumber}</p>
          <p><span className="font-medium">Pickup Address:</span> {order.pickupAddress}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Delivery Information</h3>
        <p><span className="font-medium">Delivery Date:</span> {formatDate(order.deliveryDate)}</p>
        <p><span className="font-medium">Is Fragile:</span> {order.isFragile ? 'Yes' : 'No'}</p>
        <p><span className="font-medium">Item Category:</span> {order.itemCategory}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Drop-offs</h3>
        {Array.isArray(order.DropOffs) && order.DropOffs.length > 0 ? (
          order.DropOffs.map((dropOff, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <p><span className="font-medium">Address:</span> {dropOff.address}</p>
              <p><span className="font-medium">Receiver Name:</span> {dropOff.receiverName}</p>
              <p><span className="font-medium">Receiver Phone:</span> {dropOff.receiverPhoneNumber}</p>
            </div>
          ))
        ) : (
          <p>No drop-offs available for this order.</p>
        )}
      </div>

      {order.note && (
        <div>
          <h3 className="text-lg font-semibold">Additional Notes</h3>
          <p>{order.note}</p>
        </div>
      )}

      {order.riderId && (
        <div>
          <h3 className="text-lg font-semibold">Assigned Rider</h3>
          <p><span className="font-medium">Rider ID:</span> {order.riderId}</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;