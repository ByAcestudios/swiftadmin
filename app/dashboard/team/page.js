'use client';

import { useState } from 'react';
import { Shield, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RolesPanel from './RolesPanel';
import TeamPanel from './TeamPanel';

const tabs = [
  { id: 'team', label: 'Team Members', icon: Users2 },
  { id: 'roles', label: 'Roles', icon: Shield },
];

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState('team');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Team & Roles</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage sub-admin accounts and control which modules each role can access.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'bg-[#62275F] hover:bg-[#733E70] text-white' : ''}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeTab === 'team' ? <TeamPanel /> : <RolesPanel />}
    </div>
  );
}
