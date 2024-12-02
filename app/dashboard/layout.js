'use client';

import { useState } from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';

import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/protectedRoutes';
import { Toaster } from "@/components/ui/toaster"


export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <AuthProvider>
      <ProtectedRoute>
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main 
          className={`flex-1 bg-[#f7f3f6] overflow-x-hidden overflow-y-auto bg-gray-100 p-6 transition-all duration-300 ease-in-out mt-[64px] ${
            isSidebarOpen ? 'md:ml-64' : ''
          }`}
        >
          {children}
        </main>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}
      </div>
      <Toaster />

    </div>
    </ProtectedRoute>
    </AuthProvider>
  )
}