'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

export default function TeamMemberForm({ member, roles, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    firstName: member?.firstName || '',
    lastName: member?.lastName || '',
    email: member?.email || '',
    phoneNumber: member?.phoneNumber || '',
    password: '',
    adminRoleId: member?.adminRoleId || member?.AdminRole?.id || '',
    status: member?.status || 'active',
  });

  useEffect(() => {
    if (member) {
      setForm({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        password: '',
        adminRoleId: member.adminRoleId || member.AdminRole?.id || '',
        status: member.status || 'active',
      });
    }
  }, [member]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      adminRoleId: form.adminRoleId,
      status: form.status,
    };
    if (form.password.trim()) {
      payload.password = form.password;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {member ? 'Edit Team Member' : 'Create Team Member'}
        </h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required disabled={!!member} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone number</Label>
          <Input id="phoneNumber" value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} placeholder="+234..." className="mt-1" />
        </div>
        <div>
          <Label htmlFor="password">{member ? 'New password (optional)' : 'Password'}</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required={!member} className="mt-1" />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={form.adminRoleId} onValueChange={(value) => update('adminRoleId', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {member && (
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => update('status', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !form.adminRoleId}>
          {saving ? 'Saving...' : member ? 'Update Member' : 'Create Member'}
        </Button>
      </div>
    </form>
  );
}
