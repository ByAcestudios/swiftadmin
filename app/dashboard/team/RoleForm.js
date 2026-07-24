'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import RolePermissionsEditor from './RolePermissionsEditor';
import { permissionsForEditor, sanitizeRolePermissions } from '@/lib/rbac';

export default function RoleForm({ role, onSubmit, onCancel, saving }) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState(() =>
    permissionsForEditor(role?.permissions)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      permissions: sanitizeRolePermissions(permissions),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">{role ? 'Edit Role' : 'Create Role'}</h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role-name">Role name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Operations"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="role-description">Description</Label>
          <Input
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this role can do"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Module permissions</Label>
        <RolePermissionsEditor permissions={permissions} onChange={setPermissions} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </form>
  );
}
