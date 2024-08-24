import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Upload } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().regex(/^\+234\s\d{3}\s\d{3}\s\d{4}$/, { message: "Phone number must be in the format: +234 XXX XXX XXXX" }),
  position: z.string().min(2, { message: "Position is required" }),
  gender: z.enum(["Male", "Female", "Other"], { message: "Please select a valid gender" }),
});

const TeamMemberForm = ({ onSubmit, onCancel }) => {
  const [profilePicture, setProfilePicture] = useState(null);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema)
  });

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
    onSubmit({ ...data, profilePicture });
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6 p-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Create New Team Member</h2>
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
              <Upload className="w-12 h-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <label className="cursor-pointer text-white text-sm font-medium">
              Upload
              <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" {...register('firstName')} />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" {...register('lastName')} />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" {...register('phoneNumber')} placeholder="+234 XXX XXX XXXX" />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <Label htmlFor="position">Position</Label>
          <Input id="position" {...register('position')} />
          {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>}
        </div>

        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select onValueChange={(value) => setValue('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Member
        </Button>
      </div>
    </form>
  );
};

export default TeamMemberForm;