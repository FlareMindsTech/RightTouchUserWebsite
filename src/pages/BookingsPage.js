import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineChevronRight,
  MdHelpOutline,
  MdSearch,
  MdShoppingCart
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import BookingDetailPage from './BookingDetailPage';
import { getCustomerBookings, getBookings } from '../services/bookingService';
import './BookingsPage.css';

const BookingsPage = ({ isActive, showToast, onBack, cartItemCount = 0, onNavigate }) => {
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsHistory, setBookingsHistory] = useState([]);
  const [activeBookingsList, setActiveBookingsList] = useState([]);

  const handleMenuItemClick = (item) => {
    showToast(`Opening ${item} `);
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

  const fetchMyBookings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch both current bookings and history in parallel
      const [currentRes, historyRes] = await Promise.all([
        getCustomerBookings(),
        getBookings()
      ]);

      const active = [];
      const history = [];

      // Process current bookings
      if (Array.isArray(currentRes?.result)) {
        currentRes.result.forEach(booking => {
          const statusLower = (booking.status || '').toLowerCase();
          const isActiveStatus = ['pending', 'searching', 'scheduled', 'in progress', 'assigned', 'accepted'].some(s => statusLower.includes(s));
          // If it's explicitly an active status, push to active.
          if (isActiveStatus) {
            active.push(booking);
          }
        });
      }

      // Process history bookings
      if (Array.isArray(historyRes?.result)) {
        historyRes.result.forEach((booking) => {
          const statusLower = (booking.status || '').toLowerCase();
          const isHistoryStatus = ['completed', 'cancelled', 'expired'].some(s => statusLower.includes(s));
          if (isHistoryStatus) {
            history.push(booking);
          }
        });
      }

      setActiveBookingsList(active);
      setBookingsHistory(history);

    } catch (err) {
      console.error(err);
      showToast('Error fetching bookings');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removing showToast from dependencies prevents infinite API loop since showToast is not stable

  useEffect(() => {
    if (isActive) {
      fetchMyBookings();
    }
  }, [isActive, fetchMyBookings]);

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
    <section className={`page ${isActive ? '' : 'hidden'} `} id="page-bookings">
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
        {/* Tab Navigation */}
        <div className="bookings-tabs">
          <button
            className={`tab - btn ${activeTab === 'active' ? 'active' : ''} `}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button
            className={`tab - btn ${activeTab === 'history' ? 'active' : ''} `}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Active & Upcoming Section */}
        {activeTab === 'active' && (
          <div className="active-section">
            <h3 className="section-subheading">Active</h3>
            {isLoading ? (
              <p className="empty-message">Loading active bookings...</p>
            ) : activeBookingsList.length > 0 ? (
              <div className="bookings-list">
                {activeBookingsList.map((booking, index) => (
                  <div
                    key={index}
                    className="booking-item"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <div className="booking-details">
                      <h4 className="booking-service">
                        {booking?.serviceId?.serviceName || booking?.cartId?.items?.[0]?.item?.name || 'Service Booking'}
                      </h4>
                      <p className="booking-status">
                        <span className="status-dot status-active"></span>
                        {booking.status} · {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString() : (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'No date')}
                      </p>
                    </div>
                    <MdOutlineChevronRight className="booking-arrow" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">You have no upcoming bookings</p>
            )}
          </div>
        )}

        {/* History Section */}
        {activeTab === 'history' && (
          <div className="history-section">
            <h3 className="section-subheading">History</h3>
            {isLoading ? (
              <p className="empty-message">Loading booking history...</p>
            ) : bookingsHistory.length > 0 ? (
              <div className="bookings-list">
                {bookingsHistory.map((booking, index) => (
                  <div
                    key={index}
                    className="booking-item"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <div className="booking-details">
                      <h4 className="booking-service">
                        {booking?.serviceId?.serviceName || booking?.cartId?.items?.[0]?.item?.name || 'Service Booking'}
                      </h4>
                      <p className="booking-status">
                        <span className="status-dot"></span>
                        {booking.status} · {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString() : (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'No date')}
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