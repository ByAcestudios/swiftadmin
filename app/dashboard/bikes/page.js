'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import Pagination from '../users/Pagination';
import CreateBikeForm from './CreateBikeForm';
import BikeDetailsModal from './BikeDetailsModal';
import api from '@/lib/api';

const BikesPage = () => {
  const [bikes, setBikes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingBike, setIsCreatingBike] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    vehicleType: 'all',
    availability: 'all',
    serviceStatus: 'all',
    dateFrom: null,
    dateTo: null
  });
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setFilters({
      status: 'all',
      vehicleType: 'all',
      availability: 'all',
      serviceStatus: 'all',
      dateFrom: null,
      dateTo: null
    });
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || 
      Object.values(filters).some(value => value !== 'all' && value !== null) ||
      dateRange.from || dateRange.to;
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

  useEffect(() => {
    fetchBikes();
  }, [currentPage, searchTerm, filters]);

  const fetchBikes = async () => {
    try {
      const params = {
        page: currentPage,
        search: searchTerm || undefined,
        ...filters
      };
      
      // Only include date params if both are set
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const response = await api.get('/api/bikes', { params });

      setBikes(response.data.bikes);
      // Update statistics based on filtered data
      setStatistics({
        total: response.data.bikes.length,
        totalUnfiltered: response.data.metadata.totalBikes,
        active: response.data.bikes.filter(bike => bike.status === 'active').length,
        underRepair: response.data.bikes.filter(bike => bike.status === 'under_repair').length,
        assigned: response.data.bikes.filter(bike => bike.currentRider).length,
        serviceDue: response.data.bikes.filter(bike => bike.maintenanceStatus.isDue).length
      });
      setMetadata(response.data.metadata);
    } catch (error) {
      console.error('Error fetching bikes:', error);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'active': 'success',
      'inactive': 'secondary',
      'under_repair': 'destructive'
    };
    return variants[status] || 'secondary';
  };

  const getMaintenanceBadgeVariant = (maintenanceStatus) => {
    if (!maintenanceStatus.isDue) return 'success';
    return maintenanceStatus.daysUntilService < 0 ? 'destructive' : 'warning';
  };

  return (
    <div className="space-y-6">
      {/* Total Vehicles Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {metadata?.totalBikes?.toLocaleString() || statistics?.totalUnfiltered?.toLocaleString() || 0}
            </p>
          </div>
          <div className="h-12 w-12 bg-[#733E70] bg-opacity-10 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-[#733E70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-bold text-green-600">{statistics?.active || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Under Repair</div>
          <div className="text-2xl font-bold text-red-600">{statistics?.underRepair || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Assigned</div>
          <div className="text-2xl font-bold text-blue-600">{statistics?.assigned || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Service Due</div>
          <div className="text-2xl font-bold text-yellow-600">{statistics?.serviceDue || 0}</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters {hasActiveFilters() && <span className="ml-1 text-xs">•</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="under_repair">Under Repair</option>
                  </select>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Vehicle Type</h4>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="all">All</option>
                    <option value="bike">Bike</option>
                    <option value="van">Van</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Service Status</h4>
                  <select
                    value={filters.serviceStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, serviceStatus: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="all">All</option>
                    <option value="due">Service Due</option>
                    <option value="upcoming">Service Upcoming</option>
                    <option value="completed">Service Completed</option>
                  </select>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Date Range</h4>
                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  />
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters()}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => document.body.click()} // Close popover
                    className="bg-[#733E70] hover:bg-[#62275F] text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={() => setIsCreatingBike(true)} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {isCreatingBike ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <CreateBikeForm onClose={() => setIsCreatingBike(false)} />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Rider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maintenance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bikes.map((bike) => (
                  <tr key={bike.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: bike.color }} />
                        <div className="text-sm font-medium text-gray-900">{bike.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bike.vehicleType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(bike.status)}>
                        {bike.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bike.currentRider ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{bike.currentRider.name}</div>
                          <div className="text-gray-500">{bike.currentRider.phoneNumber}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getMaintenanceBadgeVariant(bike.maintenanceStatus)}>
                        {bike.maintenanceStatus.isDue ? 
                          `Due ${Math.abs(bike.maintenanceStatus.daysUntilService)} days ${bike.maintenanceStatus.daysUntilService < 0 ? 'ago' : 'soon'}` : 
                          'Up to date'
                        }
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBikeId(bike.id)}
                        className="text-[#733E70] hover:text-[#62275F]"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {metadata && metadata.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-700">
                Showing {((metadata.currentPage - 1) * metadata.bikesPerPage) + 1} to{' '}
                {Math.min(metadata.currentPage * metadata.bikesPerPage, metadata.totalBikes)} of{' '}
                {metadata.totalBikes} vehicles
              </div>
              <Pagination
                currentPage={metadata.currentPage}
                totalPages={metadata.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {selectedBikeId && (
        <BikeDetailsModal
          bikeId={selectedBikeId}
          onClose={() => setSelectedBikeId(null)}
        />
      )}
    </div>
  );
};

export default BikesPage;