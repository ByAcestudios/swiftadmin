import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

const AssignRiderForm = ({ orderId, onSubmit }) => {
  const { toast } = useToast();
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [query, setQuery] = useState('');
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/riders');
      setRiders(response.data.riders || []);
      setFilteredRiders(response.data.riders || []);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
      toast({
        variant: "destructive",
        description: "Failed to fetch riders. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      if (!query) {
        setFilteredRiders(riders);
        return;
      }

      if (query.length < 2) {
        return;
      }

      setLoading(true);
      
      const filtered = riders.filter(rider => 
        rider.firstName.toLowerCase().includes(query.toLowerCase()) ||
        rider.lastName.toLowerCase().includes(query.toLowerCase()) ||
        rider.email.toLowerCase().includes(query.toLowerCase()) ||
        rider.phoneNumber.includes(query)
      );
      
      setFilteredRiders(filtered);
    } catch (error) {
      console.error('Error searching riders:', error);
      toast({
        variant: "destructive",
        description: "Failed to search riders. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRider) {
      onSubmit(selectedRider.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <Label htmlFor="riderId">Select Rider</Label>
        <Combobox value={selectedRider} onChange={setSelectedRider}>
          <div className="relative mt-1">
            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
              <Combobox.Input
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                displayValue={(rider) => rider ? `${rider.firstName} ${rider.lastName}` : ''}
                onChange={(event) => {
                  setQuery(event.target.value);
                  handleSearch(event.target.value);
                }}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown className="h-5 w-5 text-gray-400" />
              </Combobox.Button>
            </div>
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {loading ? (
                <div className="p-2 text-center text-gray-500">
                  Loading...
                </div>
              ) : filteredRiders.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  No riders found
                </div>
              ) : (
                filteredRiders.map((rider) => (
                  <Combobox.Option
                    key={rider.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-teal-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={rider}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {rider.firstName} {rider.lastName} {rider.details.isOnline ? '(Online)' : '(Offline)'}
                        </span>
                        {selected ? (
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-teal-600'}`}>
                            <Check className="h-5 w-5" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </div>
        </Combobox>
      </div>
      <Button type="submit" className="w-full" disabled={!selectedRider}>
        Assign Rider
      </Button>
    </form>
  );
};

export default AssignRiderForm;