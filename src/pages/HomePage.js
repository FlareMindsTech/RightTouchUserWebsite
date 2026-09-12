import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wind,
  Search,
  MapPin,
  ChevronDown,
  Wrench,
  Brush,
  ShieldCheck,
  Zap,
  CircleDollarSign,
  RotateCcw,
  ArrowRight,
  Share2,
  ChevronLeft,
  ChevronRight,
  Star,
  Headphones,
  Sparkles,
  Gift,
  Tag,
} from 'lucide-react';
import { getMyAddresses } from '../services/addressService';
import AddressModal from '../components/AddressModal';
import { shareItem } from '../utils/share';
import { formatPriceSmart } from '../utils/format';
import '../styles/home.css';

// --- Static Data ---

const offers = [
  {
    id: 1,
    badge: '🔥 HOT DEAL',
    title: 'Deep Clean Foam-Jet AC Service',
    desc: 'Complete indoor & outdoor pressure wash + anti-bacterial spray',
    discount: '35% OFF',
    code: 'ACFOAM35',
    icon: <Wind size={32} />,
    theme: 'offer-theme-emerald'
  },
  {
    id: 2,
    badge: '⚡ FLASH SALE',
    title: 'Home Electrical & Safety Check',
    desc: 'Comprehensive inspection for MCBs, wiring & heavy appliances',
    discount: 'FLAT ₹200 OFF',
    code: 'SAFEHOME',
    icon: <Zap size={32} />,
    theme: 'offer-theme-blue'
  },
  {
    id: 3,
    badge: '🏷️ SAVE 25%',
    title: 'Bathroom & Kitchen Leak Fixes',
    desc: 'Expert plumber repair for taps, flush valves & water tank fittings',
    discount: 'SAVE 25%',
    code: 'PLUMB25',
    icon: <Wrench size={32} />,
    theme: 'offer-theme-amber'
  },
  {
    id: 4,
    badge: '✨ NEW LAUNCH',
    title: 'Full Home Carpet & Sofa Spa',
    desc: 'Deep extraction vacuuming & fabric stain removal treatment',
    discount: 'UPTO 30% OFF',
    code: 'CLEANSPA',
    icon: <Brush size={32} />,
    theme: 'offer-theme-purple'
  }
];

const WHY_CHOOSE_US = [
  {
    id: 'verified',
    badge: 'CERTIFIED',
    icon: <ShieldCheck className="why-icon-svg text-emerald" size={26} />,
    title: 'Verified Technicians',
    desc: '100% background-checked & certified professionals.'
  },
  {
    id: 'fast',
    badge: 'EXPRESS',
    icon: <Zap className="why-icon-svg text-amber" size={26} />,
    title: '2-Hour Quick Response',
    desc: 'Fast doorstep arrival guaranteed within 120 minutes.'
  },
  {
    id: 'transparent',
    badge: 'TRANSPARENT',
    icon: <CircleDollarSign className="why-icon-svg text-blue" size={26} />,
    title: 'Upfront Best Prices',
    desc: 'Approved fixed rate card. Absolutely zero hidden fees.'
  },
  {
    id: 'support',
    badge: '24/7 LIVE',
    icon: <Headphones className="why-icon-svg text-indigo" size={26} />,
    title: '24/7 Dedicated Assist',
    desc: 'Live expert customer support available anytime.'
  },
  {
    id: 'eco',
    badge: 'BIO-SAFE',
    icon: <Sparkles className="why-icon-svg text-teal" size={26} />,
    title: 'Safe Eco Equipment',
    desc: 'Non-toxic, high-grade organic cleaning tools & solvents.'
  }
];

// --- Category Icon Helper ---

const CategoryIcon = ({ category }) => {
  if (category.image) {
    return (
      <img
        src={category.image}
        alt={category.category}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loading="lazy"
      />
    );
  }
  return (
    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--green)' }}>
      {category.category?.charAt(0) || '?'}
    </span>
  );
};

// --- Filter helper ---
const filterBySearch = (items, query) => {
  if (!query || query.trim() === '') return items;
  const searchTerm = query.toLowerCase().trim();
  return items.filter(item => {
    const name = item.category?.toLowerCase() || item.serviceName?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    return name.includes(searchTerm) || description.includes(searchTerm);
  });
};

// --- Main Component ---

