import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MdOutlineChevronRight,
  MdSearch,
  MdShoppingCart,
  MdPayment
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import BookingDetailPage from './BookingDetailPage';
import { getCustomerBookings, getBookings } from '../services/bookingService';
import { safeParseDate } from '../utils/browserUtils';
import './BookingsPage.css';

const BookingsPage = ({ isActive, showToast, onBack, cartItemCount = 0, currentUser }) => {
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsHistory, setBookingsHistory] = useState([]);
  const [activeBookingsList, setActiveBookingsList] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [activeHistoryFilter, setActiveHistoryFilter] = useState('ALL'); // 'ALL', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'PAID', 'UNPAID'
  const fetchedRef = useRef(false);

  const handleBack = () => {
    if (selectedBooking) {
      setSelectedBooking(null);
    } else if (onBack) {
      onBack();
    } else {
      navigate('/account');
    }
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
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

      // Unified status check logic
      const processBookings = (res, targetArray, isHistory) => {
        if (Array.isArray(res?.result)) {
          res.result.forEach(booking => {
            const statusUpper = (booking.status || '').toUpperCase();
            const isHistoryStatus = ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(statusUpper);

            if (isHistory && isHistoryStatus) {
              targetArray.push(booking);
            } else if (!isHistory && !isHistoryStatus) {
              active.push(booking);
            }
          });
        }
      };

      processBookings(currentRes, active, false);
      processBookings(historyRes, history, true);

      // Filter out duplicates if any overlap
      const seenIds = new Set();
      const filteredActive = active.filter(b => {
        if (seenIds.has(b._id)) return false;
        seenIds.add(b._id);
        return true;
      });

      const getBookingTimestamp = (booking) => {
        const dt = booking?.updatedAt || booking?.scheduledAt || booking?.createdAt;
        const ts = dt ? safeParseDate(dt).getTime() : 0;
        return Number.isNaN(ts) ? 0 : ts;
      };

      filteredActive.sort((a, b) => getBookingTimestamp(b) - getBookingTimestamp(a));
      history.sort((a, b) => getBookingTimestamp(b) - getBookingTimestamp(a));

      setActiveBookingsList(filteredActive);
      setBookingsHistory(history);

    } catch (err) {
      console.error(err);
      showToast('Error fetching bookings');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isActive && !fetchedRef.current) {
      fetchMyBookings();
      fetchedRef.current = true;
    }
    // Deep reset if inactive for a while? No, keep it for now.
    if (!isActive) {
      fetchedRef.current = false; // Allow refetch on reactivation
    }
  }, [isActive, fetchMyBookings]);

  // Derived filtered history
  const filteredHistory = bookingsHistory.filter(booking => {
    const status = (booking.status || 'PENDING').toUpperCase();
    const paymentStatus = (booking?.paymentStatus || '').toUpperCase();

    // Consolidated Filter Logic
    if (activeHistoryFilter !== 'ALL') {
      if (['PAID', 'UNPAID'].includes(activeHistoryFilter)) {
        if (paymentStatus !== activeHistoryFilter) return false;
      } else {
        if (status !== activeHistoryFilter) return false;
      }
    }

    // 3. Search Query
    if (historySearchQuery.trim()) {
      const query = historySearchQuery.toLowerCase();
      const serviceName = (booking?.serviceId?.serviceName || booking?.cartId?.items?.[0]?.item?.name || '').toLowerCase();
      const bookingId = (booking._id || '').toLowerCase();
      return serviceName.includes(query) || bookingId.includes(query);
    }

    return true;
  });

  // If a booking is selected, show the detail page
  if (selectedBooking) {
    return (
      <BookingDetailPage
        booking={selectedBooking}
        onBack={handleBack}
        showToast={showToast}
        currentUser={currentUser}
      />
    );
  }

  const renderBookingCard = (booking) => {
    const serviceName = booking?.serviceId?.serviceName || booking?.cartId?.items?.[0]?.item?.name || 'Service Booking';
    const status = (booking.status || 'PENDING').toUpperCase();
    const paymentStatus = (booking?.paymentStatus || '').toUpperCase();
    const isPaymentPending = status === 'COMPLETED' && paymentStatus !== 'PAID';
    const paymentLabel = paymentStatus === 'PAID' ? 'PAID' : 'UNPAID';
    const date = booking.scheduledAt ? safeParseDate(booking.scheduledAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : (booking.createdAt ? safeParseDate(booking.createdAt).toLocaleDateString() : 'No date');

    const getStatusClass = (status) => {
      if (['COMPLETED', 'ASSIGNED', 'ACCEPTED', 'IN PROGRESS'].includes(status)) return 'status-success';
      if (['CANCELLED', 'EXPIRED'].includes(status)) return 'status-error';
      return 'status-warning';
    };

    return (
      <div
        key={booking._id}
        className="booking-card-premium"
        onClick={() => handleBookingClick(booking)}
      >
        <div className="booking-card-header">
          <div className="booking-icon-wrapper">
            <MdShoppingCart className="booking-card-icon" />
          </div>
          <div className="booking-title-group">
            <h4 className="booking-service-name">{serviceName}</h4>
            <p className="booking-id-text">ID: #{booking._id?.slice(-6).toUpperCase()}</p>
          </div>
          <div className="booking-badges">
            <div className={`status-badge-vibrant ${getStatusClass(status)}`}>
              {status}
            </div>
            {status !== 'EXPIRED' && status !== 'CANCELLED' && (
              <div className={`payment-status-badge ${paymentStatus === 'PAID' ? 'paid' : 'unpaid'}`}>
                {paymentLabel}
              </div>
            )}
          </div>
        </div>

        {isPaymentPending && (
          <div className="payment-pending-banner">
            <MdPayment style={{ marginRight: '6px', flexShrink: 0 }} />
            Payment Pending - Tap to pay
          </div>
        )}

        <div className="booking-card-body">
          <div className="booking-info-row">
            <span className="info-label">Scheduled Date</span>
            <span className="info-value">{date}</span>
          </div>
          <div className="booking-info-row">
            <span className="info-label">Total Amount</span>
            <span className="info-value-price">₹{booking.totalPrice || booking.baseAmount || 0}</span>
          </div>
        </div>

        <div className="booking-card-footer">
          <span className="view-details-text">View Details</span>
          <MdOutlineChevronRight className="arrow-icon-premium" />
        </div>
      </div>
    );
  };

  return (
    <section className={`bookings-page-premium ${isActive ? '' : 'hidden'}`}>
      {/* Header Section - Desktop Only */}
      <div className="bookings-premium-header desktop-only">
        <div className="header-top">
          <button className="back-btn-premium" onClick={handleBack}>
            <MdOutlineChevronRight className="back-icon-premium" />
          </button>
          <h2 className="page-title-premium">My Bookings</h2>
        </div>
      </div>

      {/* Tab Navigation - Visible on all screens */}
      <div className="bookings-tabs-premium-fixed">
        <div className="bookings-tabs-premium">
          <button
            className={`tab-btn-premium ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active & Upcoming
          </button>
          <button
            className={`tab-btn-premium ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Past Bookings
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bookings-container-premium">
        {isLoading ? (
          <div className="loading-state-premium">
            <div className="shimmer-card"></div>
            <div className="shimmer-card"></div>
          </div>
        ) : (
          <div className="bookings-list-premium">
            {activeTab === 'active' ? (
              activeBookingsList.length > 0 ? (
                activeBookingsList.map(booking => renderBookingCard(booking))
              ) : (
                <div className="empty-state-premium">
                  <div className="empty-icon-wrapper">📅</div>
                  <h3>No active bookings</h3>
                  <p>You haven't booked any services yet.</p>
                  <button className="book-now-btn" onClick={() => navigate('/')}>Book Now</button>
                </div>
              )
            ) : (
              <>
                <div className="history-filters-premium">
                  <div className="history-search-wrapper">
                    <MdSearch className="search-icon-dim" />
                    <input
                      type="text"
                      placeholder="Search by service or ID..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="history-search-input"
                    />
                  </div>
                  <div className="status-filter-pills-container">
                    <div className="status-filter-pills">
                      {['ALL', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'PAID', 'UNPAID'].map(filter => (
                        <button
                          key={filter}
                          className={`filter-pill ${activeHistoryFilter === filter ? 'active' : ''}`}
                          onClick={() => setActiveHistoryFilter(filter)}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredHistory.length > 0 ? (
                  filteredHistory.map(booking => renderBookingCard(booking))
                ) : (
                  <div className="empty-state-premium">
                    <div className="empty-icon-wrapper">⌛</div>
                    <h3>No bookings found</h3>
                    <p>Try adjusting your search or filters.</p>
                    {(historySearchQuery || activeHistoryFilter !== 'ALL') && (
                      <button 
                        className="view-details-link" 
                        style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--green)', fontWeight: '700', cursor: 'pointer' }}
                        onClick={() => { setHistorySearchQuery(''); setActiveHistoryFilter('ALL'); }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BookingsPage;