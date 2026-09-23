import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MdShare, 
  MdOutlineLocationOn, 
  MdAccessTime, 
  MdMessage, 
  MdPayment, 
  MdCall, 
  MdStarOutline,
  MdStar,
  MdVerified,
  MdFlashOn,
  MdCalendarToday,
  MdArrowForwardIos,
  MdCheckCircle,
  MdReceipt,
  MdPerson,
  MdClose
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import './BookingDetailPage.css';
import InvoiceModal from '../components/InvoiceModal';
import { createRating } from '../services/ratingService';

const BookingDetailPage = ({ booking, onBack, handleAction, showToast, isService, isPaidBooking, paymentLoading, canShowPayNow, handlePayButtonClick, canRate, showInvoice, setShowInvoice, currentUser, autoOpenRate, setAutoOpenRate }) => {
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  const [ratingForm, setRatingForm] = useState({ rates: 5, comment: '' });
  const [hoverStar, setHoverStar] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const isAlreadyRated = hasSubmittedRating || Boolean(
    booking?.isRated ||
    booking?.rated ||
    booking?.ratingId ||
    booking?.hasRated ||
    booking?.ratingGiven ||
    booking?.userRating ||
    booking?.review ||
    (typeof booking?.rating === 'number' && booking.rating > 0) ||
    (typeof booking?.rating === 'object' && booking.rating !== null && Object.keys(booking.rating).length > 0) ||
    (Array.isArray(booking?.ratings) && booking.ratings.length > 0)
  );

  useEffect(() => {
    // Only open rating modal if user specifically clicked the "Rate Service" button (autoOpenRate) and hasn't rated yet
    if (autoOpenRate && !isAlreadyRated) {
      setShowRatingModal(true);
    }
    if (setAutoOpenRate) {
      setAutoOpenRate(false);
    }
  }, [autoOpenRate, setAutoOpenRate, isAlreadyRated]);

  const handleSubmitRating = async () => {
    if (!ratingForm.comment.trim()) {
      showToast('Please enter a comment.', 'error');
      return;
    }
    if (!ratingForm.rates || ratingForm.rates < 1) {
      showToast('Please select a star rating.', 'error');
      return;
    }
    setRatingLoading(true);
    try {
      const isServiceBooking = isService !== undefined ? isService : (booking.serviceId || booking.technicianId || booking.scheduledAt || booking.itemId?.serviceName ? true : false);
      const bookingType = isServiceBooking ? "service" : "product";
      
      const bookingId = booking._id || booking.id;
      let serviceId = booking.serviceId?._id || booking.serviceId || booking.itemId?._id || booking.itemId;
      let technicianId = booking.technicianId?._id || booking.technicianId?.userId?._id || booking.technicianId;
      let productId = booking.productId?._id || booking.productId || booking.itemId?._id || booking.itemId;

      if (technicianId && typeof technicianId === 'object') {
        technicianId = technicianId._id || technicianId.userId?._id || technicianId.id;
      }
      if (serviceId && typeof serviceId === 'object') {
        serviceId = serviceId._id || serviceId.id;
      }
      if (productId && typeof productId === 'object') {
        productId = productId._id || productId.id;
      }

      const payload = {
        bookingId,
        bookingType,
        rates: ratingForm.rates,
        comment: ratingForm.comment.trim()
      };

      if (isServiceBooking) {
        if (serviceId) payload.serviceId = serviceId;
        if (technicianId) payload.technicianId = technicianId;
      } else {
        if (productId) payload.productId = productId;
      }

      const response = await createRating(payload);
      
      if (response?.success) {
        showToast('Thank you for your rating!', 'success');
        setHasSubmittedRating(true);
        setShowRatingModal(false);
        setRatingForm({ rates: 5, comment: '' });
      } else {
        showToast(response?.message || 'Failed to submit rating', 'error');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showToast(error?.message || error?.response?.data?.message || 'Failed to submit rating', 'error');
    } finally {
      setRatingLoading(false);
    }
  };

  if (!booking) return null;

  // ─── Derived data ────────────────────────────────────────────────────────────
  const statusUpper = (booking.status || 'PENDING').toUpperCase();
  const paymentStatusUpper = (booking.paymentStatus || 'PENDING').toUpperCase();

  // Service info
  const serviceName =
    booking.serviceId?.serviceName ||
    booking.itemId?.serviceName ||
    booking.serviceName ||
    booking.cartId?.items?.[0]?.item?.name ||
    'Service Booking';

  const serviceImage =
    booking.serviceId?.serviceImages?.[0] ||
    booking.itemId?.serviceImages?.[0] ||
    booking.cartId?.items?.[0]?.item?.serviceImages?.[0] ||
    null;

  const serviceId =
    booking.serviceId?._id ||
    (typeof booking.serviceId === 'string' ? booking.serviceId : null) ||
    booking.itemId?._id ||
    null;

  const categoryName =
    booking.serviceId?.categoryId?.category ||
    booking.itemId?.categoryId?.category ||
    null;

  // Booking type
  const isInstant = booking.bookingType === 'instant' || !booking.scheduledAt;
  const scheduleLabel = isInstant ? 'Instant Service' : new Date(booking.scheduledAt).toLocaleString([], {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Address
  const snap = booking.addressSnapShot;
  const addressFull = snap
    ? [snap.houseNo, snap.landmark, snap.addressLine, snap.city, snap.state, snap.pincode]
        .filter(Boolean)
        .join(', ')
    : (booking.address || 'Address not specified');
  const addressShort = snap?.addressLine || snap?.city || addressFull;

  // Technician
  const techName = booking.technicianId?.userId
    ? `${booking.technicianId.userId.fname || ''} ${booking.technicianId.userId.lname || ''}`.trim()
    : booking.technicianSnapshot?.name || null;
  const techImage = booking.technicianId?.profileImage || null;
  const techSpecialization = booking.technicianId?.specialization || booking.technicianId?.category || null;
  const techRating = booking.technicianId?.rating?.avg || booking.technicianId?.averageRating || 4.8;
  const techExp = booking.technicianId?.experienceYears || booking.technicianId?.experience || 3;
  const techJobs = booking.technicianId?.completedBookings || booking.technicianId?.totalBookings || 50;
  const techMobile = booking.technicianId?.userId?.mobileNumber || booking.technicianSnapshot?.mobile || booking.technicianId?.mobileNumber || null;
  const techBio = booking.technicianId?.about || booking.technicianId?.bio || null;

  // Payment
  const baseAmount = booking.baseAmount || booking.totalAmount || 0;
  const bookingFee = booking.bookingFee || 0;
  const totalAmount = booking.totalPrice || booking.totalAmount || (baseAmount + bookingFee);
  const paymentMethod = booking.paymentMethod || 'Online';

  // Problem
  const faultProblem = booking.faultProblem || booking.note || null;

  const handleRebook = () => {
    if (handleAction) {
      handleAction('rebook', booking);
    }
  };

  const handleGoToService = () => {
    if (serviceId && categoryName) {
      navigate(`/product-services?type=${encodeURIComponent(categoryName)}&serviceId=${serviceId}`);
    } else if (serviceId) {
      navigate(`/product-services?serviceId=${serviceId}`);
    } else {
      navigate('/services');
    }
  };

  // ─── Status Tracker ──────────────────────────────────────────────────────────
  const BookingStatusTracker = ({ status }) => {
    const steps = [
      { label: 'Confirmed', icon: '📋', statuses: ['PENDING', 'SEARCHING', 'PAYMENT_PENDING'] },
      { label: 'Assigned',  icon: '👨‍🔧', statuses: ['ACCEPTED', 'ACCEPTED_BY_TECH', 'ASSIGNED'] },
      { label: 'En Route',  icon: '🚗', statuses: ['ON_THE_WAY', 'REACHED'] },
      { label: 'Working',   icon: '🔧', statuses: ['IN_PROGRESS', 'IN PROGRESS'] },
      { label: 'Done',      icon: '✅', statuses: ['COMPLETED'] },
    ];

    const st = status.toUpperCase();
    const isCancelled = ['CANCELLED', 'EXPIRED'].includes(st);

    const currentIdx = steps.findIndex(s => s.statuses.includes(st));
    const activeIdx = isCancelled ? -1 : (currentIdx !== -1 ? currentIdx : 0);

    return (
      <div className="bdp-tracker">
        <div className="bdp-tracker-header">
          <span className="bdp-tracker-label">BOOKING PROGRESS</span>
          <span className={`bdp-status-chip bdp-status-${
            isCancelled ? 'error' :
            st === 'COMPLETED' ? 'success' :
            ['ACCEPTED','ASSIGNED','ON_THE_WAY','REACHED','IN_PROGRESS','IN PROGRESS'].includes(st) ? 'info' :
            'warning'
          }`}>
            {isCancelled ? (st === 'EXPIRED' ? 'Expired' : 'Cancelled') :
             st === 'COMPLETED' ? 'Completed' :
             st === 'SEARCHING' ? 'Searching...' :
             st === 'PENDING' ? 'Confirmed' :
             st.replace(/_/g, ' ')}
          </span>
        </div>
        {isCancelled ? (
          <div className="bdp-cancelled-banner">
            <span>🚫</span>
            <span>This booking has been {st === 'EXPIRED' ? 'expired' : 'cancelled'}.</span>
          </div>
        ) : (
          <div className="bdp-steps">
            {steps.map((step, idx) => {
              const isCompleted = idx < activeIdx;
              const isActive = idx === activeIdx;
              return (
                <div key={idx} className={`bdp-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="bdp-step-line-before" />
                  <div className="bdp-step-dot">
                    {isCompleted ? <MdCheckCircle className="bdp-check-icon" /> : <span className="bdp-step-icon">{step.icon}</span>}
                  </div>
                  <div className="bdp-step-line-after" />
                  <span className="bdp-step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="bdp-page">
      {/* ── Header ── */}
      <div className="bdp-header">
        <button className="bdp-back-btn" onClick={onBack}>
          <MdArrowForwardIos style={{ transform: 'rotate(180deg)', fontSize: '18px' }} />
        </button>
        <div className="bdp-header-center">
          <h2 className="bdp-title">{serviceName}</h2>
          <span className="bdp-booking-ref">#{(booking._id || '').slice(-8).toUpperCase()}</span>
        </div>
        <button className="bdp-share-btn" onClick={() => handleAction ? handleAction('Share', booking) : null}>
          <MdShare style={{ fontSize: '20px' }} />
        </button>
      </div>

      {/* ── Progress Tracker ── */}
      <BookingStatusTracker status={statusUpper} />

      {/* ── Service Banner (clickable → service page) ── */}
      <div className="bdp-service-banner" onClick={handleGoToService} title="View Service Page">
        <div className="bdp-service-img-wrap">
          {serviceImage ? (
            <img src={serviceImage} alt={serviceName} className="bdp-service-img" />
          ) : (
            <div className="bdp-service-img-placeholder">🔧</div>
          )}
        </div>
        <div className="bdp-service-info">
          <p className="bdp-service-cat">{categoryName || 'Home Service'}</p>
          <h3 className="bdp-service-name">{serviceName}</h3>
          <span className="bdp-view-service-link">
            View Service Details <MdArrowForwardIos style={{ fontSize: '11px' }} />
          </span>
        </div>
      </div>

      {/* ── Technician Profile ── */}
      {techName ? (
        <div className="bdp-section bdp-tech-card">
          <div className="bdp-section-title">
            <MdPerson className="bdp-section-icon" />
            Assigned Technician
          </div>
          <div className="bdp-tech-main">
            <div className="bdp-tech-avatar">
              {techImage ? (
                <img src={techImage} alt={techName} loading="lazy" />
              ) : (
                <div className="bdp-tech-avatar-placeholder">{techName.charAt(0)}</div>
              )}
              <div className="bdp-tech-verified-dot"><MdVerified /></div>
            </div>
            <div className="bdp-tech-details">
              <div className="bdp-tech-name-row">
                <h3 className="bdp-tech-name">{techName}</h3>
                <span className="bdp-verified-tag"><MdVerified />Verified</span>
              </div>
              {techSpecialization && <p className="bdp-tech-spec">{techSpecialization} · RightTouch Expert</p>}
            </div>
          </div>
          <div className="bdp-tech-stats">
            <div className="bdp-tech-stat">
              <span className="bdp-stat-val">★ {typeof techRating === 'number' ? techRating.toFixed(1) : techRating}</span>
              <span className="bdp-stat-label">Rating</span>
            </div>
            <div className="bdp-tech-stat">
              <span className="bdp-stat-val">{techJobs > 0 ? techJobs + '+' : '50+'}</span>
              <span className="bdp-stat-label">Jobs</span>
            </div>
            <div className="bdp-tech-stat">
              <span className="bdp-stat-val">{techExp} Yrs</span>
              <span className="bdp-stat-label">Experience</span>
            </div>
            <div className="bdp-tech-stat">
              <span className="bdp-stat-val" style={{ color: '#22c55e' }}>✓ ID</span>
              <span className="bdp-stat-label">Identity</span>
            </div>
          </div>
          {techBio && (
            <div className="bdp-tech-bio">
              <p>{techBio}</p>
            </div>
          )}
          {techMobile && (
            <button className="bdp-call-tech-btn" onClick={() => {
              navigator.clipboard.writeText(techMobile).catch(() => {});
              showToast('Number copied!');
              setTimeout(() => { window.location.href = `tel:${techMobile}`; }, 400);
            }}>
              <MdCall /> Call Technician
            </button>
          )}
        </div>
      ) : (
        <div className="bdp-section bdp-tech-waiting">
          <div className="bdp-section-title">
            <MdPerson className="bdp-section-icon" />
            Assigning Technician
          </div>
          <div className="bdp-searching-anim">
            <div className="bdp-pulse-dot" />
            <p>Searching for the best expert near you…</p>
          </div>
        </div>
      )}

      {/* ── Service Details ── */}
      <div className="bdp-section">
        <div className="bdp-section-title">
          <MdReceipt className="bdp-section-icon" />
          Service Details
        </div>

        {/* Schedule */}
        <div className="bdp-detail-row">
          <div className="bdp-detail-icon bdp-icon-schedule">
            {isInstant ? <MdFlashOn /> : <MdCalendarToday />}
          </div>
          <div className="bdp-detail-body">
            <span className="bdp-detail-label">{isInstant ? 'Booking Type' : 'Scheduled For'}</span>
            <span className="bdp-detail-val">
              {isInstant ? (
                <span className="bdp-instant-badge">⚡ Instant Service</span>
              ) : scheduleLabel}
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="bdp-detail-row">
          <div className="bdp-detail-icon bdp-icon-location">
            <MdOutlineLocationOn />
          </div>
          <div className="bdp-detail-body">
            <span className="bdp-detail-label">Service Address</span>
            <span className="bdp-detail-val">{addressShort}</span>
            {snap && addressFull !== addressShort && (
              <span className="bdp-detail-sub">{addressFull}</span>
            )}
          </div>
        </div>

        {/* Problem */}
        {faultProblem && (
          <div className="bdp-detail-row">
            <div className="bdp-detail-icon bdp-icon-msg">
              <MdMessage />
            </div>
            <div className="bdp-detail-body">
              <span className="bdp-detail-label">Customer Note</span>
              <span className="bdp-detail-val">{faultProblem}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Work Photos (if available) ── */}
      {booking.workImages && (booking.workImages.beforeImage || booking.workImages.afterImage) && (
        <div className="bdp-section">
          <div className="bdp-section-title">
            <span style={{ fontSize: '16px' }}>📸</span>
            Work Photos
          </div>
          <div className="bdp-work-photos">
            {booking.workImages.beforeImage && (
              <div className="bdp-work-photo" onClick={() => window.open(booking.workImages.beforeImage, '_blank')}>
                <img src={booking.workImages.beforeImage} alt="Before" loading="lazy" />
                <span className="bdp-photo-label">Before</span>
              </div>
            )}
            {booking.workImages.afterImage && (
              <div className="bdp-work-photo" onClick={() => window.open(booking.workImages.afterImage, '_blank')}>
                <img src={booking.workImages.afterImage} alt="After" loading="lazy" />
                <span className="bdp-photo-label">After</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payment Summary ── */}
      <div className="bdp-section bdp-payment-section">
        <div className="bdp-section-title">
          <MdPayment className="bdp-section-icon" />
          Payment Summary
        </div>
        <div className="bdp-payment-rows">
          <div className="bdp-pay-row">
            <span>Service Charges</span>
            <span>₹{baseAmount}</span>
          </div>
          <div className="bdp-pay-row">
            <span>Platform & Booking Fee</span>
            <span>₹{bookingFee}</span>
          </div>
          <div className="bdp-pay-divider" />
          <div className="bdp-pay-row bdp-pay-total">
            <span>Total Amount</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>
        <div className={`bdp-payment-status-tag ${paymentStatusUpper === 'PAID' ? 'paid' : 'unpaid'}`}>
          <MdPayment />
          {paymentStatusUpper === 'PAID'
            ? `Paid via ${paymentMethod}`
            : 'Payment Pending'}
        </div>
      </div>

      {/* ── Action Footer ── */}
      <div className="bdp-action-footer">
        <div className="bdp-action-row">
          <button
            className="bdp-btn bdp-btn-secondary"
            onClick={() => {
              if (techMobile) {
                navigator.clipboard.writeText(techMobile).catch(() => {});
                showToast('Number copied!');
                setTimeout(() => { window.location.href = `tel:${techMobile}`; }, 400);
              } else {
                showToast('Technician not yet assigned');
              }
            }}
          >
            <MdCall /> Call
          </button>
          <button
            className={`bdp-btn bdp-btn-primary ${!canShowPayNow && !isPaidBooking ? 'disabled' : ''}`}
            onClick={handlePayButtonClick}
            disabled={paymentLoading || (!canShowPayNow && !isPaidBooking)}
          >
            <MdPayment />
            {paymentLoading ? 'Loading…' : isPaidBooking ? 'Invoice' : 'Pay Now'}
          </button>
        </div>
        {statusUpper === 'COMPLETED' && (
          isAlreadyRated ? (
            <div 
              className="bdp-btn bdp-btn-rated" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '12px',
                padding: '12px 18px',
                fontWeight: '700',
                fontSize: '13.5px'
              }}
            >
              <MdCheckCircle style={{ fontSize: '18px' }} /> Service Rated
            </div>
          ) : (
            <button
              className="bdp-btn bdp-btn-rate"
              onClick={() => setShowRatingModal(true)}
            >
              ⭐ Rate This Service
            </button>
          )
        )}
        <button className="bdp-btn bdp-btn-rebook" onClick={handleRebook}>
          🔄 Book Again
        </button>
      </div>

      {/* ── Simple Rating Modal Portal ── */}
      {showRatingModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="rating-modal-overlay-v2" 
          onClick={() => !ratingLoading && setShowRatingModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="rating-modal-v2 simple-rating-card" onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              className="rm-close-btn" 
              onClick={() => !ratingLoading && setShowRatingModal(false)}
              aria-label="Close rating modal"
            >
              <MdClose />
            </button>

            <div className="rm-header simple">
              <h3>How was your experience?</h3>
              <p className="rm-service-name">
                {serviceName} {techName ? `• ${techName}` : ''}
              </p>
            </div>

            <div className="rm-stars-section">
              <div className="rm-stars">
                {[1, 2, 3, 4, 5].map(star => {
                  const effectiveStar = hoverStar || ratingForm.rates;
                  const isActive = effectiveStar >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      className={`rm-star-btn ${isActive ? 'active' : ''}`}
                      onMouseEnter={() => setHoverStar(star)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRatingForm(prev => ({ ...prev, rates: star }))}
                      aria-label={`${star} star`}
                    >
                      {isActive ? <MdStar /> : <MdStarOutline />}
                    </button>
                  );
                })}
              </div>
              <div className="rm-score-caption">
                {(hoverStar || ratingForm.rates) === 5 && 'Excellent'}
                {(hoverStar || ratingForm.rates) === 4 && 'Good'}
                {(hoverStar || ratingForm.rates) === 3 && 'Average'}
                {(hoverStar || ratingForm.rates) === 2 && 'Fair'}
                {(hoverStar || ratingForm.rates) === 1 && 'Poor'}
              </div>
            </div>

            <div className="rm-input-wrapper simple">
              <textarea
                className="rm-textarea"
                value={ratingForm.comment}
                onChange={e => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Write a review (optional)..."
                rows={3}
              />
            </div>

            <div className="rm-actions">
              <button 
                type="button" 
                className="rm-cancel-btn" 
                onClick={() => setShowRatingModal(false)} 
                disabled={ratingLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="rm-submit-btn" 
                onClick={handleSubmitRating} 
                disabled={ratingLoading}
              >
                {ratingLoading ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showInvoice && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          booking={booking}
          details={{ 
            id: (booking._id || '').slice(-8).toUpperCase(),
            serviceName, 
            status: statusUpper,
            location: addressShort,
            dateTime: scheduleLabel,
            professional: techName,
            professionalImage: techImage,
            amount: `₹${baseAmount}`,
            bookingFee: `₹${bookingFee}`,
            total: `₹${totalAmount}`,
            paymentMethod
          }}
          paymentStatusUpper={paymentStatusUpper}
        />
      )}
    </section>
  );
};

export default BookingDetailPage;