// components/BottomNav.jsx
import React from 'react';

const BottomNav = ({ currentPage, onNavigate }) => {
  const tabs = [
    { id: 'home', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Home' },
    { id: 'services', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', label: 'Services' },
    { id: 'chat', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Chat' },
    { id: 'account', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'Account' }
  ];

  return (
    <nav className="bottom-navbar mobile-only">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`bottom-tab ${currentPage === tab.id ? 'active' : ''}`}
          onClick={(e) => onNavigate(tab.id, e.currentTarget)}
        >
          <div className="btab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={tab.icon} />
            </svg>
          </div>
          <span className="btab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;