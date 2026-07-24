'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, ChevronDown, Menu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

function displayName(user) {
  if (!user) return 'Admin User';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.fullName || user.email || 'Admin User';
}

function roleLabel(user, isSuperAdmin) {
  if (isSuperAdmin) return 'Super Admin';
  if (user?.role === 'sub-admin') return 'Sub-admin';
  if (user?.role === 'admin') return 'Admin';
  return user?.role || 'User';
}

const Navbar = ({ toggleSidebar }) => {
  const { logout, user, isSuperAdmin } = useAuth();
  const name = displayName(user);
  const email = user?.email || '';
  const role = roleLabel(user, isSuperAdmin);

  return (
    <nav className="bg-white shadow-md w-full fixed top-0 left-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#62275F]"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 ml-4">
              <Image src="/logos/logo.svg" alt="Swift Logistics Logo" width={200} height={40} />
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 max-w-[240px]">
                  <div className="w-8 h-8 rounded-full bg-[#62275F] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-900">{name}</span>
                    {email && <span className="text-xs text-gray-500 truncate">{email}</span>}
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                      {isSuperAdmin && (
                        <Badge className="text-xs bg-[#62275F] hover:bg-[#62275F]">
                          <Shield className="h-3 w-3 mr-1" />
                          Full access
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isSuperAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/team">Team & Roles</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
