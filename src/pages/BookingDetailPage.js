import React, { useState } from 'react';
import { 
  MdOutlineChevronRight, 
  MdShare, 
  MdOutlineLocationOn, 
  MdAccessTime, 
  MdMessage, 
  MdPayment, 
  MdCall, 
  MdStarOutline,
  MdStar,
  MdVerified
} from 'react-icons/md';
import './BookingDetailPage.css';
import InvoiceModal from '../components/InvoiceModal';
import { createRating } from '../services/ratingService';

import { useEffect } from 'react';

const BookingDetailPage = ({ booking, onBack, handleAction, showToast, isService, isPaidBooking, paymentLoading, canShowPayNow, handlePayButtonClick, canRate, showInvoice, setShowInvoice, currentUser, autoOpenRate, setAutoOpenRate }) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({ rates: 5, comment: '' });
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    if (canRate || autoOpenRate) {
      setShowRatingModal(true);
      if (setAutoOpenRate) setAutoOpenRate(false);
    }
  }, [canRate, autoOpenRate, setAutoOpenRate]);

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
      
      // Extract IDs properly - backend expects ObjectIds
      const bookingId = booking._id || booking.id;
      let serviceId = booking.serviceId?._id || booking.serviceId || booking.itemId?._id || booking.itemId;
      let technicianId = booking.technicianId?._id || booking.technicianId?.userId?._id || booking.technicianId;
      let productId = booking.productId?._id || booking.productId || booking.itemId?._id || booking.itemId;

      // If technicianId is an object, extract the ID
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

      console.log('[Rating] Submitting payload:', payload);
      const response = await createRating(payload);
      console.log('[Rating] Response:', response);
      
      if (response?.success) {
        showToast('Thank you for your rating!', 'success');
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

  const details = {
    id: booking.bookingId || booking._id?.slice(-8).toUpperCase() || 'N/A',
    serviceName: booking.itemId?.serviceName || booking.serviceName || 'Service Details',
    status: booking.status || 'PENDING',
    location: booking.addressSnapShot?.addressLine || booking.address || 'Location not specified',
    dateTime: booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Flexible',
    professional: booking.technicianId?.userId ? `${booking.technicianId.userId.fname || ''} ${booking.technicianId.userId.lname || ''}`.trim() : (booking.technicianSnapshot?.name || null),
    professionalImage: booking.technicianId?.profileImage || null,
    specialization: booking.technicianId?.specialization || booking.technicianId?.category || null,
    rating: booking.technicianId?.rating?.avg || booking.technicianId?.averageRating || null,
    experience: booking.technicianId?.experienceYears || booking.technicianId?.experience || null,
    reviews: booking.technicianId?.totalReviews || booking.technicianId?.rating?.count || 0,
    amount: `₹${booking.baseAmount || booking.totalAmount || 0}`,
    bookingFee: `₹${booking.bookingFee || 0}`,
    total: `₹${(booking.totalAmount || booking.baseAmount || 0) + (booking.bookingFee || 0)}`,
    paymentMethod: booking.paymentMethod || 'Online',
    professionalMobile: booking.technicianId?.userId?.mobileNumber || booking.technicianSnapshot?.mobile || booking.technicianId?.mobileNumber || null,
    addressDetails: booking.addressSnapShot ? `${booking.addressSnapShot.houseNo ? booking.addressSnapShot.houseNo + ', ' : ''}${booking.addressSnapShot.landmark ? booking.addressSnapShot.landmark + ', ' : ''}${booking.addressSnapShot.city || ''} ${booking.addressSnapShot.pincode || ''}`.trim() : null,
    bio: booking.technicianId?.about || booking.technicianId?.bio || null,
    completedJobs: booking.technicianId?.completedBookings || booking.technicianId?.totalBookings || 0
  };

  const paymentStatusUpper = (booking.paymentStatus || 'PENDING').toUpperCase();

  const BookingStatusTracker = ({ status }) => {
    const steps = [
      { label: 'Confirmed', statuses: ['PENDING', 'SEARCHING'] },
      { label: 'Arriving', statuses: ['ACCEPTED', 'ACCEPTED_BY_TECH', 'ON_THE_WAY', 'REACHED'] },
      { label: 'Working', statuses: ['IN_PROGRESS'] },
      { label: 'Completed', statuses: ['COMPLETED'] }
    ];

    const currentIdx = steps.findIndex(s => s.statuses.includes(status.toUpperCase()));
    const finalIdx = status.toUpperCase() === 'COMPLETED' ? 3 : (currentIdx !== -1 ? currentIdx : 0);

    return (
      <div className="booking-tracker-container">
        <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', fontWeight: '800', color: '#94a3b8' }}>BOOKING PROGRESS</h4>
        <div className="status-timeline">
          {steps.map((step, idx) => (
            <div key={idx} className={`timeline-point ${idx === finalIdx ? 'active' : ''} ${idx < finalIdx ? 'completed' : ''}`}>
              <div className="point-dot"></div>
              <span className="point-label">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleRebook = () => {
    if (handleAction) handleAction('Rebook', booking);
  };

  return (
    <section className="booking-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <MdOutlineChevronRight className="back-icon" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 className="detail-title">{details.serviceName}</h2>
        <button className="share-btn" onClick={() => handleAction ? handleAction('Share', booking) : null}>
          <MdShare className="share-icon" />
        </button>
      </div>

      {/* Progress Tracker */}
      <BookingStatusTracker status={details.status} />

      {/* Professional Info - Only show if assigned */}
      {details.professional ? (
        <div className="pro-profile-card-v2">
          {/* ... existing header ... */}
          <div className="pro-header-main">
            <div className="pro-avatar-v2">
              {details.professionalImage ? (
                <img src={details.professionalImage} alt={details.professional} loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#22c55e', color: 'white', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: '800' }}>
                  {details.professional.charAt(0)}
                </div>
              )}
            </div>
            <div className="pro-details-main">
              <div className="pro-name-row">
                <h3>{details.professional}</h3>
                <div className="verified-badge-v2">
                  <MdVerified className="verified-icon" />
                  <span>Verified</span>
                </div>
              </div>
              {details.specialization && <p className="pro-tagline">{details.specialization} • RightTouch Expert</p>}
            </div>
          </div>

          <div className="pro-stats-v2">
            <div className="stat-v2">
              <span className="label">Rating</span>
              <span className="value">★ {details.rating || '4.8'}</span>
            </div>
            <div className="stat-v2">
              <span className="label">Jobs</span>
              <span className="value">{details.completedJobs > 0 ? details.completedJobs + '+' : '50+'}</span>
            </div>
            <div className="stat-v2">
              <span className="label">Exp</span>
              <span className="value">{details.experience || '3'} Yrs</span>
            </div>
            <div className="stat-v2">
              <span className="label">Identity</span>
              <span className="value" style={{ color: '#22c55e' }}>Pass</span>
            </div>
          </div>

          {(details.bio || true) && (
            <div className="pro-bio-section">
              <h4 className="bio-title">About Expert</h4>
              <p className="bio-text">
                {details.bio || `${details.professional} is a highly skilled expert in ${details.specialization || 'home services'} with a proven track record of customer satisfaction and quality workmanship.`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="pro-profile-card-v2 waiting-state">
           <div className="info-content-v2">
              <span className="info-label" style={{ display: 'block', marginBottom: '8px' }}>Assigning Professional</span>
              <span className="info-value" style={{ color: '#22c55e', fontSize: '16px' }}>Searching for the best expert for you...</span>
            </div>
        </div>
      )}

      {/* Work Evidence Images */}
      {booking.workImages && (booking.workImages.beforeImage || booking.workImages.afterImage) && (
        <div className="info-card">
          <h4>Work Photos</h4>
          <div className="work-image-grid-v2">
            {booking.workImages.beforeImage && (
              <div className="work-image-v2">
                <span className="label">Before</span>
                <img src={booking.workImages.beforeImage} alt="Before" onClick={() => window.open(booking.workImages.beforeImage, '_blank')} />
              </div>
            )}
            {booking.workImages.afterImage && (
              <div className="work-image-v2">
                <span className="label">After</span>
                <img src={booking.workImages.afterImage} alt="After" onClick={() => window.open(booking.workImages.afterImage, '_blank')} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="info-section-grid">
        <div className="info-card">
          <h4>Service Details</h4>
          <div className="info-item-v2">
            <div className="info-icon-v2"><MdOutlineLocationOn /></div>
            <div className="info-content-v2">
              <span className="info-label">Address</span>
              <span className="info-value">{details.location}</span>
              {details.addressDetails && details.location === 'Pinned Location' && (
                <span className="info-sub-value" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {details.addressDetails}
                </span>
              )}
            </div>
          </div>
          <div className="info-item-v2">
            <div className="info-icon-v2"><MdAccessTime /></div>
            <div className="info-content-v2">
              <span className="info-label">Scheduled For</span>
              <span className="info-value">{details.dateTime}</span>
            </div>
          </div>
        </div>

        {booking.faultProblem && (
          <div className="info-card">
            <h4>Problem Reported</h4>
            <div className="info-item-v2">
              <div className="info-icon-v2"><MdMessage /></div>
              <div className="info-content-v2">
                <span className="info-label">Customer Note</span>
                <span className="info-value">{booking.faultProblem}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="payment-card-v2">
        <h4 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '800', marginBottom: '20px' }}>PAYMENT SUMMARY</h4>
        <div className="payment-row-v2">
          <span>Service Charges</span>
          <span>{details.amount}</span>
        </div>
        <div className="payment-row-v2">
          <span>Platform & Booking Fee</span>
          <span>{details.bookingFee}</span>
        </div>
        <div className="payment-row-v2 total">
          <span>Final Total</span>
          <span>{details.total}</span>
        </div>
        
        <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdPayment />
          {paymentStatusUpper === 'PAID' ? `Paid securely via ${details.paymentMethod}` : 'Payment yet to be initiated'}
        </div>
      </div>

      {/* Work Images Section */}
      {booking.images && booking.images.length > 0 && (
        <div className="info-card" style={{ margin: '12px' }}>
          <h4>Work Images</h4>
          <div className="image-grid-v2">
            {booking.images.map((img, idx) => (
              <div key={idx} className="image-item-v2">
                <img 
                  src={img} 
                  alt={`Work ${idx + 1}`} 
                  onClick={() => window.open(img, '_blank')} 
                  loading="lazy" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer (Sticky) */}
      <div className="action-footer-v2">
        <div className="action-buttons-row">
          <button className="btn-v2 secondary" onClick={() => {
            if (details.professionalMobile && details.professionalMobile !== 'Not available') {
              navigator.clipboard.writeText(details.professionalMobile);
              showToast('Technician number copied!');
              setTimeout(() => {
                window.location.href = `tel:${details.professionalMobile}`;
              }, 500);
            } else {
              showToast('Contact not available');
            }
          }}>
            <MdCall /> Call
          </button>

          <button
            className={`btn-v2 primary ${canShowPayNow ? 'enabled' : 'disabled'}`}
            onClick={handlePayButtonClick}
            disabled={paymentLoading || (!canShowPayNow && !isPaidBooking)}
          >
            <MdPayment />
            {paymentLoading ? '...' : (isPaidBooking ? 'Invoice' : 'Pay Now')}
          </button>


        </div>

        <button className="rebook-btn" onClick={handleRebook}>
          Book Service Again
        </button>
      </div>

      {showRatingModal && (
        <div className="rating-modal-overlay-v2" onClick={() => !ratingLoading && setShowRatingModal(false)}>
          <div className="rating-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="rm-header">
              <h3>How did we do?</h3>
              <p>Your feedback helps us improve our service.</p>
            </div>
            
            <div className="rm-stars">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = ratingForm.rates >= star;
                return (
                  <button 
                    type="button" 
                    key={star} 
                    className={`rm-star-btn ${isActive ? 'active' : ''}`} 
                    onClick={() => setRatingForm(prev => ({ ...prev, rates: star }))}
                  >
                    {isActive ? <MdStar /> : <MdStarOutline />}
                  </button>
                );
              })}
            </div>

            <div className="rm-input-wrapper">
              <textarea 
                className="rm-textarea"
                value={ratingForm.comment} 
                onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))} 
                placeholder="Tell us about your experience..." 
                rows={4} 
              />
            </div>

            <div className="rm-actions">
              <button className="rm-cancel-btn" onClick={() => setShowRatingModal(false)} disabled={ratingLoading}>Cancel</button>
              <button className="rm-submit-btn" onClick={handleSubmitRating} disabled={ratingLoading}>
                {ratingLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoice && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          booking={booking}
          details={details}
          paymentStatusUpper={paymentStatusUpper}
        />
      )}
    </section>
  );
};

export default BookingDetailPage;