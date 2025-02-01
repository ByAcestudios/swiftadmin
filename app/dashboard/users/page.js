'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    isVerified: 'all'
  });
  const [shouldFetch, setShouldFetch] = useState(false);

  const fetchUsers = async () => {
    try {
      // console.log('Fetching users with filters:', filters);
      const queryParams = new URLSearchParams();
      
      // Only add parameters if they have meaningful values
      if (filters.search?.trim()) queryParams.append('search', filters.search.trim());
      if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.isVerified && filters.isVerified !== 'all') queryParams.append('isVerified', filters.isVerified);

      const queryString = queryParams.toString();
      // console.log('Query string:', queryString);
      
      // Only add the query string if there are actual parameters
      const url = `/api/users${queryString ? `?${queryString}` : ''}`;
      // console.log('Fetching URL:', url);
      
      const response = await api.get(url);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(response.data.pagination.currentPage);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
      setShouldFetch(false);
    }
  };

  // Initial load only
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle filter changes from FilterBar
  const handleFilterChange = (newFilters) => {
    console.log('Page receiving new filters:', newFilters);
    setFilters(newFilters);
    setShouldFetch(true); // This will trigger a new fetch
  };

  // Effect to handle filter changes
  useEffect(() => {
    if (filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.isVerified !== 'all') {
      setShouldFetch(true);
    }
  }, [filters]); // Watch for any filter changes

  // Only fetch when shouldFetch is true
  useEffect(() => {
    if (shouldFetch) {
      fetchUsers();
    }
  }, [shouldFetch]);

  const handlePageChange = (page) => {
    fetchUsers();
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