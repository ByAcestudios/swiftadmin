'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart2, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

const CouponDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    couponDetails: null,
    statistics: null,
    usageHistory: [],
    metadata: null
  });

  const fetchCouponHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/coupons/${params.couponId}/history`, {
        params: {
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        }
      });

      setData({
        couponDetails: response.data.couponDetails,
        statistics: response.data.statistics,
        usageHistory: response.data.usageHistory,
        metadata: response.data.metadata
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to load coupon details",
      });
      router.push('/dashboard/coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponHistory();
  }, [currentPage, params.couponId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const { couponDetails, statistics, usageHistory, metadata } = data;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/coupons')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Coupons
        </Button>
      </div>

      {/* Coupon Overview & Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{couponDetails?.name}</h1>
              <p className="text-sm text-gray-500">{couponDetails?.code}</p>
            </div>
            <Badge className={couponDetails?.status === 'active' ? 
              "bg-purple-50 text-purple-700" : 
              "bg-red-50 text-red-700"
            }>
              {couponDetails?.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Discount</p>
              <p className="font-semibold text-purple-700">{couponDetails?.discountPercentage}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Uses</p>
              <p className="font-semibold">
                {couponDetails?.totalUses} / {couponDetails?.maxUses || '∞'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-purple-500" />
            Usage Statistics
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Total Discount Amount</p>
              <p className="text-2xl font-semibold text-purple-700">
                ₦{statistics?.totalDiscountAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Average Discount</p>
              <p className="text-2xl font-semibold text-purple-700">
                ₦{statistics?.averageDiscountAmount?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          {Object.keys(statistics?.orderTypeDistribution || {}).length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Order Type Distribution</h3>
              <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                {Object.entries(statistics.orderTypeDistribution).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-purple-600">
                      {type === 'instant' ? 'Instant Delivery' :
                       type === 'sameDay' ? 'Same Day' :
                       type === 'nextDay' ? 'Next Day' : type}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage History</h2>
        
        {usageHistory.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Order Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Discount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usageHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{entry.userName}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <Badge variant="outline" className="bg-purple-50/50 text-purple-700">
                          {entry.orderType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        ₦{parseFloat(entry.orderAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-purple-700 text-right font-medium">
                        ₦{parseFloat(entry.discountAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {metadata && metadata.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing {((metadata.currentPage - 1) * metadata.usagesPerPage) + 1} to{' '}
                  {Math.min(metadata.currentPage * metadata.usagesPerPage, metadata.totalUsages)} of{' '}
                  {metadata.totalUsages} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!metadata.hasPreviousPage}
                    className="text-purple-700 hover:bg-purple-50"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!metadata.hasNextPage}
                    className="text-purple-700 hover:bg-purple-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No usage history available
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponDetailsPage; 