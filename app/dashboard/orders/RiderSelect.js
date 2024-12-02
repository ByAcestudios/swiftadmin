// components/RiderSelect.js
import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from '@/lib/api';

const RiderSelect = ({ onSelect }) => {
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const response = await api.get('/api/riders');
        setRiders(response.data);
      } catch (error) {
        console.error('Failed to fetch riders:', error);
      }
    };
    fetchRiders();
  }, []);

  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Reassign to Rider" />
      </SelectTrigger>
      <SelectContent>
        {riders.map((rider) => (
          <SelectItem key={rider.id} value={rider.id}>{rider.firstName.toString()} {rider.lastName.toString()}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RiderSelect;