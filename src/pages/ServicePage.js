import React, { useState, useEffect } from 'react';
import {
  Star,
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
  LayoutGrid,
  ShoppingCart,
  Clock,
  Minus,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { shareItem } from '../utils/share';
import { formatPriceSmart } from '../utils/format';
import ConfirmModal from '../components/ConfirmModal';
import './ServicePage.css';

const PRICE_RANGES = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹500', value: 'under-500' },
  { label: '₹500 - ₹2000', value: '500-2000' },
  { label: 'Above ₹2000', value: 'above-2000' },
];

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
  dataLoading: isGlobalLoading,
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
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    setCategories(initialCategories);
    setAllServices(initialAllServices);
    setLoading(isGlobalLoading);
  }, [initialCategories, initialAllServices, isGlobalLoading]);

  useEffect(() => {
    let result = allServices;

    if (selectedCategory) {
      result = result.filter((s) => {
        const sCatId = s.categoryId?._id || s.categoryId;
        return sCatId === selectedCategory._id;
      });
    }

    if (filters.priceRange !== 'all') {
      result = result.filter((s) => {
        const price = s.discountedPrice || s.serviceCost;
        if (filters.priceRange === 'under-500') return price < 500;
        if (filters.priceRange === '500-2000') return price >= 500 && price <= 2000;
        if (filters.priceRange === 'above-2000') return price > 2000;
        return true;
      });
    }

    if (filters.rating > 0) {
      result = result.filter((s) => (s.ratingSummary?.averageRating || 0) >= filters.rating);
    }

    setFilteredServices(result);
    setVisibleCount(9);
  }, [selectedCategory, allServices, filters]);

  useEffect(() => {
    if (categories.length > 0) {
      if (categoryIdFromUrl) {
        const category = categories.find((c) => c._id === categoryIdFromUrl);
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
    const categoryName =
      service.categoryId?.category || selectedCategory?.category || 'AC';
    navigate(
      `/product-services?type=${encodeURIComponent(categoryName)}&serviceId=${service._id}`
    );
  };

  const getCartItemForService = (serviceId) => {
    if (!Array.isArray(cartItems)) return null;
    return (
      cartItems.find(
        (item) =>
          (item.itemId?._id || item.originalId || item.id || item._id) === serviceId
      ) || null
    );
  };

  const getServiceQuantity = (serviceId) => {
    const cartItem = getCartItemForService(serviceId);
    return Number(cartItem?.quantity || 1);
  };

  const confirmAndRemoveService = (service) => {
    setConfirmDialog({ open: true, service });
  };

  const handleConfirmRemove = async () => {
    const { service } = confirmDialog;
    setConfirmDialog({ open: false, service: null });
    if (!service) return;
    const cartItem = getCartItemForService(service._id);
    if (cartItem && removeFromCart) {
      await removeFromCart(cartItem.id || cartItem._id || service._id);
      if (showToast) showToast(`${service.serviceName} removed from cart`);
    }
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
      await updateQuantity(
        cartItem.originalId || cartItem.itemId?._id || service._id,
        cartItem.itemType || 'service',
        currentQuantity + 1
      );
      if (showToast) showToast(`${service.serviceName} quantity updated`);
    }
  };

  const handleDecrementService = async (service) => {
    const cartItem = getCartItemForService(service._id);
    if (!cartItem) return;

    const currentQuantity = Number(cartItem.quantity || 1);
    if (currentQuantity <= 1) {
      confirmAndRemoveService(service);
      return;
    }

    if (updateQuantity) {
      await updateQuantity(
        cartItem.originalId || cartItem.itemId?._id || service._id,
        cartItem.itemType || 'service',
        currentQuantity - 1
      );
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

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 9);
  };

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
      {/* Mobile Filter Toolbar */}
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

      {/* Top Category Filter Bar */}
      <nav className="category-nav desktop-only">
        <div className="category-nav-scroll">
          <button
            className={`category-nav-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            <span className="category-nav-icon">
              <LayoutGrid size={16} />
            </span>
            <span>All Services</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`category-nav-item ${
                selectedCategory?._id === cat._id ? 'active' : ''
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              <span className="category-nav-icon">{getCategoryIcon(cat.category)}</span>
              <span>{cat.category}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="content-area">
        <main className="main-content-area">
          {filteredServices.length > 0 ? (
            <>
              {/* Unified Responsive Service Grid */}
              <div className="service-grid">
                {filteredServices.slice(0, visibleCount).map((service, index) => {
                  const inCart = isInCart && isInCart(service._id);
                  const qty = getServiceQuantity(service._id);
                  const currentPrice = service.discountedPrice || service.serviceCost || 0;
                  const originalPrice = service.serviceCost || 0;
                  const hasDiscount = originalPrice > currentPrice && currentPrice > 0;
                  const discountPercent = hasDiscount
                    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                    : 0;
                  const saveAmount = hasDiscount ? originalPrice - currentPrice : 0;

                  const categoryName = service.categoryId?.category || service.serviceType || 'INSTALLATION';
                  const avgRating = service.ratingSummary?.averageRating || 4.6;
                  const totalRatings = service.ratingSummary?.totalRatings || 7;

                  return (
                    <div
                      key={service._id}
                      className="service-card-modern"
                      onMouseEnter={() => setHoveredCard(service._id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {/* Inset Image Card */}
                      <div
                        className="card-image-wrap"
                        onClick={() => handleServiceClick(service)}
                      >
                        <div className="card-image">
                          {service.serviceImages?.[0] ? (
                            <img
                              src={service.serviceImages[0]}
                              alt={service.serviceName}
                              loading="lazy"
                            />
                          ) : (
                            <div className="card-image-placeholder">
                              <Hammer size={32} />
                            </div>
                          )}
                          <button
                            className="card-share-btn"
                            title="Share Service"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareItem({
                                title: service.serviceName,
                                text: service.description || `Check out ${service.serviceName} on RightTouch!`,
                                url: `${window.location.origin}/#/product-services?serviceId=${service._id}`,
                                image: service.serviceImages?.[0],
                                price: currentPrice,
                                category: categoryName
                              }, showToast);
                            }}
                            aria-label="Share service"
                          >
                            <Share2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Card Body Details */}
                      <div
                        className="card-body"
                        onClick={() => handleServiceClick(service)}
                      >
                        {/* Category Badge */}
                        <div className="card-category-row">
                          <span className="card-category-pill">{categoryName}</span>
                        </div>

                        {/* Rating Row */}
                        <div className="card-rating-row">
                          <Star
                            size={14}
                            className="star-gold"
                            fill="#F59E0B"
                            color="#F59E0B"
                          />
                          <span className="rating-score">
                            {avgRating}
                          </span>
                          <span className="rating-count">
                            ({totalRatings} reviews)
                          </span>
                        </div>

                        {/* Service Title */}
                        <h3 className="card-title" title={service.serviceName}>
                          {service.serviceName}
                        </h3>

                        {/* Price Row */}
                        <div className="card-pricing-block">
                          <div className="price-main-row">
                            <span className="price-current">
                              ₹{formatPriceSmart(currentPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="price-original">
                                ₹{formatPriceSmart(originalPrice)}
                              </span>
                            )}
                            {discountPercent > 0 && (
                              <span className="discount-pill">{discountPercent}% OFF</span>
                            )}
                          </div>
                          {saveAmount > 0 && (
                            <div className="save-pill">
                              Save ₹{formatPriceSmart(saveAmount)}
                            </div>
                          )}
                        </div>

                        {/* Bottom Action Area: Add to Cart button transforms into Stepper & Remove */}
                        <div
                          className="card-bottom-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inCart ? (
                            <div className="cart-stepper-row">
                              <div className="stepper-box">
                                <button
                                  className="stepper-btn minus"
                                  onClick={() => handleDecrementService(service)}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="stepper-qty">{qty}</span>
                                <button
                                  className="stepper-btn plus"
                                  onClick={() => handleIncrementService(service)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                              <button
                                className="stepper-remove-btn"
                                onClick={() => confirmAndRemoveService(service)}
                              >
                                <Trash2 size={12} />
                                <span>Remove</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn-add-cart"
                              onClick={() => handleIncrementService(service)}
                            >
                              <ShoppingCart size={15} />
                              <span>Add to Cart</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {visibleCount < filteredServices.length && (
                <div className="load-more-wrapper">
                  <button className="load-more-btn-modern" onClick={handleLoadMore}>
                    Load More Services ({filteredServices.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-modern">
              <div className="empty-icon-wrapper">
                <Wrench size={48} />
              </div>
              <h3 className="empty-heading">No services found</h3>
              <p className="empty-desc">
                We couldn't find any services matching your search or filters.
              </p>
              <button className="empty-action" onClick={clearAllFilters}>
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div
          className="drawer-overlay-modern"
          onClick={() => setShowMobileFilters(false)}
        >
          <div className="drawer-modern" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header-modern">
              <div className="drawer-title-row">
                <Filter size={18} />
                <h3>Filters</h3>
              </div>
              <button
                className="drawer-close"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body-modern">
              {/* Category Filter */}
              <div className="filter-section-modern">
                <h4 className="filter-title-modern">Categories</h4>
                <div className="filter-tags-grid">
                  <button
                    className={`filter-tag ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(null)}
                  >
                    <LayoutGrid size={14} /> All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      className={`filter-tag ${
                        selectedCategory?._id === cat._id ? 'active' : ''
                      }`}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      {getCategoryIcon(cat.category)}
                      {cat.category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="filter-section-modern">
                <h4 className="filter-title-modern">Price Range</h4>
                <div className="price-options-modern">
                  {PRICE_RANGES.map((opt) => (
                    <label key={opt.value} className="price-option-radio">
                      <input
                        type="radio"
                        name="mobilePrice"
                        checked={filters.priceRange === opt.value}
                        onChange={() =>
                          setFilters({ ...filters, priceRange: opt.value })
                        }
                      />
                      <span className="radio-custom"></span>
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="drawer-footer-modern">
              <button className="drawer-btn-clear" onClick={clearAllFilters}>
                Clear
              </button>
              <button
                className="drawer-btn-apply"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.open}
        icon="🗑️"
        iconBg="#fee2e2"
        iconColor="#ef4444"
        title="Remove from Cart?"
        desc={
          confirmDialog.service
            ? `Are you sure you want to remove "${confirmDialog.service.serviceName}" from your cart?`
            : ''
        }
        confirmLabel="Remove"
        cancelLabel="Keep It"
        confirmClass="cm-confirm-danger"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </section>
  );
};

export default ServicePage;