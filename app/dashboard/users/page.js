'use client';

import { useState, useEffect } from 'react';
import UsersTable from './UsersTable';
import FilterBar from './FilterBar';
import Pagination from './Pagination';
import UserForm from './UserForm';
import { Button } from "@/components/ui/button";
import { generateRandomUsers } from '@/utils/generateRandomUsers';
import { Plus } from 'lucide-react';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);
  const [activeFilters, setActiveFilters] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const randomUsers = generateRandomUsers(50);
    setUsers(randomUsers);
  }, []);

  const handleCreateUser = (userData) => {
    setUsers([...users, { ...userData, id: users.length + 1 }]);
    setIsModalOpen(false);
  };

  const handleEditUser = (userData) => {
    setUsers(users.map(user => user.id === userData.id ? userData : user));
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleUserAction = (userId, action) => {
    switch (action) {
      case 'edit':
        const userToEdit = users.find(user => user.id === userId);
        setEditingUser(userToEdit);
        setIsModalOpen(true);
        break;
      case 'suspend':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'Suspended' } : user
        ));
        break;
      case 'activate':
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: 'Active' } : user
        ));
        break;
      case 'delete':
        setUsers(users.filter(user => user.id !== userId));
        break;
      default:
        console.log(`Unhandled action: ${action}`);
    }
  };

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    console.log('Active filters:', filters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    console.log('Changing to page:', page);
  };

  const usersPerPage = 10;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-5 h-5 mr-2" />
          Create User
        </Button>
      </div>

      <FilterBar onFilterChange={handleFilterChange} />

      {activeFilters.length > 0 && (
        <div className="bg-gray-100 p-3 rounded-md">
          <h3 className="font-semibold mb-2">Active Filters:</h3>
          {activeFilters.map((filter, index) => (
            <span key={index} className="bg-white px-2 py-1 rounded-full text-sm mr-2">
              {filter}
            </span>
          ))}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <UsersTable users={currentUsers} onUserAction={handleUserAction} />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(users.length / usersPerPage)}
        onPageChange={handlePageChange}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <UserForm 
              onSubmit={editingUser ? handleEditUser : handleCreateUser} 
              onCancel={() => { setIsModalOpen(false); setEditingUser(null); }}
              initialData={editingUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;