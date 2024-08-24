'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Filter } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from './pagination';
import OrderDetailsModal from './OrderDetailsModal';
import CreateOrderForm from './CreateOrderForm';

// Demo data
const demoOrders = [
  {
    id: 1,
    name: 'Olamilekan John',
    date: '29 Jun 2021',
    paymentType: 'Cash',
    amount: '₦495.00',
    address: '28, Jimoh Brown road, Lagos',
    status: 'In progress',
  },
  {
    id: 2,
    name: 'Olamilekan John',
    date: '29 Jun 2021',
    paymentType: 'Cash',
    amount: '₦495.00',
    address: '28, Jimoh Brown road, Lagos',
    status: 'Delivered',
  },
  // Add more demo orders as needed
];

const OrdersPage = () => {
  const [orders, setOrders] = useState(demoOrders); // This will hold the orders data
  const [filter, setFilter] = useState(''); // This will hold the current filter
  const [searchTerm, setSearchTerm] = useState(''); // This will hold the search term
  const [currentPage, setCurrentPage] = useState(1); // This will hold the current page
  const [selectedOrder, setSelectedOrder] = useState(null); // This will hold the selected order for editing
  const [isCreatingOrder, setIsCreatingOrder] = useState(false); // This will handle the create order form visibility
  const ordersPerPage = 7; // Number of orders per page

  const filteredOrders = orders.filter(order =>
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.paymentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.amount.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleCreateOrder = () => {
    setIsCreatingOrder(true);
  };

  const handleCloseCreateOrder = () => {
    setIsCreatingOrder(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-sm text-gray-600">All orders are shown here.</p>
        </div>
        <Button onClick={handleCreateOrder} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-5 h-5 mr-2" />
          Create Order
        </Button>
      </div>

      {isCreatingOrder ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <CreateOrderForm />
          <Button onClick={handleCloseCreateOrder} className="mt-4 bg-gray-500 hover:bg-gray-600 text-white rounded-md p-2 text-sm">
            Cancel
          </Button>
        </div>
      ) : (
        <>
          {/* Order Summary */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search Orders..."
                className="border border-gray-300 rounded-md p-2 w-full max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="ml-4">
                    <Filter className="w-5 h-5 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="date" />
                      <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Date</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="orderType" />
                      <label htmlFor="orderType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Order Type</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="orderStatus" />
                      <label htmlFor="orderStatus" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Order Status</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="businessCategory" />
                      <label htmlFor="businessCategory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Business Category</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pickup" />
                      <label htmlFor="pickup" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">45 mins pickup</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="delivery" />
                      <label htmlFor="delivery" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">45 mins delivery</label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Orders Table */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.paymentType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="outline" onClick={() => handleEditOrder(order)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Showing {indexOfFirstOrder + 1} to {indexOfLastOrder} of {filteredOrders.length} orders
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredOrders.length / ordersPerPage)}
                onPageChange={paginate}
              />
            </div>
          </div>
        </>
      )}

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default OrdersPage;