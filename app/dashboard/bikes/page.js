'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Filter, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
// import Pagination from '@/components/ui/pagination';
// import CreateBikeForm from '@/components/bikes/CreateBikeForm';
// import BikeDetailsModal from '@/components/bikes/BikeDetailsModal';
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '../orders/pagination';
import CreateBikeForm from './CreateBikeForm';
import BikeDetailsModal from './BikeDetailsModal';

// Demo data for bikes
const demoBikes = [
  { id: 1, name: 'Susuki', color: 'Black', engineNumber: '2901HJ291', plateNumber: 'KJA192AJ', rider: 'Jomiloju Aramide', datePurchased: '20 Nov 2020', duration: '9 months', servicingDate: '27 Jun 2021', history: [{ riderName: 'Samad Kunle', duration: '14 months' }, { riderName: 'Dekunle Abraham', duration: '4 months' }, { riderName: 'John Festus', duration: '18 months' }] },
  // Add more demo bikes as needed
];

const BikesPage = () => {
  const [bikes, setBikes] = useState(demoBikes); // This will hold the bikes data
  const [searchTerm, setSearchTerm] = useState(''); // This will hold the search term
  const [currentPage, setCurrentPage] = useState(1); // This will hold the current page
  const [isCreatingBike, setIsCreatingBike] = useState(false); // This will handle the create bike form visibility
  const [selectedBike, setSelectedBike] = useState(null); // This will hold the selected bike for details modal
  const bikesPerPage = 7; // Number of bikes per page

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

  const handleOpenBikeDetails = (bike) => {
    setSelectedBike(bike);
  };

  const handleCloseBikeDetails = () => {
    setSelectedBike(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bikes</h1>
          <p className="text-sm text-gray-600">All bikes are shown here.</p>
        </div>
        <Button onClick={handleCreateBike} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-5 h-5 mr-2" />
          Add Bike
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
          {/* Bike Summary */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <Input
                type="text"
                placeholder="Search Bikes..."
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

            {/* Bikes Table */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name of Bike</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engine Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBikes.map((bike) => (
                  <tr key={bike.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bike.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bike.color}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bike.engineNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bike.plateNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bike.rider}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" onClick={() => handleOpenBikeDetails(bike)}>
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
                Showing {indexOfFirstBike + 1} to {indexOfLastBike} of {filteredBikes.length} bikes
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

      {selectedBike && (
        <BikeDetailsModal bike={selectedBike} onClose={handleCloseBikeDetails} />
      )}
    </div>
  );
};

export default BikesPage;