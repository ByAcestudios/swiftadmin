'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = ({ isOpen }) => {
  const pathname = usePathname();
  const { sidebarItems, isLoading } = useAuth();
  const [openSubMenu, setOpenSubMenu] = useState(null);

  useEffect(() => {
    const activeIndex = sidebarItems.findIndex((item) => {
      if (pathname === item.href) return true;
      if (item.subItems?.some((sub) => pathname === sub.href || pathname.startsWith(item.href))) {
        return true;
      }
      return item.subItems && pathname.startsWith(item.href);
    });
    if (activeIndex >= 0) {
      setOpenSubMenu(activeIndex);
    }
  }, [pathname, sidebarItems]);

  const toggleSubMenu = (index) => setOpenSubMenu(openSubMenu === index ? null : index);

  const MenuItem = ({ item, index }) => {
    const isActive =
      pathname === item.href ||
      (item.subItems && item.subItems.some((sub) => pathname === sub.href)) ||
      (item.subItems && pathname.startsWith(item.href));
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const Icon = item.icon;

    return (
      <div className="mb-4">
        <Link
          href={hasSubItems ? '#' : item.href}
          className={`flex items-center px-4 py-2 rounded-xl transition-colors duration-200 ${
            isActive ? 'bg-[#62275F] text-white' : 'text-[#B99FB7] hover:bg-[#62275F] hover:text-white'
          }`}
          onClick={(e) => {
            if (hasSubItems) {
              e.preventDefault();
              toggleSubMenu(index);
            }
          }}
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
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={`block px-4 py-2 rounded-xl transition-colors duration-200 ${
                  pathname === subItem.href
                    ? 'bg-[#62275F] text-white'
                    : 'text-[#B99FB7] hover:bg-[#62275F] hover:text-white'
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
      className={`bg-white text-[#B99FB7] w-64 fixed top-16 left-0 bottom-0 py-7 px-2 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out z-30 overflow-y-auto overscroll-contain`}
    >
      <nav className="space-y-4">
        {isLoading ? (
          <p className="px-4 text-sm text-gray-400">Loading menu...</p>
        ) : sidebarItems.length === 0 ? (
          <p className="px-4 text-sm text-gray-400">No modules assigned</p>
        ) : (
          sidebarItems.map((item, index) => <MenuItem key={item.key} item={item} index={index} />)
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
