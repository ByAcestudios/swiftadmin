'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Plus, Filter } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import Pagination from '../orders/pagination';
import RiderDetailsModal from './RiderDetailsModal';
import CreateRiderForm from './CreateRiderForm';
import { Checkbox } from "@/components/ui/checkbox";
import api from '@/lib/api';
import SuccessMessage from '@/components/successMessage';

const RidersPage = () => {
  const [riders, setRiders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [isCreatingRider, setIsCreatingRider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const ridersPerPage = 7;
  const router = useRouter();

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/riders');
      setRiders(response.data);
    } catch (err) {
      console.error('Error fetching riders:', err);
      setError('Failed to fetch riders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRiders = riders.filter(rider =>
    rider.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRider = currentPage * ridersPerPage;
  const indexOfFirstRider = indexOfLastRider - ridersPerPage;
  const currentRiders = filteredRiders.slice(indexOfFirstRider, indexOfLastRider);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEditRider = (riderId) => {
    setSelectedRiderId(riderId);
  };

  const handleCloseModal = () => {
    setSelectedRiderId(null);
  };

  const handleCreateRider = () => {
    setIsCreatingRider(true);
  };

  const handleCloseCreateRider = () => {
    setIsCreatingRider(false);
    fetchRiders(); // Refresh the riders list after creating a new rider
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    fetchRiders(); // Refresh the riders list after successful action
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={handleSuccessClose}
          autoCloseDelay={3000}
        />
      )}
      
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
          <CreateRiderForm onSuccess={() => {
            setSuccessMessage('Rider created successfully');
            setShowSuccess(true);
            handleCloseCreateRider();
          }} />
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
                    {/* ... (filter options) */}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Riders Table */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRiders.map((rider) => (
                  <tr key={rider.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Image
                          className="h-10 w-10 rounded-full"
                          src={rider.profilePictureUrl || '/default-avatar.png'}
                          alt={`${rider.firstName} ${rider.lastName}`}
                          width={40}
                          height={40}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`${rider.firstName} ${rider.lastName}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rider.phoneNumber}</td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rider.status === 'active' ? 'bg-green-100 text-green-800' :
                        rider.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rider.status === 'pending' ? 'Needs Approval' : rider.status}
                      </span>
                    </td>
                    
                    
                    
                    
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" onClick={() => handleEditRider(rider.id)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstRider + 1} to {Math.min(indexOfLastRider, filteredRiders.length)} of {filteredRiders.length} riders
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

      {selectedRiderId && (
        <RiderDetailsModal riderId={selectedRiderId} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default RidersPage;