'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import CreateCouponForm from './CreateCouponForm';
import EditCouponForm from './EditCouponForm';

// Demo data for coupons
const demoCoupons = [
  { id: 1, discount: '30% Off', itemName: 'Item Name', code: 'SL9293', expiryDate: '23 Jan 2021', description: 'Description' },
  { id: 2, discount: '40% Off', itemName: 'Item Name', code: 'SL9294', expiryDate: '24 Jan 2021', description: 'Description' },
  { id: 3, discount: '50% Off', itemName: 'Item Name', code: 'SL9295', expiryDate: '25 Jan 2021', description: 'Description' },
  // Add more demo coupons as needed
];

const CouponsPage = () => {
  const [coupons, setCoupons] = useState(demoCoupons); // This will hold the coupons data
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false); // This will handle the create coupon form visibility
  const [isEditingCoupon, setIsEditingCoupon] = useState(false); // This will handle the edit coupon form visibility
  const [currentCoupon, setCurrentCoupon] = useState(null); // This will hold the current coupon being edited

  const handleAddCoupon = () => {
    setIsCreatingCoupon(true);
  };

  const handleCloseCreateCoupon = () => {
    setIsCreatingCoupon(false);
  };

  const handleSaveCoupon = (newCoupon) => {
    setCoupons([...coupons, { ...newCoupon, id: coupons.length + 1 }]);
    setIsCreatingCoupon(false);
  };

  const handleEditCoupon = (id) => {
    const coupon = coupons.find(coupon => coupon.id === id);
    setCurrentCoupon(coupon);
    setIsEditingCoupon(true);
  };

  const handleCloseEditCoupon = () => {
    setIsEditingCoupon(false);
    setCurrentCoupon(null);
  };

  const handleSaveEditedCoupon = (editedCoupon) => {
    setCoupons(coupons.map(coupon => (coupon.id === editedCoupon.id ? editedCoupon : coupon)));
    setIsEditingCoupon(false);
    setCurrentCoupon(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-600">All coupons are shown here.</p>
        </div>
        <Button onClick={handleAddCoupon} className="bg-[#733E70] hover:bg-[#62275F] text-white flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Coupon
        </Button>
      </div>

      {isCreatingCoupon ? (
        <CreateCouponForm onSave={handleSaveCoupon} onCancel={handleCloseCreateCoupon} />
      ) : isEditingCoupon ? (
        <EditCouponForm coupon={currentCoupon} onSave={handleSaveEditedCoupon} onCancel={handleCloseEditCoupon} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-gray-800">{coupon.discount}</div>
                <Button variant="outline" onClick={() => handleEditCoupon(coupon.id)} className="text-gray-500">
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Item Name</span>
                  <span className="text-sm text-gray-800">{coupon.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Code</span>
                  <span className="text-sm text-gray-800">{coupon.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Expiry Date</span>
                  <span className="text-sm text-gray-800">{coupon.expiryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Description</span>
                  <span className="text-sm text-gray-800">{coupon.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponsPage;