'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Filter, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '../orders/pagination';
import CreateBikeForm from './CreateBikeForm';
import BikeDetailsModal from './BikeDetailsModal';
import api from '@/lib/api';

const BikesPage = () => {
  const [bikes, setBikes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingBike, setIsCreatingBike] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState(null);
  const bikesPerPage = 7;

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        const response = await api.get('/api/bikes');
        setBikes(response.data);
      } catch (error) {
        console.error('Error fetching bikes:', error);
      }
    };

    fetchBikes();
  }, []);

  const filteredBikes = bikes.filter(bike =>
    bike.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastBike = currentPage * bikesPerPage;
  const indexOfFirstBike = indexOfLastBike - bikesPerPage;
  const currentBikes = filteredBikes.slice(indexOfFirstBike, indexOfLastBike);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleCreateBike = () => {
    setIsCreatingBike(true);
  };

  const handleCloseCreateBike = () => {
    setIsCreatingBike(false);
  };

  const handleDeleteBike = (id) => {
    setBikes(bikes.filter(bike => bike.id !== id));
  };

  const handleOpenBikeDetails = (bikeId) => {
    setSelectedBikeId(bikeId);
  };

  const handleCloseBikeDetails = () => {
    setSelectedBikeId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
          <p className="text-sm text-gray-600">All vehicles are shown here.</p>
        </div>
        <Button onClick={handleCreateBike} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-5 h-5 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {isCreatingBike ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <CreateBikeForm />
          <Button onClick={handleCloseCreateBike} className="mt-4 bg-gray-500 hover:bg-gray-600 text-white rounded-md p-2 text-sm">
            Cancel
          </Button>
        </div>
      ) : (
        <>
          {/* Vehicle Summary */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <Input
                type="text"
                placeholder="Search Vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-1/3"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="color" />
                      <label htmlFor="color" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Color</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="engineNumber" />
                      <label htmlFor="engineNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Engine Number</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="plateNumber" />
                      <label htmlFor="plateNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Plate Number</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rider" />
                      <label htmlFor="rider" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Rider</label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Vehicles Table */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name of Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBikes.map((bike) => (
                  <tr key={bike.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bike.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span
                          className="inline-block w-4 h-4 mr-2 rounded-full"
                          style={{ backgroundColor: bike.color }}
                        ></span>
                        {bike.color}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bike.vehicleType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bike.plateNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bike.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" onClick={() => handleOpenBikeDetails(bike.id)}>
                        Details
                      </Button>
                      <Button variant="outline" onClick={() => handleDeleteBike(bike.id)}>
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstBike + 1} to {indexOfLastBike} of {filteredBikes.length} vehicles
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredBikes.length / bikesPerPage)}
                onPageChange={paginate}
              />
            </div>
          </div>
        </>
      )}

      {selectedBikeId && (
        <BikeDetailsModal bikeId={selectedBikeId} onClose={handleCloseBikeDetails} />
      )}
    </div>
  );
};

export default BikesPage;