'use client';

import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ShipmentsCard = ({ period, setPeriod }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const statusColors = {
    'Accepted': '#36A2EB',
    'Pending': '#FFCE56',
    'Going to Pickup': '#FF6384',
    'Going to Deliver': '#4BC0C0',
    'Delivered': '#9966FF',
    'Cancelled': '#FF9F40'
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulated data - in a real app, this would come from your API
      const shipmentData = {
        'Accepted': 18,
        'Pending': 9,
        'Going to Pickup': 11,
        'Going to Deliver': 29,
        'Delivered': 31,
        'Cancelled': 2
      };

      setChartData({
        labels: Object.keys(shipmentData),
        datasets: [{
          data: Object.values(shipmentData),
          backgroundColor: Object.keys(shipmentData).map(key => statusColors[key]),
          borderColor: Object.keys(shipmentData).map(key => statusColors[key]),
          borderWidth: 1,
        }]
      });

      setIsLoading(false);
    };

    fetchData();
  }, [period]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`,
        }
      }
    },
    cutout: '60%',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Shipments Status</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#733E70] focus:border-[#733E70] p-2.5"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733E70]"></div>
        </div>
      ) : (
        <div className="h-64">
          <Doughnut data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default ShipmentsCard;