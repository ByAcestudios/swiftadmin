import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UserActions from './UserActions';
import { MoreVertical, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UsersTable({ users, onUserAction }) {
  const router = useRouter();

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200 bg-white">
          {users.map(user => (
            <TableRow key={user.id} className="hover:bg-gray-50">
              <TableCell 
                className="px-6 py-4 whitespace-nowrap cursor-pointer group"
                onClick={() => router.push(`/dashboard/users/${user.id}`)}
              >
                <div className="text-sm font-medium text-gray-900 group-hover:text-[#733E70]">
                  {user.fullName || 'N/A'}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                {user.email}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap capitalize">
                <Badge 
                  variant={
                    user.role === 'admin' ? 'destructive' :
                    user.role === 'sub-admin' ? 'default' :
                    'blue'
                  }
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <Badge 
                  variant={
                    user.status === 'active' ? 'green' :
                    'destructive'
                  }
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <Badge 
                  variant={user.isVerified ? 'blue' : 'destructive'}
                >
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={user.role === 'admin'}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  {user.role !== 'admin' && (
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUserAction(user, 'edit')}>
                        Edit
                      </DropdownMenuItem>
                      {user.status === 'active' ? (
                        <DropdownMenuItem 
                          onClick={() => onUserAction(user.id, 'suspend')}
                          className="text-yellow-600"
                        >
                          Suspend Account
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => onUserAction(user.id, 'activate')}
                          className="text-green-600"
                        >
                          Activate Account
                        </DropdownMenuItem>
                      )}
                      {!user.isVerified && (
                        <DropdownMenuItem 
                          onClick={() => onUserAction(user.id, 'resendVerification')}
                          className="text-blue-600"
                        >
                          Resend Verification
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onUserAction(user.id, 'delete')}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}