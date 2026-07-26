import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  MdDashboard,
  MdClose,
  MdKeyboardArrowDown,
} from 'react-icons/md';

import { FaUsers } from 'react-icons/fa';

import {
  BsCalendarEventFill,
  BsFillTicketFill,
} from 'react-icons/bs';

import { FaFlag } from 'react-icons/fa6';

import '../assets/CSS/Sidebar.css';

const menuItems = [
  {
    label: 'Dashboard',
    icon: <MdDashboard />,
    path: '/dashboard',
  },
  {
    label: 'User Management',
    icon: <FaUsers />,
    submenu: [
      { label: 'Users', path: '/user' },
      { label: 'Roles', path: '/role' },
      { label: 'Permissions', path: '/permission' },
    ],
  },
  {
    label: 'Add Event',
    icon: <BsCalendarEventFill />,
    path: '/event',
  },
  {
    label: 'Booking',
    icon: <BsFillTicketFill />,
    path: '/booking',
  },
  {
    label: 'Entry Report',
    icon: <FaFlag />,
    path: '/entry-report',
  },
];

export default function Sidebar() {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const closeSidebar = () => setIsOpen(false);

  const toggleSubmenu = (label) => {
    setExpandedMenu((prev) => (prev === label ? null : label));
  };

  // Toggle sidebar from header button
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);

    window.addEventListener('toggle-sidebar', handleToggle);

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
    };
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`overlay ${isOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className='sidebarHeader'>
          <div className='logoWrap'>
            <div className='logoIcon' />
            <div className='logoText'>
              <span className='logoShubh'>Shubh</span>
              <span className='logoHindi'>अवसर</span>
            </div>
          </div>

          <button
            type='button'
            className='closeButton'
            onClick={closeSidebar}
            aria-label='Close sidebar'
          >
            <MdClose />
          </button>
        </div>

        {/* Navigation */}
        <nav className='nav'>
          {menuItems.map((item) => {
            // =========================
            // SUBMENU ITEM
            // =========================
            if (item.submenu) {
              // Check if current route belongs to submenu
              const hasActiveSubmenu = item.submenu.some(
                (sub) => location.pathname === sub.path
              );

              // Open dropdown when clicked OR when route is active
              const isExpanded =
                expandedMenu === item.label || hasActiveSubmenu;

              return (
                <div key={item.label}>
                  <button
                    type='button'
                    className='navItem'
                    onClick={() => toggleSubmenu(item.label)}
                  >
                    <span className='icon'>{item.icon}</span>
                    <span className='label'>{item.label}</span>

                    <span
                      className={`chevron ${
                        isExpanded ? 'rotated' : ''
                      }`}
                    >
                      <MdKeyboardArrowDown />
                    </span>
                  </button>

                  {/* Submenu */}
                  <div
                    className={`submenuWrapper ${
                      isExpanded ? 'expanded' : ''
                    }`}
                  >
                    <div className='submenuInner'>
                      <div className='submenu'>
                        {item.submenu.map((subItem) => (
                          <NavLink
                            key={subItem.label}
                            to={subItem.path}
                            className={({ isActive }) =>
                              `submenuItem ${isActive ? 'active' : ''}`
                            }
                            onClick={closeSidebar}
                          >
                            <span className='submenuDash'>-</span>
                            <span>{subItem.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // =========================
            // NORMAL MENU ITEM
            // =========================
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `navItem ${isActive ? 'active' : ''}`
                }
                onClick={closeSidebar}
              >
                <span className='icon'>{item.icon}</span>
                <span className='label'>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}