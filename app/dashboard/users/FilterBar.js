import { useState, useEffect, useRef } from 'react';
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
import { DateRangePicker } from "@/components/ui/date-range-picker";

const FilterBar = ({ onFilterChange, initialFilters = { 
  search: '', 
  role: 'all',
  status: 'all',
  isVerified: 'all',
  dateFrom: null,
  dateTo: null
} }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search);
  const [selectedRole, setSelectedRole] = useState(initialFilters.role);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [selectedVerification, setSelectedVerification] = useState(initialFilters.isVerified);
  const [dateRange, setDateRange] = useState({
    from: initialFilters.dateFrom ? new Date(initialFilters.dateFrom) : undefined,
    to: initialFilters.dateTo ? new Date(initialFilters.dateTo) : undefined,
  });
  const debouncedSearch = useDebounce(searchTerm, 200);
  
  // Use ref to track previous filters and prevent unnecessary updates
  const prevFiltersRef = useRef({
    search: debouncedSearch,
    role: selectedRole,
    status: selectedStatus,
    isVerified: selectedVerification,
    dateFrom: dateRange.from,
    dateTo: dateRange.to
  });
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Only include dates if BOTH from and to are selected
    const dateFrom = (dateRange.from && dateRange.to) ? dateRange.from.toISOString().split('T')[0] : null;
    const dateTo = (dateRange.from && dateRange.to) ? dateRange.to.toISOString().split('T')[0] : null;
    
    const newFilters = {
      search: debouncedSearch,
      role: selectedRole,
      status: selectedStatus,
      isVerified: selectedVerification,
      dateFrom: dateFrom,
      dateTo: dateTo
    };
    
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = newFilters;
      return;
    }
    
    // Only call onFilterChange if filters actually changed
    const prevFilters = prevFiltersRef.current;
    const hasChanged = 
      prevFilters.search !== newFilters.search ||
      prevFilters.role !== newFilters.role ||
      prevFilters.status !== newFilters.status ||
      prevFilters.isVerified !== newFilters.isVerified ||
      prevFilters.dateFrom !== newFilters.dateFrom ||
      prevFilters.dateTo !== newFilters.dateTo;
    
    if (hasChanged) {
      console.log('FilterBar updating filters with:', newFilters);
      prevFiltersRef.current = newFilters;
      onFilterChange(newFilters);
    }
  }, [debouncedSearch, selectedRole, selectedStatus, selectedVerification, dateRange, onFilterChange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedStatus('all');
    setSelectedVerification('all');
    setDateRange({ from: undefined, to: undefined });
    onFilterChange({ 
      search: '', 
      role: '', 
      status: '', 
      isVerified: '',
      dateFrom: null,
      dateTo: null
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        </div>
        
        <Select
          value={selectedRole}
          onValueChange={setSelectedRole}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="sub-admin">Sub Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus}
          onValueChange={setSelectedStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedVerification}
          onValueChange={setSelectedVerification}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verification</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-[250px]">
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
          />
        </div>

        {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedVerification !== 'all' || dateRange.from || dateRange.to) && (
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

export default FilterBar;