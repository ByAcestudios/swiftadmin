import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { X, Edit2 } from 'lucide-react';

const RiderDetailsModal = ({ rider, onClose }) => {
  const [riderDetails, setRiderDetails] = useState({
    ...rider,
    documents: rider.documents || [], // Ensure documents is an array
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRiderDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleStatusChange = (value) => {
    setRiderDetails(prevDetails => ({ ...prevDetails, status: value }));
  };

  const handleSave = () => {
    console.log('Rider Details Saved:', riderDetails);
    setIsEditing(false);
    onClose();
  };

  const handleStatusSave = () => {
    console.log('Rider Status Saved:', riderDetails.status);
    setIsEditingStatus(false);
  };

  const handleSuspend = () => {
    console.log('Rider Suspended:', riderDetails);
    // Add logic to handle rider suspension
  };

  const handleBlock = () => {
    console.log('Rider Blocked:', riderDetails);
    // Add logic to handle rider blocking
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Rider Details</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-4">
            <img src={riderDetails.profilePicture} alt="Profile" className="w-24 h-24 rounded-full" />
            <div>
              <h3 className="text-xl font-bold">{riderDetails.name}</h3>
              <p className="text-gray-600">{riderDetails.phoneNumber}</p>
              <p className="text-gray-600">Order Number: #{riderDetails.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Status:</span>
              {isEditingStatus ? (
                <Select onValueChange={handleStatusChange} value={riderDetails.status}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-gray-800">{riderDetails.status}</span>
              )}
              <button onClick={() => setIsEditingStatus(!isEditingStatus)} className="text-gray-400 hover:text-gray-500">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            {isEditingStatus && (
              <Button onClick={handleStatusSave} className="bg-[#733E70] hover:bg-[#62275F] text-white">
                Save
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bikeDetails">Bike Details</Label>
              {isEditing ? (
                <Input
                  id="bikeDetails"
                  name="bikeDetails"
                  value={riderDetails.bikeDetails}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{riderDetails.bikeDetails}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              {isEditing ? (
                <Input
                  id="paymentType"
                  name="paymentType"
                  value={riderDetails.paymentType}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{riderDetails.paymentType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              {isEditing ? (
                <Input
                  id="amount"
                  name="amount"
                  value={riderDetails.amount}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{riderDetails.amount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date & Time</Label>
              {isEditing ? (
                <Input
                  id="orderDate"
                  name="orderDate"
                  value={riderDetails.orderDate}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-gray-800">{riderDetails.orderDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Documents & Licenses</Label>
            <div className="flex flex-col space-y-2">
              {Array.isArray(riderDetails.documents) && riderDetails.documents.length > 0 ? (
                riderDetails.documents.map((doc, index) => (
                  <a key={index} href={doc.url} className="text-blue-600 hover:underline">
                    {doc.name}
                  </a>
                ))
              ) : (
                <p className="text-gray-600">No documents available</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={handleSuspend} className="bg-yellow-500 hover:bg-yellow-600 text-white">
              Suspend Rider
            </Button>
            <Button onClick={handleBlock} className="bg-red-500 hover:bg-red-600 text-white">
              Block Rider
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)} className="bg-gray-500 hover:bg-gray-600 text-white">
              {isEditing ? 'Cancel' : 'Edit Rider'}
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

export default RiderDetailsModal;