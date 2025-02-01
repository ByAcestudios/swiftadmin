import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Camera, X } from "lucide-react";
import SuccessMessage from '@/components/successMessage';
// import SuccessMessage from '@/components/SuccessMessage';

const CreateRiderForm = ({ onSuccess, onClose }) => {
  const [riderDetails, setRiderDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    dateOfBirth: new Date(),
    gender: '',
    maritalStatus: '',
    educationalLevel: '',
    residentialAddress: '',
  });
  const [files, setFiles] = useState({
    profilePicture: null,
    license: null,
    passport: null,
    proofOfAddress: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const [datePickerState, setDatePickerState] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleYearChange = (year) => {
    setDatePickerState(prev => ({ ...prev, year: parseInt(year) }));
  };

  const handleMonthChange = (month) => {
    setDatePickerState(prev => ({ ...prev, month: months.indexOf(month) }));
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(datePickerState.year, datePickerState.month, day);
    setRiderDetails(prevDetails => ({ ...prevDetails, dateOfBirth: selectedDate }));
    if (errors.dateOfBirth) {
      setErrors(prevErrors => ({ ...prevErrors, dateOfBirth: null }));
    }
  };

  const validateForm = () => {
    let formErrors = {};
    
    // Name validations
    if (!riderDetails.firstName.trim()) formErrors.firstName = "First name is required";
    if (!riderDetails.lastName.trim()) formErrors.lastName = "Last name is required";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!riderDetails.email.trim()) {
      formErrors.email = "Email is required";
    } else if (!emailRegex.test(riderDetails.email)) {
      formErrors.email = "Invalid email format";
    }
    
    // Phone number validation
    const phoneRegex = /^[0-9+\s()-]{7,20}$/;
    const nigerianMobileRegex = /^(0|(\+234)|(234))?[789]\d{9}$/;
    
    if (!riderDetails.phoneNumber.trim()) {
      formErrors.phoneNumber = "Phone number is required";
    } else if (!phoneRegex.test(riderDetails.phoneNumber)) {
      formErrors.phoneNumber = "Invalid phone number format";
    } else if (!nigerianMobileRegex.test(riderDetails.phoneNumber.replace(/\D/g, ''))) {
      formErrors.phoneNumber = "Please enter a valid Nigerian mobile number";
    }
    
    // Password validation
    if (!riderDetails.password) {
      formErrors.password = "Password is required";
    } else if (riderDetails.password.length < 8) {
      formErrors.password = "Password must be at least 8 characters long";
    }
    
    // Date of birth validation
    const minAge = 18;
    const maxAge = 100;
    const today = new Date();
    const birthDate = new Date(riderDetails.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < minAge || age > maxAge) {
      formErrors.dateOfBirth = `Age must be between ${minAge} and ${maxAge}`;
    }
    
    // Other required fields
    if (!riderDetails.gender) formErrors.gender = "Gender is required";
    if (!riderDetails.maritalStatus) formErrors.maritalStatus = "Marital status is required";
    if (!riderDetails.educationalLevel) formErrors.educationalLevel = "Educational level is required";
    if (!riderDetails.residentialAddress.trim()) formErrors.residentialAddress = "Residential address is required";

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRiderDetails(prevDetails => ({ ...prevDetails, [name]: value }));
    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFiles(prevFiles => ({ ...prevFiles, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(riderDetails).forEach(([key, value]) => {
      if (key === 'dateOfBirth') {
        formData.append(key, format(value, 'yyyy-MM-dd'));
      } else {
        formData.append(key, value);
      }
    });

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });

    try {
      const response = await api.post('/api/riders/admin-create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data && response.data.message === "Rider created successfully by admin.") {
        onSuccess();
      } else {
        setErrors({ form: 'Unexpected response from server' });
      }
    } catch (err) {
      console.error('Error creating rider:', err);
      setErrors({ form: err.response?.data?.error || 'An error occurred while creating the rider' });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return <SuccessMessage message={successMessage} redirectUrl="/dashboard/riders" />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Rider</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File upload for profile picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <input 
                type="file" 
                id="profilePicture" 
                name="profilePicture"
                onChange={handleFileChange}
                className="hidden" 
              />
              <label htmlFor="profilePicture" className="cursor-pointer">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  {files.profilePicture ? (
                    <img 
                      src={URL.createObjectURL(files.profilePicture)} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-500" />
                  )}
                </div>
              </label>
              <p className="text-sm text-gray-600 mt-2">Upload profile picture</p>
            </div>
          </div>

          {/* Personal Information Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={riderDetails.firstName}
                onChange={handleChange}
                required
              />
              {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={riderDetails.lastName}
                onChange={handleChange}
                required
              />
              {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={riderDetails.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={riderDetails.phoneNumber}
                onChange={handleChange}
                required
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={riderDetails.password}
                onChange={handleChange}
                required
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(riderDetails.dateOfBirth, 'PP')}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Select onValueChange={handleYearChange} value={datePickerState.year.toString()}>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleMonthChange} value={months[datePickerState.month]}>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: getDaysInMonth(datePickerState.year, datePickerState.month) }, (_, i) => i + 1).map(day => (
                        <Button
                          key={day}
                          variant="outline"
                          className="w-8 h-8 p-0"
                          onClick={() => handleDateSelect(day)}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleChange({ target: { name: 'gender', value } })}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select onValueChange={(value) => handleChange({ target: { name: 'maritalStatus', value } })}>
                <SelectTrigger id="maritalStatus">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
              {errors.maritalStatus && <p className="text-red-500 text-sm">{errors.maritalStatus}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="educationalLevel">Educational Level</Label>
              <Select onValueChange={(value) => handleChange({ target: { name: 'educationalLevel', value } })}>
                <SelectTrigger id="educationalLevel">
                  <SelectValue placeholder="Select educational level" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="tertiary">Tertiary</SelectItem>
                  <SelectItem value="postgraduate">Postgraduate</SelectItem>
                </SelectContent>
              </Select>
              {errors.educationalLevel && <p className="text-red-500 text-sm">{errors.educationalLevel}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="residentialAddress">Residential Address</Label>
              <Input
                id="residentialAddress"
                name="residentialAddress"
                value={riderDetails.residentialAddress}
                onChange={handleChange}
                required
              />
              {errors.residentialAddress && <p className="text-red-500 text-sm">{errors.residentialAddress}</p>}
            </div>
          </div>

          {/* Document Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license">Driver&apos;s License</Label>
              <Input
                id="license"
                name="license"
                type="file"
                onChange={handleFileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport">Passport</Label>
              <Input
                id="passport"
                name="passport"
                type="file"
                onChange={handleFileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proofOfAddress">Proof of Address</Label>
              <Input
                id="proofOfAddress"
                name="proofOfAddress"
                type="file"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {errors.form && <p className="text-red-500 text-sm">{errors.form}</p>}

          <Button type="submit" className="w-full bg-[#733E70] hover:bg-[#62275F] text-white" disabled={isLoading}>
            {isLoading ? 'Creating Rider...' : 'Create Rider'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateRiderForm;