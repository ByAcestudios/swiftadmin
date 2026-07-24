'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import RoleForm from './RoleForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function RolesPanel() {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/rbac/roles');
      setRoles(res.data?.roles || res.data?.data || res.data || []);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load roles.',
      });
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (editingRole?.id) {
        await api.put(`/api/admin/rbac/roles/${editingRole.id}`, payload);
        toast({ description: 'Role updated successfully.' });
      } else {
        await api.post('/api/admin/rbac/roles', payload);
        toast({ description: 'Role created successfully.' });
      }
      setModalOpen(false);
      setEditingRole(null);
      fetchRoles();
    } catch (err) {
      toast({
        variant: 'destructive',
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to save role.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"? This only works when no members are assigned.`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/rbac/roles/${role.id}`);
      toast({ description: 'Role deleted.' });
      fetchRoles();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to delete role.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Define what each sub-admin role can access.</p>
        <Button
          onClick={() => {
            setEditingRole(null);
            setModalOpen(true);
          }}
          className="bg-[#733E70] hover:bg-[#62275F] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Loading roles...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No roles yet. Create one to assign permissions to team members.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{role.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{role.description || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{role.memberCount ?? role.membersCount ?? 0}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRole(role);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(role)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <RoleForm
            key={editingRole?.id || 'new'}
            role={editingRole}
            saving={saving}
            onCancel={() => {
              setModalOpen(false);
              setEditingRole(null);
            }}
            onSubmit={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
