import React, { useState, useEffect } from 'react';
import {
  Package,
  Sun,
  Star,
  ShieldCheck,
  Zap,
  Building2,
  LayoutGrid,
  FileText,
  RotateCcw,
  Filter,
  X,
  Share2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { shareItem } from '../utils/share';
import { formatPriceSmart } from '../utils/format';
import QuoteRequestModal from '../components/QuoteRequestModal';
import './ServicePage.css';

const PRICE_RANGES = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹500', value: 'under-500' },
  { label: '₹500 - ₹2000', value: '500-2000' },
  { label: 'Above ₹2000', value: 'above-2000' },
];

const ProductPage = ({
  isActive,
  productCategories: initialCategories = [],
  allProducts: initialAllProducts = [],
  dataLoading: isGlobalLoading,
  currentUser,
  showToast,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get('category');

  const [categories, setCategories] = useState(initialCategories);
  const [allProducts, setAllProducts] = useState(initialAllProducts);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(isGlobalLoading);
  const [error] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 0,
  });
  const [visibleCount, setVisibleCount] = useState(9);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProductForQuote, setSelectedProductForQuote] = useState(null);

  // Sync with global props
  useEffect(() => {
    setCategories(initialCategories);
    setAllProducts(initialAllProducts);
    setLoading(isGlobalLoading);
  }, [initialCategories, initialAllProducts, isGlobalLoading]);

  // Filter products by category + price + rating (same system as ServicePage)
  useEffect(() => {
    let result = allProducts;

    if (selectedCategory) {
      result = result.filter((p) => {
        const pCatId = p.categoryId?._id || p.categoryId;
        if (typeof pCatId === 'string') {
          return (
            pCatId === selectedCategory._id ||
            (p.category || '').toLowerCase() === (selectedCategory.category || '').toLowerCase()
          );
        }
        return (
          pCatId === selectedCategory._id ||
          (p.category || '').toLowerCase() === (selectedCategory.category || '').toLowerCase()
        );
      });
    }

    if (filters.priceRange !== 'all') {
      result = result.filter((p) => {
        const price = p.discountedPrice || p.productPrice || p.estimatedPriceFrom || 0;
        if (filters.priceRange === 'under-500') return price < 500;
        if (filters.priceRange === '500-2000') return price >= 500 && price <= 2000;
        if (filters.priceRange === 'above-2000') return price > 2000;
        return true;
      });
    }

    if (filters.rating > 0) {
      result = result.filter((p) => (p.ratingSummary?.averageRating || 0) >= filters.rating);
    }

    setFilteredProducts(result);
    setVisibleCount(9);
  }, [selectedCategory, allProducts, filters]);

  // Sync URL category param
  useEffect(() => {
    if (categories.length > 0) {
      if (categoryIdFromUrl) {
        const cat = categories.find((c) => c._id === categoryIdFromUrl);
        if (cat) {
          setSelectedCategory(cat);
        }
      } else {
        setSelectedCategory(null);
      }
    }
  }, [categoryIdFromUrl, categories]);

  const getCategoryIcon = (categoryName) => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('solar')) return <Sun size={16} />;
    if (name.includes('inverter') || name.includes('battery')) return <Zap size={16} />;
    if (name.includes('commercial')) return <Building2 size={16} />;
    if (name.includes('security') || name.includes('cctv')) return <ShieldCheck size={16} />;
    return <Package size={16} />;
  };

  const handleCategoryClick = (category) => {
    if (!category) {
      navigate('/products');
    } else {
      navigate(`/products?category=${category._id}`);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product-detail?productId=${product._id}`);
  };

  const handleGetQuote = (product) => {
    if (!currentUser) {
      if (showToast) showToast('Please sign in to request a quote');
      return;
    }
    setSelectedProductForQuote(product);
    setShowQuoteModal(true);
  };

  const clearAllFilters = () => {
    setFilters({ priceRange: 'all', rating: 0 });
    setSelectedCategory(null);
    navigate('/products');
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 9);
  };

  if (loading && isActive) {
    return (
      <section className={`page ${isActive ? '' : 'hidden'}`}>
        <div className="loader-wrapper">
          <div className="loader-spinner"></div>
          <p className="loader-text">Loading products...</p>
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

  if (!isActive) return null;

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-products">
      {/* Mobile Filter Toolbar (same as ServicePage) */}
      <div className="mobile-toolbar mobile-only">
        <button className="toolbar-filter" onClick={() => setShowMobileFilters(true)}>
          <Filter size={16} />
          <span>Filter</span>
          {(selectedCategory || filters.priceRange !== 'all' || filters.rating > 0) && (
            <span className="toolbar-dot">•</span>
          )}
        </button>
        <span className="toolbar-count">{filteredProducts.length} products</span>
      </div>

      {/* Top Category Filter Bar (same as ServicePage) */}
      <nav className="category-nav desktop-only">
        <div className="category-nav-scroll">
          <button
            className={`category-nav-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            <span className="category-nav-icon">
              <LayoutGrid size={16} />
            </span>
            <span>All Products</span>
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
          {filteredProducts.length > 0 ? (
            <>
              {/* Unified Responsive Product Grid (same system as service-grid) */}
              <div className="service-grid">
                {filteredProducts.slice(0, visibleCount).map((product, index) => {
                  const currentPrice =
                    product.discountedPrice || product.productPrice || product.estimatedPriceFrom || 0;
                  const originalPrice = product.originalPrice || 0;
                  const hasDiscount = originalPrice > currentPrice && currentPrice > 0;
                  const discountPercent = hasDiscount
                    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                    : 0;
                  const saveAmount = hasDiscount ? originalPrice - currentPrice : 0;

                  const categoryName = product.category || product.productType || 'PRODUCT';
                  const avgRating = product.ratingSummary?.averageRating || 0;
                  const totalRatings = product.ratingSummary?.totalRatings || 0;

                  return (
                    <div
                      key={product._id}
                      className="service-card-modern"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {/* Inset Image Card */}
                      <div
                        className="card-image-wrap"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="card-image">
                          {product.productImages?.[0] ? (
                            <img
                              src={product.productImages[0]}
                              alt={product.productName}
                              loading="lazy"
                            />
                          ) : (
                            <div className="card-image-placeholder">
                              <Package size={32} />
                            </div>
                          )}
                          <button
                            className="card-share-btn"
                            title="Share Product"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareItem({
                                title: product.productName,
                                text: product.description || `Check out ${product.productName} on RightTouch!`,
                                url: `${window.location.origin}/#/product-detail?productId=${product._id}`,
                                image: product.productImages?.[0],
                                price: currentPrice,
                                category: categoryName
                              }, showToast);
                            }}
                            aria-label="Share product"
                          >
                            <Share2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Card Body Details */}
                      <div
                        className="card-body"
                        onClick={() => handleProductClick(product)}
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

                        {/* Product Title */}
                        <h3 className="card-title" title={product.productName}>
                          {product.productName}
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

                        {/* Bottom Action Area: Get Quote only (no cart) */}
                        <div
                          className="card-bottom-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn-get-quote"
                            onClick={() => handleGetQuote(product)}
                          >
                            <FileText size={15} />
                            <span>Get Quote</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {visibleCount < filteredProducts.length && (
                <div className="load-more-wrapper">
                  <button className="load-more-btn-modern" onClick={handleLoadMore}>
                    Load More Products ({filteredProducts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-modern">
              <div className="empty-icon-wrapper">
                <Package size={48} />
              </div>
              <h3 className="empty-heading">No products found</h3>
              <p className="empty-desc">
                We couldn't find any products matching your search or filters.
              </p>
              <button className="empty-action" onClick={clearAllFilters}>
                <RotateCcw size={14} /> Reset Category
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer (same as ServicePage) */}
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

      {/* Quotation Modal */}
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          setSelectedProductForQuote(null);
        }}
        product={selectedProductForQuote}
        currentUser={currentUser}
        showToast={showToast}
        onNavigateToQuotations={() => {
          if (onNavigate) onNavigate('quotations');
          else navigate('/quotations');
        }}
      />
    </section>
  );
};

export default ProductPage;
