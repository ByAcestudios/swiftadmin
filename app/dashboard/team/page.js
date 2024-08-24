'use client';

import { useState } from 'react';
import TeamMemberCard from './TeamMemberCard';
import TeamMemberForm from './TeamMemberForm';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

// Demo data
const demoTeamMembers = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+234 123 456 7890',
    position: 'Software Engineer',
    gender: 'Male',
    profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phoneNumber: '+234 098 765 4321',
    position: 'Product Manager',
    gender: 'Female',
    profilePhoto: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    phoneNumber: '+234 111 222 3333',
    position: 'UX Designer',
    gender: 'Male',
    profilePhoto: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    id: 4,
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@example.com',
    phoneNumber: '+234 444 555 6666',
    position: 'Data Analyst',
    gender: 'Female',
    profilePhoto: 'https://randomuser.me/api/portraits/women/4.jpg',
  },
  // Add more demo members as needed
];

const TeamsPage = () => {
  const [teamMembers, setTeamMembers] = useState(demoTeamMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateMember = (newMember) => {
    setTeamMembers([...teamMembers, { ...newMember, id: teamMembers.length + 1 }]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          <Plus className="w-5 h-5 mr-2" />
          Create Member
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teamMembers.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TeamMemberForm
              onSubmit={handleCreateMember}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;