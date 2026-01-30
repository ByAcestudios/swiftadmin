'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, UserPlus, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import CreateOrderForm from '../CreateOrderForm';
import OrderActions from '../OrderActions';
import OrderDetails from '../OrderDetails';
import AssignRiderForm from '../AssignRiderForm';
import EditOrderForm from '../EditOrderForm';
import OrderFilterBar from '../OrderFilterBar';
import OrdersTable from '../OrdersTable';
import Pagination from '../pagination';
import api from '@/lib/api';

const ITEMS_PER_PAGE = 10; // Adjust this value as needed

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignRiderModalOpen, setIsAssignRiderModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    orderType: 'all',
    orderStatus: 'all',
    riderStatus: 'all',
    dateFrom: null,
    dateTo: null
  });

  const refreshOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.search?.trim()) queryParams.append('search', filters.search.trim());
      if (filters.orderType && filters.orderType !== 'all') queryParams.append('orderType', filters.orderType);
      if (filters.orderStatus && filters.orderStatus !== 'all') queryParams.append('orderStatus', filters.orderStatus);
    //   if (filters.riderStatus && filters.riderStatus !== 'all') {
    //     queryParams.append('hasRider', filters.riderStatus === 'assigned' ? 'true' : 'false');
    //   }
    queryParams.append('hasRider', true);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      queryParams.append('page', currentPage);

      const queryString = queryParams.toString();
      const url = `/api/orders${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        
        if (filters.search?.trim()) queryParams.append('search', filters.search.trim());
        if (filters.orderType && filters.orderType !== 'all') queryParams.append('orderType', filters.orderType);
        if (filters.orderStatus && filters.orderStatus !== 'all') queryParams.append('orderStatus', filters.orderStatus);
        // if (filters.riderStatus && filters.riderStatus !== 'all') {
        //   queryParams.append('hasRider', filters.riderStatus === 'assigned' ? 'true' : 'false');
        // }

        queryParams.append('hasRider', true);
        if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
        queryParams.append('page', currentPage);

        const queryString = queryParams.toString();
        const url = `/api/orders${queryString ? `?${queryString}` : ''}`;
        
        console.log('Fetching orders with URL:', url);
        const response = await api.get(url);
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, filters]);

  const handlePageChange = (page) => {
    console.log('Page change called:', page);
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters) => {
    console.log('Filter change called with:', newFilters);
    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      console.log('Filters actually changed, updating...');
      setFilters(newFilters);
      setCurrentPage(1);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      await api.post('/api/orders', orderData);
      toast({
        title: "Success",
        description: "Order created successfully!",
      });
      refreshOrders();
      setIsCreateModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
      throw error;
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
        refreshOrders();
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
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return (
    <div className="p-4 text-red-500 bg-red-50 rounded">
      <h3 className="font-bold">Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Assigned Orders</h1>
        <div className="flex gap-2">
        
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#733E70] hover:bg-[#62275F] text-white">
            <Plus className="w-5 h-5 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      <OrderFilterBar 
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <OrdersTable 
          orders={orders}
          onViewDetails={handleViewDetails}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onAssignRider={handleAssignRider}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

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

      {selectedOrder && (
        <>
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>
              <OrderDetails 
                order={selectedOrder} 
                onUpdate={(updatedOrder) => {
                  if (updatedOrder) {
                    setSelectedOrder(updatedOrder);
                  }
                  refreshOrders();
                }}
                onClose={() => setSelectedOrder(null)}
              />
            </DialogContent>
          </Dialog>

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
        </>
      )}
    </div>
  );
};

export default OrdersPage;