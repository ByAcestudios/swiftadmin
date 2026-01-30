'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UsersTable } from "./UsersTable";
import FilterBar from './FilterBar';
import Pagination from './Pagination';
import UserForm from './UserForm';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import api from '@/lib/api';

// import { toast } from "@/components/ui/use-toast";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    isVerified: 'all',
    dateFrom: null,
    dateTo: null
  });
  const [shouldFetch, setShouldFetch] = useState(false);
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef(filters);

  const fetchUsers = useCallback(async (page = currentPage) => {
    try {
      // console.log('Fetching users with filters:', filters);
      const queryParams = new URLSearchParams();
      
      // Always include page parameter
      queryParams.append('page', page.toString());
      
      // Only add parameters if they have meaningful values
      if (filters.search?.trim()) queryParams.append('search', filters.search.trim());
      if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.isVerified && filters.isVerified !== 'all') queryParams.append('isVerified', filters.isVerified);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const queryString = queryParams.toString();
      // console.log('Query string:', queryString);
      
      const url = `/api/users?${queryString}`;
      // console.log('Fetching URL:', url);
      
      const response = await api.get(url);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setTotalUsers(response.data.pagination.totalUsers || response.data.pagination.total || 0);
      // Use the page we requested, not what the API returns (to avoid resetting)
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
      setShouldFetch(false);
    }
  }, [filters]);

  // Initial load only
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Handle filter changes from FilterBar - use useCallback to prevent infinite loops
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prevFilters => {
      // Only update if filters actually changed
      const hasChanged = 
        prevFilters.search !== newFilters.search ||
        prevFilters.role !== newFilters.role ||
        prevFilters.status !== newFilters.status ||
        prevFilters.isVerified !== newFilters.isVerified ||
        prevFilters.dateFrom !== newFilters.dateFrom ||
        prevFilters.dateTo !== newFilters.dateTo;
      
      if (!hasChanged) {
        return prevFilters; // Return same object if no change
      }
      
      return newFilters;
    });
  }, []);
  
  // Effect to handle filter changes and fetch when filters actually change
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = filters;
      return;
    }
    
    // Check if filters actually changed
    const prevFilters = prevFiltersRef.current;
    const hasChanged = 
      prevFilters.search !== filters.search ||
      prevFilters.role !== filters.role ||
      prevFilters.status !== filters.status ||
      prevFilters.isVerified !== filters.isVerified ||
      prevFilters.dateFrom !== filters.dateFrom ||
      prevFilters.dateTo !== filters.dateTo;
    
    if (hasChanged) {
      console.log('Filters changed, fetching page 1:', filters);
      prevFiltersRef.current = filters;
      setCurrentPage(1);
      setLoading(true);
      fetchUsers(1);
    }
  }, [filters, fetchUsers]);

  // Effect to handle filter changes - removed to prevent unwanted page resets
  // Filter changes are handled by handleFilterChange which already resets to page 1

  // Only fetch when shouldFetch is true
  useEffect(() => {
    if (shouldFetch) {
      fetchUsers(currentPage);
    }
  }, [shouldFetch]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setLoading(true);
    setShouldFetch(false); // Prevent the useEffect from interfering
    fetchUsers(page);
  };

  const handleCreateUser = async (userData) => {
    try {
      // const response = await api.post('/api/users/create', userData);
      // setUsers([...users, response.data.user]);
      await api.post('/api/users', userData);
      setIsModalOpen(false);
      // return response.data;
      await fetchUsers(); // Refresh users data immediately
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const handleEditUser = async (userData) => {
    try {
      console.log('EditingUser state:', editingUser);
      console.log('Received userData:', userData);
      
      if (!editingUser?.id) {
        throw new Error('User ID is required for editing');
      }

      await api.put(`/api/users/${editingUser.id}`, {
        ...userData,
        id: editingUser.id
      });

      setIsModalOpen(false);
      await fetchUsers(); // Refresh users data immediately
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      switch (action) {
        case 'edit':
          // Since we're now passing the full user object, we don't need to find it
          const userToEdit = typeof userId === 'object' ? userId : users.find(user => user.id === userId);
          console.log('User to edit:', userToEdit); // Debug log
          
          if (!userToEdit) {
            throw new Error('User not found');
          }
          
          setEditingUser({
            ...userToEdit,
            location: userToEdit.location || '',
            latitude: userToEdit.latitude || '',
            longitude: userToEdit.longitude || ''
          });
          setIsModalOpen(true);
          break;
        case 'suspend':
          try {
            await api.put(`/api/users/${userId}/status`, {
              status: 'suspended'
            });
            await fetchUsers(); // Refresh the list after suspension
          } catch (error) {
            console.error('Error suspending user:', error);
            throw error;
          }
          break;
        case 'activate':
          try {
            await api.put(`/api/users/${userId}/status`, {
              status: 'active'
            });
            await fetchUsers(); // Refresh the list after activation
          } catch (error) {
            console.error('Error activating user:', error);
            throw error;
          }
          break;
        case 'delete':
          try {
            await api.delete(`/api/users/${userId}`);
            await fetchUsers(); // Refresh the list after deletion
          } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
          }
          break;
        case 'resendVerification':
          try {
            await api.post(`/users/${userId}/resend-verification`);
            // toast({
            //   title: "Verification email sent",
            //   description: "A new verification email has been sent to the user.",
            // });
          } catch (error) {
            console.error('Error resending verification:', error);
            throw error;
          }
          break;
        default:
          console.log(`Unhandled action: ${action}`);
      }
    } catch (error) {
      console.error(`Error performing user action ${action}:`, error);
      // You might want to show an error message to the user here
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return (
    <div className="p-4 text-red-500 bg-red-50 rounded">
      <h3 className="font-bold">Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-5 h-5 mr-2" />
          Create User
        </Button>
      </div>

      {/* Total Users Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers.toLocaleString()}</p>
          </div>
          <div className="h-12 w-12 bg-[#733E70] bg-opacity-10 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-[#733E70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <UsersTable 
          users={users} 
          onUserAction={handleUserAction} 
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <UserForm 
              onSubmit={editingUser ? handleEditUser : handleCreateUser} 
              onCancel={() => { setIsModalOpen(false); setEditingUser(null); }}
              initialData={editingUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default UsersPage;