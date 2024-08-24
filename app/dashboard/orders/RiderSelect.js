import { useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Demo data for riders
const demoRiders = [
  { id: 1, fullName: 'John Doe', phoneNumber: '+234 123 456 7890', plateNumber: 'ABC123' },
  { id: 2, fullName: 'Jane Smith', phoneNumber: '+234 098 765 4321', plateNumber: 'XYZ789' },
  // Add more demo riders as needed
];

const RiderSelect = ({ onRiderChange }) => {
  const [selectedRider, setSelectedRider] = useState(null);

  const handleRiderChange = (riderId) => {
    const rider = demoRiders.find(r => r.id === parseInt(riderId));
    setSelectedRider(rider);
    onRiderChange(rider);
  };

  return (
    <div className="flex flex-col space-y-2">
      <Select onValueChange={handleRiderChange}>
        <SelectTrigger className="border border-gray-300 rounded-md p-2 text-sm">
          <SelectValue placeholder="Select Rider" />
        </SelectTrigger>
        <SelectContent>
          {demoRiders.map(rider => (
            <SelectItem key={rider.id} value={rider.id.toString()}>
              {rider.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedRider && (
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={selectedRider.fullName}
            readOnly
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <input
            type="text"
            value={selectedRider.phoneNumber}
            readOnly
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <input
            type="text"
            value={selectedRider.plateNumber}
            readOnly
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default RiderSelect;
