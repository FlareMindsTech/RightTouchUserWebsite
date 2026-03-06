import React, { useState, useEffect } from 'react';
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
  Building2,
  Sun,
  Car
} from 'lucide-react';
import { getAllCategories } from '../services/categoryService';
import { getAllServices } from '../services/serviceService';

// --- Static Data Moved Outside Component for Performance ---

const CATEGORY_ICON_MAP = {
  'Commercial': <Building2 size={24} />,
  'Solar': <Sun size={24} />,
  'Security': <ShieldCheck size={24} />,
  'Ev Services': <Car size={24} />,
  'AC': <Wind size={24} />,
  'Appliance Repair': <Wrench size={24} />,
  'Washing Machine': <Zap size={24} />,
  'Refrigerator': <RotateCcw size={24} />,
  'Television': <RotateCcw size={24} />,
  'Water Purifier': <Zap size={24} />,
  'default': <Wrench size={24} />
};

const OFFERS = [
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

const CategoryIcon = ({ category }) => {
  if (category.image) {
    return <img src={category.image} alt={category.category} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
  }
  return CATEGORY_ICON_MAP[category.category] || CATEGORY_ICON_MAP['default'];
};

// --- Main Component ---

const HomePage = ({ isActive, showToast }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceCategories, setServiceCategories] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isActive) return;
      try {
        setLoading(true);
        const [servCatRes, prodCatRes, servRes] = await Promise.all([
          getAllCategories({ categoryType: 'service' }),
          getAllCategories({ categoryType: 'product' }),
          getAllServices({ limit: 10 })
        ]);

        const servCats = servCatRes?.result || servCatRes?.data || servCatRes;
        if (Array.isArray(servCats)) setServiceCategories(servCats);

        const prodCats = prodCatRes?.result || prodCatRes?.data || prodCatRes;
        if (Array.isArray(prodCats)) setProductCategories(prodCats);

        const servs = servRes?.result?.services || servRes?.data || servRes;
        if (Array.isArray(servs)) setServices(servs);
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isActive]);

  const handleCategoryClick = (category, type) => {
    navigate(type === 'product' ? `/products` : `/services`);
    showToast(`Opening ${category.category} ${type}s`);
  };

  const handleServiceClick = (service) => {
    const categoryName = service.categoryId?.category || 'Service';
    navigate(`/product-services?type=${encodeURIComponent(categoryName)}&serviceId=${service._id}`);
    showToast(`Opening ${service.serviceName}`);
  };

  const handleBookNow = (offer) => {
    showToast(`Booking ${offer.title}`);
  };

  if (!isActive) return null;

  return (
    <section className="page" id="page-home">
      {/* Location Bar */}
      <div className="location-bar mobile-only">
        <div className="location-left">
          <MapPin size={20} className="location-pin" />
          <div className="location-text">
            <strong>Current Location</strong>
            <span>Detecting address... <ChevronDown size={14} className="chevron" /></span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="desktop-hero desktop-only">
        <div className="hero-content">
          <p className="hero-sub">Your Trusted Partner for</p>
          <h1 className="hero-title">Home Repair & Services</h1>
          <p className="hero-desc">Expert technicians for AC, appliances, plumbing & more. Book in minutes.</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section mobile-only">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search for services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Service Categories */}
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
        <div className="carousel-track">
          {OFFERS.map(offer => (
            <div key={offer.id} className={`offer-card offer-card-${offer.id}`}>
              <div className="offer-badge">{offer.badge}</div>
              <div className="offer-text">
                <h3>{offer.title}</h3>
                <p>{offer.desc}</p>
                <button className="btn-book-white" onClick={() => handleBookNow(offer)}>Book Now</button>
              </div>
              <div className={`offer-img offer-img-${offer.id}`}>{offer.icon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Appliance Repair Section */}
      <div className="section-wrap">
        <h2 className="section-title">Appliance repair & Services</h2>
        <div className="carousel-track">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="appliance-card skeleton" style={{ minWidth: '120px', height: '140px', background: '#f1f5f9' }}></div>
            ))
          ) : (
            services.map(service => (
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
    </section>
  );
};

export default HomePage;