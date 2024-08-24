'use client';

import { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const SalesDistributionCard = ({ period }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('states');
  const [selectedState, setSelectedState] = useState('');

  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulated data
      const stateData = {
        'Lagos': 35,
        'Abuja': 20,
        'Kano': 15,
        'Rivers': 10,
        'Oyo': 8,
        'Others': 12
      };

      const lagosLGAData = {
        'Ikeja': 25,
        'Lekki': 20,
        'Surulere': 15,
        'Oshodi': 12,
        'Ikorodu': 10,
        'Others': 18
      };

      if (view === 'states') {
        setChartData({
          labels: Object.keys(stateData),
          datasets: [{
            data: Object.values(stateData),
            backgroundColor: colors.slice(0, Object.keys(stateData).length),
            borderColor: colors.slice(0, Object.keys(stateData).length),
            borderWidth: 1,
          }]
        });
      } else if (view === 'lga' && selectedState === 'Lagos') {
        setChartData({
          labels: Object.keys(lagosLGAData),
          datasets: [{
            data: Object.values(lagosLGAData),
            backgroundColor: colors.slice(0, Object.keys(lagosLGAData).length),
            borderColor: colors.slice(0, Object.keys(lagosLGAData).length),
            borderWidth: 1,
          }]
        });
      }

      setIsLoading(false);
    };

    fetchData();
  }, [period, view, selectedState]);

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
    }
  };

  const handleViewChange = (e) => {
    const newView = e.target.value;
    setView(newView);
    if (newView === 'states') {
      setSelectedState('');
    } else if (newView === 'lga' && selectedState !== 'Lagos') {
      setSelectedState('Lagos');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Sales Distribution</h2>
        <div className="flex space-x-2">
          <select
            value={view}
            onChange={handleViewChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#733E70] focus:border-[#733E70] p-2.5"
          >
            <option value="states">States</option>
            <option value="lga">Lagos LGAs</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733E70]"></div>
        </div>
      ) : (
        <div className="h-64">
          <Pie data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default SalesDistributionCard;