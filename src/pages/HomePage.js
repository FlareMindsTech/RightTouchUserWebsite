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
} from 'lucide-react';
import { getAllCategories } from '../services/categoryService';
import { getAllServices } from '../services/serviceService';

// --- Static Data ---

const offers = [
  { id: 1, badge: 'HOT DEAL', title: 'Deep clean with foam-jet AC services', desc: 'AC service & repair', icon: <Wind size={40} /> },
  { id: 2, badge: 'NEW', title: 'Home affordable carpet cleaning', desc: 'Electrical & carpet services', icon: <Brush size={40} /> },
  { id: 3, badge: 'SAVE 20%', title: 'Premium plumbing services', desc: 'Bathroom & kitchen repair', icon: <Wrench size={40} /> }
];

const WHY_CHOOSE_US = [
  { icon: <ShieldCheck className="text-blue-500" />, title: 'Verified Experts', desc: 'All technicians are background-checked and certified.' },
  { icon: <Zap className="text-yellow-500" />, title: 'Fast Response', desc: 'Get a technician at your doorstep within 2 hours.' },
  { icon: <CircleDollarSign className="text-green-500" />, title: 'Best Prices', desc: 'Transparent pricing. No hidden charges.' },
  { icon: <RotateCcw className="text-red-500" />, title: 'Money-Back', desc: 'Not satisfied? Get a full refund, no questions asked.' }
];

// --- Category Icon Helper ---

const CategoryIcon = ({ category }) => {
  if (category.image) {
    return (
      <img
        src={category.image}
        alt={category.category}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    );
  }
  // Fallback: first letter avatar
  return (
    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--green)' }}>
      {category.category?.charAt(0) || '?'}
    </span>
  );
};

// --- Main Component ---

// Filter helper function
const filterBySearch = (items, query) => {
  if (!query || query.trim() === '') return items;
  const searchTerm = query.toLowerCase().trim();
  return items.filter(item => {
    const name = item.category?.toLowerCase() || item.serviceName?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    return name.includes(searchTerm) || description.includes(searchTerm);
  });
};

