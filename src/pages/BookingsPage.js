import React, { useState } from 'react';
import { 
  MdOutlineChevronRight,
  MdHelpOutline,
  MdOutlineLocationOn,
  MdSearch,
  MdShoppingCart
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpeg';
import BookingDetailPage from './BookingDetailPage';
import './BookingsPage.css';

const BookingsPage = ({ isActive, showToast, onBack, cartItemCount = 0 }) => {
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  const handleMenuItemClick = (item) => {
    showToast(`Opening ${item}`);
  };

  const handleBack = () => {
    if (selectedBooking) {
      setSelectedBooking(null);
    } else if (onBack) {
      onBack();
    }
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const bookings = [
    { service: 'Plumber', status: 'Completed', date: 'Jun 29, 2025' },
    { service: 'Bathroom Cleaning', status: 'Completed', date: 'Jun 21, 2025' },
    { service: 'Electrician', status: 'Completed', date: 'Jan 15, 2025' },
    { service: 'Chimney', status: 'Completed', date: 'Jan 29, 2025' }
  ];

  // If a booking is selected, show the detail page
  if (selectedBooking) {
    return (
      <BookingDetailPage 
        booking={selectedBooking}
        onBack={handleBack}
        showToast={showToast}
      />
    );
  }

  // Otherwise show the main bookings page
  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-bookings">
      {/* Mobile Header with Logo, Search, Cart */}
      <div className="bookings-mobile-header mobile-only">
        <div className="mobile-header-left">
          <img src={logo} alt="RightTouch" className="mobile-header-logo" />
          <span className="mobile-header-title">RightTouch</span>
        </div>
        <div className="mobile-header-right">
          <div className="mobile-search-bar">
            <MdSearch className="mobile-search-icon" />
            <input type="text" placeholder="Search..." />
          </div>
          <button className="mobile-cart-btn" onClick={handleCartClick}>
            <MdShoppingCart className="mobile-cart-icon" />
            {cartItemCount > 0 && <span className="mobile-cart-badge">{cartItemCount}</span>}
          </button>
        </div>
      </div>

      {/* Desktop Header Section */}
      <div className="bookings-header desktop-only">
        <button className="back-btn" onClick={handleBack}>
          <MdOutlineChevronRight className="back-icon" />
        </button>
        <h2 className="bookings-title">My Bookings</h2>
        <button className="help-btn" onClick={() => handleMenuItemClick('Help')}>
          <MdHelpOutline className="help-icon" />
          <span>Help</span>
        </button>
      </div>

      {/* Content Section */}
      <div className="bookings-content">
        {/* Active & Upcoming Section */}
        {activeTab === 'active' && (
          <div className="active-section">
            <h3 className="section-subheading">Active & Upcoming</h3>
            <p className="empty-message">You have no upcoming bookings</p>
          </div>
        )}

        {/* History Section */}
        {activeTab === 'history' && (
          <div className="history-section">
            <h3 className="section-subheading">History</h3>
            {bookings.length > 0 ? (
              <div className="bookings-list">
                {bookings.map((booking, index) => (
                  <div 
                    key={index} 
                    className="booking-item"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <div className="booking-details">
                      <h4 className="booking-service">{booking.service}</h4>
                      <p className="booking-status">
                        <span className="status-dot"></span>
                        {booking.status} · {booking.date}
                      </p>
                    </div>
                    <MdOutlineChevronRight className="booking-arrow" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No booking history</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BookingsPage;