'use client';

import { useState, useEffect } from 'react';
import { format, startOfYear, endOfYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, CreditCard, Wallet, Clock, Ban, Search, X } from 'lucide-react';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TransactionsPage = () => {
  // State for filters and pagination
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    startDate: startOfYear(new Date()),  // Start of current year
    endDate: endOfYear(new Date()),      // End of current year
    status: 'all',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10
  });

  // Add new state for stats
  const [stats, setStats] = useState({
    transactionsByStatusAndPayment: [],
    summary: {
      totalTransactions: 0,
      successfulTransactions: 0,
      totalAmount: 0,
      successRate: "0.00"
    },
    paymentMethods: [],
    dateRange: {
      from: "",
      to: ""
    }
  });

  // Add new state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  // Add date preset options
  const datePresets = [
    {
      label: 'Today',
      dates: { from: new Date(), to: new Date() }
    },
    {
      label: 'Last 7 days',
      dates: { from: subWeeks(new Date(), 1), to: new Date() }
    },
    {
      label: 'Last 30 days',
      dates: { from: subMonths(new Date(), 1), to: new Date() }
    },
    {
      label: 'This week',
      dates: { from: startOfWeek(new Date()), to: endOfWeek(new Date()) }
    },
    {
      label: 'This month',
      dates: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
    },
    {
      label: 'This year',
      dates: { from: startOfYear(new Date()), to: endOfYear(new Date()) }
    }
  ];

  // Fetch transactions with current filters
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      // Handle search query
      if (searchQuery) {
        if (/^ORD/i.test(searchQuery)) {
          queryParams.append('orderNumber', searchQuery);
        } else {
          queryParams.append('orderId', searchQuery);
        }
      }

      // Add pagination
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());

      // Add status filter - ensure it's added when not 'all'
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status.toLowerCase());
      }

      // Add payment method filter
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        queryParams.append('paymentMethod', filters.paymentMethod.toLowerCase());
      }

      // Add date filters
      if (filters.startDate) {
        queryParams.append('startDate', format(filters.startDate, 'yyyy-MM-dd'));
      }
      if (filters.endDate) {
        queryParams.append('endDate', format(filters.endDate, 'yyyy-MM-dd'));
      }

      // Add amount filters
      if (filters.minAmount) {
        queryParams.append('minAmount', filters.minAmount);
      }
      if (filters.maxAmount) {
        queryParams.append('maxAmount', filters.maxAmount);
      }

      // Add sorting
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      console.log('Fetching with params:', queryParams.toString()); // Debug log

      const response = await api.get(`/api/transactions/admin/all?${queryParams}`);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Add stats fetching function
  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) {
        queryParams.set('startDate', format(filters.startDate, 'yyyy-MM-dd'));
      }
      if (filters.endDate) {
        queryParams.set('endDate', format(filters.endDate, 'yyyy-MM-dd'));
      }

      console.log('Fetching stats with date range:', queryParams.toString());

      const response = await api.get(`/api/transactions/admin/stats?${queryParams}`);
      setStats(response.data.data || {
        transactionsByStatusAndPayment: [],
        summary: {
          totalTransactions: 0,
          successfulTransactions: 0,
          totalAmount: 0,
          successRate: "0.00"
        },
        paymentMethods: [],
        dateRange: {
          from: format(filters.startDate, 'yyyy-MM-dd'),
          to: format(filters.endDate, 'yyyy-MM-dd')
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        transactionsByStatusAndPayment: [],
        summary: {
          totalTransactions: 0,
          successfulTransactions: 0,
          totalAmount: 0,
          successRate: "0.00"
        },
        paymentMethods: [],
        dateRange: {
          from: format(filters.startDate, 'yyyy-MM-dd'),
          to: format(filters.endDate, 'yyyy-MM-dd')
        }
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    console.log(`Changing filter ${key} to:`, value); // Debug log
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Add useEffect for initial data fetch
  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []); // Empty dependency array means this runs once on mount

  // Keep the existing useEffect for filter changes
  useEffect(() => {
    if (searchQuery) {
      fetchTransactions();
    }
  }, [searchQuery]); // Only fetch automatically for search changes

  // Helper function to format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  // Helper function to get stats for a specific status
  const getStatsByStatus = (status) => {
    const transactions = stats.transactionsByStatusAndPayment || [];
    return transactions
      .filter(stat => stat.status === status)
      .reduce((acc, curr) => {
        return {
          count: acc.count + parseInt(curr.count || 0),
          totalAmount: acc.totalAmount + parseFloat(curr.totalAmount || 0)
        };
      }, { count: 0, totalAmount: 0 });
  };

  // Add function to fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/transactions/admin/by-order/${orderId}`);
      setOrderDetails(response.data);
      setShowOrderDialog(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add search handler
  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  // Keep the clear filters function with fetch
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date()),
      status: 'all',
      minAmount: '',
      maxAmount: '',
      paymentMethod: 'all',
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
    fetchTransactions(); // Keep this to immediately fetch after clearing
  };

  // Add helper function to format date for display
  const formatDateForDisplay = (date) => {
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Successful Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successful Transactions</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.summary.successfulTransactions}
                </p>
                <p className="ml-2 text-sm text-gray-500">transactions</p>
              </div>
              <p className="text-sm font-medium text-green-600">
                {formatAmount(getStatsByStatus('success').totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {getStatsByStatus('pending').count}
                </p>
                <p className="ml-2 text-sm text-gray-500">transactions</p>
              </div>
              <p className="text-sm font-medium text-yellow-600">
                {formatAmount(getStatsByStatus('pending').totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Failed Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Transactions</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {getStatsByStatus('failed').count}
                </p>
                <p className="ml-2 text-sm text-gray-500">transactions</p>
              </div>
              <p className="text-sm font-medium text-red-600">
                {formatAmount(getStatsByStatus('failed').totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.summary.totalTransactions}
                </p>
                <p className="ml-2 text-sm text-gray-500">transactions</p>
              </div>
              <p className="text-sm font-medium text-blue-600">
                {formatAmount(stats.summary.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Filters</h2>
            {filters.startDate && filters.endDate && (
              <p className="text-sm text-gray-500">
                Showing data from {formatDateForDisplay(filters.startDate)} to {formatDateForDisplay(filters.endDate)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
            <Button 
              onClick={fetchTransactions}
              className="flex items-center gap-2"
            >
              Apply Filters
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input - keeps automatic fetching */}
          <div className="md:col-span-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search order ID or number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) fetchTransactions();
                  }}
                  className="pl-9 pr-9 w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      fetchTransactions();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Date Range Picker - remove auto fetch */}
          <div className="md:col-span-1">
            <DateRangePicker
              value={{
                from: filters.startDate,
                to: filters.endDate
              }}
              presets={datePresets}
              onChange={({ from, to }) => {
                setFilters(prev => ({
                  ...prev,
                  startDate: from,
                  endDate: to,
                  page: 1
                }));
              }}
            />
          </div>

          {/* Status Filter - remove auto fetch */}
          <div>
            <Select
              value={filters.status}
              onValueChange={(value) => {
                handleFilterChange('status', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method - remove auto fetch */}
          <div>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) => {
                setFilters(prev => ({
                  ...prev,
                  paymentMethod: value,
                  page: 1
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range - remove auto fetch */}
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => {
                setFilters(prev => ({
                  ...prev,
                  minAmount: e.target.value,
                  page: 1
                }));
              }}
            />
            <Input
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => {
                setFilters(prev => ({
                  ...prev,
                  maxAmount: e.target.value,
                  page: 1
                }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => fetchOrderDetails(transaction.order.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {transaction.order.orderNumber}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatAmount(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${transaction.status === 'success' ? 'bg-green-100 text-green-800' : 
                      transaction.status === 'failed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.paymentMethod}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {`${transaction.user.firstName} ${transaction.user.lastName}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.order.orderType}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {orderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Information</h3>
                  <p className="mt-1">Order Number: {orderDetails.order.orderNumber}</p>
                  <p>Type: {orderDetails.order.orderType}</p>
                  <p>Status: {orderDetails.order.orderStatus}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
                  <p className="mt-1">Name: {orderDetails.data[0].user.firstName} {orderDetails.data[0].user.lastName}</p>
                  <p>Email: {orderDetails.data[0].user.email}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction History</h3>
                <div className="space-y-2">
                  {orderDetails.data.map((transaction) => (
                    <div key={transaction.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{formatAmount(transaction.amount)}</p>
                          <p className="text-sm text-gray-500">{transaction.paymentMethod}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                          ${transaction.status === 'success' ? 'bg-green-100 text-green-800' : 
                            transaction.status === 'failed' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage; 