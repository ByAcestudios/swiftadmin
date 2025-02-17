'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

const NOTIFICATION_TYPES = [
  { id: 'PROMO', label: 'Promotion' },
  { id: 'SYSTEM', label: 'System' },
  { id: 'PAYMENT', label: 'Payment' }
];

const USER_TYPES = [
  { id: 'ALL', label: 'All Users' },
  { id: 'CUSTOMERS', label: 'Customers' },
  { id: 'RIDERS', label: 'Riders' }
];

const NotificationsPage = () => {
  const { toast } = useToast();
  const [notificationType, setNotificationType] = useState('PROMO');
  const [userType, setUserType] = useState('ALL');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [metadata, setMetadata] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search users
  const searchUsers = async (query) => {
    if (query.length < 2) return;
    
    try {
      const response = await api.get('/api/users/admin/search', {
        params: { query }
      });
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        variant: "destructive",
        description: "Failed to search users. Please try again.",
      });
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Remove selected user
  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // Handle notification send
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let endpoint = '/api/admin/notifications/broadcast';
      let payload = {
        title,
        message,
        type: notificationType,
        userType,
        metadata
      };

      if (selectedUsers.length > 0) {
        endpoint = '/api/admin/notifications/targeted';
        payload = {
          ...payload,
          userIds: selectedUsers.map(u => u.id)
        };
      }

      if (isScheduled) {
        endpoint = '/api/admin/notifications/schedule';
        payload = {
          ...payload,
          scheduledFor: scheduledDate.toISOString()
        };
      }

      await api.post(endpoint, payload);

      toast({
        description: "Notification sent successfully!",
      });

      // Reset form
      setTitle('');
      setMessage('');
      setMetadata({});
      setSelectedUsers([]);
      setIsScheduled(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        variant: "destructive",
        description: "Failed to send notification. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Send Notifications</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Select
              value={notificationType}
              onValueChange={setNotificationType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Select
              value={userType}
              onValueChange={setUserType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Notification Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Notification Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
          />
        </div>

        {userType === 'TARGETED' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="border rounded-md p-2">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="text-sm text-gray-500">{user.email}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-sm"
                  >
                    {user.firstName} {user.lastName}
                    <X
                      className="h-4 w-4 cursor-pointer"
                      onClick={() => removeUser(user.id)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
            />
            Schedule for later
          </label>

          {isScheduled && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {format(scheduledDate, 'PPP')}
                  <CalendarIcon className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Notification'}
        </Button>
      </form>
    </div>
  );
};

export default NotificationsPage; 