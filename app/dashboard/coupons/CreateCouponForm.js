import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const CreateCouponForm = ({ onSave, onCancel }) => {
  const [couponDetails, setCouponDetails] = useState({
    itemName: '',
    code: '',
    discount: '',
    expiryDate: new Date(),
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCouponDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleDateChange = (date) => {
    setCouponDetails(prevDetails => ({ ...prevDetails, expiryDate: date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Coupon Created:', couponDetails);
    onSave(couponDetails);
    // Add logic to handle coupon creation
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-center text-gray-800">New Coupon</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemName">Item Name</Label>
          <Input
            id="itemName"
            name="itemName"
            value={couponDetails.itemName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            value={couponDetails.code}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount">Discount</Label>
          <Input
            id="discount"
            name="discount"
            value={couponDetails.discount}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {couponDetails.expiryDate ? format(couponDetails.expiryDate, 'dd MMM yyyy') : 'Select Date'}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={couponDetails.expiryDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={couponDetails.description}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex justify-end space-x-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white">
          Cancel
        </Button>
        <Button type="submit" className="bg-[#733E70] hover:bg-[#62275F] text-white">
          Create
        </Button>
      </div>
    </form>
  );
};

export default CreateCouponForm;