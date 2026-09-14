'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UsersTable } from "./UsersTable";
import FilterBar from './FilterBar';
import Pagination from './Pagination';
import UserForm from './UserForm';
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  File,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { exportToExcel, exportToPDF, fetchAllDataForExport } from '@/utils/exportUtils';
import { useToast } from "@/hooks/use-toast";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
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

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      if (filters.role && filters.role !== 'all') {
        params.set('role', filters.role);
      }
      const qs = params.toString();
      const res = await api.get(`/api/users/stats${qs ? `?${qs}` : ''}`);
      setStats(res.data?.stats || res.data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.role]);

  const fetchUsers = useCallback(async (page = currentPage) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());

      if (filters.search?.trim()) queryParams.append('search', filters.search.trim());
      if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.isVerified && filters.isVerified !== 'all') queryParams.append('isVerified', filters.isVerified);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const response = await api.get(`/api/users?${queryParams.toString()}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setTotalUsers(response.data.pagination.totalUsers || response.data.pagination.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
      setShouldFetch(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers(1);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prevFilters) => {
      const hasChanged =
        prevFilters.search !== newFilters.search ||
        prevFilters.role !== newFilters.role ||
        prevFilters.status !== newFilters.status ||
        prevFilters.isVerified !== newFilters.isVerified ||
        prevFilters.dateFrom !== newFilters.dateFrom ||
        prevFilters.dateTo !== newFilters.dateTo;

      if (!hasChanged) return prevFilters;
      return newFilters;
    });
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = filters;
      return;
    }

    const prevFilters = prevFiltersRef.current;
    const hasChanged =
      prevFilters.search !== filters.search ||
      prevFilters.role !== filters.role ||
      prevFilters.status !== filters.status ||
      prevFilters.isVerified !== filters.isVerified ||
      prevFilters.dateFrom !== filters.dateFrom ||
      prevFilters.dateTo !== filters.dateTo;

    if (hasChanged) {
      prevFiltersRef.current = filters;
      setCurrentPage(1);
      setShouldFetch(true);
    }
  }, [filters]);

  useEffect(() => {
    if (shouldFetch) {
      fetchUsers(1);
    }
  }, [shouldFetch, fetchUsers]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  const handleCreateUser = async (userData) => {
    try {
      await api.post('/api/users', userData);
      setIsModalOpen(false);
      await fetchUsers();
      await fetchStats();
      toast({ description: 'User created successfully.' });
    } catch (err) {
      console.error('Error creating user:', err);
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to create user.',
      });
      throw err;
    }
  };

  const handleEditUser = async (userData) => {
    try {
      await api.put(`/api/users/${editingUser.id}`, {
        ...userData,
        id: editingUser.id,
      });
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
      await fetchStats();
      toast({ description: 'User updated successfully.' });
    } catch (err) {
      console.error('Error updating user:', err);
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to update user.',
      });
      throw err;
    }
  };

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      const allUsers = await fetchAllDataForExport('/api/users', filters);

      const columns = [
        { key: 'fullName', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        { key: 'isVerified', label: 'Verified' },
        { key: 'createdAt', label: 'Joined' },
      ];

      if (format === 'excel') {
        await exportToExcel(allUsers, columns, 'users');
      } else {
        await exportToPDF(allUsers, columns, 'Users');
      }
    } catch (err) {
      console.error('Export error:', err);
      toast({
        variant: 'destructive',
        description: 'Failed to export users.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleUserAction = async (userOrId, action) => {
    const userId = typeof userOrId === 'object' ? userOrId.id : userOrId;

    try {
      switch (action) {
        case 'edit':
          setEditingUser(userOrId);
          setIsModalOpen(true);
          break;
        case 'suspend':
          await api.put(`/api/users/${userId}/status`, { status: 'suspended' });
          await fetchUsers();
          break;
        case 'activate':
          await api.put(`/api/users/${userId}/status`, { status: 'active' });
          await fetchUsers();
          break;
        case 'delete':
          await api.delete(`/api/users/${userId}`);
          await fetchUsers();
          await fetchStats();
          break;
        case 'resendVerification':
          await api.post(`/users/${userId}/resend-verification`);
          break;
        default:
          console.log(`Unhandled action: ${action}`);
      }
    } catch (err) {
      console.error(`Error performing user action ${action}:`, err);
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  const cardStats = [
    {
      key: 'total',
      label: 'Total users',
      value: stats?.totalUsers ?? totalUsers,
      icon: Users,
    },
    {
      key: 'verified',
      label: 'Verified',
      value: stats?.verifiedUsers,
      icon: UserCheck,
      valueClass: 'text-green-700',
    },
    {
      key: 'unverified',
      label: 'Unverified',
      value: stats?.unverifiedUsers,
      icon: UserX,
      valueClass: 'text-amber-700',
    },
    {
      key: 'week',
      label: 'New this week',
      value: stats?.newUsersThisWeek,
      icon: UserPlus,
      valueClass: 'text-[#733E70]',
      subtitle: 'Last 7 days',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <div className="flex gap-2">
          <Button
            onClick={fetchStats}
            variant="ghost"
            size="sm"
            disabled={statsLoading}
            title="Refresh stats"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => handleExport('excel')}
            variant="outline"
            disabled={isExporting}
            className="flex items-center"
          >
            <File className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Excel'}
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            variant="outline"
            disabled={isExporting}
            className="flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'PDF'}
          </Button>
          <Button
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="bg-[#733E70] hover:bg-[#62275F] text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cardStats.map(({ key, label, value, icon: Icon, valueClass, subtitle }) => (
          <div key={key} className="bg-white p-5 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className={`text-3xl font-bold mt-1 tabular-nums ${valueClass || 'text-gray-900'}`}>
                  {statsLoading && value == null ? '…' : Number(value ?? 0).toLocaleString()}
                </p>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-[#733E70] bg-opacity-10 rounded-full flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-[#733E70]" />
              </div>
            </div>
          </div>
        ))}
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

export default UsersPage;
