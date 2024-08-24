import { useState } from 'react';
import { Pencil } from 'lucide-react';

// Demo data for drivers
const demoDrivers = [
  { id: 1, fullName: 'John Doe', phoneNumber: '+234 123 456 7890', plateNumber: 'ABC123' },
  { id: 2, fullName: 'Jane Smith', phoneNumber: '+234 098 765 4321', plateNumber: 'XYZ789' },
  // Add more demo drivers as needed
];

const RiderDetails = ({ rider, onRiderChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newRider, setNewRider] = useState(rider);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);

  const handleSave = () => {
    onRiderChange(newRider);
    setIsEditing(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setNewRider(driver.fullName);
    setSearchTerm('');
  };

  const filteredDrivers = demoDrivers.filter(driver =>
    driver.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-2 mt-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-600">Rider Details</p>
        <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-gray-500">
          <Pencil className="w-4 h-4" />
        </button>
      </div>
      {isEditing ? (
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={handleSearch}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          {searchTerm && (
            <div className="border border-gray-300 rounded-md p-2 text-sm max-h-40 overflow-y-auto">
              {filteredDrivers.map(driver => (
                <div
                  key={driver.id}
                  className="cursor-pointer hover:bg-gray-100 p-2"
                  onClick={() => handleSelectDriver(driver)}
                >
                  {driver.fullName}
                </div>
              ))}
            </div>
          )}
          {selectedDriver && (
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={selectedDriver.fullName}
                readOnly
                className="border border-gray-300 rounded-md p-2 text-sm"
              />
              <input
                type="text"
                value={selectedDriver.phoneNumber}
                readOnly
                className="border border-gray-300 rounded-md p-2 text-sm"
              />
              <input
                type="text"
                value={selectedDriver.plateNumber}
                readOnly
                className="border border-gray-300 rounded-md p-2 text-sm"
              />
              <button onClick={handleSave} className="bg-[#733E70] hover:bg-[#62275F] text-white rounded-md p-2 text-sm">
                Reassign
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-800">{rider}</p>
      )}
    </div>
  );
};

export default RiderDetails;