// components/BottomNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = ({ currentPage, onNavigate, currentUser }) => {
  const location = useLocation();

  // Hide bottom nav on deep-linked or detail views (e.g. product quotations, checkout, report)
  const hideOnPaths = ['/product-services', '/product-detail', '/checkout', '/report', '/quotations'];
  const currentPath = location.pathname || '';
  const shouldHide = hideOnPaths.some(p => currentPath === p || currentPath.startsWith(p + '/'));

  if (shouldHide) {
    return null;
  }

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
    ...(currentUser ? [{ id: 'bookings', path: '/bookings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Bookings' }] : []),
    { id: 'account', path: '/account', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'Account' }
  ];

  return (
    <nav className="bottom-navbar mobile-only">
      {[

        <Link key="home"
          to="/"
          className={`bottom-tab ${isActive('home') ? 'active' : ''}`}
        >
          <div className="btab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <span className="btab-label">Home</span>
        </Link>,
        <Link key="products"
          to="/products"
          className={`bottom-tab ${isActive('products') ? 'active' : ''}`}
        >
          <div className="btab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <span className="btab-label">Products</span>
        </Link>,
        <Link key="services"
          to="/services"
          className={`bottom-tab ${isActive('services') ? 'active' : ''}`}
        >
          <div className="btab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <span className="btab-label">Services</span>
        </Link>,
        <Link key="account"
          to="/account"
          className={`bottom-tab ${isActive('account') ? 'active' : ''}`}
        >
          <div className="btab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{minHeight:'25px'}}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
          </div>
          <span className="btab-label">Account</span>
        </Link>
      ]}
    </nav>
  );
};

export default BottomNav;
