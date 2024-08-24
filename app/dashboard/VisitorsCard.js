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

const VisitorsCard = ({ period, setPeriod }) => {
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
          data = [1500, 1800, 1600, 2000, 2200, 1800, 1900];
          break;
        case 'weekly':
          labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          data = [10000, 12000, 11500, 13000];
          break;
        case 'monthly':
          labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          data = [50000, 55000, 53000, 58000, 62000, 60000];
          break;
        case 'yearly':
          labels = ['2019', '2020', '2021', '2022', '2023'];
          data = [500000, 600000, 650000, 700000, 750000];
          break;
      }

      setChartData({
        labels,
        datasets: [
          {
            label: 'Web Visitors',
            data,
            fill: true,
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, 'rgba(115, 62, 112, 0.5)');
              gradient.addColorStop(1, 'rgba(115, 62, 112, 0.1)');
              return gradient;
            },
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
        callbacks: {
          label: (context) => `Visitors: ${context.parsed.y.toLocaleString()}`,
        },
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

  const totalVisitors = chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Web Visitors</h2>
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
          {totalVisitors.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500 ml-2">Total Visitors</span>
      </div>
    </div>
  );
};

export default VisitorsCard;