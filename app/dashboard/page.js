'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  Users, 
  CheckCircle, 
  BarChart,
  XCircle,
  RefreshCw,
  FileText,
  File,
  HelpCircle,
  FileSpreadsheet,
  FilePdf
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Register ChartJS components before using any charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BRAND = {
  primary: '#62275f',
  secondary: '#97bb3d',
  primaryLight: 'rgba(98, 39, 95, 0.1)',
  secondaryLight: 'rgba(151, 187, 61, 0.1)',
  gradients: {
    purple: 'linear-gradient(135deg, #62275f 0%, #8a3786 100%)',
    green: 'linear-gradient(135deg, #97bb3d 0%, #b3d55f 100%)',
    blue: 'linear-gradient(135deg, #2D3282 0%, #4F54A3 100%)',
    orange: 'linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)',
  }
};

const periods = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return '';
  }
};

// Add a loading skeleton component
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Mimic the layout with gray backgrounds */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-100 h-32 rounded-lg" />
      ))}
    </div>
    {/* Add more skeleton layouts */}
  </div>
);

export default function Dashboard() {
  const { toast } = useToast();
  const [period, setPeriod] = useState('7days');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [tempDateRange, setTempDateRange] = useState({ startDate: null, endDate: null });
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayDateRange, setDisplayDateRange] = useState({ start: null, end: null });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      let url = `/api/orders/stats/dashboard?period=${period}`;
      if (period === 'custom' && dateRange.startDate && dateRange.endDate) {
        url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        // Update display range for custom dates
        setDisplayDateRange({
          start: dateRange.startDate,
          end: dateRange.endDate
        });
      } else {
        // For non-custom periods, use API's date range
        const response = await api.get(url);
        setDashboardData(response.data);
        setDisplayDateRange({
          start: response.data.dateRange.start,
          end: response.data.dateRange.end
        });
      }
      
      const response = await api.get(url);
      setDashboardData(response.data);
    } catch (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        description: "Failed to load dashboard statistics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchDashboardStats();
    }
  }, [period]);

  useEffect(() => {
    if (period === 'custom' && dateRange.startDate && dateRange.endDate) {
      fetchDashboardStats();
    }
  }, [dateRange]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setChartDimensions({
        width: width < 768 ? width - 48 : (width - 96) / 2,
        height: 300,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleApplyDateRange = () => {
    if (!tempDateRange.startDate || !tempDateRange.endDate) {
      toast({
        variant: "destructive",
        description: "Please select both start and end dates",
      });
      return;
    }

    const start = new Date(tempDateRange.startDate);
    const end = new Date(tempDateRange.endDate);

    if (start > end) {
      toast({
        variant: "destructive",
        description: "Start date cannot be after end date",
      });
      return;
    }

    setDateRange(tempDateRange);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setDateRange({ startDate: null, endDate: null });
      setTempDateRange({ startDate: null, endDate: null });
    }
  };

  const refreshData = async () => {
    await fetchDashboardStats();
    setLastUpdated(new Date());
  };

  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = [
      // Headers
      ['Dashboard Report', format(new Date(), 'yyyy-MM-dd')],
      [],
      ['Summary'],
      ['Metric', 'Value'],
      ['Total Orders', dashboardData.summary.totalOrders],
      ['Unique Customers', dashboardData.summary.uniqueCustomers],
      ['Completed Orders', dashboardData.summary.completedOrders],
      ['Completion Rate', `${dashboardData.summary.completionRate}%`],
      [],
      ['User Metrics'],
      ['Total Users', dashboardData.userMetrics.summary.totalUsers],
      ['Active Users', dashboardData.userMetrics.activity.totalActiveUsers],
      ['Verification Rate', `${dashboardData.userMetrics.summary.verificationRate}%`],
      [],
      ['Rider Metrics'],
      ['Total Riders', dashboardData.riderMetrics.summary.totalRiders],
      ['Online Riders', dashboardData.riderMetrics.activity.onlineRiders],
      ['Total Deliveries', dashboardData.riderMetrics.deliveryPerformance.totalDeliveries],
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Report');

    // Save file
    XLSX.writeFile(wb, `dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Dashboard Report', 14, 15);
    doc.setFontSize(10);
    doc.text(format(new Date(), 'yyyy-MM-dd'), 14, 22);

    // Add summary section
    doc.autoTable({
      startY: 30,
      head: [['Summary Metrics', 'Value']],
      body: [
        ['Total Orders', dashboardData.summary.totalOrders],
        ['Unique Customers', dashboardData.summary.uniqueCustomers],
        ['Completed Orders', dashboardData.summary.completedOrders],
        ['Completion Rate', `${dashboardData.summary.completionRate}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [98, 39, 95] }, // BRAND.primary
    });

    // Add user metrics
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['User Metrics', 'Value']],
      body: [
        ['Total Users', dashboardData.userMetrics.summary.totalUsers],
        ['Active Users', dashboardData.userMetrics.activity.totalActiveUsers],
        ['Verification Rate', `${dashboardData.userMetrics.summary.verificationRate}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [151, 187, 61] }, // BRAND.secondary
    });

    // Add rider metrics
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Rider Metrics', 'Value']],
      body: [
        ['Total Riders', dashboardData.riderMetrics.summary.totalRiders],
        ['Online Riders', dashboardData.riderMetrics.activity.onlineRiders],
        ['Total Deliveries', dashboardData.riderMetrics.deliveryPerformance.totalDeliveries],
      ],
      theme: 'grid',
      headStyles: { fillColor: [98, 39, 95] }, // BRAND.primary
    });

    // Save PDF
    doc.save(`dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="p-4 rounded-full bg-red-50">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Failed to load dashboard</h3>
        <p className="text-gray-500">{error}</p>
        <Button onClick={() => fetchDashboardStats()}>Try Again</Button>
      </div>
    );
  }

  if (isLoading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  // Chart configurations
  const orderTimelineConfig = {
    data: {
      labels: dashboardData.charts.orderTimeline.map(item => 
        format(new Date(item.date), 'MMM dd')
      ),
      datasets: [{
        label: 'Orders',
        data: dashboardData.charts.orderTimeline.map(item => item.orders),
        fill: true,
        borderColor: BRAND.primary,
        backgroundColor: BRAND.primaryLight,
        tension: 0.4,
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  };

  const statusDistributionConfig = {
    data: {
      labels: dashboardData.charts.statusDistribution.map(item => 
        item.status.charAt(0).toUpperCase() + item.status.slice(1)
      ),
      datasets: [{
        data: dashboardData.charts.statusDistribution.map(item => item.count),
        backgroundColor: [
          '#733E70',
          '#9B6B9D',
          '#C398C1',
          '#EBC5E9',
        ],
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  };

  // Additional chart configurations
  const userGrowthConfig = {
    data: {
      labels: dashboardData.userMetrics.userGrowth.map(item => 
        format(new Date(item.date), 'MMM dd')
      ),
      datasets: [{
        label: 'New Users',
        data: dashboardData.userMetrics.userGrowth.map(item => item.newUsers),
        fill: true,
        borderColor: BRAND.secondary,
        backgroundColor: BRAND.secondaryLight,
        tension: 0.4,
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          {displayDateRange.start && displayDateRange.end && (
            <p className="text-sm text-gray-600">
              {formatDate(displayDateRange.start)} - {' '}
              {formatDate(displayDateRange.end)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          {/* Export Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="text-green-600 hover:text-green-900"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="text-red-600 hover:text-red-900"
          >
            <File className="h-4 w-4 mr-2" />
            Export PDF
          </Button>

          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={tempDateRange.startDate || ''}
                onChange={(e) => setTempDateRange(prev => ({ 
                  ...prev, 
                  startDate: e.target.value 
                }))}
                className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={tempDateRange.endDate || ''}
                onChange={(e) => setTempDateRange(prev => ({ 
                  ...prev, 
                  endDate: e.target.value 
                }))}
                className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
              <Button
                onClick={handleApplyDateRange}
                className="bg-purple-700 hover:bg-purple-800 text-white"
                size="sm"
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards with enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-white p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold mt-2 text-gray-900">
                {dashboardData.summary.totalOrders}
              </p>
            </div>
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ background: BRAND.gradients.purple }}
            >
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
          </div>
          <div 
            className="absolute bottom-0 left-0 h-1 w-full"
            style={{ background: BRAND.gradients.purple }}
          />
        </div>
        
        <div className="relative overflow-hidden bg-white p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unique Customers</p>
              <p className="text-3xl font-bold mt-2 text-gray-900">
                {dashboardData.summary.uniqueCustomers}
              </p>
            </div>
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ background: BRAND.gradients.green }}
            >
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <div 
            className="absolute bottom-0 left-0 h-1 w-full"
            style={{ background: BRAND.gradients.green }}
          />
        </div>
        
        <div className="relative overflow-hidden bg-white p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Orders</p>
              <p className="text-3xl font-bold mt-2 text-gray-900">
                {dashboardData.summary.completedOrders}
              </p>
            </div>
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ background: BRAND.gradients.blue }}
            >
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <div 
            className="absolute bottom-0 left-0 h-1 w-full"
            style={{ background: BRAND.gradients.blue }}
          />
        </div>
        
        <div className="relative overflow-hidden bg-white p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <div className="flex items-baseline mt-2">
                <p className="text-3xl font-bold text-gray-900">
                  {parseFloat(dashboardData.summary.completionRate).toFixed(1)}
                </p>
                <p className="ml-1 text-lg text-gray-600">%</p>
              </div>
            </div>
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ background: BRAND.gradients.orange }}
            >
              <BarChart className="h-6 w-6 text-white" />
            </div>
          </div>
          <div 
            className="absolute bottom-0 left-0 h-1 w-full"
            style={{ background: BRAND.gradients.orange }}
          />
        </div>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-[300px]">
            <Line {...userGrowthConfig} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.primaryLight }}>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold mt-1" style={{ color: BRAND.primary }}>
                {dashboardData.userMetrics.summary.totalUsers}
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.secondaryLight }}>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold mt-1" style={{ color: BRAND.secondary }}>
                {dashboardData.userMetrics.activity.totalActiveUsers}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Top Customers</h4>
            <div className="space-y-3">
              {dashboardData.userMetrics.topCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                  <Badge style={{ backgroundColor: BRAND.primaryLight, color: BRAND.primary }}>
                    {customer.orderCount} orders
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rider Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rider Performance</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.primaryLight }}>
              <p className="text-sm text-gray-600">Total Riders</p>
              <p className="text-2xl font-bold mt-1" style={{ color: BRAND.primary }}>
                {dashboardData.riderMetrics.summary.totalRiders}
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.secondaryLight }}>
              <p className="text-sm text-gray-600">Online Riders</p>
              <p className="text-2xl font-bold mt-1" style={{ color: BRAND.secondary }}>
                {dashboardData.riderMetrics.activity.onlineRiders}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500">Delivery Stats</h4>
            <div className="space-y-3">
              {Object.entries(dashboardData.riderMetrics.deliveryPerformance)
                .filter(([key]) => key !== 'completionRate')
                .map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            backgroundColor: BRAND.primary,
                            width: `${(value / dashboardData.riderMetrics.deliveryPerformance.totalDeliveries * 100) || 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-medium text-gray-600">{value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Riders</h3>
          <div className="space-y-4">
            {dashboardData.riderMetrics.topRiders.map((rider) => (
              <div key={rider.id} className="p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{rider.name}</p>
                    <p className="text-sm text-gray-500">{rider.phoneNumber}</p>
                  </div>
                  <Badge 
                    className="capitalize"
                    style={{ 
                      backgroundColor: rider.onlineStatus === 'online' ? 
                        BRAND.secondaryLight : 'rgba(0,0,0,0.05)',
                      color: rider.onlineStatus === 'online' ? 
                        BRAND.secondary : 'gray'
                    }}
                  >
                    {rider.onlineStatus}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Deliveries</p>
                    <p className="font-medium" style={{ color: BRAND.primary }}>
                      {rider.deliveryCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="font-medium" style={{ color: BRAND.primary }}>
                      {rider.completedDeliveries}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="font-medium" style={{ color: BRAND.primary }}>
                      {parseFloat(rider.riderScore).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
          <div className="h-[300px]">
            <Line {...orderTimelineConfig} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Pie {...statusDistributionConfig} />
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type Distribution</h3>
          <div className="space-y-4">
            {dashboardData.charts.typeDistribution.map((type) => (
              <div key={type.type} className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {type.type === 'nextDay' ? 'Next Day' :
                     type.type === 'sameDay' ? 'Same Day' :
                     type.type === 'instant' ? 'Instant Delivery' : type.type}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{
                        width: `${(type.count / dashboardData.summary.totalOrders * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <span className="ml-4 text-sm font-medium text-gray-600">
                  {type.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Delivery Locations</h3>
          <div className="space-y-4">
            {dashboardData.charts.topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="ml-3 text-sm text-gray-600">{location.address}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{location.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}