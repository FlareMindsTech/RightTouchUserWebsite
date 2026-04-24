import React, { useState, useEffect } from 'react';
import {
  Star,
  Search,
  Filter,
  X,
  Wrench,
  Hammer,
  Zap,
  Wind,
  Sun,
  Droplets,
  Sparkles,
  Cpu,
  Paintbrush,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/services.css';


const ServicesPage = ({
  isActive,
  onNavigate,
  onOpenServiceDetail,
  addToCart,
  removeFromCart,
  updateQuantity,
  isInCart,
  cartItems,
  showToast,
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(isGlobalLoading);
  const [error] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, service: null });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 0,
  });
  const [visibleCount, setVisibleCount] = useState(8);

  // Sync with global props
  useEffect(() => {
    setCategories(initialCategories);
    setAllServices(initialAllServices);
    setLoading(isGlobalLoading);
  }, [initialCategories, initialAllServices, isGlobalLoading]);

  // Prioritize navbar/global searchQuery for services page filtering
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

    // 2. Filter by Price Range
    if (filters.priceRange !== 'all') {
      result = result.filter(s => {
        const price = s.discountedPrice || s.serviceCost;
        if (filters.priceRange === 'under500') return price < 500;
        if (filters.priceRange === '500to2000') return price >= 500 && price <= 2000;
        if (filters.priceRange === 'above2000') return price > 2000;
        return true;
      });
    }

    // 3. Filter by Rating
    if (filters.rating > 0) {
      result = result.filter(s => (s.ratingSummary?.averageRating || 0) >= filters.rating);
    }

    // 4. Filter by search query
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
    setVisibleCount(8); // Reset visibility when filters change
  }, [selectedCategory, allServices, effectiveSearchQuery, filters]);



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

  const clearAllFilters = () => {
    setFilters({ priceRange: 'all', rating: 0 });
    setSelectedCategory(null);
    navigate('/services');
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('solar')) return <Sun size={18} />;
    if (name.includes('ac') || name.includes('air')) return <Wind size={18} />;
    if (name.includes('electric')) return <Zap size={18} />;
    if (name.includes('plumb')) return <Droplets size={18} />;
    if (name.includes('clean')) return <Sparkles size={18} />;
    if (name.includes('paint')) return <Paintbrush size={18} />;
    if (name.includes('appliance') || name.includes('repair')) return <Cpu size={18} />;
    return <Wrench size={18} />;
  };

  const TopCategoryBar = () => (
    <div className="top-category-bar">
      <div
        className={`top-cat-item ${!selectedCategory ? 'active' : ''}`}
        onClick={() => handleCategoryClick(null)}
      >
        <div className="top-cat-icon"><LayoutGrid size={20} /></div>
        <span className="top-cat-label">All Services</span>
      </div>
      {categories.map(cat => (
        <div
          key={cat._id}
          className={`top-cat-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
          onClick={() => handleCategoryClick(cat)}
        >
          <div className="top-cat-icon">
            {cat.image ? (
              <img src={cat.image} alt={cat.category} className="top-cat-img" />
            ) : (
              getCategoryIcon(cat.category)
            )}
          </div>
          <span className="top-cat-label">{cat.category}</span>
        </div>
      ))}
    </div>
  );

  const FilterContent = () => (
    <div className="filter-content-inner">
      <div className="filter-section">
        <h4 className="section-title">Browse Categories</h4>
        <div className="category-menu">
          <div
            className={`menu-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            <div className="menu-icon"><LayoutGrid size={18} /></div>
            <span className="menu-label">All Services</span>
            <ChevronRight className="menu-chevron" size={14} />
          </div>
          {categories.map(cat => (
            <div
              key={cat._id}
              className={`menu-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <div className="menu-icon">{getCategoryIcon(cat.category)}</div>
              <span className="menu-label">{cat.category}</span>
              <ChevronRight className="menu-chevron" size={14} />
            </div>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <button className="reset-all-btn" onClick={clearAllFilters}>
          <X size={16} /> Reset Categories
        </button>
      )}
    </div>
  );


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



  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
      {/* Mobile Search - Keeping it compact */}
      <div className="services-mobile-container mobile-only" style={{ padding: '0 16px', marginTop: '12px' }}>
        <div className="search-pill-container" style={{ margin: 0 }}>
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

      <div className="section-wrap">
        {/* Mobile Filter Bar */}
        <div className="mobile-filter-bar mobile-only">
          <div className="filter-toggle-btn" onClick={() => setShowMobileFilters(true)}>
            <Filter size={18} />
            <span>Filters {(selectedCategory || filters.priceRange !== 'all' || filters.rating > 0) && "•"}</span>
          </div>
          <p className="results-count-text">
            {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'} Found
          </p>
        </div>

        <div className="services-layout-wrapper">
          {/* Main Content Area */}
          <main className="services-results-main full-width">
            <TopCategoryBar />

            {/* Active Chips (Desktop Only) */}
            <div className="active-chips-container desktop-only">
              {selectedCategory && (
                <div className="active-chip">
                  Category: {selectedCategory.category}
                  <X size={14} onClick={() => setSelectedCategory(null)} />
                </div>
              )}
            </div>

            {filteredServices.length > 0 ? (
              <div className="services-results-container">
                {/* Desktop View (Massive Cards) */}
                <div className="massive-list desktop-only">
                  {filteredServices.slice(0, visibleCount).map(service => (
                    <div key={service._id} className="massive-section-wrap">
                      <div className="massive-card">
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
                              <img src={service.serviceImages[0]} alt={service.serviceName} loading="lazy" />
                            ) : (
                              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>
                                <Wrench size={40} />
                              </div>
                            )}
                          </div>
                          {isInCart && isInCart(service._id) ? (
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIncrementService(service);
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
                  {filteredServices.slice(0, visibleCount).map(service => (
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
                          <p className="compact-subtitle">₹{service.discountedPrice || service.serviceCost}</p>
                        )}
                      </div>
                      <div className="compact-card-actions" onClick={(e) => e.stopPropagation()}>
                        {isInCart && isInCart(service._id) ? (
                          <>
                            <div className="compact-quantity-container">
                              <button
                                className="compact-qty-btn"
                                onClick={() => handleDecrementService(service)}
                                aria-label={`Decrease quantity for ${service.serviceName}`}
                              >
                                -
                              </button>
                              <span className="compact-qty-value">{getServiceQuantity(service._id)}</span>
                              <button
                                className="compact-qty-btn"
                                onClick={() => handleIncrementService(service)}
                                aria-label={`Increase quantity for ${service.serviceName}`}
                              >
                                +
                              </button>
                            </div>
                            <button
                              className="compact-remove-btn"
                              onClick={() => confirmAndRemoveService(service)}
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            className="compact-add-btn"
                            onClick={() => handleIncrementService(service)}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show More Button */}
                {visibleCount < filteredServices.length && (
                  <div className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCount(prev => prev + 8)}
                    >
                      Show More Services
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-services-message">
                <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
                <h3>No matches found</h3>
                <p>
                  Try adjusting your filters or search query to find what you're looking for.
                </p>
                <button className="clear-search-btn" onClick={clearAllFilters}>
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="filters-drawer-overlay" onClick={() => setShowMobileFilters(false)}>
          <div className="filters-drawer-content mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Filters</h3>
              <button className="drawer-close" onClick={() => setShowMobileFilters(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="drawer-body">
              <FilterContent />
            </div>
            <div className="mobile-filter-actions">
              <button
                className="clear-filters-btn"
                style={{ flex: 1, marginTop: 0 }}
                onClick={() => {
                  clearAllFilters();
                  setShowMobileFilters(false);
                }}
              >
                Reset
              </button>
              <button
                className="apply-filters-btn"
                onClick={() => setShowMobileFilters(false)}
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

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
    </section>
  );
};

export default ServicesPage;
