import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Star,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
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
  isInCart,
  showToast
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get('serviceId');

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

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
      if (!serviceId) {
        setLoading(false);
        return;
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
  }, [serviceId, isActive]);

  const handleBack = () => {
    navigate('/services');
  };

  const handleAddToCart = () => {
    if (!service) return;
    addToCart({
      ...service,
      itemType: 'service'
    });
  };

  const handleRemoveFromCart = () => {
    if (!service) return;
    const cartItem = cartItems.find(item => (item.itemId?._id || item.originalId) === service._id);
    if (cartItem) {
      removeFromCart(cartItem.id);
    }
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
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-product-services">
      {/* Detail Header */}
      <div className="services-hero" style={{ textAlign: 'left', padding: '30px 20px' }}>
        <button className="back-btn-simple" onClick={handleBack} style={{ marginBottom: '15px' }}>
          <ChevronLeft size={20} /> Back
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '28px', margin: 0 }}>{service.serviceName}</h1>
              {service.isPopular && <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px' }}>POPULAR</span>}
              {service.isRecommended && <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '10px' }}>RECOMMENDED</span>}
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
              <button className="cart-btn remove-from-cart" onClick={handleRemoveFromCart} style={{ width: '100%', height: '48px' }}>
                Remove from Cart
              </button>
            ) : (
              <button className="cart-btn add-to-cart" onClick={handleAddToCart} style={{ width: '100%', height: '48px' }}>
                Add to Cart
              </button>
            )}

            <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                <Clock size={16} style={{ color: 'var(--green)', marginBottom: '4px' }} />
                <p style={{ fontSize: '11px', margin: 0, fontWeight: '600' }}>{service.duration || 'Flexible'}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                <Truck size={16} style={{ color: service.siteVisitRequired ? 'var(--green)' : '#94a3b8', marginBottom: '4px' }} />
                <p style={{ fontSize: '11px', margin: 0, fontWeight: '600' }}>{service.siteVisitRequired ? 'Site Visit' : 'Remote/Studio'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', padding: '0 20px' }}>

        {/* What's Included */}
        <div className="detail-card-new">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
            <CheckCircle2 size={22} color="var(--green)" /> What's Included
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {service.whatIncluded?.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What's Not Included */}
        <div className="detail-card-new">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
            <XCircle size={22} color="#ef4444" /> What's Not Included
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {service.whatNotIncluded?.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Rectify Method (How it works) */}
        <div className="detail-card-new" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#0369a1' }}>
            <Hammer size={22} /> How it works (Rectify Method)
          </h3>
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            {service.rectifyMethod?.map((step, idx) => (
              <div key={idx} style={{ marginBottom: '15px', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '-20px', top: '2px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: '#0ea5e9', color: 'white', fontSize: '9px',
                  display: 'grid', placeItems: 'center', fontWeight: 'bold'
                }}>{idx + 1}</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e', fontWeight: '500' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Service Checklist */}
        <div className="detail-card-new">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
            <ClipboardList size={22} color="var(--green)" /> Service Checklist
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {service.serviceChecklist?.map((item, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }}></div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Fault Reasons & Tools */}
        <div className="detail-card-new" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#991b1b', fontSize: '14px' }}>
              <AlertCircle size={18} /> Common Fault Reasons
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {service.faultReasons?.map(reason => (
                <span key={reason} style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>{reason}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e293b', fontSize: '14px' }}>
              <Box size={18} /> Tools & Equipment Used
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {service.toolsEquipments?.map(tool => (
                <span key={tool} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>{tool}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Service Highlights & Warranty */}
        <div className="detail-card-new" style={{ background: 'var(--bg-input)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
            <Zap size={22} color="#3b82f6" /> Service Highlights
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {service.serviceHighlights?.map((item, idx) => (
              <span key={idx} className="highlight-badge">
                {item}
              </span>
            ))}
          </div>
          <div className="warranty-box-new">
            <ShieldCheck size={18} /> Service Warranty: {service.serviceWarranty || '15'} Days
          </div>
          {service.cancellationPolicy && (
            <div style={{ marginTop: '15px', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Cancellation Policy:</strong> {service.cancellationPolicy}
            </div>
          )}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: service.requiresSpareParts ? '#f59e0b' : '#22c55e' }}>
            <Info size={14} />
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
  );
};

export default ProductServices;
