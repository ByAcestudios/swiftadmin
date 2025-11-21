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

const FilterBar = ({ onFilterChange, initialFilters = { 
  search: '', 
  role: 'all',
  status: 'all',
  isVerified: 'all'
} }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search);
  const [selectedRole, setSelectedRole] = useState(initialFilters.role);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [selectedVerification, setSelectedVerification] = useState(initialFilters.isVerified);
  const debouncedSearch = useDebounce(searchTerm, 200);
  
  // Use ref to track previous filters and prevent unnecessary updates
  const prevFiltersRef = useRef({
    search: debouncedSearch,
    role: selectedRole,
    status: selectedStatus,
    isVerified: selectedVerification
  });
  const isInitialMount = useRef(true);

  useEffect(() => {
    const newFilters = {
      search: debouncedSearch,
      role: selectedRole,
      status: selectedStatus,
      isVerified: selectedVerification
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
      prevFilters.isVerified !== newFilters.isVerified;
    
    if (hasChanged) {
      console.log('FilterBar updating filters with:', newFilters);
      prevFiltersRef.current = newFilters;
      onFilterChange(newFilters);
    }
  }, [debouncedSearch, selectedRole, selectedStatus, selectedVerification, onFilterChange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedStatus('all');
    setSelectedVerification('all');
    onFilterChange({ 
      search: '', 
      role: '', 
      status: '', 
      isVerified: '' 
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

        {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedVerification !== 'all') && (
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