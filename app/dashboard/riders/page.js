'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, ChevronLeft, ChevronRight, X, History } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import Pagination from '../users/Pagination';
import api from '@/lib/api';
import SuccessMessage from '@/components/successMessage';
import CreateRiderForm from './CreateRiderForm';
import RiderDetailsModal from './RiderDetailsModal';
import RiderHistoryModal from './RiderHistoryModal';


const RidersPage = () => {
  const router = useRouter();
  const initialFilters = {
    status: 'all',
    availability: 'all',
    onlineStatus: 'all',
    search: '',
    page: 1,
    limit: 10,
    dateFrom: null,
    dateTo: null
  };

  const [filters, setFilters] = useState(initialFilters);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [ridersData, setRidersData] = useState({ riders: [], metadata: {} });
  const [isCreatingRider, setIsCreatingRider] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [selectedRiderForHistory, setSelectedRiderForHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRiders();
  }, [filters]);

  const fetchRiders = async () => {
    setIsLoading(true);
    try {
      const params = {
        ...filters,
        search: filters.search || undefined,
        status: filters.status || undefined,
        availability: filters.availability || undefined,
        onlineStatus: filters.onlineStatus || undefined
      };
      
      // Only include date params if both are set
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const response = await api.get('/api/riders', { params });
      setRidersData(response.data);
    } catch (err) {
      console.error('Error fetching riders:', err);
      setError('Failed to fetch riders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset page when changing filters
    }));
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'active': 'success',
      'pending': 'warning',
      'inactive': 'secondary',
      'suspended': 'destructive'
    };
    return variants[status] || 'secondary';
  };

  const getAvailabilityBadgeVariant = (rider) => {
    if (!rider.details.isOnline) return 'secondary';
    return rider.details.currentOrderId ? 'warning' : 'success';
  };

  const getAvailabilityStatus = (rider) => {
    if (!rider.details.isOnline) return 'Offline';
    return rider.details.currentOrderId ? 'Busy' : 'Free';
  };

  const hasActiveFilters = () => {
    return (
      filters.status !== 'all' ||
      filters.availability !== 'all' ||
      filters.onlineStatus !== 'all' ||
      filters.search !== '' ||
      dateRange.from || dateRange.to
    );
  };

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setFilters(initialFilters);
  };

  // Handle date range changes - only trigger when both dates are selected
  useEffect(() => {
    const dateFrom = (dateRange.from && dateRange.to) ? dateRange.from.toISOString().split('T')[0] : null;
    const dateTo = (dateRange.from && dateRange.to) ? dateRange.to.toISOString().split('T')[0] : null;
    
    setFilters(prev => ({
      ...prev,
      dateFrom: dateFrom,
      dateTo: dateTo
    }));
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {showSuccess && (
        <SuccessMessage message={successMessage} onClose={() => setShowSuccess(false)} />
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riders</h1>
          <p className="text-sm text-gray-600">Manage your delivery riders</p>
        </div>
        <Button onClick={() => setIsCreatingRider(true)} className="bg-[#733E70] hover:bg-[#62275F]">
          <Plus className="w-5 h-5 mr-2" />
          Create Rider
        </Button>
      </div>

      {/* Updated Filters with Clear Button */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search riders..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.availability}
              onValueChange={(value) => handleFilterChange('availability', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Availability</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.onlineStatus}
              onValueChange={(value) => handleFilterChange('onlineStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Online status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-full">
              <DateRangePicker
                value={dateRange}
                onChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {filters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('search', '')}
                  />
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {filters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('status', 'all')}
                  />
                </Badge>
              )}
              {filters.availability !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Availability: {filters.availability}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('availability', 'all')}
                  />
                </Badge>
              )}
              {filters.onlineStatus !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Online Status: {filters.onlineStatus}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('onlineStatus', 'all')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Riders Table */}
      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ridersData.riders.map((rider) => (
              <tr key={rider.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex-shrink-0 h-10 w-10">
                    <Image
                      className="h-10 w-10 rounded-full object-cover"
                      src={rider.profilePictureUrl || '/default-avatar.png'}
                      alt={`${rider.firstName} ${rider.lastName}`}
                      width={40}
                      height={40}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div 
                    onClick={() => router.push(`/dashboard/riders/${rider.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="text-sm font-medium text-gray-900 group-hover:text-[#733E70]">
                      {rider.firstName} {rider.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{rider.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {rider.phoneNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusBadgeVariant(rider.status)}>
                    {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getAvailabilityBadgeVariant(rider)}>
                    {getAvailabilityStatus(rider)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button variant="outline" onClick={() => setSelectedRiderId(rider.id)}>
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedRiderForHistory(rider.id)}
                    className="ml-2"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Updated Pagination section */}
        {ridersData.metadata && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, ridersData.metadata.totalRiders)} of {ridersData.metadata.totalRiders} riders
            </div>
            <Pagination
              currentPage={parseInt(filters.page)}
              totalPages={ridersData.metadata.totalPages}
              onPageChange={(page) => handleFilterChange('page', page)}
            />
          </div>
        )}
      </div>

      {/* Updated Modal section */}
      {isCreatingRider && (
        <CreateRiderForm
          onSuccess={() => {
            setSuccessMessage('Rider created successfully');
            setShowSuccess(true);
            setIsCreatingRider(false);
            fetchRiders();
          }}
          onClose={() => setIsCreatingRider(false)}
        />
      )}

      {selectedRiderId && (
        <RiderDetailsModal
          riderId={selectedRiderId}
          onClose={() => setSelectedRiderId(null)}
        />
      )}

      {selectedRiderForHistory && (
        <RiderHistoryModal
          riderId={selectedRiderForHistory}
          onClose={() => setSelectedRiderForHistory(null)}
        />
      )}
    </div>
  );
};

export default RidersPage;