const HomePage = ({
  isActive,
  searchQuery,
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

  // Keep local state in sync with global props
  useEffect(() => {
    setServiceCategories([...initialServiceCategories].sort((a, b) => b.category.localeCompare(a.category)));
    setProductCategories(initialProductCategories);
    setServices(initialServices);
    setLoading(isGlobalLoading);
  }, [initialServiceCategories, initialProductCategories, initialServices, isGlobalLoading]);

  // Detect real user location
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setUserAddress('Location unavailable');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Use a signal or timeout for fetch
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          const data = await res.json();
          const addr = data.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || '';
          const city = addr.city || addr.town || addr.state_district || addr.state || '';
          const fullAddr = area && city ? `${area}, ${city}` : area || city || 'Unknown area';
          setUserAddress(fullAddr);
        } catch (err) {
          console.warn('[HomePage] Location fetch error:', err);
          setUserAddress('Location unavailable');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.warn('[HomePage] Geolocation error:', err);
        const msg = err.code === 1 ? 'Permission denied' : 'Slow connection';
        setUserAddress(msg);
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Filtered data based on search query
  const filteredServiceCategories = filterBySearch(serviceCategories, searchQuery);
  const filteredProductCategories = filterBySearch(productCategories, searchQuery);
  const filteredServices = filterBySearch(services, searchQuery);

  // Check if any results found
  const hasSearchResults = searchQuery && searchQuery.trim() !== '' &&
    (filteredServiceCategories.length > 0 || filteredProductCategories.length > 0 || filteredServices.length > 0);

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

  // If searching, show filtered results
  const isSearching = searchQuery && searchQuery.trim() !== '';

  return (
    <section className="page" id="page-home">
      {/* Location Bar */}
      <div className="location-bar mobile-only" onClick={detectLocation}>
        <div className="location-left">
          <MapPin size={20} className="location-pin" />
          <div className="location-text">
            <strong>Current Location</strong>
            <span>
              {locationLoading ? 'Detecting...' : userAddress}
              <ChevronDown size={14} className="chevron" />
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="desktop-hero desktop-only">
        <div className="hero-content">
          <p className="hero-sub">Your Trusted Partner for</p>
          <h1 className="hero-title">Home Repair &amp; Services</h1>
          <p className="hero-desc">Expert technicians for AC, appliances, plumbing &amp; more. Book in minutes.</p>
        </div>
      </div>

      {/* Show search results if searching */}
      {isSearching ? (
        <div className="section-wrap">
          <h2 className="section-title">Search <span className="accent">Results</span></h2>

          {/* Filtered Service Categories */}
          {filteredServiceCategories.length > 0 && (
            <div className="section-wrap" style={{ paddingTop: 0 }}>
              <h3 className="section-title" style={{ fontSize: '14px' }}>Service Categories</h3>
              <div className="category-grid">
                {filteredServiceCategories.slice(0, 8).map(cat => (
                  <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'service')}>
                    <div className="cat-icon-wrap" style={{ display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
                      <CategoryIcon category={cat} />
                    </div>
                    <span>{cat.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtered Product Categories */}
          {filteredProductCategories.length > 0 && (
            <div className="section-wrap" style={{ paddingTop: 0 }}>
              <h3 className="section-title" style={{ fontSize: '14px' }}>Product Categories</h3>
              <div className="category-grid">
                {filteredProductCategories.slice(0, 8).map(cat => (
                  <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'product')}>
                    <div className="cat-icon-wrap" style={{ display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
                      <CategoryIcon category={cat} />
                    </div>
                    <span>{cat.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtered Services */}
          {filteredServices.length > 0 && (
            <div className="section-wrap" style={{ paddingTop: 0 }}>
              <h3 className="section-title" style={{ fontSize: '14px' }}>Services</h3>
              <div className="carousel-track">
                {filteredServices.slice(0, 10).map(service => (
                  <div key={service._id} className="appliance-card" onClick={() => handleServiceClick(service)}>
                    <div className="appliance-img-wrap" style={{ display: 'grid', placeItems: 'center', color: 'var(--green-dark)' }}>
                      {service.serviceImages?.[0] ? (
                        <img src={service.serviceImages[0]} alt={service.serviceName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Wrench size={32} />
                      )}
                    </div>
                    <span style={{ fontSize: '12px', textAlign: 'center', display: 'block', marginTop: '8px', fontWeight: '600' }}>
                      {service.serviceName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results found */}
          {!hasSearchResults && !loading && (
            <div className="no-results" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Search size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No results found</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Try different keywords or browse our categories</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Normal View - Service Categories */}
          <div className="section-wrap">
            <h2 className="section-title">Home <span className="accent">Services</span></h2>
            <div className="category-grid">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="category-card skeleton" style={{ height: '100px', background: '#f1f5f9' }}></div>
                ))
              ) : (
                serviceCategories.slice(0, 8).map(cat => (
                  <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'service')}>
                    <div className="cat-icon-wrap" style={{ display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
                      <CategoryIcon category={cat} />
                    </div>
                    <span>{cat.category}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Product Categories */}
          {!loading && productCategories.length > 0 && (
            <div className="section-wrap">
              <h2 className="section-title">Professional <span className="accent">Products</span></h2>
              <div className="category-grid">
                {productCategories.slice(0, 8).map(cat => (
                  <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'product')}>
                    <div className="cat-icon-wrap" style={{ display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
                      <CategoryIcon category={cat} />
                    </div>
                    <span>{cat.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offers Carousel */}
          <div className="section-wrap">
            <h2 className="section-title">Offers for you</h2>
            <div className="carousel-track" id="offersCarousel">
              {offers.map(offer => (
                <div key={offer.id} className={`offer-card ${offer.id === 2 ? 'offer-card-2' : offer.id === 3 ? 'offer-card-3' : ''}`}>
                  <div className="offer-badge">{offer.badge}</div>
                  <div className="offer-text">
                    <h3>{offer.title}</h3>
                    <p>{offer.desc}</p>
                    <button className="btn-book-white" onClick={() => handleBookNow(offer)}>Book Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Appliance Repair Section */}
          <div className="section-wrap">
            <h2 className="section-title">Appliance repair &amp; Services</h2>
            <div className="carousel-track" id="applianceCarousel">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="appliance-card-premium skeleton" style={{ width: '160px', height: '180px', background: '#f1f5f9' }}></div>
                ))
              ) : (
                services.map(service => (
                  <div key={service._id} className="appliance-card-premium" onClick={() => handleServiceClick(service)}>
                    <div className="appliance-img-wrap-premium">
                      {service.serviceImages?.[0] ? (
                        <img src={service.serviceImages[0]} alt={service.serviceName} />
                      ) : (
                        <Wrench size={32} />
                      )}
                    </div>
                    <div className="appliance-info-premium">
                      <span className="appliance-name-premium">
                        {service.serviceName}
                      </span>
                      <div className="appliance-price-wrap">
                        <span className="appliance-price">₹{service.discountedPrice || service.serviceCost}</span>
                        {service.serviceCost > (service.discountedPrice || 0) && (
                          <span className="appliance-old-price">₹{service.serviceCost}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="section-wrap desktop-only">
            <h2 className="section-title">Why Choose RightTouch?</h2>
            <div className="why-grid">
              {WHY_CHOOSE_US.map(item => (
                <div key={item.title} className="why-card">
                  <div className="why-icon" style={{ fontSize: '2rem' }}>{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default HomePage;