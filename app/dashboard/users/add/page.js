'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import UserForm from '../UserForm';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

const AddUserPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (userData) => {
    try {
      setIsSubmitting(true);
      await api.post('/api/users', userData);
      toast({
        title: "Success",
        description: "User created successfully!",
      });
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/users');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Add New User</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <UserForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default AddUserPage;
