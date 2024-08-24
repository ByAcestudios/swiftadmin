import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Camera } from "lucide-react";

const CreateRiderForm = () => {
  const [riderDetails, setRiderDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    retypePassword: '',
    dateOfBirth: new Date(),
    gender: '',
    maritalStatus: '',
    educationalLevel: '',
    residentialAddress: '',
    guarantor: {
      title: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      residentialAddress: '',
      officeAddress: '',
    },
    documents: {
      driversLicense: null,
      passport: null,
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRiderDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleGuarantorChange = (e) => {
    const { name, value } = e.target;
    setRiderDetails(prevDetails => ({
      ...prevDetails,
      guarantor: { ...prevDetails.guarantor, [name]: value }
    }));
  };

  const handleDateSelect = (date) => {
    setRiderDetails(prevDetails => ({ ...prevDetails, dateOfBirth: date }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setRiderDetails(prevDetails => ({
      ...prevDetails,
      documents: { ...prevDetails.documents, [name]: files[0] }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Rider Created:', riderDetails);
    // Add logic to handle rider creation
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800">New Rider</h2>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <input type="file" id="profilePicture" className="hidden" />
          <label htmlFor="profilePicture" className="cursor-pointer">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-500" />
            </div>
          </label>
          <p className="text-sm text-gray-600 mt-2">Upload profile picture</p>
        </div>
      </div>

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
        </div>
        <div className="space-y-2">
          <Label htmlFor="retypePassword">Retype Password</Label>
          <Input
            id="retypePassword"
            name="retypePassword"
            type="password"
            value={riderDetails.retypePassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Calendar
                mode="single"
                selected={riderDetails.dateOfBirth}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="residentialAddress">Residential Address</Label>
          <Textarea
            id="residentialAddress"
            name="residentialAddress"
            value={riderDetails.residentialAddress}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800">Guarantor's Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guarantorTitle">Title</Label>
          <Input
            id="guarantorTitle"
            name="title"
            value={riderDetails.guarantor.title}
            onChange={handleGuarantorChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorFirstName">First Name</Label>
          <Input
            id="guarantorFirstName"
            name="firstName"
            value={riderDetails.guarantor.firstName}
            onChange={handleGuarantorChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorLastName">Last Name</Label>
          <Input
            id="guarantorLastName"
            name="lastName"
            value={riderDetails.guarantor.lastName}
            onChange={handleGuarantorChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guarantorPhoneNumber">Phone Number</Label>
          <Input
            id="guarantorPhoneNumber"
            name="phoneNumber"
            type="tel"
            value={riderDetails.guarantor.phoneNumber}
            onChange={handleGuarantorChange}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="guarantorResidentialAddress">Guarantor's Residential Address</Label>
          <Textarea
            id="guarantorResidentialAddress"
            name="residentialAddress"
            value={riderDetails.guarantor.residentialAddress}
            onChange={handleGuarantorChange}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="guarantorOfficeAddress">Guarantor's Office Address</Label>
          <Textarea
            id="guarantorOfficeAddress"
            name="officeAddress"
            value={riderDetails.guarantor.officeAddress}
            onChange={handleGuarantorChange}
            required
          />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800">Upload Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driversLicense">Driver's License</Label>
          <Input
            id="driversLicense"
            name="driversLicense"
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passport">Passport</Label>
          <Input
            id="passport"
            name="passport"
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#733E70] hover:bg-[#62275F] text-white">
        Create Rider
      </Button>
    </form>
  );
};

export default CreateRiderForm;