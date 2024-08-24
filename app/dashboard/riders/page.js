'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Filter } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import Pagination from '../orders/pagination';
import RiderDetailsModal from './RiderDetailsModal';
import CreateRiderForm from './CreateRiderForm';
import { Checkbox } from "@/components/ui/checkbox";


// Demo data for riders
const demoRiders = [
  { id: 1, name: 'Jomiloju Aramide', numberOfOrders: 27, riderScore: 5, bonus: 9500, salary: 65000 },
  // Add more demo riders as needed
];

const RidersPage = () => {
  const [riders, setRiders] = useState(demoRiders); // This will hold the riders data
  const [searchTerm, setSearchTerm] = useState(''); // This will hold the search term
  const [currentPage, setCurrentPage] = useState(1); // This will hold the current page
  const [selectedRider, setSelectedRider] = useState(null); // This will hold the selected rider for editing
  const [isCreatingRider, setIsCreatingRider] = useState(false); // This will handle the create rider form visibility
  const ridersPerPage = 7; // Number of riders per page

  const filteredRiders = riders.filter(rider =>
    rider.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRider = currentPage * ridersPerPage;
  const indexOfFirstRider = indexOfLastRider - ridersPerPage;
  const currentRiders = filteredRiders.slice(indexOfFirstRider, indexOfLastRider);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEditRider = (rider) => {
    setSelectedRider(rider);
  };

  const handleCloseModal = () => {
    setSelectedRider(null);
  };

  const handleCreateRider = () => {
    setIsCreatingRider(true);
  };

  const handleCloseCreateRider = () => {
    setIsCreatingRider(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riders</h1>
          <p className="text-sm text-gray-600">All riders are shown here.</p>
        </div>
        <Button onClick={handleCreateRider} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-5 h-5 mr-2" />
          Create Rider
        </Button>
      </div>

      {isCreatingRider ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <CreateRiderForm />
          <Button onClick={handleCloseCreateRider} className="mt-4 bg-gray-500 hover:bg-gray-600 text-white rounded-md p-2 text-sm">
            Cancel
          </Button>
        </div>
      ) : (
        <>
          {/* Rider Summary */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <Input
                type="text"
                placeholder="Search Riders..."
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
                      <Checkbox id="highestOrder" />
                      <label htmlFor="highestOrder" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Highest Order</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="lowestOrder" />
                      <label htmlFor="lowestOrder" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Lowest Order</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="riderScore" />
                      <label htmlFor="riderScore" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Rider Score</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="bonus" />
                      <label htmlFor="bonus" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bonus</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="salary" />
                      <label htmlFor="salary" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Salary</label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Riders Table */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRiders.map((rider) => (
                  <tr key={rider.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rider.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.numberOfOrders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.riderScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.bonus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.salary}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" onClick={() => handleEditRider(rider)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstRider + 1} to {indexOfLastRider} of {filteredRiders.length} riders
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredRiders.length / ridersPerPage)}
                onPageChange={paginate}
              />
            </div>
          </div>
        </>
      )}

      {selectedRider && (
        <RiderDetailsModal rider={selectedRider} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default RidersPage;