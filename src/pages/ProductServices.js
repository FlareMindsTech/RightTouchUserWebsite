import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Star,
  CheckCircle2,
  XCircle,
  Check,
  X,
  ShieldCheck,
  Clock,
  Zap,
  Info,
  Hammer
} from 'lucide-react';
import { getServiceById } from '../services/serviceService';
import './ProductServices.css'; // Import the CSS

const ProductServices = ({
  isActive,
  onNavigate,
  cartItems,
  addToCart,
  removeFromCart,
  updateQuantity,
  isInCart,
  showToast,
  allServices = []
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get('serviceId');

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, service: null });

  // Custom FAQ content
  const customFAQs = [
    {
      question: "How do I book a service?",
      answer: "Simply browse through our services, select the one you need, choose a convenient time slot, and book online. Our team will confirm your appointment within minutes."
    },
    {
      question: "What areas do you serve?",
      answer: "We currently serve all major cities and surrounding areas. Enter your location during booking to check if we cover your area."
    },
    {
      question: "Are your technicians certified?",
      answer: "Yes, all our technicians are fully certified, background-verified, and undergo regular training to ensure quality service delivery."
    },
    {
      question: "What is your service warranty policy?",
      answer: "We provide a minimum 15-day warranty on all services. If you experience any issues within the warranty period, we'll revisit and fix it at no additional cost."
    },
    {
      question: "How do I reschedule or cancel my booking?",
      answer: "You can reschedule or cancel your booking through the 'My Bookings' section in your account. Please note that cancellations made less than 2 hours before the scheduled time may incur a small fee."
    },
    {
      question: "Do you use genuine spare parts?",
      answer: "Yes, we use only genuine OEM spare parts for all repairs. If any part needs replacement, we'll always consult with you first and provide a transparent price estimate."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major payment methods including credit/debit cards, UPI, net banking, and wallet payments. You can also pay cash after the service is completed."
    },
    {
      question: "How do I track my service professional?",
      answer: "Once your booking is confirmed, you'll receive real-time updates about the technician's location and estimated arrival time via SMS and in-app notifications."
    }
  ];

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId || !isActive) {
        if (!serviceId) setLoading(false);
        return;
      }

      // Cache-first: try to find in global services
      if (allServices.length > 0) {
        const cached = allServices.find(s => s._id === serviceId);
        if (cached) {
          setService(cached);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getServiceById(serviceId);

        const data = response?.result || response?.data || response;
        if (data && data._id) {
          setService(data);
        } else {
          setError("Service not found");
        }
      } catch (err) {
        console.error("Error fetching service details:", err);
        setError("Failed to load service details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (isActive) {
      fetchServiceDetails();
    }
  }, [serviceId, isActive, allServices]);

  const handleBack = () => {
    navigate('/services');
  };

  const getCartItemForService = (serviceId) => {
    if (!Array.isArray(cartItems)) return null;
    return cartItems.find(item => (item.itemId?._id || item.originalId) === serviceId) || null;
  };

  const getServiceQuantity = (serviceId) => {
    const cartItem = getCartItemForService(serviceId);
    return Number(cartItem?.quantity || 0);
  };

  const confirmAndRemoveService = (service) => {
    const cartItem = getCartItemForService(service._id);
    if (!cartItem || !removeFromCart) return;
    setConfirmDialog({ open: true, service });
  };

  const handleConfirmRemove = async () => {
    const { service } = confirmDialog;
    setConfirmDialog({ open: false, service: null });
    if (!service) return;
    const cartItem = getCartItemForService(service._id);
    if (!cartItem || !removeFromCart) return;
    await removeFromCart(cartItem.id);
  };

  const handleCancelRemove = () => {
    setConfirmDialog({ open: false, service: null });
  };

  const handleIncrementService = async (service) => {
    const cartItem = getCartItemForService(service._id);

    if (!cartItem) {
      if (addToCart) {
        await addToCart({ ...service, itemType: 'service', quantity: 1 });
      }
      return;
    }

    const currentQuantity = Number(cartItem.quantity || 1);
    if (updateQuantity) {
      await updateQuantity(cartItem.originalId || cartItem.itemId?._id, cartItem.itemType || 'service', currentQuantity + 1);
      if (showToast) showToast(`${service.serviceName} quantity updated`);
    }
  };

  const handleDecrementService = async (service) => {
    const cartItem = getCartItemForService(service._id);
    if (!cartItem) return;

    const currentQuantity = Number(cartItem.quantity || 1);
    if (currentQuantity <= 1) {
      await confirmAndRemoveService(service);
      return;
    }

    if (updateQuantity) {
      await updateQuantity(cartItem.originalId || cartItem.itemId?._id, cartItem.itemType || 'service', currentQuantity - 1);
      if (showToast) showToast(`${service.serviceName} quantity updated`);
    }
  };

  const [expandedSections, setExpandedSections] = useState({
    included: false,
    notIncluded: false,
    checklist: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading && isActive) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if ((error || !service) && isActive) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2 style={{ color: '#ef4444' }}>{error || "Service Not Found"}</h2>
        <button className="back-btn-simple" onClick={handleBack} style={{ marginTop: '20px' }}>
          <ChevronLeft size={20} /> Back to Services
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Custom Confirm Dialog */}
      {confirmDialog.open && (
        <div className="confirm-overlay" onClick={handleCancelRemove}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className="confirm-title">Remove from Cart?</h3>
            <p className="confirm-message">
              <strong>{confirmDialog.service?.serviceName}</strong> will be removed from your cart.
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-cancel" onClick={handleCancelRemove}>
                Keep It
              </button>
              <button className="confirm-btn confirm-remove" onClick={handleConfirmRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <section className={`page ${isActive ? '' : 'hidden'}`} id="page-product-services">
        {/* Detail Header */}
        <div className="services-hero">
          <button className="back-btn-simple" onClick={handleBack}>
            <ChevronLeft size={20} /> Back
          </button>
          
          <div className="service-detail-hero-content">
            {/* Left Column: Service Image Section */}
            <div className="service-detail-image-wrap">
              {service.serviceImages?.[0] ? (
                <img src={service.serviceImages[0]} alt={service.serviceName} className="service-main-img" />
              ) : (
                <div className="service-img-placeholder-large">
                  <Hammer size={60} />
                </div>
              )}
            </div>

            {/* Right Column: Title, Ratings, Price & Booking Controls */}
            <div className="price-card-sticky">
              {/* Title & Rating */}
              <h1 className="service-title">{service.serviceName}</h1>

              <div className="rating-wrapper">
                <div className="rating-stars">
                  <Star className="star-icon" />
                  <span>{service.ratingSummary?.averageRating || 0}</span>
                  <span className="rating-count">
                    ({service.ratingSummary?.totalRatings || 0} reviews)
                  </span>
                </div>
                <span className="service-badge">
                  {service.serviceType || 'Service'}
                </span>
              </div>

              {/* Price & Savings */}
              <div className="price-section">
                <div className="price-main">
                  <span className="price-current">₹{service.discountedPrice || service.serviceCost}</span>
                  {service.serviceCost > (service.discountedPrice || 0) && (
                    <>
                      <span className="price-original">₹{service.serviceCost}</span>
                      <span className="price-discount">{service.serviceDiscountPercentage}% OFF</span>
                    </>
                  )}
                </div>

                {service.discountAmount > 0 && (
                  <div className="price-savings">
                    You Save ₹{service.discountAmount}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isInCart(service._id) ? (
                <div className="massive-cart-controls" onClick={(e) => e.stopPropagation()}>
                  <div className="massive-quantity-container">
                    <button
                      className="massive-qty-btn"
                      onClick={() => handleDecrementService(service)}
                      aria-label={`Decrease quantity for ${service.serviceName}`}
                    >
                      -
                    </button>
                    <span className="massive-qty-value">{getServiceQuantity(service._id)}</span>
                    <button
                      className="massive-qty-btn"
                      onClick={() => handleIncrementService(service)}
                      aria-label={`Increase quantity for ${service.serviceName}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="massive-add-btn massive-remove-btn"
                    onClick={() => confirmAndRemoveService(service)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  className="massive-add-btn"
                  onClick={() => {
                    handleIncrementService(service);
                  }}
                >
                  Add to Cart
                </button>
              )}

              {/* Duration Box */}
              <div className="detail-feature-bar">
                <div className="feature-item">
                  <Clock size={18} className="feature-icon" />
                  <div className="feature-content">
                    <span className="feature-label">Duration</span>
                    <p className="feature-value">{service.duration || 'Flexible'}</p>
                  </div>
                </div>
              </div>

              {/* Supported Brands */}
              {service.supportedBrands && service.supportedBrands.length > 0 && (
                <div className="brands-section">
                  <span className="brands-label">Supported Brands</span>
                  <div className="brands-list">
                    {service.supportedBrands.map(brand => (
                      <span key={brand} className="brand-tag">{brand}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width Service Description Card */}
        {service.description && (
          <div className="detail-card-new description-card">
            <h3 className="detail-card-title">
              <Info size={22} className="icon-info" /> About This Service
            </h3>
            <p className="service-description">
              {service.description}
            </p>
          </div>
        )}

        <div className="detail-section-grid">
          {/* What's Included */}
          <div className="detail-card-new">
            <h3 className="detail-card-title">
              <CheckCircle2 size={24} className="icon-success" /> What's Included
            </h3>
            <ul className="detail-list">
              {(expandedSections.included ? service.whatIncluded : service.whatIncluded?.slice(0, 4))?.map((item, idx) => (
                <li key={idx} className="detail-list-item">
                  <Check className="detail-list-icon icon-success" size={16} />
                  {item}
                </li>
              ))}
            </ul>
            {service.whatIncluded?.length > 4 && (
              <button className="show-more-toggle" onClick={() => toggleSection('included')}>
                {expandedSections.included ? 'Show Less' : `+${service.whatIncluded.length - 4} More`}
              </button>
            )}
          </div>

          {/* What's Not Included */}
          <div className="detail-card-new">
            <h3 className="detail-card-title">
              <XCircle size={24} className="icon-error" /> What's Not Included
            </h3>
            <ul className="detail-list">
              {(expandedSections.notIncluded ? service.whatNotIncluded : service.whatNotIncluded?.slice(0, 4))?.map((item, idx) => (
                <li key={idx} className="detail-list-item">
                  <X className="detail-list-icon icon-error" size={16} />
                  {item}
                </li>
              ))}
            </ul>
            {service.whatNotIncluded?.length > 4 && (
              <button className="show-more-toggle" onClick={() => toggleSection('notIncluded')}>
                {expandedSections.notIncluded ? 'Show Less' : `+${service.whatNotIncluded.length - 4} More`}
              </button>
            )}
          </div>

          {/* Service Highlights & Warranty */}
          <div className="detail-card-new highlight-card">
            <h3 className="detail-card-title">
              <Zap size={24} className="icon-info" /> Service Highlights & Policies
            </h3>

            <div className="highlights-grid">
              <div className="highlights-left">
                <div className="highlights-badges">
                  {service.serviceHighlights?.map((item, idx) => (
                    <span key={idx} className="highlight-badge">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="spare-parts-info">
                  <Info size={18} />
                  <span>{service.requiresSpareParts ? 'This service may require spare parts (extra cost)' : 'No additional spare parts typically required'}</span>
                </div>
              </div>

              <div className="highlights-right">
                <div className="warranty-box-new">
                  <ShieldCheck size={20} /> Service Warranty: {String(service.serviceWarranty || '15').toLowerCase().includes('day') ? service.serviceWarranty : `${service.serviceWarranty || '15'} Days`}
                </div>

                {service.cancellationPolicy && (
                  <div className="cancellation-policy">
                    <strong>Cancellation Policy:</strong> {service.cancellationPolicy}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="section-wrap">
          <h2 className="faq-title">Frequently Asked <span className="accent-text">Questions</span></h2>
          <div className="faq-container">
            {customFAQs.length > 0 ? customFAQs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <button
                  className={`faq-question-btn ${openFaqIndex === idx ? 'active' : ''}`}
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-toggle-icon">
                    {openFaqIndex === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === idx && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            )) : service.frequentlyAskedQuestions?.map((faq, idx) => {
              const q = typeof faq === 'string' ? faq : faq.question;
              const a = typeof faq === 'string' ? "Please contact support for details." : faq.answer;

              return (
                <div key={idx} className="faq-item">
                  <button
                    className={`faq-question-btn ${openFaqIndex === idx ? 'active' : ''}`}
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  >
                    <span>{q}</span>
                    <span className="faq-toggle-icon">
                      {openFaqIndex === idx ? '−' : '+'}
                    </span>
                  </button>
                  {openFaqIndex === idx && (
                    <div className="faq-answer">
                      {a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductServices;
