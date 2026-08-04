import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import '../styles/home.css';

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
                loading="lazy"
            />
        );
    }
    return (
        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--green)' }}>
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
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);

                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
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

    // Filtered data
    const filteredServiceCategories = filterBySearch(serviceCategories, searchQuery);
    const filteredProductCategories = filterBySearch(productCategories, searchQuery);
    const filteredServices = filterBySearch(services, searchQuery);

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

    const isSearching = searchQuery && searchQuery.trim() !== '';

    // --- Render ---
    return (
        <section className="home-page" id="page-home">
            {/* ===== LOCATION BAR - No Change Button ===== */}
            <div className="location-bar">
                <div className="location-left">
                    <MapPin size={20} className="location-pin" />
                    <div className="location-text">
                        <strong>Current Location</strong>
                        <span>
                            {locationLoading ? 'Detecting...' : userAddress}
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

            {/* ===== SEARCH RESULTS (when searching) ===== */}
            {isSearching ? (
                <div className="search-results-section">
                    <div className="search-results-header">
                        <h2>Search <span className="accent">Results</span></h2>
                        <div className="search-results-count">
                            Found {filteredServiceCategories.length + filteredProductCategories.length + filteredServices.length} items
                        </div>
                    </div>

                    {filteredServiceCategories.length > 0 && (
                        <div className="section-wrap">
                            <h3 className="search-sub-title">Service Categories</h3>
                            <div className="category-grid">
                                {filteredServiceCategories.map(cat => (
                                    <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'service')}>
                                        <div className="cat-icon-wrap">
                                            <CategoryIcon category={cat} />
                                        </div>
                                        <span>{cat.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredProductCategories.length > 0 && (
                        <div className="section-wrap">
                            <h3 className="search-sub-title">Product Categories</h3>
                            <div className="category-grid">
                                {filteredProductCategories.map(cat => (
                                    <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'product')}>
                                        <div className="cat-icon-wrap">
                                            <CategoryIcon category={cat} />
                                        </div>
                                        <span>{cat.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredServices.length > 0 && (
                        <div className="section-wrap">
                            <h3 className="search-sub-title">Services</h3>
                            <div className="services-grid">
                                {filteredServices.map(service => (
                                    <div key={service._id} className="search-service-card" onClick={() => handleServiceClick(service)}>
                                        <div className="search-service-img">
                                            {service.serviceImages?.[0] ? (
                                                <img src={service.serviceImages[0]} alt={service.serviceName} />
                                            ) : (
                                                <div className="service-img-placeholder"><Wrench size={28} /></div>
                                            )}
                                        </div>
                                        <div className="search-service-info">
                                            <h4 className="search-service-name">{service.serviceName}</h4>
                                            <div className="search-service-price-block">
                                                <span className="search-service-price">₹{service.discountedPrice || service.serviceCost}</span>
                                                {service.serviceCost > (service.discountedPrice || 0) && (
                                                    <span className="search-service-old-price">₹{service.serviceCost}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!hasSearchResults && !loading && (
                        <div className="no-results">
                            <div className="no-results-icon"><Search size={40} /></div>
                            <h3>No matches found</h3>
                            <p>We couldn't find any services or categories matching "<strong>{searchQuery}</strong>"</p>
                            <button className="btn-hero-primary" onClick={() => navigate('/services')}>
                                Browse All Services
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* ===== NORMAL VIEW ===== */
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
                                    <div key={i} className="category-card skeleton" style={{ height: '100px' }} />
                                ))
                            ) : (
                                serviceCategories.map(cat => (
                                    <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'service')}>
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
                                    <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat, 'product')}>
                                        <div className="cat-icon-wrap">
                                            <CategoryIcon category={cat} />
                                        </div>
                                        <span>{cat.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Offers Carousel --- */}
                    <div className="section-wrap offers-section">
                        <div className="section-header">
                            <h2 className="section-title">🔥 Exclusive <span className="accent">Offers</span></h2>
                            <button className="section-view-all" onClick={() => navigate('/offers')}>
                                See All <ArrowRight size={16} />
                            </button>
                        </div>
                        <div className="offers-carousel">
                            {offers.map(offer => (
                                <div key={offer.id} className={`offer-card ${offer.id === 2 ? 'offer-card-2' : offer.id === 3 ? 'offer-card-3' : ''}`}>
                                    <div className="offer-badge">{offer.badge}</div>
                                    <div className="offer-icon">{offer.icon}</div>
                                    <div className="offer-text">
                                        <h3>{offer.title}</h3>
                                        <p>{offer.desc}</p>
                                        <button className="btn-book-white" onClick={() => handleBookNow(offer)}>
                                            Book Now →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Appliance Repair & Services (Horizontal Scroll) --- */}
                    {!loading && services.length > 0 && (
                        <div className="section-wrap">
                            <div className="section-header">
                                <h2 className="section-title">🔧 Appliance <span className="accent">Repair</span> &amp; Services</h2>
                                <button className="section-view-all" onClick={() => navigate('/services')}>
                                    View All <ArrowRight size={16} />
                                </button>
                            </div>
                            <div className="appliance-carousel">
                                {services.map(service => (
                                    <div key={service._id} className="appliance-card" onClick={() => handleServiceClick(service)}>
                                        <div className="appliance-img-wrap">
                                            {service.serviceImages?.[0] ? (
                                                <img src={service.serviceImages[0]} alt={service.serviceName} />
                                            ) : (
                                                <Wrench size={28} />
                                            )}
                                        </div>
                                        <div className="appliance-info">
                                            <span className="appliance-name">{service.serviceName}</span>
                                            <div className="appliance-price-wrap">
                                                <span className="appliance-price">₹{service.discountedPrice || service.serviceCost}</span>
                                                {service.serviceCost > (service.discountedPrice || 0) && service.discountedPrice && (
                                                    <span className="appliance-old-price">₹{service.serviceCost}</span>
                                                )}
                                            </div>
                                            <button className="appliance-book-btn">View</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Why Choose Us --- */}
                    <div className="section-wrap why-choose-section">
                        <div className="section-header">
                            <h2 className="section-title">Why <span className="accent">RightTouch</span>?</h2>
                        </div>
                        <div className="why-grid">
                            {WHY_CHOOSE_US.map(item => (
                                <div key={item.title} className="why-card">
                                    <div className="why-icon">{item.icon}</div>
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