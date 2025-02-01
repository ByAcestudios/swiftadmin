import { useState, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast"
import api from '@/lib/api';
import { nanoid } from 'nanoid'; // You might need to install this package: npm install nanoid
import { Badge } from "@/components/ui/badge";
import { getKeysByCategory } from "@/utils/settings";

const CreateOrderForm = ({ onSubmit, onClose }) => {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    customerType: 'guest',
    senderName: '',
    phoneNumber: '',
    pickupAddress: '',
    orderType: '',
    deliveryDate: '',
    isFragile: false,
    itemCategory: '',
    paymentType: '',
    note: '',
    dropOffs: [{
      receiverName: '',
      receiverPhoneNumber: '',
      address: '',
      location: { type: 'Point', coordinates: [0, 0] }
    }]
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [riders, setRiders] = useState([]);
  const [users, setUsers] = useState({ users: [], pagination: {} });
  const [isLoadingRiders, setIsLoadingRiders] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);

  const itemCategories =  getKeysByCategory('itemCategories');
  console.log(itemCategories);

  useEffect(() => {
    fetchRiders();
    fetchUsers();
    fetchCategories();
  }, []);

  const fetchRiders = async () => {
    setIsLoadingRiders(true);
    try {
      const response = await api.get('/api/riders');
      setRiders(response.data);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
      toast({
        title: "Error",
        description: "Failed to load riders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRiders(false);
    }
  };

  const fetchUsers = async (searchQuery = '') => {
    if (formData.customerType === 'user') {
      setIsLoadingUsers(true);
      try {
        const response = await api.get('/api/users', {
          params: {
            page,
            limit: 10,
            search: searchQuery
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
  };

  const fetchCategories = async () => {
    const result = await getKeysByCategory();
    if (result.categories) {
      setCategories(result.categories);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        fetchUsers(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch users when switching to 'user' type
  useEffect(() => {
    if (formData.customerType === 'user') {
      fetchUsers();
    }
  }, [formData.customerType, page]);

  const handleChange = (e, index = null) => {
    const { name, value, type, checked } = e.target || {};
    
    if (index !== null) {
      setFormData(prev => ({
        ...prev,
        dropOffs: prev.dropOffs.map((dropOff, i) => {
          if (i !== index) return dropOff;
          
          if (name === 'latitude' || name === 'longitude') {
            const coordinates = [...dropOff.location.coordinates];
            if (name === 'latitude') {
              coordinates[0] = parseFloat(value) || 0;
            } else {
              coordinates[1] = parseFloat(value) || 0;
            }
            return {
              ...dropOff,
              location: {
                ...dropOff.location,
                coordinates
              }
            };
          }
          
          return { ...dropOff, [name]: value };
        })
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleUserSelect = (userId) => {
    const selectedUser = users.users.find(user => user.id === userId);
    if (selectedUser) {
      setSelectedUserId(selectedUser.id);
      setFormData(prev => ({
        ...prev,
        senderName: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
      }));
    }
  };

  const addDropOff = () => {
    setFormData(prev => ({
      ...prev,
      dropOffs: [...prev.dropOffs, {
        receiverName: '',
        receiverPhoneNumber: '',
        address: '',
        location: { type: 'Point', coordinates: [0, 0] }
      }]
    }));
  };

  const removeDropOff = (index) => {
    if (formData.dropOffs.length > 1) {
      setFormData(prev => ({
        ...prev,
        dropOffs: prev.dropOffs.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    
    if (formData.customerType === 'user') {
      payload.userId = selectedUserId;
    }

    try {
      await onSubmit(payload);
      onClose(); // Close the modal after successful submission
    } catch (error) {
      // Handle error (e.g., show an error message)
      console.error('Failed to create order:', error);
    }
  };

  const renderCustomerTypeSelector = () => (
    <div className="mb-4">
      <Label>Customer Type</Label>
      <RadioGroup
        value={formData.customerType}
        onValueChange={(value) => handleChange({ target: { name: 'customerType', value } })}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="guest" id="guest" />
          <Label htmlFor="guest">Guest</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="user" id="user" />
          <Label htmlFor="user">Registered User</Label>
        </div>
      </RadioGroup>
    </div>
  );

  const renderSenderFields = () => {
    if (formData.customerType === 'guest') {
      return (
        <div className="mb-4">
          <Label htmlFor="senderName">Sender Name</Label>
          <Input
            id="senderName"
            name="senderName"
            value={formData.senderName}
            onChange={handleChange}
            placeholder="Enter sender name"
          />
        </div>
      );
    }

    return (
      <>
        <div className="mb-4">
          <Label htmlFor="userId">Select User</Label>
          <Combobox value={selectedUserId} onChange={handleUserSelect}>
            <div className="relative mt-1">
              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                <Combobox.Input
                  className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                  displayValue={(userId) => {
                    const user = users.users.find(u => u.id === userId);
                    return user ? `${user.firstName} ${user.lastName}` : '';
                  }}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                </Combobox.Button>
              </div>
              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {isLoadingUsers ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    Loading users...
                  </div>
                ) : users.users.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    No users found.
                  </div>
                ) : (
                  <>
                    {users.users.map((user) => (
                      <Combobox.Option
                        key={user.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-teal-600 text-white' : 'text-gray-900'
                          }`
                        }
                        value={user.id}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.email}
                            </span>
                            {selected && (
                              <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-teal-600'}`}>
                                <Check className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                    {users.pagination.currentPage < users.pagination.totalPages && (
                      <button
                        className="w-full py-2 text-sm text-gray-600 hover:bg-gray-100"
                        onClick={() => setPage(prev => prev + 1)}
                      >
                        Load more...
                      </button>
                    )}
                  </>
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </>
    );
  };

  const renderRiderField = () => (
    <div className="mb-4">
      <Label htmlFor="riderId">Rider</Label>
      {isLoadingRiders ? (
        <p className="text-sm text-gray-500">Loading riders...</p>
      ) : riders.length > 0 ? (
        <Combobox value={selectedUserId} onChange={(value) => handleChange({ target: { name: 'riderId', value } })}>
          <div className="relative mt-1">
            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
              <Combobox.Input
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                displayValue={(riderId) => {
                  const rider = riders.find(r => r.id === riderId);
                  return rider ? `${rider.firstName} ${rider.lastName}` : '';
                }}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown className="h-5 w-5 text-gray-400" />
              </Combobox.Button>
            </div>
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {riders.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                riders.map((rider) => (
                  <Combobox.Option
                    key={rider.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-teal-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={rider.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {rider.firstName} {rider.lastName}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-teal-600'
                            }`}
                          >
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
      ) : (
        <p className="text-sm text-red-500">No riders available. Please add riders first.</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>
            <Badge className={formData.customerType === 'guest' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"}>
              {formData.customerType === 'guest' ? "Guest" : "Registered User"}
            </Badge>
          </div>
          
          <div className="space-y-4">
            {renderCustomerTypeSelector()}
            {renderSenderFields()}
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select name="orderType" onValueChange={(value) => handleChange({ target: { name: 'orderType', value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sameDay">Same Day</SelectItem>
                  <SelectItem value="nextDay">Next Day</SelectItem>
                  <SelectItem value="instant">Instant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select name="paymentType" onValueChange={(value) => handleChange({ target: { name: 'paymentType', value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Delivery Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pickupAddress">Pickup Address</Label>
            <Input
              id="pickupAddress"
              name="pickupAddress"
              value={formData.pickupAddress}
              onChange={handleChange}
              placeholder="Enter pickup address"
            />
          </div>
          <div>
            <Label htmlFor="itemCategory">Item Category</Label>
            <Select 
              name="itemCategory" 
              onValueChange={(value) => handleChange({ target: { name: 'itemCategory', value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="isFragile">Is Fragile</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                id="isFragile" 
                name="isFragile"
                checked={formData.isFragile}
                onCheckedChange={(checked) => handleChange({ target: { name: 'isFragile', type: 'checkbox', checked } })}
              />
              <span className="text-sm text-gray-600">{formData.isFragile ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="note">Note</Label>
          <Textarea 
            id="note" 
            name="note" 
            value={formData.note}
            onChange={handleChange}
            placeholder="Add any additional notes"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Drop-offs</h3>
          <Button type="button" variant="outline" size="sm" onClick={addDropOff}>
            <Plus className="h-4 w-4 mr-2" /> Add Drop-off
          </Button>
        </div>
        
        {formData.dropOffs.map((dropOff, index) => (
          <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Receiver Name</Label>
                <Input 
                  name="receiverName"
                  value={dropOff.receiverName}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Enter receiver name"
                />
              </div>
              <div>
                <Label>Receiver Phone</Label>
                <Input 
                  name="receiverPhoneNumber"
                  value={dropOff.receiverPhoneNumber}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Enter receiver phone"
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input 
                  name="address"
                  value={dropOff.address}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Enter delivery address"
                />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input 
                  name="latitude"
                  type="number"
                  step="any"
                  value={dropOff.location.coordinates[0]}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input 
                  name="longitude"
                  type="number"
                  step="any"
                  value={dropOff.location.coordinates[1]}
                  onChange={(e) => handleChange(e, index)}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
            {formData.dropOffs.length > 1 && (
              <div className="mt-4">
                <Button type="button" variant="destructive" size="sm" onClick={() => removeDropOff(index)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Remove Drop-off
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-[#733E70] hover:bg-[#62275F]">Create Order</Button>
      </div>
    </form>
  );
};

export default CreateOrderForm;