// components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, User, ShoppingCart, Search, X, Menu } from 'lucide-react';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = ({
  currentPage,
  onNavigate,
  cartItemCount = 0,
  currentUser,
  onLoginClick,
  onLogout,
  searchQuery,
  onSearchChange
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine active state based on current path
  const isActive = (path) => {
    if (path === 'home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === `/${path}`;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="top-navbar">
      <div className="nav-container">
        {/* Brand / Logo - Only Logo */}
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">
              <img src={logo} alt="RightTouch Logo" className="brand-logo" />
            </div>
          </Link>
        </div>

        {/* Navigation Links - Desktop */}
        <nav className="nav-links desktop-nav">
          <Link to="/" className={`nav-link ${isActive('home') ? 'active' : ''}`}>
            <span className="nav-icon"><Home size={18} /></span>
            <span className="nav-label">Home</span>
          </Link>
          <Link to="/services" className={`nav-link ${isActive('services') ? 'active' : ''}`}>
            <span className="nav-icon"><Wrench size={18} /></span>
            <span className="nav-label">Services</span>
          </Link>
          <Link to="/account" className={`nav-link ${isActive('account') ? 'active' : ''}`}>
            <span className="nav-icon"><User size={18} /></span>
            <span className="nav-label">
              {currentUser?.name || currentUser?.identifier || 'Account'}
            </span>
          </Link>
        </nav>

        {/* Search Bar - Desktop */}
        <div className="nav-search desktop-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search services..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          <kbd className="search-shortcut desktop-only">⌘K</kbd>
        </div>

        {/* Search Bar - Mobile (visible on mobile) */}
        <div className="nav-search mobile-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        {/* Nav Actions */}
        <div className="nav-actions">
          {/* Login/Logout buttons - Desktop */}
          {!currentUser ? (
            <button className="login-btn-nav desktop-only" onClick={onLoginClick}>
              Sign In
            </button>
          ) : (
            <button className="logout-btn-nav desktop-only" onClick={onLogout}>
              Sign Out
            </button>
          )}

          {/* Cart Button */}
          <Link to="/cart" className="cart-icon-btn" title="Shopping Cart">
            <ShoppingCart className="cart-icon" size={20} />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="brand-icon small">
                <img src={logo} alt="RightTouch Logo" className="brand-logo" />
              </div>
              <button className="mobile-menu-close" onClick={toggleMobileMenu}>
                <X size={24} />
              </button>
            </div>
            <nav className="mobile-nav-links">
              <Link to="/" className={`mobile-nav-link ${isActive('home') ? 'active' : ''}`} onClick={toggleMobileMenu}>
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link to="/services" className={`mobile-nav-link ${isActive('services') ? 'active' : ''}`} onClick={toggleMobileMenu}>
                <Wrench size={20} />
                <span>Services</span>
              </Link>
              <Link to="/account" className={`mobile-nav-link ${isActive('account') ? 'active' : ''}`} onClick={toggleMobileMenu}>
                <User size={20} />
                <span>Account</span>
              </Link>
            </nav>
            <div className="mobile-menu-footer">
              <div className="mobile-menu-actions">
                {!currentUser ? (
                  <button className="mobile-login-btn" onClick={onLoginClick}>
                    Sign In
                  </button>
                ) : (
                  <button className="mobile-logout-btn" onClick={onLogout}>
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;