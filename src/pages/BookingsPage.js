import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MdOutlineChevronRight,
  MdSearch,
  MdShoppingCart,
  MdPayment,
  MdCalendarToday,
  MdHistory
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import BookingDetailPage from './BookingDetailPage';
import { getCustomerBookings, getBookings, bookAgain } from '../services/bookingService';
import { createPaymentOrder, verifyPayment, loadRazorpayScript } from '../services/paymentService';
import { safeParseDate } from '../utils/browserUtils';
import { goBackSmart } from '../utils/browserUtils';
import { resolveRazorpayKey } from '../utils/razorpay';
import ConfirmModal from '../components/ConfirmModal';
import './BookingsPage.css';

const BookingsPage = ({ isActive, showToast, onBack, cartItemCount = 0, currentUser }) => {
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsHistory, setBookingsHistory] = useState([]);
  const [activeBookingsList, setActiveBookingsList] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [activeHistoryFilter, setActiveHistoryFilter] = useState('ALL'); // 'ALL', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'HISTORY'
  const [autoOpenRate, setAutoOpenRate] = useState(false);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5);
  const [paymentLoading, setPaymentLoading] = useState(false);
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
  
  const handlePayNow = async (booking) => {
    if (paymentLoading) return;
    setPaymentLoading(true);
    try {
      if (!window.Razorpay) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay SDK');
        }
      }
      const bookingId = booking._id;
      
      // 1. Create Razorpay Order
      const orderRes = await createPaymentOrder({ bookingId });
      console.log('[Razorpay] Order Creation Response:', orderRes);

      if (!orderRes?.success || !orderRes.result) {
        throw new Error(orderRes?.message || 'Failed to create payment order from server');
      }

      // Destructure with fallbacks
      const { 
        amount: rawAmount, 
        orderId, 
        keyId, 
        key, 
        currency = 'INR' 
      } = orderRes.result;

      // ✅ .env key is the primary source (switch it to switch test/live).
      // If it mismatches the key the order was created with, the server key
      // wins with a loud console error (see utils/razorpay.js).
      const finalKey = resolveRazorpayKey({
        envKey: process.env.REACT_APP_RAZORPAY_KEY_ID,
        serverKey: keyId || key,
      });
      const finalOrderId = (orderId || "").trim();
      const finalCurrency = String(currency).toUpperCase();

      console.log("Frontend Key (Bookings):", finalKey);
      console.log("Order ID (Bookings):", finalOrderId);

      if (!finalKey) throw new Error('Razorpay Key ID is missing');
      if (!finalOrderId) throw new Error('Razorpay Order ID is missing');
      if (!rawAmount) throw new Error('Payment amount is missing');

      // 2. Server always returns the amount in PAISE (Razorpay Checkout SDK
      // expects paise). Never multiply — a heuristic mismatch would send a
      // 100x amount to checkout and Razorpay rejects the order (400).
      const amountInPaise = Math.round(Number(rawAmount));

      if (amountInPaise < 100) {
        throw new Error('Minimum payment amount is ₹1.00 (100 paise)');
      }

      // Clean phone number
      const cleanPhone = (currentUser?.phone || currentUser?.mobile || "").replace(/\D/g, "");

      // 3. Open Razorpay Checkout
      const options = {
        key: finalKey,
        amount: amountInPaise,
        currency: finalCurrency,
        name: "RightTouch",
        description: `Payment for Booking #${bookingId?.slice(-6).toUpperCase()}`,
        order_id: finalOrderId,
        prefill: {
          name: (currentUser?.name || currentUser?.fname || "Customer").trim(),
          email: (currentUser?.email || "").trim(),
          contact: cleanPhone.length >= 10 ? cleanPhone : ""
        },
        theme: {
          color: "#22c55e"
        },
        handler: async function (response) {
          try {
            console.log('[Razorpay Success] Response:', response);
            // 4. Verify Payment
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingId
            });

            if (verifyRes?.success) {
              showToast('Payment Successful!', 'success');
              await fetchMyBookings();
              setSelectedBooking(null);
            } else {
              showToast(verifyRes?.message || 'Payment verification failed', 'error');
            }
          } catch (error) {
            console.error('[Razorpay Verify Error]:', error);
            showToast('Error verifying payment', 'error');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('[Razorpay] Checkout dismissed by user');
            setPaymentLoading(false);
          }
        }
      };

      console.log('[Razorpay Options] Final Payload:', { ...options, key: finalKey.substring(0, 8) + '***' });
      
      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
                console.error('[Razorpay Payment Failed]:', response.error);
                showToast(response.error.description || 'Payment failed', 'error');
        });
        rzp.open();
      } catch (e) {
        console.error('[Razorpay Init Error]:', e);
        showToast('Failed to open payment gateway. Check console.', 'error');
        setPaymentLoading(false);
      }

    } catch (error) {
      console.error('[Payment Flow Error]:', error);
      showToast(error.message || 'Payment initialization failed', 'error');
      setPaymentLoading(false);
    }

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
      booking?.serviceId?.serviceName ||
      booking?.itemId?.serviceName ||
      booking?.cartId?.items?.[0]?.item?.name ||
      'Service Booking';

    const serviceImage =
      booking?.serviceId?.serviceImages?.[0] ||
      booking?.itemId?.serviceImages?.[0] ||
      booking?.cartId?.items?.[0]?.item?.serviceImages?.[0] ||
      null;

    const categoryName =
      booking?.serviceId?.categoryId?.category ||
      booking?.itemId?.categoryId?.category ||
      null;

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
            <span className="info-value">{isInstant ? '⚡ Instant' : dateLabel}</span>
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
                }}
              >
                ⭐ Rate Service
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
            <MdCalendarToday style={{ marginBottom: '-2px', marginRight: '6px' }} />
            Active & Upcoming
          </button>
          <button
            className={`tab-btn-premium ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('history'); setVisibleHistoryCount(5); }}
          >
            <MdHistory style={{ marginBottom: '-2px', marginRight: '6px' }} />
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
                      onChange={(e) => { setHistorySearchQuery(e.target.value); setVisibleHistoryCount(5); }}
                      className="history-search-input"
                    />
                  </div>
                  <div className="status-filter-pills-container">
                    <div className="status-filter-pills">
                      {['ALL', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'HISTORY'].map(filter => (
                        <button
                          key={filter}
                          className={`filter-pill ${activeHistoryFilter === filter ? 'active' : ''}`}
                          onClick={() => { setActiveHistoryFilter(filter); setVisibleHistoryCount(5); }}
                        >
                          {filter}
                        </button>
                      ))}
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
                    <div className="empty-icon-wrapper">⌛</div>
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
        icon="🔄"
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