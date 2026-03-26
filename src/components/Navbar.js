// components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, User, ShoppingCart, ClipboardList } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = ({ currentPage, onNavigate, cartItemCount = 0, currentUser, onLoginClick, onLogout, searchQuery, onSearchChange }) => {
  const location = useLocation();

  // Determine active state based on current path
  const isActive = (path) => {
    if (path === 'home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === `/${path}`;
  };

  return (
    <header className="top-navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">
              <img src={logo} alt="RightTouch Logo" className="brand-logo" />
            </div>
          </Link>
        </div>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${isActive('home') ? 'active' : ''}`}
          >
            <span className="nav-icon"><Home size={18} /></span> Home
          </Link>
          <Link
            to="/services"
            className={`nav-link ${isActive('services') ? 'active' : ''}`}
          >
            <span className="nav-icon"><Wrench size={18} /></span> Services
          </Link>
          <Link
            to="/account"
            className={`nav-link ${isActive('account') ? 'active' : ''}`}
          >
            <span className="nav-icon"><User size={18} /></span> {currentUser?.name || currentUser?.identifier || 'Account'}
          </Link>
          {/* {currentUser && (
            <Link
              to="/bookings"
              className={`nav-link ${isActive('bookings') ? 'active' : ''}`}
            >
              <span className="nav-icon"><ClipboardList size={18} /></span> Bookings
            </Link>
          )} */}
        </nav>

        <div className="nav-search desktop-only" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search services..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        <div className="nav-actions desktop-only">
          <Link
            to="/cart"
            className="cart-icon-btn"
            title="Shopping Cart"
          >
            <ShoppingCart size={20} />
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

