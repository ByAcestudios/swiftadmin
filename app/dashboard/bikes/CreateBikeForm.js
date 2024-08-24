import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { ChromePicker } from 'react-color';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Demo data for riders
const demoRiders = [
  { value: 'Jomiloju Aramide', label: 'Jomiloju Aramide' },
  { value: 'Mayowa', label: 'Mayowa' },
  // Add more demo riders as needed
];

const CreateBikeForm = () => {
  const [bikeDetails, setBikeDetails] = useState({
    name: '',
    color: '#000000',
    plateNumber: '',
    nextServicingDate: new Date(),
    dateOfPurchase: new Date(),
    duration: '',
    history: [{ riderName: '', duration: '' }],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBikeDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleColorChange = (color) => {
    setBikeDetails(prevDetails => ({ ...prevDetails, color: color.hex }));
  };

  const handleDateChange = (name, date) => {
    setBikeDetails(prevDetails => ({ ...prevDetails, [name]: date }));
  };

  const handleHistoryChange = (index, e) => {
    const { name, value } = e.target;
    const newHistory = [...bikeDetails.history];
    newHistory[index][name] = value;
    setBikeDetails(prevDetails => ({ ...prevDetails, history: newHistory }));
  };

  const handleRiderChange = (index, value) => {
    const newHistory = [...bikeDetails.history];
    newHistory[index].riderName = value;
    setBikeDetails(prevDetails => ({ ...prevDetails, history: newHistory }));
  };

  const addHistoryEntry = () => {
    setBikeDetails(prevDetails => ({
      ...prevDetails,
      history: [...prevDetails.history, { riderName: '', duration: '' }]
    }));
  };

  const removeHistoryEntry = (index) => {
    const newHistory = bikeDetails.history.filter((_, i) => i !== index);
    setBikeDetails(prevDetails => ({ ...prevDetails, history: newHistory }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Bike Created:', bikeDetails);
    // Add logic to handle bike creation
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800">Bike Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Bike Name</Label>
          <Input
            id="name"
            name="name"
            value={bikeDetails.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full mr-2" style={{ backgroundColor: bikeDetails.color }}></div>
                  {bikeDetails.color}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <ChromePicker color={bikeDetails.color} onChangeComplete={handleColorChange} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plateNumber">Plate Number</Label>
          <Input
            id="plateNumber"
            name="plateNumber"
            value={bikeDetails.plateNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextServicingDate">Next Servicing Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {bikeDetails.nextServicingDate ? format(bikeDetails.nextServicingDate, 'dd MMM yyyy') : 'Select Date'}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={bikeDetails.nextServicingDate}
                onSelect={(date) => handleDateChange('nextServicingDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfPurchase">Date of Purchase</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {bikeDetails.dateOfPurchase ? format(bikeDetails.dateOfPurchase, 'dd MMM yyyy') : 'Select Date'}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={bikeDetails.dateOfPurchase}
                onSelect={(date) => handleDateChange('dateOfPurchase', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            name="duration"
            value={bikeDetails.duration}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800">History</h3>
      {bikeDetails.history.map((entry, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <Label htmlFor={`riderName-${index}`}>Rider's Name</Label>
            <Select onValueChange={(value) => handleRiderChange(index, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Rider" />
              </SelectTrigger>
              <SelectContent>
                {demoRiders.map((rider) => (
                  <SelectItem key={rider.value} value={rider.value}>
                    {rider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`duration-${index}`}>Duration</Label>
            <Input
              id={`duration-${index}`}
              name="duration"
              value={entry.duration}
              onChange={(e) => handleHistoryChange(index, e)}
              required
            />
          </div>
          <Button variant="outline" onClick={() => removeHistoryEntry(index)} className="text-red-500">
            <X className="w-5 h-5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={addHistoryEntry} className="flex items-center">
        <Plus className="w-5 h-5 mr-2" />
        Add New
      </Button>

      <Button type="submit" className="w-full bg-[#733E70] hover:bg-[#62275F] text-white">
        Save Changes
      </Button>
    </form>
  );
};

export default CreateBikeForm;