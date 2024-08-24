import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, UserMinus, Trash, UserCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";

const actionIcons = {
  edit: Edit,
  suspend: UserMinus,
  activate: UserCheck,
  delete: Trash
};

const UserActions = ({ userId, actions, onActionSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (action) => {
    onActionSelect(userId, action);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {actions.map(({ id, label }) => {
              const IconComponent = actionIcons[id];
              return (
                <button
                  key={id}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  role="menuitem"
                  onClick={() => handleAction(id)}
                >
                  {IconComponent && <IconComponent className="w-5 h-5 mr-3 text-gray-400" />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActions;