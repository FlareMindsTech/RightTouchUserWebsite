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
  LayoutGrid,
  ShoppingBag,
  Clock,
  Share2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ServicePage.css';

const ServicePage = ({
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(isGlobalLoading);
  const [error] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, service: null });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 0,
  });
  const [visibleCount, setVisibleCount] = useState(9);
  const [shuffledCategories, setShuffledCategories] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Shuffle function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    setCategories(initialCategories);
    setAllServices(initialAllServices);
    setLoading(isGlobalLoading);
    if (initialCategories.length > 0) {
      setShuffledCategories(shuffleArray(initialCategories));
    }
  }, [initialCategories, initialAllServices, isGlobalLoading]);

  const effectiveSearchQuery = (searchQuery || '').trim().toLowerCase();

  useEffect(() => {
    let result = allServices;

    if (selectedCategory) {
      result = result.filter(s => {
        const sCatId = s.categoryId?._id || s.categoryId;
        return sCatId === selectedCategory._id;
      });
    }

    if (filters.priceRange !== 'all') {
      result = result.filter(s => {
        const price = s.discountedPrice || s.serviceCost;
        if (filters.priceRange === 'under500') return price < 500;
        if (filters.priceRange === '500to2000') return price >= 500 && price <= 2000;
        if (filters.priceRange === 'above2000') return price > 2000;
        return true;
      });
    }

    if (filters.rating > 0) {
      result = result.filter(s => (s.ratingSummary?.averageRating || 0) >= filters.rating);
    }

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
    setVisibleCount(9);
  }, [selectedCategory, allServices, effectiveSearchQuery, filters]);

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

  const handleCategoryClick = (category) => {
    if (!category) {
      navigate('/services');
    } else {
      navigate(`/services?category=${category._id}`);
    }
  };

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
    if (name.includes('solar')) return <Sun size={16} />;
    if (name.includes('ac') || name.includes('air')) return <Wind size={16} />;
    if (name.includes('electric')) return <Zap size={16} />;
    if (name.includes('plumb')) return <Droplets size={16} />;
    if (name.includes('clean')) return <Sparkles size={16} />;
    if (name.includes('paint')) return <Paintbrush size={16} />;
    if (name.includes('appliance') || name.includes('repair')) return <Cpu size={16} />;
    return <Wrench size={16} />;
  };

  const getCategoryColor = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('solar')) return '#F39C12';
    if (name.includes('ac') || name.includes('air')) return '#3498DB';
    if (name.includes('electric')) return '#E74C3C';
    if (name.includes('plumb')) return '#1ABC9C';
    if (name.includes('clean')) return '#9B59B6';
    if (name.includes('paint')) return '#E67E22';
    if (name.includes('appliance') || name.includes('repair')) return '#2ECC71';
    return '#0B7C4D';
  };

  const CategoryNav = () => (
    <div className="category-nav">
      <div className="category-nav-scroll">
        <button
          className={`category-nav-item ${!selectedCategory ? 'active' : ''}`}
          onClick={() => handleCategoryClick(null)}
        >
          <div className="category-nav-icon">
            <LayoutGrid size={16} />
          </div>
          <span>All Services</span>
        </button>
        {shuffledCategories.map(cat => (
          <button
            key={cat._id}
            className={`category-nav-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            <div className="category-nav-icon" style={{ background: selectedCategory?._id === cat._id ? 'rgba(255,255,255,0.2)' : getCategoryColor(cat.category) + '20' }}>
              {cat.image ? (
                <img src={cat.image} alt={cat.category} />
              ) : (
                getCategoryIcon(cat.category)
              )}
            </div>
            <span>{cat.category}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const FilterPanel = () => (
    <div className="filter-panel-modern">
      <div className="filter-group-modern">
        <h4 className="filter-group-label">Categories</h4>
        <div className="filter-list">
          <button
            className={`filter-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            <LayoutGrid size={16} />
            <span>All Services</span>
            <ChevronRight size={14} />
          </button>
          {shuffledCategories.map(cat => (
            <button
              key={cat._id}
              className={`filter-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {getCategoryIcon(cat.category)}
              <span>{cat.category}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && isActive) {
    return (
      <section className={`page ${isActive ? '' : 'hidden'}`}>
        <div className="loader-wrapper">
          <div className="loader-spinner"></div>
          <p className="loader-text">Loading services...</p>
        </div>
      </section>
    );
  }

  if (error && isActive) {
    return (
      <section className={`page ${isActive ? '' : 'hidden'}`}>
        <div className="error-wrapper">
          <div className="error-emoji">😕</div>
          <h2 className="error-heading">Something went wrong</h2>
          <p className="error-desc">{error}</p>
          <button className="error-btn" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-services">
      {/* Mobile Filter */}
      <div className="mobile-toolbar mobile-only">
        <button className="toolbar-filter" onClick={() => setShowMobileFilters(true)}>
          <Filter size={16} />
          <span>Filter</span>
          {(selectedCategory || filters.priceRange !== 'all' || filters.rating > 0) && (
            <span className="toolbar-dot">•</span>
          )}
        </button>
        <span className="toolbar-count">{filteredServices.length} services</span>
      </div>

      {/* Category Navigation */}
      <CategoryNav />

      <div className="content-area">
        <main className="main-content-area">
          {filteredServices.length > 0 ? (
            <>
              {/* Grid View Only - No List toggle */}
              <div className="service-grid">
                {filteredServices.slice(0, visibleCount).map((service, index) => {
                  const isHovered = hoveredCard === service._id;
                  const discount = service.serviceCost && service.discountedPrice 
                    ? Math.round(((service.serviceCost - service.discountedPrice) / service.serviceCost) * 100)
                    : 0;

                  return (
                  <div 
                    key={service._id} 
                    className={`service-card-modern ${isHovered ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredCard(service._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="card-image" onClick={() => handleServiceClick(service)}>
                      {service.serviceImages?.[0] ? (
                        <img src={service.serviceImages[0]} alt={service.serviceName} loading="lazy" />
                      ) : (
                        <div className="card-image-placeholder">
                          <Hammer size={28} />
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="discount-badge">-{discount}%</div>
                      )}
                      <div className="card-image-overlay">
                        <button className="card-view-link">Quick View</button>
                      </div>
                      <button className="share-btn" onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({
                            title: service.serviceName,
                            text: service.description,
                            url: window.location.href
                          });
                        }
                      }}>
                        <Share2 size={16} />
                      </button>
                    </div>

                    <div className="card-body" onClick={() => handleServiceClick(service)}>
                      <div className="card-header">
                        <h3 className="card-title">{service.serviceName}</h3>
                        <span className="card-category" style={{ background: getCategoryColor(service.categoryId?.category) + '20', color: getCategoryColor(service.categoryId?.category) }}>
                          {service.categoryId?.category || 'Service'}
                        </span>
                      </div>

                      <div className="card-meta">
                        <div className="card-rating">
                          <Star size={14} className="star-gold" fill="#F1C40F" />
                          <span className="rating-value">{service.ratingSummary?.averageRating || 0}</span>
                          <span className="card-review-count">
                            ({service.ratingSummary?.totalRatings || 0} reviews)
                          </span>
                        </div>
                        <div className="card-duration">
                          <Clock size={14} />
                          <span>{service.duration || 'Flexible'}</span>
                        </div>
                      </div>

                      <div className="card-price">
                        <span className="price-current">₹{service.discountedPrice || service.serviceCost}</span>
                        {service.serviceCost > (service.discountedPrice || 0) && (
                          <span className="price-original">₹{service.serviceCost}</span>
                        )}
                        {service.serviceCost > (service.discountedPrice || 0) && (
                          <span className="price-save">Save ₹{service.serviceCost - (service.discountedPrice || service.serviceCost)}</span>
                        )}
                      </div>

                      {service.serviceHighlights?.length > 0 && (
                        <div className="card-features">
                          {service.serviceHighlights.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="card-feature">{item}</span>
                          ))}
                          {service.serviceHighlights.length > 3 && (
                            <span className="card-feature more">+{service.serviceHighlights.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      {isInCart && isInCart(service._id) ? (
                        <>
                          <div className="qty-control-modern">
                            <button
                              className="qty-btn-modern"
                              onClick={() => handleDecrementService(service)}
                            >
                              −
                            </button>
                            <span className="qty-value-modern">
                              {getServiceQuantity(service._id)}
                            </span>
                            <button
                              className="qty-btn-modern"
                              onClick={() => handleIncrementService(service)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="action-btn action-remove"
                            onClick={() => confirmAndRemoveService(service)}
                          >
                            <X size={14} /> Remove
                          </button>
                        </>
                      ) : (
                        <button
                          className="action-btn action-add"
                          onClick={() => handleIncrementService(service)}
                        >
                          <ShoppingBag size={16} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              </div>

              {/* Mobile Compact Cards */}
              <div className="mobile-compact-grid mobile-only">
                {filteredServices.slice(0, visibleCount).map(service => {
                  const discount = service.serviceCost && service.discountedPrice 
                    ? Math.round(((service.serviceCost - service.discountedPrice) / service.serviceCost) * 100)
                    : 0;
                  return (
                  <div
                    key={service._id}
                    className="mobile-compact-card"
                    onClick={() => handleServiceClick(service)}
                  >
                    <div className="compact-card-image">
                      {service.serviceImages?.[0] ? (
                        <img src={service.serviceImages[0]} alt={service.serviceName} />
                      ) : (
                        <Wrench size={18} />
                      )}
                      {discount > 0 && (
                        <div className="compact-discount">-{discount}%</div>
                      )}
                      <div className="compact-card-overlay">
                        <span>View</span>
                      </div>
                    </div>
                    <div className="compact-card-info">
                      <h4 className="compact-card-title">{service.serviceName}</h4>
                      <div className="compact-card-price">
                        ₹{service.discountedPrice || service.serviceCost}
                        {service.serviceCost > (service.discountedPrice || 0) && (
                          <span className="compact-original">₹{service.serviceCost}</span>
                        )}
                      </div>
                      <div className="compact-card-rating">
                        <Star size={10} className="star-gold" fill="#F1C40F" />
                        <span>{service.ratingSummary?.averageRating || 0}</span>
                      </div>
                    </div>
                    <div className="compact-card-action" onClick={(e) => e.stopPropagation()}>
                      {isInCart && isInCart(service._id) ? (
                        <div className="compact-qty">
                          <button
                            className="compact-qty-btn"
                            onClick={() => handleDecrementService(service)}
                          >
                            −
                          </button>
                          <span className="compact-qty-value">
                            {getServiceQuantity(service._id)}
                          </span>
                          <button
                            className="compact-qty-btn"
                            onClick={() => handleIncrementService(service)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="compact-add-btn"
                          onClick={() => handleIncrementService(service)}
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              </div>

              {/* Load More */}
              {visibleCount < filteredServices.length && (
                <div className="load-more-wrapper">
                  <button
                    className="load-more-btn-modern"
                    onClick={() => setVisibleCount(prev => prev + 9)}
                  >
                    <span>Load More Services</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-modern">
              <div className="empty-icon-wrapper">
                <Search size={48} />
              </div>
              <h3 className="empty-heading">No services found</h3>
              <p className="empty-desc">
                We couldn't find any services matching your criteria.
              </p>
              <button className="empty-action" onClick={clearAllFilters}>
                Reset Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="drawer-overlay-modern" onClick={() => setShowMobileFilters(false)}>
          <div className="drawer-modern" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header-modern">
              <h3 className="drawer-title-modern">Filters</h3>
              <button className="drawer-close-modern" onClick={() => setShowMobileFilters(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="drawer-body-modern">
              <FilterPanel />
            </div>
            <div className="drawer-footer-modern">
              <button
                className="drawer-btn-secondary"
                onClick={() => {
                  clearAllFilters();
                  setShowMobileFilters(false);
                }}
              >
                Reset All
              </button>
              <button
                className="drawer-btn-primary"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="dialog-overlay-modern" onClick={handleCancelRemove}>
          <div className="dialog-modern" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon-modern">
              <X size={28} />
            </div>
            <h3 className="dialog-title-modern">Remove from cart?</h3>
            <p className="dialog-desc-modern">
              <strong>{confirmDialog.service?.serviceName}</strong> will be removed from your cart.
            </p>
            <div className="dialog-actions-modern">
              <button className="dialog-btn-cancel" onClick={handleCancelRemove}>
                Keep
              </button>
              <button className="dialog-btn-confirm" onClick={handleConfirmRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServicePage;