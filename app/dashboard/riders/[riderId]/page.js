'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Search, MapPin, Package, Star, Clock, Navigation, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from '@/lib/api';

export default function RiderHistoryPage({ params }) {
  const router = useRouter();
  const { riderId } = params;
  
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

  const openInGoogleMaps = (lat, lng) => {
    if (lat && lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
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
    <div className="container mx-auto py-8 space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="hover:bg-gray-100"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Riders
      </Button>

      {/* Rider Details Header */}
      {riderData?.rider && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              {/* Rider Basic Info */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={riderData.rider.profilePictureUrl || '/default-avatar.png'}
                    alt={riderData.rider.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {riderData.rider.name}
                  </h1>
                  <div className="mt-1 text-sm text-gray-500">
                    {riderData.rider.email} • {riderData.rider.phoneNumber}
                  </div>
                  <Badge 
                    variant={getStatusBadgeVariant(riderData.rider.status)}
                    className="mt-2"
                  >
                    {riderData.rider.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Current Status */}
              <div className="text-right">
                <Badge 
                  variant={riderData.rider.details.isOnline ? 'success' : 'secondary'}
                  className="text-sm"
                >
                  {riderData.rider.details.isOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
                {riderData.rider.details.currentOrderId && (
                  <div className="mt-2 text-sm text-gray-500">
                    Current Order: {riderData.rider.details.currentOrderId}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Total Orders</div>
                    <div className="text-lg font-semibold">
                      {riderData.rider.details.orderCount || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Rider Score</div>
                    <div className="text-lg font-semibold">
                      {riderData.rider.details.riderScore || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Last Active</div>
                    <div className="text-sm font-medium">
                      {riderData.rider.details.lastActiveAt ? 
                        formatDate(riderData.rider.details.lastActiveAt) : 
                        'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Navigation className="h-5 w-5 text-gray-400 mr-2" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Current Location</div>
                    <div className="text-sm font-medium">
                      {riderData.rider.details.currentLocation?.address || 
                       (typeof riderData.rider.details.currentLocation === 'string' 
                        ? riderData.rider.details.currentLocation 
                        : 'Not Available')}
                    </div>
                    {(riderData.rider.details.currentLocation?.latitude && riderData.rider.details.currentLocation?.longitude) ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {riderData.rider.details.currentLocation.latitude.toFixed(6)}, {riderData.rider.details.currentLocation.longitude.toFixed(6)}
                        </span>
                        <button
                          onClick={() => openInGoogleMaps(
                            riderData.rider.details.currentLocation.latitude,
                            riderData.rider.details.currentLocation.longitude
                          )}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (riderData.rider.details.currentLat && riderData.rider.details.currentLong) ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {riderData.rider.details.currentLat.toFixed(6)}, {riderData.rider.details.currentLong.toFixed(6)}
                        </span>
                        <button
                          onClick={() => openInGoogleMaps(
                            riderData.rider.details.currentLat,
                            riderData.rider.details.currentLong
                          )}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by order number or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full max-w-md"
        />
      </div>

      {/* Content */}
      <div className="bg-white shadow rounded-lg">
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
                        <div 
                          onClick={() => router.push(`/dashboard/users/${order.customer.id}`)}
                          className="cursor-pointer group"
                        >
                          <div className="text-sm font-medium text-gray-900 group-hover:text-[#733E70]">
                            {order.customer.name}
                          </div>
                          <div className="text-xs text-gray-500">{order.customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.pickupAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {riderData?.metadata && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
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
  );
} 