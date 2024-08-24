
'use client';

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesCard = ({ period, setPeriod }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Simulated data fetching based on period
    const fetchData = () => {
      let labels, currentData, previousData;
      switch (period) {
        case 'daily':
          labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          currentData = [1200, 1900, 1500, 1700, 2000, 2200, 1800];
          previousData = [1000, 1700, 1400, 1600, 1900, 2000, 1600];
          break;
        case 'weekly':
          labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          currentData = [8000, 9500, 10000, 9000];
          previousData = [7500, 9000, 9500, 8500];
          break;
        case 'monthly':
          labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          currentData = [50000, 55000, 60000, 58000, 65000, 70000];
          previousData = [48000, 52000, 57000, 55000, 62000, 67000];
          break;
        case 'yearly':
          labels = ['2019', '2020', '2021', '2022', '2023'];
          currentData = [600000, 650000, 700000, 750000, 800000];
          previousData = [550000, 600000, 650000, 700000, 750000];
          break;
      }

      setChartData({
        labels,
        datasets: [
          {
            label: 'Current Period',
            data: currentData,
            backgroundColor: 'rgba(115, 62, 112, 0.8)',
            borderColor: '#733E70',
            borderWidth: 1,
          },
          {
            label: 'Previous Period',
            data: previousData,
            backgroundColor: 'rgba(115, 62, 112, 0.2)',
            borderColor: '#733E70',
            borderWidth: 1,
          },
        ],
      });
    };

    fetchData();
  }, [period]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value) => '$' + value.toLocaleString(),
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  const totalSales = chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;
  const previousTotalSales = chartData.datasets[1]?.data.reduce((a, b) => a + b, 0) || 0;
  const salesDifference = totalSales - previousTotalSales;
  const salesPercentageChange = ((salesDifference / previousTotalSales) * 100).toFixed(1);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Sales</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#733E70] focus:border-[#733E70] p-2.5"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4 text-center">
        <span className="text-3xl font-bold text-gray-800">
          ${totalSales.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500 ml-2">Total Sales</span>
        <div className={`text-sm ${salesDifference >= 0 ? 'text-green-500' : 'text-red-500'} mt-2`}>
          {salesDifference >= 0 ? '▲' : '▼'} {Math.abs(salesPercentageChange)}%
          <span className="text-gray-500 ml-1">vs previous period</span>
        </div>
      </div>
    </div>
  );
};

export default SalesCard;