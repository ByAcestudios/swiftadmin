import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

const CreateOrderForm = ({ onSubmit, onClose }) => {
  const { toast } = useToast()

  const [orderData, setOrderData] = useState({
    senderName: '',
    orderNumber: `ORD${nanoid(8)}`, // Generate a random alphanumeric string
    phoneNumber: '',
    paymentType: '',
    note: '',
    pickupAddress: '',
    orderType: '',
    deliveryDate: '',
    isFragile: false,
    itemCategory: '',
    riderId: '',
    dropOffs: [{ address: '', receiverName: '', receiverPhoneNumber: '', location: { type: 'Point', coordinates: [] } }]
  });
  const [customerType, setCustomerType] = useState('guest');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [riders, setRiders] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoadingRiders, setIsLoadingRiders] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchRiders();
    fetchUsers();
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

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleChange = (name, value) => {
    setOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (userId) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setSelectedUserId(selectedUser.id);
      setOrderData(prev => ({
        ...prev,
        senderName: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
      }));
    }
  };

  const handleDropOffChange = (index, field, value) => {
    const newDropOffs = [...orderData.dropOffs];
    if (field === 'location') {
      newDropOffs[index][field] = value;
    } else {
      newDropOffs[index][field] = value;
    }
    setOrderData(prev => ({ ...prev, dropOffs: newDropOffs }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...orderData };
    
    if (customerType === 'user') {
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
        value={customerType}
        onValueChange={setCustomerType}
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
    if (customerType === 'guest') {
      return (
        <div className="mb-4">
          <Label htmlFor="senderName">Sender Name</Label>
          <Input
            id="senderName"
            value={orderData.senderName}
            onChange={(e) => handleChange('senderName', e.target.value)}
          />
        </div>
      );
    } else {
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
                      const user = users.find(u => u.id === userId);
                      return user ? `${user.firstName} ${user.lastName}` : '';
                    }}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                  </Combobox.Button>
                </div>
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {users.length === 0 ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      Nothing found.
                    </div>
                  ) : (
                    users.map((user) => (
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
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {user.firstName} {user.lastName}
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
          </div>
          <div className="mb-4">
            <Label htmlFor="senderName">Sender Name</Label>
            <Input
              id="senderName"
              value={orderData.senderName}
              readOnly
            />
          </div>
        </>
      );
    }
  };

  const renderRiderField = () => (
    <div className="mb-4">
      <Label htmlFor="riderId">Rider</Label>
      {isLoadingRiders ? (
        <p className="text-sm text-gray-500">Loading riders...</p>
      ) : riders.length > 0 ? (
        <Combobox value={orderData.riderId} onChange={(value) => handleChange('riderId', value)}>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          {renderCustomerTypeSelector()}
          {renderSenderFields()}
          <div className="mb-4">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={orderData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select value={orderData.paymentType} onValueChange={(value) => handleChange('paymentType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <div className="mb-4">
            <Label htmlFor="pickupAddress">Pickup Address</Label>
            <Input
              id="pickupAddress"
              value={orderData.pickupAddress}
              onChange={(e) => handleChange('pickupAddress', e.target.value)}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="orderType">Order Type</Label>
            <Select value={orderData.orderType} onValueChange={(value) => handleChange('orderType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sameDay">Same Day</SelectItem>
                <SelectItem value="nextDay">Next Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-4">
            <Label htmlFor="deliveryDate">Delivery Date</Label>
            <Input
              type="datetime-local"
              id="deliveryDate"
              value={orderData.deliveryDate}
              onChange={(e) => handleChange('deliveryDate', e.target.value)}
            />
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <Switch
              id="isFragile"
              checked={orderData.isFragile}
              onCheckedChange={(checked) => handleChange('isFragile', checked)}
            />
            <Label htmlFor="isFragile">Is Fragile</Label>
          </div>
          <div className="mb-4">
            <Label htmlFor="itemCategory">Item Category</Label>
            <Select value={orderData.itemCategory} onValueChange={(value) => handleChange('itemCategory', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select item category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderRiderField()}
        </div>
      </div>
      
      <div className="mb-4">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          value={orderData.note}
          onChange={(e) => handleChange('note', e.target.value)}
        />
      </div>

      <h3 className="font-semibold mt-6 mb-2">Drop-offs</h3>
      {orderData.dropOffs.map((dropOff, index) => (
        <div key={index} className="space-y-2 p-4 border rounded">
          <div className="mb-4">
            <Label htmlFor={`dropOffAddress${index}`}>Drop-off Address</Label>
            <Input
              id={`dropOffAddress${index}`}
              value={dropOff.address}
              onChange={(e) => handleDropOffChange(index, 'address', e.target.value)}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor={`receiverName${index}`}>Receiver Name</Label>
            <Input
              id={`receiverName${index}`}
              value={dropOff.receiverName}
              onChange={(e) => handleDropOffChange(index, 'receiverName', e.target.value)}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor={`receiverPhoneNumber${index}`}>Receiver Phone Number</Label>
            <Input
              id={`receiverPhoneNumber${index}`}
              value={dropOff.receiverPhoneNumber}
              onChange={(e) => handleDropOffChange(index, 'receiverPhoneNumber', e.target.value)}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor={`locationCoordinates${index}`}>Location Coordinates (lng,lat)</Label>
            <Input
              id={`locationCoordinates${index}`}
              value={dropOff.location.coordinates.join(',')}
              onChange={(e) => handleDropOffChange(index, 'location', { type: 'Point', coordinates: e.target.value.split(',').map(Number) })}
            />
          </div>
        </div>
      ))}
      
      <Button 
        type="button" 
        onClick={() => setOrderData(prev => ({ 
          ...prev, 
          dropOffs: [...prev.dropOffs, { address: '', receiverName: '', receiverPhoneNumber: '', location: { type: 'Point', coordinates: [] } }] 
        }))}
        className="mt-2"
      >
        Add Drop-off
      </Button>
      
      <div className="flex justify-end mt-6">
        <Button type="submit">Create Order</Button>
      </div>
    </form>
  );
};

export default CreateOrderForm;