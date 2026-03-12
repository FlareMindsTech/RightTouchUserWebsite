import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Building2,
  ChevronLeft,
  Star,
  Sun,
  Car,
  Wrench,
  Search,
  Hammer
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllServices } from '../services/serviceService';
import { getAllCategories } from '../services/categoryService';
import '../styles/services.css';

// Filter helper function
const filterBySearch = (items, query) => {
  if (!query || query.trim() === '') return items;
  const searchTerm = query.toLowerCase().trim();
  return items.filter(item => {
    const name = item.serviceName?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    const category = item.categoryId?.category?.toLowerCase() || '';
    return name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
  });
};

const ServicesPage = ({
  isActive,
  onNavigate,
  onOpenServiceDetail,
  addToCart,
  cartItems = [],
  updateQuantity,
  removeFromCart,
  showToast,
  isInCart,
  searchQuery,
  categories: initialCategories = [],
  allServices: initialAllServices = [],
  dataLoading: isGlobalLoading
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get('category');

  const [categories, setCategories] = useState(initialCategories);
  const [allServices, setAllServices] = useState(initialAllServices);
  const [filteredServices, setFilteredServices] = useState([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [view, setView] = useState('services'); // Default to 'services' to show all
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(isGlobalLoading);
  const [error, setError] = useState(null);

  // Sync with global props
  useEffect(() => {
    setCategories(initialCategories);
    setAllServices(initialAllServices);
    setLoading(isGlobalLoading);
  }, [initialCategories, initialAllServices, isGlobalLoading]);

  // Unify search queries: favor global search if active, otherwise use local
  const effectiveSearchQuery = (searchQuery || localSearchQuery || '').trim().toLowerCase();

  // Unified filtering logic
  useEffect(() => {
    let result = allServices;

    // 1. Filter by category
    if (selectedCategory) {
      result = result.filter(s => {
        const sCatId = s.categoryId?._id || s.categoryId;
        return sCatId === selectedCategory._id;
      });
    }

    // 2. Filter by search query
    if (effectiveSearchQuery) {
      result = result.filter(item => {
        const name = (item.serviceName || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const category = (item.categoryId?.category || '').toLowerCase();
        return name.includes(effectiveSearchQuery) ||
          description.includes(effectiveSearchQuery) ||
          category.includes(effectiveSearchQuery);
      });
    }

    setFilteredServices(result);
  }, [selectedCategory, allServices, effectiveSearchQuery]);



  // Sync state with URL category
  useEffect(() => {
    if (categories.length > 0) {
      if (categoryIdFromUrl) {
        const category = categories.find(c => c._id === categoryIdFromUrl);
        if (category) {
          setSelectedCategory(category);
        }
      } else {
        setSelectedCategory(null);
      }
    }
  }, [categoryIdFromUrl, categories]);

  // Handle category selection via URL
  const handleCategoryClick = (category) => {
    if (!category) {
      navigate('/services'); // Reset to all
    } else {
      navigate(`/services?category=${category._id}`);
    }
  };

  // Handle service click
  const handleServiceClick = (service) => {
    const categoryName = service.categoryId?.category || selectedCategory?.category || 'AC';
    navigate(`/product-services?type=${encodeURIComponent(categoryName)}&serviceId=${service._id}`);
  };


  if (loading && isActive) {
    return (
      <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
        <div className="services-hero">
          <h1>Loading <span className="accent">Services...</span></h1>
        </div>
        <div className="section-wrap">
          <div className="loading-spinner" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="spinner"></div>
            <p>Fetching available services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && isActive) {
    return (
      <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
        <div className="services-hero">
          <h1><span className="accent">Oops!</span></h1>
          <p>{error}</p>
        </div>
        <div className="section-wrap">
          <div style={{ textAlign: 'center' }}>
            <button className="retry-button" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </section>
    );
  }

  // Check if searching
  const isSearching = effectiveSearchQuery !== '';

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
      {/* Page Header */}
      <div className="services-hero desktop-only" style={{ textAlign: 'left' }}>
        <h1>{selectedCategory ? selectedCategory.category : 'Our'} <span className="accent">Services</span></h1>
        <p>{selectedCategory ? `Specialized ${selectedCategory.category} services for you` : 'Browse all our premium home services'}</p>
      </div>

      {/* Mobile Top Section */}
      <div className="services-mobile-container mobile-only">
        <h2 className="mobile-page-title">Home Services</h2>
        <div className="search-pill-container">
          <Search className="search-pill-icon" size={20} />
          <input
            type="text"
            className="search-pill-input"
            placeholder="Search for services"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="section-wrap" style={{ paddingBottom: 0 }}>
        {/* Category Ribbon */}
        <div className="category-ribbon">
          <button
            className={`ribbon-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            All Services
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              className={`ribbon-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat.category}
            </button>
          ))}
        </div>
      </div>

      <div className="section-wrap">
        {filteredServices.length > 0 ? (
          <div className="services-results-container">
            {/* Desktop View (Massive Cards) */}
            <div className="massive-list desktop-only">
              {filteredServices.map(service => (
                <div key={service._id} className="massive-section-wrap">
                  <div className="massive-card">
                    {service.isPopular && <span className="premium-badge badge-popular">Popular</span>}
                    {service.isRecommended && <span className="premium-badge badge-recommended">Recommended</span>}
                    <div className="massive-card-content">
                      <h3 className="massive-card-title">{service.serviceName}</h3>
                      <div className="massive-card-rating">
                        <Star size={16} className="star-icon" />
                        <span>
                          {service.ratingSummary?.averageRating || 0.0} ({service.ratingSummary?.totalRatings || 0} reviews)
                        </span>
                      </div>
                      <div className="massive-card-price">
                        ₹{service.discountedPrice || service.serviceCost} •
                      </div>
                      <ul className="massive-card-description">
                        {(service.description?.split(',') || []).slice(0, 3).map((item, idx) => (
                          <li key={idx}>{item.trim()}</li>
                        ))}
                      </ul>
                      <div className="massive-card-link" onClick={() => handleServiceClick(service)}>
                        View details
                      </div>
                    </div>
                    <div className="massive-card-right">
                      <div className="massive-card-image">
                        {service.serviceImages?.[0] ? (
                          <img src={service.serviceImages[0]} alt={service.serviceName} />
                        ) : (
                          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>
                            <Wrench size={40} />
                          </div>
                        )}
                      </div>
                      {isInCart(service._id) ? (
                        <div className="quantity-container-cart">
                          <button
                            className="qty-btn-cart qty-minus"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cartItem = cartItems.find(item => (item.originalId || item.itemId?._id) === service._id);
                              if (cartItem) {
                                const currentQty = cartItem.quantity || 1;
                                if (currentQty > 1) {
                                  updateQuantity(cartItem.originalId || cartItem.itemId, cartItem.itemType || 'service', currentQty - 1);
                                  showToast('Removed one from cart');
                                } else {
                                  removeFromCart(cartItem.id);
                                  showToast(`${service.serviceName} removed from cart`);
                                }
                              }
                            }}
                          >
                            −
                          </button>
                          <span className="qty-value-cart">
                            {cartItems.find(item => (item.originalId || item.itemId?._id) === service._id)?.quantity || 1}
                          </span>
                          <button
                            className="qty-btn-cart qty-plus"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cartItem = cartItems.find(item => (item.originalId || item.itemId?._id) === service._id);
                              if (cartItem) {
                                const currentQty = cartItem.quantity || 1;
                                updateQuantity(cartItem.originalId || cartItem.itemId, cartItem.itemType || 'service', currentQty + 1);
                                showToast('Added one more to cart');
                              }
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="massive-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({ ...service, itemType: 'service' });
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View (Compact Cards) */}
            <div className="compact-service-grid mobile-only">
              {filteredServices.map(service => (
                <div
                  key={service._id}
                  className="compact-service-card"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="compact-image-box">
                    {service.serviceImages?.[0] ? (
                      <img src={service.serviceImages[0]} alt={service.serviceName} className="compact-img" />
                    ) : (
                      <Hammer size={18} />
                    )}
                  </div>
                  <div className="compact-info">
                    <h4 className="compact-name">{service.serviceName}</h4>
                    {service.serviceCost && (
                      <p className="compact-subtitle">₹{service.serviceCost}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-services-message" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              No services found
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {isSearching ? `We couldn't find anything for "${effectiveSearchQuery}"` : "This category is empty for now."}
            </p>
            {isSearching && (
              <button
                className="view-details-link"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setLocalSearchQuery('');
                  onNavigate('services'); // This might clear global search if App handles it
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesPage;