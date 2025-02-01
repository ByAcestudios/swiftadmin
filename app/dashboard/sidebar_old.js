'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronUp,
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Users,
  ClipboardList,
  Tag,
  UserCircle,
  Users2,
  Calendar,
  Settings
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  // { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Riders', href: '/dashboard/riders', icon: Users },
  // { name: 'To-do', href: '/dashboard/todo', icon: ClipboardList },
  { name: 'Coupons', href: '/dashboard/coupons', icon: Tag },
  { 
    name: 'Users', 
    href: '/dashboard/users', 
    icon: UserCircle,
    subItems: [
      { name: 'All Users', href: '/dashboard/users' },
      { name: 'Add User', href: '/dashboard/users/add' },
    ]
  },
  // { name: 'Team', href: '/dashboard/team', icon: Users2 },
  // { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const pathname = usePathname();

  const toggleSubMenu = (index) => setOpenSubMenu(openSubMenu === index ? null : index);

  const MenuItem = ({ item, index }) => {
    const isActive = pathname === item.href;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const Icon = item.icon;

    return (
      <div className="mb-4">
        <Link
          href={item.href}
          className={`flex items-center px-4 py-2 rounded-xl transition-colors duration-200 ${
            isActive ? 'bg-[#62275F] text-white' : 'text-[#B99FB7] hover:bg-[#62275F] hover:text-white'
          }`}
          onClick={() => hasSubItems && toggleSubMenu(index)}
        >
          <Icon className="mr-3 h-5 w-5" />
          <span>{item.name}</span>
          {hasSubItems && (
            <span className="ml-auto">
              {openSubMenu === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          )}
        </Link>
        {hasSubItems && openSubMenu === index && (
          <div className="ml-6 mt-2 space-y-2">
            {item.subItems.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                href={subItem.href}
                className={`block px-4 py-2 rounded-xl transition-colors duration-200 ${
                  pathname === subItem.href ? 'bg-[#62275F] text-white' : 'text-[#B99FB7] hover:bg-[#62275F] hover:text-white'
                }`}
              >
                {subItem.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white text-[#B99FB7] w-64 h-[calc(100vh-4rem)] fixed top-16 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out z-30 overflow-y-auto md:translate-x-0 md:static`}
    >
      <nav className="space-y-4 p-4">
        {menuItems.map((item, index) => (
          <MenuItem key={index} item={item} index={index} />
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;