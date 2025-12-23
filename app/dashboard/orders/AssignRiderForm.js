import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Fetch all riders with pagination
  const fetchRiders = useCallback(async (searchQuery = '', page = 1, append = false) => {
    try {
      setLoading(true);
      const response = await api.get('/api/riders', {
        params: {
          page,
          limit: 50, // Fetch 50 at a time for better performance
          search: searchQuery || undefined,
          status: 'active' // Only show active riders
        }
      });
      
      const newRiders = response.data.riders || [];
      const metadata = response.data.metadata || {};
      
      if (append) {
        setRiders(prev => {
          const updated = [...prev, ...newRiders];
          setFilteredRiders(updated);
          return updated;
        });
      } else {
        setRiders(newRiders);
        setFilteredRiders(newRiders);
      }
      
      setCurrentPage(metadata.currentPage || page);
      setTotalPages(metadata.totalPages || 1);
      setHasMore((metadata.currentPage || page) < (metadata.totalPages || 1));
    } catch (error) {
      console.error('Failed to fetch riders:', error);
      toast({
        variant: "destructive",
        description: "Failed to fetch riders. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load - fetch first page
  useEffect(() => {
    fetchRiders('', 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debounced server-side search
  const handleSearch = useCallback((searchQuery) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is empty, fetch all riders
    if (!searchQuery || searchQuery.trim() === '') {
      fetchRiders('', 1, false);
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      fetchRiders(searchQuery.trim(), 1, false);
    }, 300);
  }, [fetchRiders]);

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
                  const value = event.target.value;
                  setQuery(value);
                  handleSearch(value);
                }}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown className="h-5 w-5 text-gray-400" />
              </Combobox.Button>
            </div>
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {loading && filteredRiders.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  Loading...
                </div>
              ) : filteredRiders.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  {query ? 'No riders found. Try a different search.' : 'No riders available'}
                </div>
              ) : (
                <>
                  {filteredRiders.map((rider) => (
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
                            {rider.firstName} {rider.lastName} {rider.details?.isOnline ? '(Online)' : '(Offline)'}
                          </span>
                          {selected ? (
                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-teal-600'}`}>
                              <Check className="h-5 w-5" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))}
                  {hasMore && !query && (
                    <div className="p-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => fetchRiders(query, currentPage + 1, true)}
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : `Load More (${totalPages - currentPage} pages remaining)`}
                      </Button>
                    </div>
                  )}
                </>
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