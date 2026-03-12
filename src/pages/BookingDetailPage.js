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
  MdStarOutline,
  MdCheckCircleOutline
} from 'react-icons/md';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';
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

const BookingDetailPage = ({ booking, onBack, showToast }) => {
  const handleAction = (action) => {
    showToast(`${action} clicked for ${booking.service}`);
  };

  const handlePayment = async () => {
    try {
      showToast('Initializing payment...');
      const res = await loadRazorpaySDK();
      if (!res) {
        showToast('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // Create Payment Order via backend wrapper
      const orderRes = await createPaymentOrder({
        bookingId: booking._id,
        amount: parseInt(details.total.replace('₹', ''))
      });

      if (!orderRes?.success) {
        showToast(orderRes?.message || 'Failed to initialize payment');
        return;
      }

      const options = {
        key: orderRes.result?.key || orderRes.key,
        amount: orderRes.result?.amount || orderRes.amount,
        currency: "INR",
        name: "Right Touch",
        description: `Payment for Booking ${details.id}`,
        order_id: orderRes.result?.orderId || orderRes.orderId,
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
              // Refresh or Navigate back to update UI
              setTimeout(() => onBack(), 1000);
            } else {
              showToast('Payment verification failed');
            }
          } catch (err) {
            console.error('Payment Verification error:', err);
            showToast('Verification failed internally');
          }
        },
        prefill: {
          name: "Customer",
          contact: "9999999999" // Use actual customer object if available
        },
        theme: { color: "#6c63ff" }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      showToast('Error launching payment');
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
      (booking?.status === 'SEARCHING' ? 'Searching...' : 'Not assigned');

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
      images: booking?.workImages?.beforeImage || booking?.workImages?.afterImage
        ? [booking.workImages.beforeImage, booking.workImages.afterImage].filter(Boolean)
        : []
    };
  };
  console.log(booking)
  const details = getBookingDetails();

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
          <span>Paid via {details.paymentMethod}</span>
        </div>

        <button className="invoice-btn" onClick={() => handleAction('View Invoice')}>
          <MdReceipt className="invoice-icon" />
          View Invoice
          <MdOutlineChevronRight className="arrow-icon" />
        </button>
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
        {(details.status.toLowerCase() === 'completed' && booking?.paymentStatus === 'pending') ? (
          <button className="action-btn primary" onClick={handlePayment} style={{ flex: 1, backgroundColor: '#4CAF50' }}>
            <MdPayment className="action-icon" />
            Pay Now ({details.total})
          </button>
        ) : (
          <>
            <button className="action-btn secondary" onClick={() => handleAction('Message')}>
              <MdMessage className="action-icon" />
              Message
            </button>
            <button className="action-btn secondary" onClick={() => {
              if (details.professionalMobile && details.professionalMobile !== 'Not available') {
                window.location.href = `tel:${details.professionalMobile}`;
              } else {
                handleAction('Call');
              }
            }}>
              <MdCall className="action-icon" />
              Call
            </button>
            <button className="action-btn primary" onClick={() => handleAction('Review')}>
              <MdStarOutline className="action-icon" />
              Rate & Review
            </button>
          </>
        )}
      </div>

      {/* Rebook Button */}
      <div className="rebook-section">
        <button className="rebook-btn" onClick={() => handleAction('Rebook')}>
          Book Again
        </button>
      </div>
    </section>
  );
};

export default BookingDetailPage;