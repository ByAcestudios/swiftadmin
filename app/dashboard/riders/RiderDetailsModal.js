import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { X, Edit2, CalendarIcon, Upload, FileText, Trash2 } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import SuccessMessage from '@/components/successMessage';

const RiderDetailsModal = ({ riderId, onClose }) => {
  const { toast } = useToast();
  const [riderDetails, setRiderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newDocument, setNewDocument] = useState({ documentType: '', file: null });
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRiderDetails();
  }, [riderId]);

  const fetchRiderDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/riders/${riderId}`);
      setRiderDetails(response.data);
    } catch (err) {
      console.error('Error fetching rider details:', err);
      setError('Failed to fetch rider details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRiderDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setRiderDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleDateChange = (date) => {
    setRiderDetails(prevDetails => ({ ...prevDetails, dateOfBirth: format(date, 'yyyy-MM-dd') }));
  };

  const handleSave = async () => {
    try {
      await api.put(`/api/riders/${riderId}`, riderDetails);
      setIsEditing(false);
      fetchRiderDetails(); // Refresh rider details
    } catch (err) {
      console.error('Error updating rider:', err);
      setError('Failed to update rider. Please try again.');
    }
  };

  const handleStatusSave = async () => {
    try {
      await api.patch(`/api/riders/${riderId}/status`, { status: riderDetails.status });
      setIsEditingStatus(false);
      fetchRiderDetails(); // Refresh rider details
    } catch (err) {
      console.error('Error updating rider status:', err);
      setError('Failed to update rider status. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDocument(prev => ({ ...prev, file }));
    }
  };

  const handleDocumentTypeChange = (value) => {
    setNewDocument(prev => ({ ...prev, documentType: value }));
  };

  const handleUploadDocument = async () => {
    if (!newDocument.documentType || !newDocument.file) {
      toast({
        title: "Error",
        description: "Please select a document type and file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', newDocument.file);
    formData.append('documentType', newDocument.documentType);

    try {
      await api.post(`/api/upload/riders/${riderId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      await fetchRiderDetails(); // Refresh rider details
      setNewDocument({ documentType: '', file: null });
      setSuccessMessage('Document uploaded successfully');
      setShowSuccess(true);
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/api/documents/${documentId}`);
        await fetchRiderDetails(); // Refresh rider details
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
      } catch (err) {
        console.error('Error deleting document:', err);
        toast({
          title: "Error",
          description: "Failed to delete document. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  const handleApproveRider = async () => {
    if (window.confirm('Are you sure you want to approve this rider?')) {
      try {
        await api.post(`/api/riders/approve/${riderId}`);
        await fetchRiderDetails(); // Refresh rider details
        toast({
          title: "Success",
          description: "Rider approved successfully!",
        });
      } catch (err) {
        console.error('Error approving rider:', err);
        toast({
          title: "Error",
          description: "Failed to approve rider. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!riderDetails) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        {showSuccess && (
          <SuccessMessage 
            message={successMessage} 
            onClose={handleSuccessClose}
            autoCloseDelay={3000}
          />
        )}
        
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Rider Details</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-4">
            <Image
              src={riderDetails.profilePictureUrl || '/default-avatar.png'}
              alt="Profile"
              width={96}
              height={96}
              className="rounded-full"
            />
            <div>
              <h3 className="text-xl font-bold">{`${riderDetails.firstName} ${riderDetails.lastName}`}</h3>
              <p className="text-gray-600">{riderDetails.phoneNumber}</p>
              <p className="text-gray-600">{riderDetails.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Status:</span>
              {isEditingStatus && riderDetails.status !== 'pending' ? (
                <Select onValueChange={(value) => handleSelectChange('status', value)} value={riderDetails.status}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-gray-800">
                  {riderDetails.status === 'pending' ? 'Needs Approval' : riderDetails.status}
                </span>
              )}
              {riderDetails.status !== 'pending' && (
                <button 
                  onClick={() => setIsEditingStatus(!isEditingStatus)} 
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEditingStatus && riderDetails.status !== 'pending' && (
              <Button onClick={handleStatusSave} className="bg-[#733E70] hover:bg-[#62275F] text-white">
                Save Status
              </Button>
            )}
            {riderDetails.status === 'pending' && (
              <Button onClick={handleApproveRider} className="bg-green-500 hover:bg-green-600 text-white">
                Approve Rider
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${!isEditing && "opacity-50 cursor-not-allowed"}`}
                    disabled={!isEditing}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {riderDetails.dateOfBirth ? format(new Date(riderDetails.dateOfBirth), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={riderDetails.dateOfBirth ? new Date(riderDetails.dateOfBirth) : undefined}
                    onSelect={handleDateChange}
                    disabled={!isEditing}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleSelectChange('gender', value)} value={riderDetails.gender} disabled={!isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select onValueChange={(value) => handleSelectChange('maritalStatus', value)} value={riderDetails.maritalStatus} disabled={!isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="educationalLevel">Educational Level</Label>
              <Select onValueChange={(value) => handleSelectChange('educationalLevel', value)} value={riderDetails.educationalLevel} disabled={!isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select educational level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="tertiary">Tertiary</SelectItem>
                  <SelectItem value="graduate">Graduate</SelectItem>
                  <SelectItem value="postgraduate">Postgraduate</SelectItem>
                  <SelectItem value="bachelors">Bachelors</SelectItem>
                  <SelectItem value="masters">Masters</SelectItem>
                  <SelectItem value="highschool">High School</SelectItem>

                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="residentialAddress">Residential Address</Label>
            <Textarea
              id="residentialAddress"
              name="residentialAddress"
              value={riderDetails.residentialAddress}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-6 mt-6">
            {/* Guarantor Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Guarantor Information</h3>
              {riderDetails.Guarantor ? (
                <div>
                  <p>Name: {riderDetails.Guarantor.title} {riderDetails.Guarantor.firstName} {riderDetails.Guarantor.lastName}</p>
                  <p>Phone: {riderDetails.Guarantor.phoneNumber}</p>
                  {/* Add more guarantor details as needed */}
                </div>
              ) : (
                <p className="text-gray-600">No guarantor information available</p>
              )}
              {/* Add button or form to add/edit guarantor information */}
            </div>

            {/* Documents Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Documents & Licenses</h3>
              <div className="space-y-4">
                {riderDetails.RiderDocuments && riderDetails.RiderDocuments.length > 0 ? (
                  riderDetails.RiderDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {doc.documentType}
                        </a>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 italic">No documents available</p>
                )}
              </div>

              {/* Add New Document Form */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold mb-3">Upload New Document</h4>
                <div className="space-y-3">
                  <Select onValueChange={handleDocumentTypeChange} value={newDocument.documentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="license">License</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="profilePicture">Profile Picture</SelectItem>
                      {/* Add more document types as needed */}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-3">
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    <Button 
                      onClick={handleUploadDocument} 
                      className="bg-[#733E70] hover:bg-[#62275F] text-white"
                      disabled={isUploading || !newDocument.documentType || !newDocument.file}
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={() => setIsEditing(!isEditing)} className="bg-gray-500 hover:bg-gray-600 text-white">
              {isEditing ? 'Cancel' : 'Edit Rider'}
            </Button>
            {isEditing && (
              <Button onClick={handleSave} className="bg-[#733E70] hover:bg-[#62275F] text-white">
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDetailsModal;
