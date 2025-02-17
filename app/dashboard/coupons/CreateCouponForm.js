import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

const CreateCouponForm = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [couponDetails, setCouponDetails] = useState({
    name: '',
    code: '',
    description: '',
    discountPercentage: '',
    maxDiscountAmount: '',
    startDate: new Date(),
    expiryDate: new Date(),
    maxUses: '',
    minOrderAmount: '',
    applicableOrderTypes: [],
  });
  const [orderTypes, setOrderTypes] = useState([]);

  useEffect(() => {
    const fetchOrderTypes = async () => {
      try {
        const response = await api.get('/api/settings/keys', {
          params: { keys: 'orderType' }
        });
        
        // Map the array of order types to the required format
        const formattedOrderTypes = response.data.orderType.map(type => ({
          id: type,
          label: type === 'instant' ? 'Instant Delivery' :
                 type === 'sameday' ? 'Same Day' :
                 type === 'nextday' ? 'Next Day' : type
        }));
        
        setOrderTypes(formattedOrderTypes);
      } catch (error) {
        console.error('Error fetching order types:', error);
        toast({
          variant: "destructive",
          description: "Failed to load order types. Please try again.",
        });
      }
    };

    fetchOrderTypes();
  }, []);

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!couponDetails.name.trim()) {
      errors.name = 'Coupon name is required';
    } else if (couponDetails.name.length < 3) {
      errors.name = 'Coupon name must be at least 3 characters';
    }

    // Code validation
    if (!couponDetails.code.trim()) {
      errors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9_]+$/.test(couponDetails.code)) {
      errors.code = 'Code must contain only uppercase letters, numbers, and underscores';
    }

    // Description validation
    if (!couponDetails.description.trim()) {
      errors.description = 'Description is required';
    }

    // Discount validation
    const discount = parseInt(couponDetails.discountPercentage);
    if (!discount) {
      errors.discountPercentage = 'Discount percentage is required';
    } else if (discount <= 0 || discount > 100) {
      errors.discountPercentage = 'Discount must be between 1 and 100';
    }

    // Date validation
    if (couponDetails.startDate >= couponDetails.expiryDate) {
      errors.expiryDate = 'Expiry date must be after start date';
    }

    // Max uses validation
    if (couponDetails.maxUses !== '') {
      const maxUses = parseInt(couponDetails.maxUses);
      if (maxUses <= 0) {
        errors.maxUses = 'Maximum uses must be greater than 0';
      }
    }

    // Min order amount validation
    if (couponDetails.minOrderAmount !== '' && couponDetails.minOrderAmount !== null) {
      const amount = parseFloat(couponDetails.minOrderAmount);
      if (amount < 0) {
        errors.minOrderAmount = 'Minimum order amount cannot be negative';
      }
    }

    const maxDiscount = parseFloat(couponDetails.maxDiscountAmount);
    if (couponDetails.maxDiscountAmount && (isNaN(maxDiscount) || maxDiscount <= 0)) {
      errors.maxDiscountAmount = 'Maximum discount amount must be greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name === 'minOrderAmount') {
      processedValue = value === '' ? null : Math.round(parseFloat(value) * 100);
      if (isNaN(processedValue)) processedValue = null;
    }
    
    if (['discountPercentage', 'maxUses'].includes(name)) {
      processedValue = value === '' ? '' : parseInt(value, 10);
      if (isNaN(processedValue)) processedValue = '';
    }

    if (name === 'code') {
      processedValue = value.toUpperCase();
    }

    setCouponDetails(prev => ({ ...prev, [name]: processedValue }));
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOrderTypeToggle = (orderType) => {
    setCouponDetails(prev => {
      const types = prev.applicableOrderTypes || [];
      const updated = types.includes(orderType)
        ? types.filter(t => t !== orderType)
        : [...types, orderType];
      return { ...prev, applicableOrderTypes: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...couponDetails,
        startDate: couponDetails.startDate.toISOString(),
        expiryDate: couponDetails.expiryDate.toISOString(),
      };

      // Remove empty optional fields
      if (!payload.maxUses) delete payload.maxUses;
      if (payload.minOrderAmount === null || payload.minOrderAmount === '') {
        delete payload.minOrderAmount;
      }
      if (payload.applicableOrderTypes.length === 0) {
        delete payload.applicableOrderTypes;
      }
      if (!payload.maxDiscountAmount) delete payload.maxDiscountAmount;

      const response = await api.post('/api/coupons', payload);
      
      toast({
        description: "Coupon created successfully",
        variant: "success"
      });
      
      onSuccess?.(response.data.coupon);
      onClose();
    } catch (error) {
      console.error('Error creating coupon:', error);
      setError(error.response?.data?.message || 'Failed to create coupon. Please try again.');
      
      toast({
        variant: "destructive",
        description: error.response?.data?.message || "Failed to create coupon. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Coupon Name</Label>
          <Input
            id="name"
            name="name"
            value={couponDetails.name}
            onChange={handleChange}
            className={validationErrors.name ? "border-red-500" : ""}
          />
          {validationErrors.name && (
            <span className="text-xs text-red-500">{validationErrors.name}</span>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Coupon Code</Label>
          <Input
            id="code"
            name="code"
            value={couponDetails.code}
            onChange={handleChange}
            className={validationErrors.code ? "border-red-500" : ""}
          />
          {validationErrors.code && (
            <span className="text-xs text-red-500">{validationErrors.code}</span>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountPercentage">Discount Percentage</Label>
          <Input
            id="discountPercentage"
            name="discountPercentage"
            type="number"
            min="0"
            max="100"
            value={couponDetails.discountPercentage}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxUses">Maximum Uses (Optional)</Label>
          <Input
            id="maxUses"
            name="maxUses"
            type="number"
            min="1"
            value={couponDetails.maxUses}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minOrderAmount">Minimum Order Amount (Optional)</Label>
          <Input
            id="minOrderAmount"
            name="minOrderAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter amount in ₦"
            value={couponDetails.minOrderAmount ? (couponDetails.minOrderAmount / 100).toFixed(2) : ''}
            onChange={handleChange}
          />
          <span className="text-xs text-gray-500">Leave empty for no minimum amount</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxDiscountAmount">Maximum Discount Amount (Optional)</Label>
          <Input
            id="maxDiscountAmount"
            name="maxDiscountAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter amount in ₦"
            value={couponDetails.maxDiscountAmount}
            onChange={handleChange}
          />
          {validationErrors.maxDiscountAmount && (
            <span className="text-xs text-red-500">{validationErrors.maxDiscountAmount}</span>
          )}
          <span className="text-xs text-gray-500">Leave empty for no maximum discount limit</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Valid Order Types (Optional)</Label>
        <div className="grid grid-cols-2 gap-4">
          {orderTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <Checkbox
                id={type.id}
                checked={couponDetails.applicableOrderTypes.includes(type.id)}
                onCheckedChange={() => handleOrderTypeToggle(type.id)}
              />
              <label htmlFor={type.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {format(couponDetails.startDate, 'PPP')}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={couponDetails.startDate}
                onSelect={(date) => setCouponDetails(prev => ({ ...prev, startDate: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Expiry Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {format(couponDetails.expiryDate, 'PPP')}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={couponDetails.expiryDate}
                onSelect={(date) => setCouponDetails(prev => ({ ...prev, expiryDate: date }))}
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
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-[#733E70] hover:bg-[#62275F] text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Coupon'}
        </Button>
      </div>
    </form>
  );
};

export default CreateCouponForm;