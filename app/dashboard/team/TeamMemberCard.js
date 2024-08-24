import { User, Mail, Phone } from 'lucide-react';

const TeamMemberCard = ({ member }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
        {member.profilePhoto ? (
          <img src={member.profilePhoto} alt={`${member.firstName} ${member.lastName}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{`${member.firstName} ${member.lastName}`}</h3>
      <p className="text-sm text-gray-600 mb-2">{member.position}</p>
      <div className="flex items-center text-sm text-gray-500 mb-1">
        <Mail className="w-4 h-4 mr-2" />
        {member.email}
      </div>
      <div className="flex items-center text-sm text-gray-500 mb-1">
        <Phone className="w-4 h-4 mr-2" />
        {member.phoneNumber}
      </div>
      <p className="text-sm text-gray-500">Gender: {member.gender}</p>
    </div>
  );
};

export default TeamMemberCard;
