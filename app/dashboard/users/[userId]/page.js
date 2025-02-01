'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Search, Package, Star, Clock, MapPin, History } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from '@/lib/api';

export default function UserDetailsPage({ params }) {
  const router = useRouter();
  const { userId } = params;
  
  const [userData, setUserData] = useState(null);
  const [orderHistory, setOrderHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  useEffect(() => {
    fetchOrderHistory();
  }, [userId, currentPage, searchQuery]);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      setUserData(response.data.user);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details');
    }
  };

  const fetchOrderHistory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/users/${userId}/history`, {
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined
        }
      });
      
      if (response.data.message === "Page number exceeds available pages") {
        setCurrentPage(1);
        return;
      }
      
      setOrderHistory(response.data);
    } catch (err) {
      console.error('Error fetching order history:', err);
      if (err.response?.data?.message !== "Page number exceeds available pages") {
        setError('Failed to load order history');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    const variants = {
      'active': 'success',
      'inactive': 'secondary',
      'suspended': 'destructive'
    };
    return variants[status.toLowerCase()] || 'secondary';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">{error}</div>
    );
  }

  if (!userData) {
    return (
      <div className="text-gray-500 text-center py-4">No user data available</div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="hover:bg-gray-100"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back
      </Button>

      {/* User Details Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={userData.profilePictureUrl || '/default-avatar.png'}
                  alt={`${userData.firstName} ${userData.lastName}`}
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userData.fullName}
                </h1>
                <div className="mt-1 text-sm text-gray-500">
                  {userData.email} • {userData.phoneNumber}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Joined {format(new Date(userData.joinedDate), 'PP')}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900">
                {orderHistory?.metadata?.totalOrders || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Order History</h2>
            {orderHistory?.metadata?.totalOrders > 0 && (
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : orderHistory?.metadata?.totalOrders === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                This user hasn't placed any orders yet.
              </p>
            </div>
          ) : orderHistory?.orders && orderHistory.orders.length > 0 ? (
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
                        Pickup Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Drop-off Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderHistory.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.orderDate), 'PP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(order.orderStatus)}>
                            {order.orderStatus.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.pickupAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.dropOffs?.[0]?.address || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {orderHistory.metadata && orderHistory.metadata.totalPages > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((orderHistory.metadata.currentPage - 1) * 10) + 1} to{' '}
                    {Math.min(orderHistory.metadata.currentPage * 10, orderHistory.metadata.totalOrders)} of{' '}
                    {orderHistory.metadata.totalOrders} orders
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!orderHistory.metadata.hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!orderHistory.metadata.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No orders found {searchQuery && 'matching your search criteria'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 