const HomePage = ({
  isActive,
  currentUser,
  onLoginClick,
  searchQuery,
  showToast,
  serviceCategories: initialServiceCategories = [],
  productCategories: initialProductCategories = [],
  services: initialServices = [],
  loading: isGlobalLoading
}) => {
  const navigate = useNavigate();
  const [serviceCategories, setServiceCategories] = useState(initialServiceCategories);
  const [productCategories, setProductCategories] = useState(initialProductCategories);
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState(isGlobalLoading);
  const [userAddress, setUserAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [pendingAddressOpen, setPendingAddressOpen] = useState(false);
  const applianceCarouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollTicking = useRef(false);

  const checkScrollState = useCallback(() => {
    if (!scrollTicking.current) {
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        if (applianceCarouselRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = applianceCarouselRef.current;
          setCanScrollLeft(scrollLeft > 5);
          setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
        }
        scrollTicking.current = false;
      });
    }
  }, []);

  useEffect(() => {
    const el = applianceCarouselRef.current;
    if (el) {
      checkScrollState();
      el.addEventListener('scroll', checkScrollState, { passive: true });
      window.addEventListener('resize', checkScrollState, { passive: true });
      return () => {
        el.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, [services, checkScrollState]);

  const scrollApplianceCarousel = (direction) => {
    if (applianceCarouselRef.current) {
      applianceCarouselRef.current.scrollBy({ left: direction, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setServiceCategories([...initialServiceCategories].sort((a, b) => b.category.localeCompare(a.category)));
    setProductCategories(initialProductCategories);
    setServices(initialServices);
    setLoading(isGlobalLoading);
  }, [initialServiceCategories, initialProductCategories, initialServices, isGlobalLoading]);

  // Load the user's default saved address (only)
  useEffect(() => {
    if (!currentUser?._id) {
      setUserAddress('Login to set your address');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    let cancelled = false;

    const loadDefaultAddress = async () => {
      try {
        const response = await getMyAddresses();
        if (cancelled) return;
        const addrList = response?.result || response?.data || response || [];
        const list = Array.isArray(addrList) ? addrList : [];
        const defaultAddr = list.find((a) => a.isDefault) || list[0];

        if (defaultAddr) {
          const line = defaultAddr.addressLine || defaultAddr.address || '';
          const rest = [defaultAddr.city, defaultAddr.state, defaultAddr.pincode].filter(Boolean).join(', ');
          setUserAddress(line || rest || 'No address saved');
        } else {
          setUserAddress('No address saved');
        }
      } catch (err) {
        console.warn('[HomePage] Failed to load default address:', err);
        if (!cancelled) setUserAddress('Address unavailable');
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    };

    loadDefaultAddress();

    return () => {
      cancelled = true;
    };
  }, [currentUser?._id, isActive]);

  // Automatically open AddressModal if login was triggered from location click
  useEffect(() => {
    if (currentUser?._id && pendingAddressOpen) {
      setIsAddressModalOpen(true);
      setPendingAddressOpen(false);
    }
  }, [currentUser?._id, pendingAddressOpen]);

  const handleLocationClick = () => {
    if (!currentUser?._id) {
      setPendingAddressOpen(true);
      if (onLoginClick) {
        onLoginClick();
      }
      return;
    }
    setIsAddressModalOpen(true);
  };

  const handleCategoryClick = (category, type) => {
    if (type === 'product') {
      navigate(`/products`);
    } else {
      navigate(`/services?category=${category._id}`);
    }
  };

  const handleServiceClick = (service) => {
    const categoryName = service.categoryId?.category || 'Service';
    navigate(`/product-services?type=${encodeURIComponent(categoryName)}&serviceId=${service._id}`);
  };

  const handleBookNow = (offer) => {
    const normalizedTitle = (offer?.title || '').toLowerCase();
    const offerKeywordMap = {
      1: ['ac'],
      2: ['carpet', 'electrical'],
      3: ['plumbing', 'bathroom', 'kitchen']
    };

    const keywords = offerKeywordMap[offer?.id] || [];
    const matchedCategory = serviceCategories.find((category) => {
      const categoryName = (category?.category || '').toLowerCase();
      return keywords.some((keyword) => categoryName.includes(keyword)) ||
        keywords.some((keyword) => normalizedTitle.includes(keyword) && categoryName.includes(keyword));
    });

    if (matchedCategory?._id) {
      navigate(`/services?category=${matchedCategory._id}`);
      return;
    }

    navigate('/services');
  };

  if (!isActive) return null;

  const isSearching = searchQuery && searchQuery.trim() !== '';

  // --- Render ---
  return (
    <section className="home-page" id="page-home">
      {/* ===== LOCATION BAR - Shows default saved address, click to manage ===== */}
      <div className="location-bar" onClick={handleLocationClick} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLocationClick(); }}>
        <div className="location-left">
          <MapPin size={20} className="location-pin" />
          <div className="location-text">
            <strong>Delivery Address</strong>
            <span>
              <span className="location-addr">
                {locationLoading ? 'Loading...' : userAddress}
              </span>
              <ChevronDown size={14} className="chevron" />
            </span>
          </div>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">⭐ Trusted by 50K+ customers</div>
          <h1 className="hero-title">
            Home <span className="accent">Repair</span> &amp; <br />
            <span className="accent">Services</span> On Demand
          </h1>
          <p className="hero-desc">
            Expert technicians for AC, appliances, plumbing &amp; more.
            Book in minutes — get peace of mind.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => navigate('/services')}>
              Book Now <ArrowRight size={18} />
            </button>
            <button className="btn-hero-secondary" onClick={() => navigate('/services')}>
              Explore Services
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">4.9★</span>
              <span className="stat-label">Avg. Rating</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">2hr</span>
              <span className="stat-label">Response Time</span>
            </div>
          </div>
        </div>
        <div className="hero-visual desktop-only">
          <div className="hero-float-card hero-float-card-1">
            <div className="float-icon"><Wrench size={22} /></div>
            <div>
              <strong>AC Repair</strong>
              <span>Starting ₹499</span>
            </div>
          </div>
          <div className="hero-float-card hero-float-card-2">
            <div className="float-icon"><Brush size={22} /></div>
            <div>
              <strong>Carpet Clean</strong>
              <span>30% off</span>
            </div>
          </div>
          <div className="hero-float-card hero-float-card-3">
            <div className="float-icon"><ShieldCheck size={22} /></div>
            <div>
              <strong>Verified</strong>
              <span>Experts only</span>
            </div>
          </div>
          <div className="hero-circle-bg" />
        </div>
      </div>

      {/* ===== NORMAL VIEW ===== */}
      <>
        {/* --- Service Categories --- */}
        <div className="section-wrap">
          <div className="section-header">
            <h2 className="section-title">Home <span className="accent">Services</span></h2>
            <button className="section-view-all" onClick={() => navigate('/services')}>
              View All <ArrowRight size={16} />
            </button>
          </div>
          <div className="category-grid">
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="category-card skeleton" style={{ height: '195px' }} />
              ))
            ) : (
              serviceCategories.map(cat => (
                <div
                  key={cat._id}
                  className="category-card"
                  onClick={() => handleCategoryClick(cat, 'service')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(cat, 'service'); }}
                >
                  <div className="cat-icon-wrap">
                    <CategoryIcon category={cat} />
                  </div>
                  <span>{cat.category}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- Product Categories --- */}
        {!loading && productCategories.length > 0 && (
          <div className="section-wrap">
            <div className="section-header">
              <h2 className="section-title">Professional <span className="accent">Products</span></h2>
              <button className="section-view-all" onClick={() => navigate('/products')}>
                View All <ArrowRight size={16} />
              </button>
            </div>
            <div className="category-grid">
              {productCategories.map(cat => (
                <div
                  key={cat._id}
                  className="category-card"
                  onClick={() => handleCategoryClick(cat, 'product')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(cat, 'product'); }}
                >
                  <div className="cat-icon-wrap">
                    <CategoryIcon category={cat} />
                  </div>
                  <span>{cat.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Offers Section (Unique Animated Cards with Glowing Accents) --- */}
        <div className="section-wrap offers-section">
          <div className="section-header">
            <div className="section-header-titles">
              <h2 className="section-title">🔥 Exclusive <span className="accent">Offers</span> &amp; Deals</h2>
              <span className="section-subtitle">Handpicked discount vouchers • Limited time doorstep specials</span>
            </div>
          </div>
          <div className="offers-grid">
            {offers.map(offer => (
              <div
                key={offer.id}
                className={`offer-card ${offer.theme}`}
              >
                <div className="offer-card-glow" />
                <div className="offer-card-badge">
                  <span className="offer-badge-text">{offer.badge}</span>
                </div>
                <div className="offer-card-body">
                  <div className="offer-icon-wrapper">
                    {offer.icon}
                  </div>
                  <div className="offer-content">
                    <span className="offer-discount-tag">{offer.discount}</span>
                    <h3 className="offer-title">{offer.title}</h3>
                    <p className="offer-desc">{offer.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Appliance Repair & Services (Horizontal Scroll with Header & Floating Side Navigation, Fully Responsive) --- */}
        {!loading && services.length > 0 && (
          <div className="section-wrap appliance-section-wrap">
            <div className="section-header appliance-section-header">
              <div className="section-header-titles">
                <h2 className="section-title">🔧 Appliance <span className="accent">Repair</span> &amp; Services</h2>
                <span className="section-subtitle">Verified experts • 2-Hour fast doorstep delivery</span>
              </div>
              <div className="section-header-actions">
                <button className="section-view-all" onClick={() => navigate('/services')}>
                  View All <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="appliance-carousel-container">
              {canScrollLeft && (
                <button
                  className="appliance-floating-nav nav-left"
                  onClick={() => scrollApplianceCarousel(-320)}
                  aria-label="Scroll Left"
                  type="button"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div className="appliance-carousel" ref={applianceCarouselRef}>
                {services.map(service => {
                  const discountPercent = (service.serviceCost && service.discountedPrice && service.serviceCost > service.discountedPrice)
                    ? Math.round(((service.serviceCost - service.discountedPrice) / service.serviceCost) * 100)
                    : null;

                  return (
                    <div
                      key={service._id}
                      className="appliance-card"
                      onClick={() => handleServiceClick(service)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleServiceClick(service); }}
                    >
                      <div className="appliance-img-wrap">
                        {discountPercent ? (
                          <span className="appliance-badge discount-badge">{discountPercent}% OFF</span>
                        ) : (
                          <span className="appliance-badge popular-badge">TOP SERVICE</span>
                        )}
                        {service.serviceImages?.[0] ? (
                          <img src={service.serviceImages[0]} alt={service.serviceName} loading="lazy" />
                        ) : (
                          <div className="appliance-placeholder-icon">
                            <Wrench size={36} />
                          </div>
                        )}
                        <button className="share-btn-round" onClick={(e) => {
                          e.stopPropagation();
                          shareItem({
                            title: service.serviceName,
                            text: service.description || service.serviceName,
                            url: `${window.location.origin}/product-services?serviceId=${service._id}`
                          }, showToast);
                        }} aria-label="Share service">
                          <Share2 size={13} />
                        </button>
                        <div className="appliance-img-gradient-overlay" />
                      </div>
                      <div className="appliance-info">
                        <div className="appliance-meta-bar">
                          <span className="appliance-warranty">
                            <ShieldCheck size={12} /> 30-Day Warranty
                          </span>
                          <span className="appliance-rating">
                            <Star size={11} className="star-icon" /> 4.9
                          </span>
                        </div>
                        <span className="appliance-name" title={service.serviceName}>{service.serviceName}</span>
                        <div className="appliance-price-wrap">
                          <span className="appliance-price">₹{formatPriceSmart(service.discountedPrice || service.serviceCost)}</span>
                          {service.serviceCost > (service.discountedPrice || 0) && service.discountedPrice && (
                            <span className="appliance-old-price">₹{formatPriceSmart(service.serviceCost)}</span>
                          )}
                          {discountPercent && (
                            <span className="appliance-save-tag">Save {discountPercent}%</span>
                          )}
                        </div>
                        <div className="appliance-card-footer">
                          <button className="appliance-book-btn">
                            Book Service <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {canScrollRight && (
                <button
                  className="appliance-floating-nav nav-right"
                  onClick={() => scrollApplianceCarousel(320)}
                  aria-label="Scroll Right"
                  type="button"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- Why Choose Us (Unique Animated Interactive Motion Cards) --- */}
        <div className="section-wrap why-choose-section">
          <div className="section-header why-header">
            <div className="section-header-titles">
              <h2 className="section-title">Why <span className="accent">RightTouch</span>?</h2>
              <span className="section-subtitle">The gold standard in home repair, safety &amp; reliability</span>
            </div>
          </div>
          <div className="why-grid">
            {WHY_CHOOSE_US.map(item => (
              <div key={item.id} className="why-card">
                <div className="why-card-top">
                  <div className="why-icon-box">
                    <div className="why-icon-pulse" />
                    {item.icon}
                  </div>
                  <span className="why-badge-pill">{item.badge}</span>
                </div>
                <div className="why-card-body">
                  <h4 className="why-card-title">{item.title}</h4>
                  <p className="why-card-desc">{item.desc}</p>
                </div>
                <div className="why-card-accent-bar" />
              </div>
            ))}
          </div>
        </div>
      </>

      {/* Address Selection Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        currentUser={currentUser}
        onSelectAddress={(newAddressLine) => setUserAddress(newAddressLine)}
        showToast={showToast}
        onLoginClick={onLoginClick}
      />
    </section>
  );
};

export default HomePage;