// components/BottomNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = ({ currentPage, onNavigate, currentUser }) => {
  const location = useLocation();

  // Determine active state based on current path
  const isActive = (path) => {
    if (path === 'home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === `/${path}`;
  };

  const tabs = [
    { id: 'home', path: '/', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Home' },
    { id: 'services', path: '/services', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', label: 'Services' },
    { id: 'account', path: '/account', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'Account' }
  ];

  return (
    <nav className="bottom-navbar mobile-only">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          to={tab.path}
          className={`bottom-tab ${isActive(tab.id) ? 'active' : ''}`}
        >
          <div className="btab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={tab.icon} />
            </svg>
          </div>
          <span className="btab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
