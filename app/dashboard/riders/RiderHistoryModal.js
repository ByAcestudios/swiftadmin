'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from '@/lib/api';

const RiderHistoryModal = ({ riderId, onClose }) => {
  const [riderData, setRiderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchRiderHistory();
  }, [riderId, currentPage]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchRiderHistory();
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const fetchRiderHistory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/riders/${riderId}/history`, {
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined
        }
      });
      
      setRiderData(response.data);
    } catch (err) {
      console.error('Error fetching rider history:', err);
      setError('Failed to load rider history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'delivered': 'success',
      'cancelled': 'destructive',
      'pending': 'warning',
      'in_transit': 'default'
    };
    return variants[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'PPp');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Rider History</h2>
              {riderData?.rider && (
                <p className="text-sm text-gray-600">
                  {riderData.rider.name} - Total Orders: {riderData.metadata.totalOrders}
                </p>
              )}
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by order number or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : riderData?.orders?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found {searchQuery && 'matching your search criteria'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pickup
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {riderData?.orders?.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.orderDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(order.orderStatus)}>
                            {order.orderStatus.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.pickupAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {riderData?.metadata && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {searchQuery ? (
                      <span>
                        Found {riderData.metadata.totalOrders} matching orders
                      </span>
                    ) : (
                      <span>
                        Page {riderData.metadata.currentPage} of {riderData.metadata.totalPages}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!riderData.metadata.hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!riderData.metadata.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderHistoryModal; 