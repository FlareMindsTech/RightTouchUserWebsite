import React from 'react';
import {
  MdOutlineChevronRight,
  MdShare,
  MdOutlineLocationOn,
  MdAccessTime,
  MdPerson,
  MdPayment,
  MdReceipt,
  MdMessage,
  MdCall,
  MdStarOutline
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';
import { addToCart } from '../services/cartService';
import { createRating } from '../services/ratingService';
import InvoiceModal from '../components/InvoiceModal';
import './BookingDetailPage.css';

const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BookingDetailPage = ({ booking, onBack, showToast, currentUser }) => {
  const navigate = useNavigate();
  const [paymentLoading, setPaymentLoading] = React.useState(false);
  const [showInvoice, setShowInvoice] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [ratingLoading, setRatingLoading] = React.useState(false);
  const [ratingForm, setRatingForm] = React.useState({ rates: 0, comment: '' });

  const handleAction = (action) => {};

  const handlePayment = async () => {
    if (paymentLoading) return;
    setPaymentLoading(true);
    try {
      const res = await loadRazorpaySDK();
      if (!res) {
        showToast('Razorpay SDK failed to load. Are you online?');
        setPaymentLoading(false);
        return;
      }

      // Create Payment Order via backend
      const orderRes = await createPaymentOrder({
        bookingId: booking._id
      });

      if (!orderRes?.success) {
        showToast(orderRes?.message || 'Failed to initialize payment');
        setPaymentLoading(false);
        return;
      }

      const orderData = orderRes.result || orderRes;
      const user = currentUser || (() => {
        try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch { return {}; }
      })();

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY || orderData.key || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'RightTouch Services',
        description: `Payment for Booking ${details.id}`,
        image: '/logo.png',
        order_id: orderData.orderId || orderData.id,
        handler: async function (paymentResponse) {
          try {
            const verification = await verifyPayment({
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              bookingId: booking._id
            });

            if (verification?.success) {
              showToast('Payment successful!');
              setTimeout(() => onBack(), 1200);
            } else {
              showToast('Payment verification failed');
            }
          } catch (err) {
            console.error('Payment Verification error:', err);
            showToast('Error verifying payment');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: user.name || `${user.fname || ''} ${user.lname || ''}`.trim() || 'Customer',
          email: user.email || '',
          contact: user.mobileNumber || user.phoneNumber || ''
        },
        theme: { color: '#2ecc71' },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled. Your booking is saved.');
            setPaymentLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      showToast('Error launching payment');
      setPaymentLoading(false);
    }
  };

  const getBookingDetails = () => {
    // Dynamically build details from the booking prop with fallbacks
    const serviceName = booking?.serviceId?.serviceName || booking?.cartId?.items?.[0]?.item?.name || booking?.service || 'Service Booking';
    const addressInfo = booking?.addressSnapshot || booking?.addressId;
    const location = addressInfo ? (addressInfo.addressLine || `${addressInfo.flat || ''}, ${addressInfo.area || ''}, ${addressInfo.city || ''}`.replace(/^[,\s]+|[,\s]+$/g, '')) : (booking?.address || 'Address not specified');
    const price = booking?.baseAmount || booking?.serviceId?.serviceCost || booking?.totalPrice || booking?.cartId?.totalPrice || 0;
    const platformFee = booking?.platformFee || booking?.bookingFee || booking?.commissionAmount || 0;
    const totalAmount = parseInt(price) + parseInt(platformFee);

    const professionalName = booking?.technicianSnapshot?.name ||
      (booking?.technicianId?.userId?.fname ? `${booking.technicianId.userId.fname} ${booking.technicianId.userId.lname || ''}`.trim() : null) ||
      booking?.assignedTechnician?.name ||
      (booking?.status === 'SEARCHING' ? 'Searching...' : 'Awaiting technician assignment');

    const professionalMobile = booking?.technicianSnapshot?.mobile ||
      booking?.technicianId?.userId?.mobileNumber ||
      'Not available';

    const professionalImage = booking?.technicianSnapshot?.profileImage ||
      booking?.technicianId?.profileImage ||
      null;

    const experience = booking?.technicianSnapshot?.experienceYears ||
      booking?.technicianId?.experienceYears ||
      0;

    const specialization = booking?.technicianSnapshot?.specialization ||
      booking?.technicianId?.specialization ||
      'Technician';

    const isOnline = booking?.technicianId?.availability?.isOnline || false;

    const ratingValue = booking?.technicianSnapshot?.rating ||
      booking?.technicianId?.rating?.avg ||
      0;

    const reviewCount = booking?.technicianSnapshot?.reviews ||
      booking?.technicianId?.rating?.count ||
      0;

    return {
      id: booking?._id ? `BKP${booking._id.substring(booking._id.length - 4).toUpperCase()}` : 'BKP000',
      professional: professionalName,
      professionalMobile: professionalMobile,
      professionalImage: professionalImage,
      experience: experience,
      specialization: specialization,
      isOnline: isOnline,
      rating: ratingValue,
      reviews: reviewCount,
      location: location,
      dateTime: booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : (booking?.createdAt ? new Date(booking.createdAt).toLocaleString() : 'Date not fixed'),
      amount: `₹${price}`,
      paymentMethod: booking?.paymentProvider === 'razorpay' ? 'Online' : (booking?.paymentDetails?.method || booking?.paymentId ? 'Online' : 'Pending'),
      bookingFee: `₹${platformFee}`,
      total: `₹${totalAmount}`,
      status: booking?.status || 'Pending',
      serviceName: serviceName,
      technicianId:
        booking?.technicianId?._id ||
        booking?.technicianSnapshot?._id ||
        booking?.assignedTechnician?._id ||
        null,
      serviceId: booking?.serviceId?._id || booking?.serviceId || null,
      images: booking?.workImages?.beforeImage || booking?.workImages?.afterImage
        ? [booking.workImages.beforeImage, booking.workImages.afterImage].filter(Boolean)
        : []
    };
  };
  const details = getBookingDetails();
  const bookingStatusUpper = (booking?.status || '').toUpperCase();
  const paymentStatusUpper = (booking?.paymentStatus || '').toUpperCase();
  const isExpiredBooking = ['EXPIRED', 'CANCELLED'].includes(bookingStatusUpper);
  const isCompletedBooking = bookingStatusUpper === 'COMPLETED';
  const isPaidBooking = paymentStatusUpper === 'PAID';
  const hasTechnician = Boolean(details.technicianId || booking?.technicianId);
  const canRateTechnician = hasTechnician && ['ACCEPTED', 'IN PROGRESS', 'COMPLETED'].includes(bookingStatusUpper);
  const canShowPayNow = isCompletedBooking && !isPaidBooking && !isExpiredBooking;

  const handlePayButtonClick = () => {
    if (paymentLoading) return;
    if (canShowPayNow) {
      handlePayment();
      return;
    }

    if (isPaidBooking) {
      showToast('Payment already completed for this booking');
      return;
    }

    if (isExpiredBooking) {
      showToast('Payment is disabled for expired or cancelled bookings');
      return;
    }

    showToast('Pay option will be enabled once technician completes the work');
  };

  const handleRebook = async () => {
    try {
      const firstCartItem = booking?.cartId?.items?.[0] || null;
      const itemId =
        booking?.serviceId?._id ||
        booking?.productId?._id ||
        firstCartItem?.itemId?._id ||
        firstCartItem?.item?._id ||
        firstCartItem?.itemId ||
        booking?.itemId?._id ||
        booking?.itemId;

      const itemType =
        firstCartItem?.itemType ||
        (booking?.serviceId ? 'service' : (booking?.productId ? 'product' : 'service'));

      if (!itemId) {
        showToast('Unable to rebook this item right now');
        return;
      }

      const response = await addToCart({
        itemId,
        itemType,
        quantity: 1
      });

      if (response?.success) {
        showToast('Booking added to cart again');
        navigate('/cart');
      } else {
        showToast(response?.message || 'Failed to add booking to cart');
      }
    } catch (error) {
      console.error('Rebook failed:', error);
      showToast('Error while booking again');
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!canRateTechnician) {
      showToast('Rating is available once technician accepts your booking');
      return;
    }
    if (!ratingForm.rates) {
      showToast('Please select a star rating');
      return;
    }

    setRatingLoading(true);
    try {
      const payload = {
        bookingId: booking?._id,
        bookingType: booking?.bookingType || (details.serviceId ? 'service' : 'product'),
        rates: ratingForm.rates,
        comment: ratingForm.comment,
        technicianId: details.technicianId,
        serviceId: details.serviceId
      };

      const response = await createRating(payload);
      if (response?.success) {
        showToast('Rating submitted successfully');
        setShowRatingModal(false);
        setRatingForm({ rates: 0, comment: '' });
      } else {
        showToast(response?.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Rating submit failed:', error);
      showToast('Error submitting rating');
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <section className="booking-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <MdOutlineChevronRight className="back-icon" />
        </button>
        <h2 className="detail-title">Booking Details</h2>
        <button className="share-btn" onClick={() => handleAction('Share')}>
          <MdShare className="share-icon" />
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <span className={`status-badge ${details.status.toLowerCase()}`}>{details.status}</span>
        <span className="booking-id">ID: {details.id}</span>
      </div>

      {/* Professional Info */}
      <div className="professional-section">
        <div className="professional-info">
          <div className="professional-avatar-container">
            <div className="professional-avatar">
              {details.professionalImage ? (
                <img src={details.professionalImage} alt={details.professional} />
              ) : (
                details.professional ? details.professional.charAt(0) : '?'
              )}
            </div>
            {booking?.technicianId && (
              <span className={`online-status-dot ${details.isOnline ? 'online' : 'offline'}`}></span>
            )}
          </div>
          <div className="professional-details">
            <div className="professional-header">
              <h3>{details.professional}</h3>
              {details.experience > 0 && (
                <span className="experience-badge">{details.experience}y Exp</span>
              )}
            </div>
            <p className="specialization-text">{details.specialization}</p>
            {details.professionalMobile && details.professionalMobile !== 'Not available' && (
              <p className="mobile-text">
                <MdCall style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {details.professionalMobile}
              </p>
            )}
            <div className="rating">
              <span className="stars">{'★'.repeat(Math.round(details.rating) || 0)}</span>
              <span className="rating-value">{details.rating}</span>
              <span className="reviews">({details.reviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="service-details-section">
        <h3>Service Details</h3>

        <div className="detail-item">
          <MdOutlineLocationOn className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Location</span>
            <span className="detail-value">{details.location}</span>
          </div>
        </div>

        <div className="detail-item">
          <MdAccessTime className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Date & Time</span>
            <span className="detail-value">{details.dateTime}</span>
          </div>
        </div>

        <div className="detail-item">
          <MdPerson className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Professional</span>
            <span className="detail-value">{details.professional}</span>
          </div>
        </div>

        {booking.faultProblem && (
          <div className="detail-item">
            <MdMessage className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Reported Problem</span>
              <span className="detail-value">{booking.faultProblem}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="payment-section">
        <h3>Payment Details</h3>

        <div className="payment-breakdown">
          <div className="payment-row">
            <span>Service Charge</span>
            <span>{details.amount}</span>
          </div>
          <div className="payment-row">
            <span>Booking Fee</span>
            <span>{details.bookingFee}</span>
          </div>
          <div className="payment-row total">
            <span>Total Amount</span>
            <span>{details.total}</span>
          </div>
        </div>

        <div className="payment-method">
          <MdPayment className="payment-icon" />
          {canShowPayNow
            ? <span className="payment-pending-tag">Payment Pending</span>
            : <span>{paymentStatusUpper === 'PAID' ? `Paid via ${details.paymentMethod}` : 'Payment not available'}</span>
          }
        </div>

        {paymentStatusUpper === 'PAID' && (
          <button className="invoice-btn" onClick={() => setShowInvoice(true)}>
            <MdReceipt className="invoice-icon" />
            View Invoice
            <MdOutlineChevronRight className="arrow-icon" />
          </button>
        )}
      </div>

      {/* Work Images */}
      {details.images && details.images.length > 0 && (
        <div className="work-images-section">
          <h3>Work Images</h3>
          <div className="image-grid">
            {details.images.map((image, index) => (
              <div key={index} className="image-item">
                <img src={image} alt={`Work ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className={`action-btn primary pay-now-btn ${canShowPayNow && !paymentLoading ? 'enabled' : 'disabled-state'}`}
          onClick={handlePayButtonClick}
          aria-disabled={!canShowPayNow || paymentLoading}
        >
          <MdPayment className="action-icon" />
          {paymentLoading
            ? 'Processing...'
            : (isPaidBooking ? 'Paid' : `Pay Now (${details.total})`)}
        </button>

        <button className="action-btn secondary" onClick={() => {
          if (details.professionalMobile && details.professionalMobile !== 'Not available') {
            window.location.href = `tel:${details.professionalMobile}`;
          } else {
            showToast('Technician phone number not available yet');
          }
        }}>
          <MdCall className="action-icon" />
          Call
        </button>

        <button
          className={`action-btn primary ${canRateTechnician ? 'rate-enabled' : 'rate-disabled'}`}
          onClick={() => {
            if (!canRateTechnician) {
              showToast('Rating option is available once technician accepts your booking');
              return;
            }
            setShowRatingModal(true);
          }}
        >
            <MdStarOutline className="action-icon" />
            Rate & Review
          </button>
      </div>

      {/* Rebook Button */}
      <div className="rebook-section">
        <button className="rebook-btn" onClick={handleRebook}>
          Book Again
        </button>
      </div>

      {showRatingModal && (
        <div className="rating-modal-overlay" onClick={() => !ratingLoading && setShowRatingModal(false)}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rate Your Technician</h3>
            <p className="rating-note">Optional feedback after technician acceptance.</p>

            <form onSubmit={handleSubmitRating}>
              <div className="star-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`star-btn ${ratingForm.rates >= star ? 'active' : ''}`}
                    onClick={() => setRatingForm((prev) => ({ ...prev, rates: star }))}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                value={ratingForm.comment}
                onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience (optional)"
                rows={4}
              />

              <div className="rating-actions">
                <button type="button" className="rating-cancel" onClick={() => setShowRatingModal(false)} disabled={ratingLoading}>
                  Cancel
                </button>
                <button type="submit" className="rating-submit" disabled={ratingLoading}>
                  {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        booking={booking}
        details={details}
        paymentStatusUpper={paymentStatusUpper}
      />
    </section>
  );
};

export default BookingDetailPage;