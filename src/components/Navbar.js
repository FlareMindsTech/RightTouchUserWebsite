// components/Navbar.jsx
import React from 'react';
import { Home, Wrench, MessageCircle, User, ShoppingCart, Zap } from 'lucide-react';

const Navbar = ({ currentPage, onNavigate }) => {
  return (
    <header className="top-navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="brand-icon"><Zap size={24} /></div>
          <span className="brand-name">RightTouch</span>
        </div>
        
        <nav className="nav-links">
          <a 
            href="#" 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('home', e.currentTarget); }}
          >
            <span className="nav-icon"><Home size={18} /></span> Home
          </a>
          <a 
            href="#" 
            className={`nav-link ${currentPage === 'services' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('services', e.currentTarget); }}
          >
            <span className="nav-icon"><Wrench size={18} /></span> Services
          </a>
          <a 
            href="#" 
            className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('chat', e.currentTarget); }}
          >
            <span className="nav-icon"><MessageCircle size={18} /></span> Chat
          </a>
          <a 
            href="#" 
            className={`nav-link ${currentPage === 'account' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('account', e.currentTarget); }}
          >
            <span className="nav-icon"><User size={18} /></span> Account
          </a>
        </nav>

        <div className="nav-search desktop-only" style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search services..."
          />
        </div>

        <div className="nav-actions desktop-only">
          <button 
            className="cart-icon-btn"
            onClick={() => onNavigate('cart', null)}
            title="Shopping Cart"
          >
            <ShoppingCart size={20} />
            <span className="cart-badge">0</span>
          </button>
        </div>
      </div>
    </header>
  );
};
  
export default Navbar;

