import { useState } from 'react';
import UserActions from './UserActions';
import { User, Phone, Mail, ShoppingCart, Tag } from 'lucide-react';

const UsersTable = ({ users, onUserAction }) => {
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800'; // Default color for undefined status
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActions = (user) => {
    const actions = [
      { id: 'edit', label: 'Edit User' },
      { id: 'delete', label: 'Delete User' },
    ];

    if (user.status === 'Active' || user.status === 'Inactive' || user.status === 'New') {
      actions.push({ id: 'suspend', label: 'Suspend User' });
    } else if (user.status === 'Suspended') {
      actions.push({ id: 'activate', label: 'Activate User' });
    }

    return actions;
  };

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <User className="h-10 w-10 rounded-full bg-gray-200 p-2 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.businessCategory}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {user.phoneNumber}
                </div>
                <div className="text-sm text-gray-500 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {user.email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2 text-gray-400" />
                  {user.orderCount}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                  {user.status || 'Unknown'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <UserActions
                  userId={user.id}
                  actions={getActions(user)}
                  onActionSelect={onUserAction}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;