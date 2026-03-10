import Link from 'next/link';
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
      'cancelled': 'Cancelled',
      'assigned': 'Assigned',
      'picked_up': 'Picked Up',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'expired': 'Expired'
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
      'cancelled': 'bg-red-500',
      'assigned': 'bg-indigo-500',
      'picked_up': 'bg-green-600',
      'accepted': 'bg-emerald-500',
      'rejected': 'bg-red-500',
      'expired': 'bg-gray-500'
    };
    return statusMap[status] || 'bg-gray-500';
  };

  const truncateUserId = (userId) => {
    return userId?.slice(0, 8) + '...' || 'N/A';
  };

  const getSenderName = (order) => {
    if (!order.senderName) return order.user?.name || 'Unknown User';
    return order.senderName;
  };

  const getSenderEmail = (order) => order.user?.email || '—';
  const getSenderPhone = (order) => order.phoneNumber || order.user?.phoneNumber || '—';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address, maxLength = 40) => {
    if (!address) return 'N/A';
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[1000px]">
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Order Date</TableHead>
          <TableHead>Sender</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Pickup Address</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rider</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.orderNumber}</TableCell>
            <TableCell className="text-sm text-gray-600">
              {formatDate(order.orderDate)}
            </TableCell>
            <TableCell>
              {order.user?.id ? (
                <Link href={`/dashboard/users/${order.user.id}`} className="text-[#62275F] hover:underline font-medium">
                  {getSenderName(order)}
                </Link>
              ) : (
                getSenderName(order)
              )}
            </TableCell>
            <TableCell className="text-sm text-gray-600 max-w-[180px] truncate" title={getSenderEmail(order)}>
              {getSenderEmail(order)}
            </TableCell>
            <TableCell className="text-sm font-mono">
              {getSenderPhone(order) !== '—' ? (
                <a href={`tel:${getSenderPhone(order)}`} className="text-[#62275F] hover:underline">
                  {getSenderPhone(order)}
                </a>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </TableCell>
            <TableCell className="max-w-xs" title={order.pickupAddress}>
              {truncateAddress(order.pickupAddress)}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {formatOrderType(order.orderType)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={`${getStatusColor(order.orderStatus)} text-white`}>
                {formatStatus(order.orderStatus)}
              </Badge>
            </TableCell>
            <TableCell>
              {order.rider ? (
                <div className="text-sm">
                  <Link href={`/dashboard/riders/${order.rider.id}`} className="text-[#62275F] hover:underline font-medium block">
                    {order.rider.name?.trim()}
                  </Link>
                  {order.rider.phoneNumber && (
                    <a href={`tel:${order.rider.phoneNumber}`} className="text-xs font-mono text-[#62275F] hover:underline">
                      {order.rider.phoneNumber}
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-400">Not Assigned</span>
              )}
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
    </div>
  );
};

export default OrdersTable; 