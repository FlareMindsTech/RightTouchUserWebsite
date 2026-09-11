import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MdArrowBack,
  MdOutlineChevronRight,
  MdSearch,
  MdShoppingCart,
  MdPayment,
  MdCalendarToday,
  MdHistory,
  MdAssignment,
  MdApps,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
  MdArchive,
  MdFlashOn,
  MdStar,
  MdRefresh,
  MdHandyman
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import BookingDetailPage from './BookingDetailPage';
import { getCustomerBookings, getBookings, bookAgain } from '../services/bookingService';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { safeParseDate } from '../utils/browserUtils';
import { goBackSmart } from '../utils/browserUtils';
import ConfirmModal from '../components/ConfirmModal';
import './BookingsPage.css';

const BookingsPage = ({ isActive, showToast, onBack, cartItemCount = 0, currentUser }) => {
  const navigate = useNavigate();
  const { initiatePayment, loading: paymentLoading } = useRazorpayPayment();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsHistory, setBookingsHistory] = useState([]);
  const [activeBookingsList, setActiveBookingsList] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [activeHistoryFilter, setActiveHistoryFilter] = useState('ALL'); // 'ALL', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'HISTORY'
  const [autoOpenRate, setAutoOpenRate] = useState(false);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showRebookConfirm, setShowRebookConfirm] = useState(false);
  const [rebookLoading, setRebookLoading] = useState(false);
  const [bookingToRebook, setBookingToRebook] = useState(null);
  const fetchedRef = useRef(false);

  const handleBack = () => {
    if (selectedBooking) {
      setSelectedBooking(null);
    } else if (onBack) {
      onBack();
    } else {
      goBackSmart(navigate, '/account');
    }
  };

  const handleBookingClick = (booking, openRate = false) => {
    setAutoOpenRate(openRate);
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
      if (activeHistoryFilter === 'COMPLETED') {
        if (status !== 'COMPLETED') return false;
      } else if (activeHistoryFilter === 'HISTORY') {
        if (paymentStatus !== 'PAID') return false;
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

  const handleAction = useCallback((type, data) => {
    if (type === 'Share') {
      const serviceName = data?.serviceId?.serviceName || data?.itemId?.serviceName || data?.cartId?.items?.[0]?.item?.name || 'RightTouch Service';
      const categoryName = data?.serviceId?.categoryId?.category || data?.itemId?.categoryId?.category || '';
      const serviceId = data?.serviceId?._id || (typeof data?.serviceId === 'string' ? data?.serviceId : null);
      const bookingRef = (data?._id || '').slice(-6).toUpperCase();

      const shareUrl = serviceId && categoryName
        ? `${window.location.origin}/product-services?type=${encodeURIComponent(categoryName)}&serviceId=${serviceId}`
        : window.location.origin;

      const sharePayload = {
        title: `RightTouch – ${serviceName}`,
        text: `I booked "${serviceName}" on RightTouch! Check it out 🔧\nBooking Ref: #${bookingRef}`,
        url: shareUrl
      };

      if (navigator.share) {
        navigator.share(sharePayload).catch(err => {
          if (err.name !== 'AbortError') {
            // User cancelled or share failed – silent
            console.log('Share dismissed:', err);
          }
        });
      } else {
        // Fallback: copy to clipboard
        const fullText = `${sharePayload.text}\n${shareUrl}`;
        navigator.clipboard.writeText(fullText)
          .then(() => showToast('Booking link copied to clipboard!'))
          .catch(() => showToast('Could not copy link'));
      }
    } else if (type === 'Rebook') {
      setBookingToRebook(data);
      setShowRebookConfirm(true);
    }
  }, [showToast]);
  
  const handlePayNow = (booking) => {
    const bookingId = booking?._id || booking?.id || booking?.bookingId;
    if (!bookingId) {
      showToast('Booking ID is missing', 'error');
      return;
    }

    initiatePayment({
      bookingId,
      customerUser: currentUser,
      onSuccess: async () => {
        showToast('Payment completed successfully!', 'success');
        await fetchMyBookings();
        setSelectedBooking(null);
      },
      onFailure: (err) => {
        showToast(err.message || 'Payment failed', 'error');
      }
    });
  };

  // If a booking is selected, show the detail page
  if (selectedBooking) {
    const status = (selectedBooking.status || '').toUpperCase();
    const isPaid = (selectedBooking.paymentStatus || '').toUpperCase() === 'PAID';
    const canPay = status !== 'CANCELLED' && status !== 'EXPIRED' && !isPaid;

    return (
      <BookingDetailPage
        booking={selectedBooking}
        onBack={handleBack}
        handleAction={handleAction}
        showToast={showToast}
        currentUser={currentUser}
        isPaidBooking={isPaid}
        canShowPayNow={canPay}
        paymentLoading={paymentLoading}
        handlePayButtonClick={() => {
          if (isPaid) {
            setShowInvoice(true);
          } else {
            handlePayNow(selectedBooking);
          }
        }}
        canRate={status === 'COMPLETED'}
        showInvoice={showInvoice}
        setShowInvoice={setShowInvoice}
        autoOpenRate={autoOpenRate}
        setAutoOpenRate={setAutoOpenRate}
      />
    );
  }

  const renderBookingCard = (booking) => {
    const serviceName =
      booking?.productSnapshot?.productName ||
      booking?.productId?.productName ||
      booking?.productId?.name ||
      booking?.serviceId?.serviceName ||
      booking?.itemId?.serviceName ||
      booking?.cartId?.items?.[0]?.item?.name ||
      booking?.productName ||
      'Product / Service Order';

    const serviceImage =
      booking?.productSnapshot?.imageUrl ||
      booking?.productId?.productImages?.[0] ||
      booking?.serviceId?.serviceImages?.[0] ||
      booking?.itemId?.serviceImages?.[0] ||
      booking?.cartId?.items?.[0]?.item?.serviceImages?.[0] ||
      null;

    const categoryName =
      booking?.productSnapshot?.productType ||
      booking?.productId?.productType ||
      booking?.serviceId?.categoryId?.category ||
      booking?.itemId?.categoryId?.category ||
      (booking?.productId ? 'Product Purchase' : null);

    const status = (booking.status || 'PENDING').toUpperCase();
    const paymentStatus = (booking?.paymentStatus || '').toUpperCase();
    const isPaymentPending = status !== 'CANCELLED' && status !== 'EXPIRED' && paymentStatus !== 'PAID';
    const paymentLabel = paymentStatus === 'PAID' ? 'PAID' : 'UNPAID';
    const isInstant = booking.bookingType === 'instant' || !booking.scheduledAt;
    const dateLabel = booking.scheduledAt
      ? safeParseDate(booking.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : (booking.createdAt ? safeParseDate(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No date');

    const getStatusClass = (s) => {
      if (['COMPLETED', 'ASSIGNED', 'ACCEPTED', 'IN PROGRESS', 'ACCEPTED_BY_TECH', 'ON_THE_WAY', 'REACHED', 'IN_PROGRESS'].includes(s)) return 'status-success';
      if (['CANCELLED', 'EXPIRED'].includes(s)) return 'status-error';
      return 'status-warning';
    };

    return (
      <div
        key={booking._id}
        className="booking-card-premium"
        onClick={() => handleBookingClick(booking, false)}
      >
        {/* Image + Title row */}
        <div className="booking-card-header">
          <div className="booking-icon-wrapper" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px' }}>
            {serviceImage ? (
              <img
                src={serviceImage}
                alt={serviceName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <MdShoppingCart className="booking-card-icon" />
            )}
          </div>
          <div className="booking-title-group">
            {categoryName && <p className="booking-category-tag">{categoryName}</p>}
            <h4 className="booking-service-name">{serviceName}</h4>
            <p className="booking-id-text">#{booking._id?.slice(-6).toUpperCase()}</p>
          </div>
          <div className="booking-badges">
            <div className={`status-badge-vibrant ${getStatusClass(status)}`}>
              {status.replace(/_/g, ' ')}
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
            Payment Pending – Tap to pay
          </div>
        )}

        <div className="booking-card-body">
          <div className="booking-info-row">
            <span className="info-label">{isInstant ? 'Booking Type' : 'Scheduled Date'}</span>
            <span className="info-value">
              {isInstant ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <MdFlashOn style={{ color: '#eab308', fontSize: '15px' }} /> Instant
                </span>
              ) : dateLabel}
            </span>
          </div>
          <div className="booking-info-row">
            <span className="info-label">Total Amount</span>
            <span className="info-value-price">₹{booking.totalPrice || booking.totalAmount || booking.baseAmount || 0}</span>
          </div>

          {booking.technicianId && (
            <div className="booking-tech-preview">
              <div className="tech-avatar-mini">
                {booking.technicianId.profileImage ? (
                  <img src={booking.technicianId.profileImage} alt="Tech" />
                ) : (
                  <div className="avatar-placeholder">{booking.technicianId.userId?.fname?.charAt(0) || 'T'}</div>
                )}
              </div>
              <div className="tech-info-mini">
                <span className="tech-role">Assigned Expert</span>
                <span className="tech-name">{booking.technicianId.userId?.fname} {booking.technicianId.userId?.lname}</span>
              </div>
            </div>
          )}
        </div>

        <div className="booking-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {status === 'COMPLETED' && (
              <button
                className="rate-service-card-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookingClick(booking, true);
                }}
                style={{
                  background: 'var(--green)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MdStar style={{ fontSize: '15px' }} /> Rate Service
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="view-details-text">View Details</span>
            <MdOutlineChevronRight className="arrow-icon-premium" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={`bookings-page-premium ${isActive ? '' : 'hidden'}`}>
      {/* Header Section */}
      <div className="bookings-premium-header">
        <div className="header-top">
          <button className="back-btn-premium" onClick={handleBack} aria-label="Go Back">
            <MdArrowBack className="back-icon-premium" />
          </button>
          <div className="header-title-wrapper">
            <h2 className="page-title-premium">My Bookings</h2>
            <p className="page-subtitle-premium">Track your active services, schedules, and past orders</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Fixed Segmented Tabs */}
      <div className="bookings-tabs-premium-fixed">
        <div className="bookings-segmented-tabs">
          <button
            className={`tab-btn-premium ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <MdCalendarToday className="tab-icon" />
            <span>Active & Upcoming</span>
            {activeBookingsList.length > 0 && (
              <span className="tab-count-badge active">{activeBookingsList.length}</span>
            )}
          </button>
          <button
            className={`tab-btn-premium ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('history'); setVisibleHistoryCount(5); }}
          >
            <MdHistory className="tab-icon" />
            <span>Past Bookings</span>
            {bookingsHistory.length > 0 && (
              <span className="tab-count-badge">{bookingsHistory.length}</span>
            )}
          </button>
          <button
            className="tab-btn-premium"
            onClick={() => navigate('/quotations')}
          >
            <MdAssignment className="tab-icon" />
            <span>Product Quotations</span>
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
                  <div className="empty-icon-wrapper">
                    <div className="empty-badge-circle">
                      <MdCalendarToday />
                    </div>
                  </div>
                  <h3>No Active Bookings</h3>
                  <p>You don't have any in-progress or scheduled service bookings right now. Explore our home services and book in seconds.</p>
                  <button className="book-now-btn" onClick={() => navigate('/#services')}>
                    <MdHandyman style={{ fontSize: '18px' }} /> Explore Services
                  </button>
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
                      onChange={(e) => { setHistorySearchQuery(e.target.value); setVisibleHistoryCount(5); }}
                      className="history-search-input"
                    />
                    {historySearchQuery && (
                      <button 
                        className="search-clear-btn"
                        onClick={() => { setHistorySearchQuery(''); setVisibleHistoryCount(5); }}
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="status-filter-pills-container">
                    <div className="status-filter-pills">
                      {[
                        { id: 'ALL', label: 'All Bookings', icon: MdApps, iconColor: '#0284c7' },
                        { id: 'COMPLETED', label: 'Completed', icon: MdCheckCircle, iconColor: '#16a34a' },
                        { id: 'CANCELLED', label: 'Cancelled', icon: MdCancel, iconColor: '#dc2626' },
                        { id: 'EXPIRED', label: 'Expired', icon: MdAccessTime, iconColor: '#d97706' },
                        { id: 'HISTORY', label: 'History Archive', icon: MdArchive, iconColor: '#7c3aed' }
                      ].map(item => {
                        const IconComp = item.icon;
                        const isPillActive = activeHistoryFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            className={`filter-pill ${isPillActive ? 'active' : ''}`}
                            onClick={() => { setActiveHistoryFilter(item.id); setVisibleHistoryCount(5); }}
                          >
                            <IconComp
                              className="pill-icon"
                              style={{
                                fontSize: '16px',
                                flexShrink: 0,
                                color: isPillActive ? '#ffffff' : item.iconColor
                              }}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {filteredHistory.length > 0 ? (
                  <>
                    {filteredHistory.slice(0, visibleHistoryCount).map(booking => renderBookingCard(booking))}
                    {filteredHistory.length > visibleHistoryCount && (
                      <div style={{ textAlign: 'center', margin: '20px 0 40px' }}>
                        <button 
                          className="book-now-btn" 
                          onClick={() => setVisibleHistoryCount(prev => prev + 5)}
                        >
                          See More Bookings
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state-premium">
                    <div className="empty-icon-wrapper"><MdSearch style={{ fontSize: '28px', color: '#64748b' }} /></div>
                    <h3>No bookings found</h3>
                    <p>Try adjusting your search or filters.</p>
                    {(historySearchQuery || activeHistoryFilter !== 'ALL') && (
                      <button 
                        className="view-details-link" 
                        style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--green)', fontWeight: '700', cursor: 'pointer' }}
                        onClick={() => { setHistorySearchQuery(''); setActiveHistoryFilter('ALL'); setVisibleHistoryCount(5); }}
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

      <ConfirmModal
        isOpen={showRebookConfirm}
        icon={<MdRefresh style={{ fontSize: '24px' }} />}
        iconBg="#e0f2fe"
        iconColor="#0284c7"
        title="Book Service Again?"
        desc={`Are you sure you want to book this service again?`}
        confirmLabel="Book Again"
        cancelLabel="Cancel"
        confirmClass="cm-confirm-success"
        loading={rebookLoading}
        onConfirm={async () => {
          if (!bookingToRebook) return;
          setRebookLoading(true);
          try {
            const payload = {
              previousBookingId: bookingToRebook._id,
              bookingType: 'instant',
              faultProblem: bookingToRebook.faultProblem || '',
              addressId: bookingToRebook.addressId || bookingToRebook.addressSnapShot?._id || bookingToRebook.addressSnapShot?.addressId || ''
            };
            const res = await bookAgain(payload);
            if (res?.success) {
              showToast('Booking created successfully!', 'success');
              setShowRebookConfirm(false);
              setBookingToRebook(null);
              await fetchMyBookings();
              setSelectedBooking(null);
            } else {
              showToast(res?.message || 'Failed to create booking', 'error');
            }
          } catch (err) {
            console.error('Rebook Error:', err);
            showToast(err.message || 'Failed to create booking', 'error');
          } finally {
            setRebookLoading(false);
          }
        }}
        onCancel={() => {
          setShowRebookConfirm(false);
          setBookingToRebook(null);
        }}
      />
    </section>
  );
};

export default BookingsPage;