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

const OrderFilterBar = ({ onFilterChange, initialFilters = { 
  search: '', 
  orderType: 'all',
  orderStatus: 'all',
} }) => {
  const [filters, setFilters] = useState({
    ...initialFilters,
    riderStatus: 'all'
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

  const clearFilters = () => {
    setFilters({
      search: '',
      orderType: 'all',
      orderStatus: 'all',
      riderStatus: 'all'
    });
    onFilterChange({ 
      search: '', 
      orderType: 'all', 
      orderStatus: 'all', 
      riderStatus: 'all'
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

        {(filters.search || filters.orderType !== 'all' || filters.orderStatus !== 'all') && (
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