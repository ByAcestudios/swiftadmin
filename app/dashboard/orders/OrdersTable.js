import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';

const OrdersTable = ({ orders, onViewDetails, onEditOrder, onDeleteOrder, onAssignRider }) => {
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
    const statusMap = {
      'in_transit': 'bg-blue-500',
      'delivered': 'bg-green-500',
      'pending': 'bg-yellow-500',
      'cancelled': 'bg-red-500'
    };
    return statusMap[status] || 'bg-gray-500';
  };

  const truncateUserId = (userId) => {
    return userId?.slice(0, 8) + '...' || 'N/A';
  };

  const getSenderName = (order) => {
    // If senderName is null, it's a registered user order
    if (!order.senderName) {
      return order.user?.name || 'Unknown User';
    }
    // If senderName exists, it's a guest order
    return order.senderName;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Sender</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rider</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.orderNumber}</TableCell>
            <TableCell>{getSenderName(order)}</TableCell>
            <TableCell>{order.orderType}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(order.orderStatus)}>
                {order.orderStatus}
              </Badge>
            </TableCell>
            <TableCell>
              {order.rider ? order.rider.name : 'Not Assigned'}
            </TableCell>
            <TableCell className="space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onViewDetails(order)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEditOrder(order)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onDeleteOrder(order.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onAssignRider(order)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrdersTable; 