import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import OrderStatus from './OrderStatus';
import RiderDetails from './RiderDetails';
import OrderActions from './OrderActions';

const OrderDetailsModal = ({ order, onClose }) => {
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [riderDetails, setRiderDetails] = useState(order.riderDetails);

  const handleStatusChange = (newStatus) => {
    setOrderStatus(newStatus);
  };

  const handleRiderChange = (newRider) => {
    setRiderDetails(newRider);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4 mt-4">
          <img src={order.profilePhoto} alt={order.name} className="w-24 h-24 rounded-full" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{order.name}</h3>
            <p className="text-sm text-gray-600">{order.phoneNumber}</p>
          </div>
        </div>

        <div className="mt-4">
          <OrderStatus status={orderStatus} onStatusChange={handleStatusChange} />
          <RiderDetails rider={riderDetails} onRiderChange={handleRiderChange} />
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">Pickup Address</p>
          <p className="text-sm text-gray-800">{order.pickupAddress}</p>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">Delivery Address</p>
          <p className="text-sm text-gray-800">{order.deliveryAddress}</p>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">Additional Note</p>
          <p className="text-sm text-gray-800">{order.additionalNote}</p>
        </div>

        <OrderActions onAccept={() => console.log('Order Accepted')} onReject={() => console.log('Order Rejected')} />
      </div>
    </div>
  );
};

export default OrderDetailsModal;