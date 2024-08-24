import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Upload, User } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().regex(/^\+234\s\d{3}\s\d{3}\s\d{4}$/, { message: "Phone number must be in the format: +234 XXX XXX XXXX" }),
  businessCategory: z.string().min(1, { message: "Business category is required" }),
  location: z.enum(["Mainland", "Island", "Outskirt"], { message: "Please select a valid location" }),
  status: z.enum(["Active", "Inactive", "Suspended", "New"], { message: "Please select a valid status" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }).optional().or(z.literal('')),
  retypePassword: z.string().optional().or(z.literal(''))
}).refine((data) => data.password === data.retypePassword, {
  message: "Passwords don't match",
  path: ["retypePassword"],
});

const UserForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach(key => {
        setValue(key, initialData[key]);
      });
      setProfilePicture(initialData.profilePicture);
    }
  }, [initialData, setValue]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitForm = (data) => {
    onSubmit({ ...data, profilePicture, id: initialData?.id });
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6 p-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{initialData ? 'Edit User' : 'Create New User'}</h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-500">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden relative group">
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <label className="cursor-pointer text-white text-sm font-medium">
              <Upload className="w-6 h-6 mx-auto mb-1" />
              Upload
              <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <Input {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <Input {...register('email')} type="email" />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <Input {...register('phoneNumber')} placeholder="+234 XXX XXX XXXX" />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Category</label>
          <Input {...register('businessCategory')} />
          {errors.businessCategory && <p className="mt-1 text-sm text-red-600">{errors.businessCategory.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <Select onValueChange={(value) => setValue('location', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mainland">Mainland</SelectItem>
              <SelectItem value="Island">Island</SelectItem>
              <SelectItem value="Outskirt">Outskirt</SelectItem>
            </SelectContent>
          </Select>
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <Select onValueChange={(value) => setValue('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="New">New</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <Input {...register('password')} type="password" />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Re-type Password</label>
          <Input {...register('retypePassword')} type="password" />
          {errors.retypePassword && <p className="mt-1 text-sm text-red-600">{errors.retypePassword.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialData ? 'Update User' : 'Create User'}</Button>
      </div>
    </form>
  );
};

export default UserForm;