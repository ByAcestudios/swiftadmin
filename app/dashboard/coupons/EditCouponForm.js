import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from '@/lib/api';

const EditCouponForm = ({ coupon, open, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [couponDetails, setCouponDetails] = useState({
    name: coupon.name,
    code: coupon.code,
    description: coupon.description,
    discountPercentage: coupon.discountPercentage,
    maxDiscountAmount: coupon.maxDiscountAmount || '',
    startDate: new Date(coupon.startDate),
    expiryDate: new Date(coupon.expiryDate),
    maxUses: coupon.maxUses || '',
    minOrderAmount: coupon.minOrderAmount || '',
    applicableOrderTypes: coupon.applicableOrderTypes || [],
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

    if (!couponDetails.name.trim()) {
      errors.name = 'Coupon name is required';
    }

    if (!couponDetails.code.trim()) {
      errors.code = 'Coupon code is required';
    }

    if (!couponDetails.description.trim()) {
      errors.description = 'Description is required';
    }

    const discount = parseInt(couponDetails.discountPercentage);
    if (!discount || discount <= 0 || discount > 100) {
      errors.discountPercentage = 'Discount must be between 1 and 100';
    }

    if (couponDetails.startDate >= couponDetails.expiryDate) {
      errors.expiryDate = 'Expiry date must be after start date';
    }

    const maxDiscount = parseFloat(couponDetails.maxDiscountAmount);
    if (couponDetails.maxDiscountAmount && (isNaN(maxDiscount) || maxDiscount <= 0)) {
      errors.maxDiscountAmount = 'Maximum discount amount must be greater than 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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

      if (!payload.maxUses) delete payload.maxUses;
      if (!payload.minOrderAmount) delete payload.minOrderAmount;
      if (payload.applicableOrderTypes.length === 0) {
        delete payload.applicableOrderTypes;
      }

      const response = await api.put(`/api/coupons/${coupon.id}`, payload);
      
      toast({
        description: "Coupon updated successfully",
      });
      
      onSuccess?.(response.data.coupon);
      onClose();
    } catch (error) {
      console.error('Error updating coupon:', error);
      
      toast({
        variant: "destructive",
        description: error.response?.data?.message || "Failed to update coupon",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCouponDetails(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={couponDetails.name}
                onChange={handleChange}
                error={validationErrors.name}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                value={couponDetails.code}
                onChange={handleChange}
                error={validationErrors.code}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                id="discountPercentage"
                name="discountPercentage"
                type="number"
                min="1"
                max="100"
                value={couponDetails.discountPercentage}
                onChange={handleChange}
                error={validationErrors.discountPercentage}
                required
              />
            </div>

            <div className="grid gap-2">
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
                error={validationErrors.maxDiscountAmount}
              />
              <p className="text-sm text-gray-500">
                Leave empty for no maximum discount limit
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Applicable Order Types</Label>
              <div className="flex flex-wrap gap-4">
                {orderTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={couponDetails.applicableOrderTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        setCouponDetails(prev => ({
                          ...prev,
                          applicableOrderTypes: checked
                            ? [...prev.applicableOrderTypes, type.id]
                            : prev.applicableOrderTypes.filter(t => t !== type.id)
                        }));
                      }}
                    />
                    <Label htmlFor={type.id} className="font-normal">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Validity Period</Label>
              <div className="flex gap-4">
                <div className="grid gap-2 flex-1">
                  <Label>Start Date</Label>
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
                <div className="grid gap-2 flex-1">
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxUses">Maximum Uses (Optional)</Label>
              <Input
                id="maxUses"
                name="maxUses"
                type="number"
                min="1"
                value={couponDetails.maxUses}
                onChange={handleChange}
                error={validationErrors.maxUses}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minOrderAmount">Minimum Order Amount (Optional)</Label>
              <Input
                id="minOrderAmount"
                name="minOrderAmount"
                type="number"
                min="0"
                value={couponDetails.minOrderAmount}
                onChange={handleChange}
                error={validationErrors.minOrderAmount}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={couponDetails.description}
                onChange={handleChange}
                error={validationErrors.description}
                required
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-4">
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
              {isSubmitting ? 'Updating...' : 'Update Coupon'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCouponForm;