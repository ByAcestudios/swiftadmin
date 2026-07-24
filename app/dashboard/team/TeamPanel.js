'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import TeamMemberForm from './TeamMemberForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const statusColor = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800',
};

export default function TeamPanel() {
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamRes, rolesRes] = await Promise.all([
        api.get('/api/admin/rbac/team'),
        api.get('/api/admin/rbac/roles'),
      ]);
      setMembers(teamRes.data?.members || teamRes.data?.team || teamRes.data?.data || teamRes.data || []);
      setRoles(rolesRes.data?.roles || rolesRes.data?.data || rolesRes.data || []);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load team members.',
      });
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (editingMember?.id) {
        await api.put(`/api/admin/rbac/team/${editingMember.id}`, payload);
        toast({ description: 'Team member updated.' });
      } else {
        await api.post('/api/admin/rbac/team', payload);
        toast({ description: 'Team member created.' });
      }
      setModalOpen(false);
      setEditingMember(null);
      fetchData();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to save team member.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (member) => {
    if (!window.confirm(`Suspend access for ${member.email}?`)) return;
    try {
      await api.patch(`/api/admin/rbac/team/${member.id}/suspend`);
      toast({ description: 'Team member suspended.' });
      fetchData();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to suspend team member.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Create individual sub-admin accounts with assigned roles.</p>
        <Button
          onClick={() => {
            setEditingMember(null);
            setModalOpen(true);
          }}
          disabled={roles.length === 0}
          className="bg-[#733E70] hover:bg-[#62275F] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Member
        </Button>
      </div>

      {roles.length === 0 && !loading && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Create at least one role before adding team members.
        </p>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Loading team members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No team members yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {[member.firstName, member.lastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {member.AdminRole?.name || member.roleName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColor[member.status] || statusColor.inactive}>
                      {member.status || 'unknown'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMember(member);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {member.status !== 'suspended' && (
                      <Button variant="outline" size="sm" onClick={() => handleSuspend(member)}>
                        <UserX className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Team Member' : 'Create Team Member'}</DialogTitle>
          </DialogHeader>
          <TeamMemberForm
            member={editingMember}
            roles={roles}
            saving={saving}
            onCancel={() => {
              setModalOpen(false);
              setEditingMember(null);
            }}
            onSubmit={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
