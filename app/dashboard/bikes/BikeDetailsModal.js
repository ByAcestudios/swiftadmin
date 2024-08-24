import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Edit2 } from 'lucide-react';

const BikeDetailsModal = ({ bike, onClose }) => {
  const [bikeDetails, setBikeDetails] = useState(bike);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBikeDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleSave = () => {
    console.log('Bike Details Saved:', bikeDetails);
    setIsEditing(false);
    onClose();
  };

  const handleDelete = () => {
    console.log('Bike Deleted:', bikeDetails);
    // Add logic to handle bike deletion
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Bike Details</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  name="name"
                  value={bikeDetails.name}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              {isEditing ? (
                <Input
                  id="color"
                  name="color"
                  value={bikeDetails.color}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.color}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number</Label>
              {isEditing ? (
                <Input
                  id="plateNumber"
                  name="plateNumber"
                  value={bikeDetails.plateNumber}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.plateNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocatedDriver">Allocated Driver</Label>
              {isEditing ? (
                <Input
                  id="allocatedDriver"
                  name="allocatedDriver"
                  value={bikeDetails.allocatedDriver}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.allocatedDriver}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="datePurchased">Date Purchased</Label>
              {isEditing ? (
                <Input
                  id="datePurchased"
                  name="datePurchased"
                  value={bikeDetails.datePurchased}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.datePurchased}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              {isEditing ? (
                <Input
                  id="duration"
                  name="duration"
                  value={bikeDetails.duration}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.duration}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="servicingDate">Servicing Date</Label>
              {isEditing ? (
                <Input
                  id="servicingDate"
                  name="servicingDate"
                  value={bikeDetails.servicingDate}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{bikeDetails.servicingDate}</p>
              )}
              <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-gray-500">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>History</Label>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider's Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bikeDetails.history.map((history, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{history.riderName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{history.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete Bike
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)} className="bg-gray-500 hover:bg-gray-600 text-white">
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            {isEditing && (
              <Button onClick={handleSave} className="bg-[#733E70] hover:bg-[#62275F] text-white">
                Save
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeDetailsModal;
