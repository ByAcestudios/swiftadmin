import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const OrderStatus = ({ status, onStatusChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState(status);

  const handleSave = () => {
    onStatusChange(newStatus);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col space-y-2 mt-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-gray-600">Status</p>
        <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-gray-500">
          <Pencil className="w-4 h-4" />
        </button>
      </div>
      {isEditing ? (
        <div className="flex flex-col space-y-2">
          <Select onValueChange={setNewStatus} value={newStatus}>
            <SelectTrigger className="border border-gray-300 rounded-md p-2 text-sm">
              <SelectValue placeholder="Choose Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In progress">In progress</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} className="bg-[#733E70] hover:bg-[#62275F] text-white rounded-md p-2 text-sm">
            Save
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-800">{status}</p>
      )}
    </div>
  );
};

export default OrderStatus;