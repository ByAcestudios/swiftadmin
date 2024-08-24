import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const CreateOrderForm = () => {
  // Demo data for riders
  const demoRiders = [
    { id: 1, fullName: 'John Doe', phoneNumber: '+234 123 456 7890', plateNumber: 'ABC123' },
    { id: 2, fullName: 'Jane Smith', phoneNumber: '+234 098 765 4321', plateNumber: 'XYZ789' },
    // Add more demo riders as needed
  ];

  const [orderDetails, setOrderDetails] = useState({
    customerName: '',
    orderNumber: '',
    phoneNumber: '',
    orderDate: new Date(),
    paymentType: '',
    amount: '',
    additionalNote: '',
    pickupAddress: '',
    deliveryAddress: '',
    rider: null,
  });

  const [riderSearch, setRiderSearch] = useState('');
  const [showRiderDropdown, setShowRiderDropdown] = useState(false);

  useEffect(() => {
    // Generate a random order number
    const randomOrderNumber = Math.floor(100000 + Math.random() * 900000);
    setOrderDetails(prevDetails => ({ ...prevDetails, orderNumber: `ORD-${randomOrderNumber}` }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleDateSelect = (date) => {
    setOrderDetails(prevDetails => ({ ...prevDetails, orderDate: date }));
  };

  const handleRiderSelect = (rider) => {
    setOrderDetails(prevDetails => ({ ...prevDetails, rider: rider }));
    setRiderSearch('');
    setShowRiderDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Order Created:', orderDetails);
    // Add logic to handle order creation
  };

  const filteredRiders = demoRiders.filter(rider =>
    rider.fullName.toLowerCase().includes(riderSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800">New Order</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            name="customerName"
            value={orderDetails.customerName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="orderNumber">Order Number</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            value={orderDetails.orderNumber}
            readOnly
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={orderDetails.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Order Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {orderDetails.orderDate ? format(orderDetails.orderDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={orderDetails.orderDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paymentType">Payment Type</Label>
          <Select name="paymentType" onValueChange={(value) => handleChange({ target: { name: 'paymentType', value } })}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={orderDetails.amount}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="additionalNote">Additional Note</Label>
        <Textarea
          id="additionalNote"
          name="additionalNote"
          value={orderDetails.additionalNote}
          onChange={handleChange}
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="pickupAddress">Pickup Address</Label>
        <Input
          id="pickupAddress"
          name="pickupAddress"
          value={orderDetails.pickupAddress}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="deliveryAddress">Delivery Address</Label>
        <Input
          id="deliveryAddress"
          name="deliveryAddress"
          value={orderDetails.deliveryAddress}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2 relative">
        <Label>Select Rider</Label>
        <Input
          type="text"
          placeholder="Search for a rider"
          value={riderSearch}
          onChange={(e) => {
            setRiderSearch(e.target.value);
            setShowRiderDropdown(true);
          }}
          onFocus={() => setShowRiderDropdown(true)}
        />
        {showRiderDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {filteredRiders.map((rider) => (
              <div
                key={rider.id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleRiderSelect(rider)}
              >
                {rider.fullName}
              </div>
            ))}
            {filteredRiders.length === 0 && (
              <div className="px-4 py-2 text-gray-500">No riders found</div>
            )}
          </div>
        )}
      </div>
      
      {orderDetails.rider && (
        <div className="space-y-2 bg-gray-100 p-4 rounded-md">
          <p><strong>Selected Rider:</strong> {orderDetails.rider.fullName}</p>
          <p><strong>Phone:</strong> {orderDetails.rider.phoneNumber}</p>
          <p><strong>Plate Number:</strong> {orderDetails.rider.plateNumber}</p>
        </div>
      )}
      
      <Button type="submit" className="w-full bg-[#733E70] hover:bg-[#62275F] text-white">
        Create Order
      </Button>
    </form>
  );
};

export default CreateOrderForm;