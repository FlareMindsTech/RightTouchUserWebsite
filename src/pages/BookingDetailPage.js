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
import './BookingDetailPage.css';

const BookingDetailPage = ({ booking, onBack, showToast }) => {
  const handleAction = (action) => {
    showToast(`${action} clicked for ${booking.service}`);
  };

  // Mock data based on booking type
  const getBookingDetails = () => {
    const details = {
      'Plumber': {
        id: 'BKP001',
        professional: 'Rajesh Kumar',
        rating: 4.8,
        reviews: 156,
        location: 'Door 123, Main Street, Chennai',
        dateTime: 'Monday, Jun 29, 2025 · 10:00 AM',
        amount: '₹1,299',
        paymentMethod: 'Credit Card',
        bookingFee: '₹49',
        total: '₹1,348',
        status: 'Completed',
        images: [
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200'
        ]
      },
      'Bathroom Cleaning': {
        id: 'BKP002',
        professional: 'Suresh Reddy',
        rating: 4.6,
        reviews: 98,
        location: 'Apt 45, Lake View Apartments, Chennai',
        dateTime: 'Saturday, Jun 21, 2025 · 2:00 PM',
        amount: '₹899',
        paymentMethod: 'UPI',
        bookingFee: '₹39',
        total: '₹938',
        status: 'Completed',
        images: [
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200'
        ]
      },
      'Electrician': {
        id: 'BKP003',
        professional: 'Karthik',
        rating: 4.7,
        reviews: 203,
        location: 'Plot 56, Anna Nagar, Chennai',
        dateTime: 'Wednesday, Jan 15, 2025 · 11:30 AM',
        amount: '₹599',
        paymentMethod: 'Cash',
        bookingFee: '₹29',
        total: '₹628',
        status: 'Completed',
        images: [
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200'
        ]
      },
      'Chimney': {
        id: 'BKP004',
        professional: 'Mohan Das',
        rating: 4.9,
        reviews: 87,
        location: 'House 78, Velachery, Chennai',
        dateTime: 'Wednesday, Jan 29, 2025 · 4:00 PM',
        amount: '₹1,499',
        paymentMethod: 'Credit Card',
        bookingFee: '₹59',
        total: '₹1,558',
        status: 'Completed',
        images: [
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200',
          'https://via.placeholder.com/300x200'
        ]
      }
    };
    return details[booking.service] || details['Plumber'];
  };

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
        <span className="status-badge completed">{booking.status}</span>
        <span className="booking-id">ID: {details.id}</span>
      </div>

      {/* Professional Info */}
      <div className="professional-section">
        <div className="professional-info">
          <div className="professional-avatar">
            {details.professional.charAt(0)}
          </div>
          <div className="professional-details">
            <h3>{details.professional}</h3>
            <div className="rating">
              <span className="stars">{'★'.repeat(Math.floor(details.rating))}</span>
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
      {details.images && (
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
        <button className="action-btn secondary" onClick={() => handleAction('Message')}>
          <MdMessage className="action-icon" />
          Message
        </button>
        <button className="action-btn secondary" onClick={() => handleAction('Call')}>
          <MdCall className="action-icon" />
          Call
        </button>
        <button className="action-btn primary" onClick={() => handleAction('Review')}>
          <MdStarOutline className="action-icon" />
          Rate & Review
        </button>
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