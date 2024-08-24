'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

const OrdersCard = ({ period, setPeriod }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Simulated data fetching based on period
    const fetchData = () => {
      let labels, data;
      switch (period) {
        case 'daily':
          labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          data = [30, 40, 35, 50, 49, 60, 70];
          break;
        case 'weekly':
          labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          data = [200, 250, 300, 280];
          break;
        case 'monthly':
          labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          data = [1200, 1900, 1500, 1700, 2000, 2200];
          break;
        case 'yearly':
          labels = ['2019', '2020', '2021', '2022', '2023'];
          data = [15000, 18000, 17000, 22000, 24000];
          break;
      }

      setChartData({
        labels,
        datasets: [
          {
            label: 'Orders',
            data,
            fill: true,
            backgroundColor: 'rgba(115, 62, 112, 0.2)',
            borderColor: '#733E70',
            tension: 0.4,
            pointRadius: 0,
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
        display: false,
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
          callback: (value) => value.toLocaleString(),
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Orders</h2>
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
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-4 text-center">
        <span className="text-3xl font-bold text-gray-800">
          {chartData.datasets[0]?.data.reduce((a, b) => a + b, 0).toLocaleString()}
        </span>
        <span className="text-sm text-gray-500 ml-2">Total Orders</span>
      </div>
    </div>
  );
};

export default OrdersCard;