'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateCouponForm from '@/app/dashboard/coupons/CreateCouponForm';
import EditCouponForm from './EditCouponForm';
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from 'next/link';

const orderTypes = [
  { id: "instant", label: "Instant Delivery" },
  { id: "sameDay", label: "Same Day" },
  { id: "nextDay", label: "Next Day" },
];

const getStatusColor = (isActive) => {
  return isActive 
    ? "bg-purple-50 text-purple-700 border-purple-200" 
    : "bg-red-50 text-red-700 border-red-200";
};

const getOrderTypeBadgeStyle = (type) => {
  return "bg-purple-50/50 text-purple-700 border-purple-100 hover:bg-purple-100/50";
};

const CouponsPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    orderType: 'all',
    expiryStatus: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/coupons', {
        params: {
          page: currentPage,
          ...filters,
        }
      });
      setCoupons(response.data.coupons);
      setMetadata(response.data.metadata);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to load coupons. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, filters]);

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getOrderTypeLabel = (type) => {
    switch (type) {
      case 'instant': return 'Instant Delivery';
      case 'sameDay': return 'Same Day';
      case 'nextDay': return 'Next Day';
      default: return type;
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      orderType: 'all',
      expiryStatus: 'all',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           filters.expiryStatus !== 'all' || 
           filters.search !== '';
  };

  const handleDeleteCoupon = async () => {
    try {
      await api.delete(`/api/coupons/${couponToDelete.id}`);
      toast({
        description: "Coupon deleted successfully",
      });
      fetchCoupons();
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to delete coupon. Please try again.",
      });
    } finally {
      setCouponToDelete(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-600">Manage your delivery coupons</p>
        </div>
        <Button 
          onClick={() => setIsCreatingCoupon(true)} 
          className="bg-[#733E70] hover:bg-[#62275F] text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Coupon
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coupons..."
            className="pl-8"
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.expiryStatus} onValueChange={(value) => handleFilterChange('expiryStatus', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Expiry Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expiry Status</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="not_expired">Not Expired</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters() && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-purple-700 hover:bg-purple-50 gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {isCreatingCoupon ? (
        <CreateCouponForm 
          onClose={() => setIsCreatingCoupon(false)}
          onSuccess={() => {
            setIsCreatingCoupon(false);
            fetchCoupons();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div>Loading...</div>
          ) : coupons.map((coupon) => (
            <div key={coupon.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link 
                    href={`/dashboard/coupons/${coupon.id}`}
                    className="group"
                  >
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-purple-700">
                      {coupon.name}
                    </h3>
                    <p className="text-sm text-gray-500">{coupon.code}</p>
                  </Link>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCoupon(coupon)}
                    className="text-purple-700 hover:bg-purple-50"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCouponToDelete(coupon)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Badge className={getStatusColor(coupon.isActive)}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-purple-700">{coupon.discountPercentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uses</span>
                  <span className="font-medium">{coupon.usageCount} / {coupon.maxUses || '∞'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min. Order</span>
                  <span className="font-medium text-purple-700">
                    {coupon.minOrderAmount ? `₦${parseFloat(coupon.minOrderAmount).toLocaleString()}` : 'None'}
                  </span>
                </div>
                {coupon.applicableOrderTypes && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {coupon.applicableOrderTypes.map(type => (
                      <Badge 
                        key={type} 
                        variant="outline" 
                        className={getOrderTypeBadgeStyle(type)}
                      >
                        {type === 'instant' ? 'Instant Delivery' :
                         type === 'sameDay' ? 'Same Day' :
                         type === 'nextDay' ? 'Next Day' : type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {metadata && !isCreatingCoupon && metadata.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {((metadata.currentPage - 1) * metadata.couponsPerPage) + 1} to{' '}
            {Math.min(metadata.currentPage * metadata.couponsPerPage, metadata.totalCoupons)} of{' '}
            {metadata.totalCoupons} coupons
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="text-purple-700 hover:bg-purple-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(metadata.totalPages, prev + 1))}
              disabled={currentPage === metadata.totalPages}
              className="text-purple-700 hover:bg-purple-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {editingCoupon && (
        <EditCouponForm
          coupon={editingCoupon}
          open={!!editingCoupon}
          onClose={() => setEditingCoupon(null)}
          onSuccess={() => {
            setEditingCoupon(null);
            fetchCoupons();
          }}
        />
      )}

      <Dialog open={!!couponToDelete} onOpenChange={() => setCouponToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Coupon
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this coupon? This action cannot be undone 
              and will permanently delete the coupon{' '}
              <span className="font-semibold text-gray-900">
                {couponToDelete?.name}
              </span>.
            </p>
          </div>

          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setCouponToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCoupon}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Coupon
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;