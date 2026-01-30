import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from '@/hooks/useDebounce';
import { fetchOrderSettings, formatSettingsForSelect } from '@/utils/settings';
import { DateRangePicker } from "@/components/ui/date-range-picker";

const OrderFilterBar = ({ onFilterChange, initialFilters = { 
  search: '', 
  orderType: 'all',
  orderStatus: 'all',
  dateFrom: null,
  dateTo: null,
} }) => {
  const [filters, setFilters] = useState({
    ...initialFilters,
    riderStatus: 'all'
  });
  const [dateRange, setDateRange] = useState({
    from: initialFilters.dateFrom ? new Date(initialFilters.dateFrom) : undefined,
    to: initialFilters.dateTo ? new Date(initialFilters.dateTo) : undefined,
  });
  const searchInputRef = useRef(null);
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    const newFilters = { ...filters, search: debouncedSearch };
    onFilterChange(newFilters);
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleTypeChange = (value) => {
    const newFilters = { ...filters, orderType: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (value) => {
    const newFilters = { ...filters, orderStatus: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRiderStatusChange = (value) => {
    const newFilters = { ...filters, riderStatus: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle date range changes - only trigger when both dates are selected
  useEffect(() => {
    // Only include dates if BOTH from and to are selected
    const dateFrom = (dateRange.from && dateRange.to) ? dateRange.from.toISOString().split('T')[0] : null;
    const dateTo = (dateRange.from && dateRange.to) ? dateRange.to.toISOString().split('T')[0] : null;
    
    setFilters(prevFilters => {
      // Only update if dates actually changed
      if (prevFilters.dateFrom !== dateFrom || prevFilters.dateTo !== dateTo) {
        const newFilters = {
          ...prevFilters,
          dateFrom: dateFrom,
          dateTo: dateTo
        };
        onFilterChange(newFilters);
        return newFilters;
      }
      return prevFilters;
    });
  }, [dateRange, onFilterChange]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setFilters({
      search: '',
      orderType: 'all',
      orderStatus: 'all',
      riderStatus: 'all',
      dateFrom: null,
      dateTo: null
    });
    onFilterChange({ 
      search: '', 
      orderType: 'all', 
      orderStatus: 'all', 
      riderStatus: 'all',
      dateFrom: null,
      dateTo: null
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            ref={searchInputRef}
            placeholder="Search orders by number or sender..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10"
          />
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        </div>
        
        <Select value={filters.orderType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="instant">Instant</SelectItem>
            <SelectItem value="sameDay">Same Day</SelectItem>
            <SelectItem value="nextDay">Next Day</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.orderStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.riderStatus} onValueChange={handleRiderStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rider Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-[250px]">
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
          />
        </div>

        {(filters.search || filters.orderType !== 'all' || filters.orderStatus !== 'all' || filters.riderStatus !== 'all' || dateRange.from || dateRange.to) && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderFilterBar; 