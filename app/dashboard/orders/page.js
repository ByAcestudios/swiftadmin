'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';

import { useToast } from "@/hooks/use-toast"
import CreateOrderForm from './CreateOrderForm';
import OrderActions from './OrderActions';
import OrderDetails from './OrderDetails';
import AssignRiderForm from './AssignRiderForm';
import EditOrderForm from './EditOrderForm';
import api from '@/lib/api';

const ITEMS_PER_PAGE = 10; // Adjust this value as needed

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignRiderModalOpen, setIsAssignRiderModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const response = await api.post('/api/orders', orderData);
      toast({
        title: "Success",
        description: "Order created successfully!",
      });
      fetchOrders(); // Refresh the orders list
      setIsCreateModalOpen(false); // Close the modal
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
      throw error; // Rethrow the error so the form can handle it if needed
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await api.delete(`/api/orders/${orderId}`);
        toast({
          title: "Success",
          description: "Order deleted successfully!",
        });
        fetchOrders();
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to delete order. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAssignRiderSubmit = async (riderId) => {
    try {
      await api.patch(`/api/orders/${selectedOrder.id}/reassign`, { riderId });
      toast({
        title: "Success",
        description: "Rider assigned successfully!",
      });
      setIsAssignRiderModalOpen(false);
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign rider. Please try again.",
        variant: "destructive",
      });
    }
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
      'instant': 'Instant',

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
    return userId.slice(0, 8) + '...';
  };

  // Client-side pagination
  const pageCount = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleAssignRider = (order) => {
    setSelectedOrder(order);
    setIsAssignRiderModalOpen(true);
  };

  const handleUpdateOrder = async (updatedOrder) => {
    try {
      await api.put(`/api/orders/${updatedOrder.id}`, updatedOrder);
      toast({
        title: "Success",
        description: "Order updated successfully!",
      });
      setIsEditModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Orders Management</h1>
      
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4" onClick={() => setIsCreateModalOpen(true)}>Create New Order</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <CreateOrderForm 
            onSubmit={handleCreateOrder} 
            onClose={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Order Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Button 
                      variant="link" 
                      onClick={() => handleViewDetails(order)}
                    >
                      {order.orderNumber}
                    </Button>
                  </TableCell>
                  <TableCell>{order.senderName || truncateUserId(order.userId)}</TableCell>
                  <TableCell>{formatOrderType(order.orderType)}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(order.orderStatus)} text-white`}>
                      {formatStatus(order.orderStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAssignRider(order)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Simple pagination controls */}
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span>Page {currentPage} of {pageCount}</span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {selectedOrder && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            <OrderDetails 
              order={selectedOrder} 
              onUpdate={() => {
                fetchOrders();
                setSelectedOrder(null);
              }}
              onClose={() => setSelectedOrder(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedOrder && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Order</DialogTitle>
            </DialogHeader>
            <EditOrderForm 
              order={selectedOrder}
              onSubmit={handleUpdateOrder}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isAssignRiderModalOpen} onOpenChange={setIsAssignRiderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Rider</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <AssignRiderForm 
              orderId={selectedOrder.id}
              onSubmit={handleAssignRiderSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;