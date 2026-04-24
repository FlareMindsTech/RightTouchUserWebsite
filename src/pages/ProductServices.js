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
  Hammer,
  ClipboardList,
  AlertCircle,
  Truck,
  Box
} from 'lucide-react';
import { getServiceById } from '../services/serviceService';

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
          // Optional: Still fetch in background to get full details if needed
          // but for now, this is production-level caching
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
        <div className="services-hero" style={{ textAlign: 'left' }}>
          <button className="back-btn-simple" onClick={handleBack} style={{ marginBottom: '15px' }}>
            <ChevronLeft size={20} /> Back
          </button>
        <div className="service-detail-hero-content" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}> 
          {/* Service Image Section */}
<div className="service-detail-image-wrap">
            {service.serviceImages?.[0] ? (
              <img src={service.serviceImages[0]} alt={service.serviceName} className="service-main-img" />
            ) : (
              <div className="service-img-placeholder-large">
                <Hammer size={60} />
              </div>
            )}
            <div className="service-badges-overlay">
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '28px', margin: 0 }}>{service.serviceName}</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '700' }}>
                <Star size={18} fill="#f59e0b" />
                <span>{service.ratingSummary?.averageRating || 0}</span>
                <span style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                  ({service.ratingSummary?.totalRatings || 0} reviews)
                </span>
              </div>
              <span className="accent" style={{ background: 'var(--green-bg)', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '600' }}>
                {service.serviceType || 'Service'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '700px' }}>{service.description}</p>

            {service.supportedBrands && service.supportedBrands.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supported Brands: </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                  {service.supportedBrands.map(brand => (
                    <span key={brand} style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '4px', fontSize: '12px', color: '#475569' }}>{brand}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="price-card-sticky">
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--green)' }}>₹{service.discountedPrice || service.serviceCost}</span>
              {service.serviceCost > (service.discountedPrice || 0) && (
                <div style={{ marginTop: '4px' }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '8px' }}>₹{service.serviceCost}</span>
                  <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>{service.serviceDiscountPercentage}% OFF</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Minimum Visit Charge</span>
                <span style={{ fontWeight: '600' }}>₹{service.minimumVisitCharge || 0}</span>
              </div>
              {service.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--green)' }}>
                  <span>You Save</span>
                  <span>₹{service.discountAmount}</span>
                </div>
              )}
            </div>

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
                Add
              </button>
            )}

            <div className="detail-feature-bar">
              <div className="feature-item">
                <Clock size={18} className="feature-icon" />
                <div className="feature-content">
                  <span className="feature-label">Duration</span>
                  <p className="feature-value">{service.duration || 'Flexible'}</p>
                </div>
              </div>
              <div className="feature-item">
                <Truck size={18} className="feature-icon" style={{ opacity: service.siteVisitRequired ? 1 : 0.4 }} />
                <div className="feature-content">
                  <span className="feature-label">Availability</span>
                  <p className="feature-value">{service.siteVisitRequired ? 'Site Visit' : 'Remote'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-section-grid">

        {/* What's Included */}
        <div className="detail-card-new">
          <h3 className="detail-card-title">
            <CheckCircle2 size={24} color="var(--green)" /> What's Included
          </h3>
          <ul className="detail-list">
            {(expandedSections.included ? service.whatIncluded : service.whatIncluded?.slice(0, 4))?.map((item, idx) => (
              <li key={idx} className="detail-list-item">
                <Check className="detail-list-icon" size={16} color="var(--green)" />
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
            <XCircle size={24} color="#ef4444" /> What's Not Included
          </h3>
          <ul className="detail-list">
            {(expandedSections.notIncluded ? service.whatNotIncluded : service.whatNotIncluded?.slice(0, 4))?.map((item, idx) => (
              <li key={idx} className="detail-list-item">
                <X className="detail-list-icon" size={16} color="#ef4444" />
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

        {/* Rectify Method (How it works) */}
        <div className="detail-card-new" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <h3 className="detail-card-title" style={{ color: '#0369a1' }}>
            <Hammer size={24} /> How it works (Rectify Method)
          </h3>
          <div className="timeline-container-v2">
            {service.rectifyMethod?.map((step, idx) => (
              <div key={idx} className="timeline-step-v2">
                <div className="timeline-line-v2"></div>
                <div className="timeline-marker-v2">{idx + 1}</div>
                <div className="timeline-content-v2">
                  <p className="timeline-text-v2">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Checklist */}
        <div className="detail-card-new">
          <h3 className="detail-card-title">
            <ClipboardList size={24} color="var(--green)" /> Service Checklist
          </h3>
          <div className="checklist-grid">
            {(expandedSections.checklist ? service.serviceChecklist : service.serviceChecklist?.slice(0, 6))?.map((item, idx) => (
              <div key={idx} className="checklist-item">
                <div className="checklist-dot"></div>
                {item}
              </div>
            ))}
          </div>
          {service.serviceChecklist?.length > 6 && (
            <button className="show-more-toggle" onClick={() => toggleSection('checklist')}>
              {expandedSections.checklist ? 'Show Less' : `+${service.serviceChecklist.length - 6} More`}
            </button>
          )}
        </div>

        {/* Fault Reasons & Tools */}
        <div className="detail-card-new" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#991b1b', fontSize: '14px', fontWeight: '800' }}>
              <AlertCircle size={18} /> Common Fault Reasons
            </h4>
            <div className="tech-chip-group">
              {service.faultReasons?.map(reason => (
                <span key={reason} className="tech-chip fault">{reason}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#1e293b', fontSize: '14px', fontWeight: '800' }}>
              <Box size={18} /> Tools & Equipment Used
            </h4>
            <div className="tech-chip-group">
              {service.toolsEquipments?.map(tool => (
                <span key={tool} className="tech-chip tool">{tool}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Service Highlights & Warranty */}
        <div className="detail-card-new" style={{ background: 'var(--bg-input)' }}>
          <h3 className="detail-card-title">
            <Zap size={24} color="#3b82f6" /> Service Highlights
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {service.serviceHighlights?.map((item, idx) => (
              <span key={idx} className="highlight-badge">
                {item}
              </span>
            ))}
          </div>
          <div className="warranty-box-new">
            <ShieldCheck size={20} /> Service Warranty: {service.serviceWarranty || '15'} Days
          </div>
          {service.cancellationPolicy && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #cbd5e1', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong>Cancellation Policy:</strong> {service.cancellationPolicy}
            </div>
          )}
          <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: service.requiresSpareParts ? '#f59e0b' : '#22c55e', fontWeight: '600' }}>
            <Info size={16} />
            {service.requiresSpareParts ? 'This service may require spare parts (extra cost)' : 'No additional spare parts typically required'}
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="section-wrap" style={{ padding: '40px 20px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px' }}>Frequently Asked <span className="accent">Questions</span></h2>
        <div style={{ maxWidth: '800px' }}>
          {customFAQs.length > 0 ? customFAQs.map((faq, idx) => (
            <div key={idx} style={{
              marginBottom: '12px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'var(--bg-card)'
            }}>
              <button
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  background: openFaqIndex === idx ? 'var(--green-bg)' : 'transparent',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              >
                <span style={{ flex: 1, paddingRight: '10px' }}>{faq.question}</span>
                <span style={{
                  color: 'var(--green)',
                  fontSize: '22px',
                  fontWeight: '400',
                  lineHeight: '1',
                  transform: openFaqIndex === idx ? 'rotate(0deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                  {openFaqIndex === idx ? '−' : '+'}
                </span>
              </button>
              {openFaqIndex === idx && (
                <div style={{
                  padding: '16px 18px',
                  background: 'var(--bg-input)',
                  borderTop: '1px solid var(--border)',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.7'
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          )) : service.frequentlyAskedQuestions?.map((faq, idx) => {
            const q = typeof faq === 'string' ? faq : faq.question;
            const a = typeof faq === 'string' ? "Please contact support for details." : faq.answer;

            return (
              <div key={idx} style={{
                marginBottom: '12px',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--bg-card)'
              }}>
                <button
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    background: openFaqIndex === idx ? 'var(--green-bg)' : 'transparent',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                >
                  <span style={{ flex: 1, paddingRight: '10px' }}>{q}</span>
                  <span style={{
                    color: 'var(--green)',
                    fontSize: '22px',
                    fontWeight: '400',
                    lineHeight: '1'
                  }}>
                    {openFaqIndex === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === idx && (
                  <div style={{
                    padding: '16px 18px',
                    background: 'var(--bg-input)',
                    borderTop: '1px solid var(--border)',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.7'
                  }}>
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
