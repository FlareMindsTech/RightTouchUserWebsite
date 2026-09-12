import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Sun,
  Star,
  ShieldCheck,
  Zap,
  Building2,
  LayoutGrid,
  ShoppingBag,
  Share2,
  FileText,
  RotateCcw
} from 'lucide-react';
import { shareItem } from '../utils/share';
import { formatPriceSmart } from '../utils/format';
import QuoteRequestModal from '../components/QuoteRequestModal';
import '../styles/services.css';
import './ServicePage.css';

const ProductPage = ({
  isActive,
  addToCart,
  isInCart,
  cartItems,
  removeFromCart,
  productCategories: initialCategories = [],
  allProducts: initialAllProducts = [],
  dataLoading: isGlobalLoading,
  currentUser,
  showToast,
  onNavigate,
  searchQuery: globalSearchQuery = ''
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get('category');

  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialAllProducts);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(isGlobalLoading);
  const [error] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProductForQuote, setSelectedProductForQuote] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Sync with global props
  useEffect(() => {
    setCategories(initialCategories);
    setProducts(initialAllProducts);
    setLoading(isGlobalLoading);
  }, [initialCategories, initialAllProducts, isGlobalLoading]);

  // Sync URL category param
  useEffect(() => {
    if (categories.length > 0) {
      if (categoryIdFromUrl) {
        const cat = categories.find(c => c._id === categoryIdFromUrl);
        if (cat) setSelectedCategory(cat);
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

  const getCategoryColor = (categoryName) => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('solar')) return '#F39C12';
    if (name.includes('inverter') || name.includes('battery')) return '#3498DB';
    if (name.includes('commercial')) return '#8E44AD';
    if (name.includes('security') || name.includes('cctv')) return '#E74C3C';
    return '#22ba73';
  };

  const handleCategoryClick = (category) => {
    if (!category) {
      setSelectedCategory(null);
      navigate('/products');
    } else {
      setSelectedCategory(category);
      navigate(`/products?category=${category._id}`);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product-detail?productId=${product._id}`);
  };

  const filteredProducts = products.filter(prod => {
    return selectedCategory
      ? (prod.categoryId === selectedCategory._id ||
         prod.categoryId?._id === selectedCategory._id ||
         (prod.category || '').toLowerCase() === (selectedCategory.category || '').toLowerCase())
      : true;
  });

  if (!isActive) return null;

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-products">
      {/* Top Category Filter Ribbon */}
      <nav className="category-nav">
        <div className="category-nav-scroll">
          <button
            className={`category-nav-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            <span className="category-nav-icon"><LayoutGrid size={16} /></span>
            <span>All Products</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              className={`category-nav-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <span className="category-nav-icon">
                {cat.image ? (
                  <img src={cat.image} alt={cat.category} loading="lazy" />
                ) : (
                  getCategoryIcon(cat.category)
                )}
              </span>
              <span>{cat.category}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Full-Width Content Container */}
      <div className="content-area" style={{ display: 'block', width: '100%' }}>
        <main className="main-content-area" style={{ width: '100%' }}>
          {loading ? (
            <div className="loader-wrapper">
              <div className="loader-spinner"></div>
              <p className="loader-text">Loading products...</p>
            </div>
          ) : error ? (
            <div className="error-wrapper">
              <div className="error-emoji">😕</div>
              <h2 className="error-heading">Something went wrong</h2>
              <p className="error-desc">{error}</p>
              <button className="error-btn" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="product-grid-full">
              {filteredProducts.map((product, index) => {
                const isHovered = hoveredCard === product._id;
                const discount = product.originalPrice && product.discountedPrice
                  ? Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)
                  : 0;

                const priceDisplay = product.discountedPrice || product.productPrice || product.estimatedPriceFrom || 0;
                const inCart = isInCart && isInCart(product._id);
                const categoryName = product.category || product.productType || 'Product';
                const categoryColor = getCategoryColor(categoryName);

                return (
                  <div
                    key={product._id}
                    className={`service-card-modern ${isHovered ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredCard(product._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="card-image" onClick={() => handleProductClick(product)}>
                      {product.productImages?.[0] ? (
                        <img src={product.productImages[0]} alt={product.productName} loading="lazy" />
                      ) : (
                        <div className="card-image-placeholder">
                          <Package size={32} />
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="discount-badge">-{discount}%</div>
                      )}
                      <div className="card-image-overlay">
                        <button className="card-view-link">View Product</button>
                      </div>
                      <button
                        className="share-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareItem({
                            title: product.productName,
                            text: product.description || product.productName,
                            url: `${window.location.origin}/product-detail?productId=${product._id}`
                          }, showToast);
                        }}
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    <div className="card-body" onClick={() => handleProductClick(product)}>
                      <div className="card-header">
                        <h3 className="card-title">{product.productName}</h3>
                        <span
                          className="card-category"
                          style={{
                            background: `${categoryColor}18`,
                            color: categoryColor
                          }}
                        >
                          {categoryName}
                        </span>
                      </div>

                      <div className="card-meta">
                        <div className="card-rating">
                          <Star size={14} className="star-gold" fill="#F1C40F" color="#F1C40F" />
                          <span className="rating-value">{product.ratingSummary?.averageRating || 0}</span>
                          <span className="card-review-count">
                            ({product.ratingSummary?.totalRatings || 0} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="card-price">
                        <span className="price-current">₹{formatPriceSmart(priceDisplay)}</span>
                        {product.originalPrice > priceDisplay && (
                          <span className="price-original">₹{formatPriceSmart(product.originalPrice)}</span>
                        )}
                        {product.originalPrice > priceDisplay && (
                          <span className="price-save">
                            Save ₹{formatPriceSmart(product.originalPrice - priceDisplay)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="card-actions product-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-btn action-quote"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          if (!currentUser) {
                            if (showToast) showToast('Please sign in to request a quote');
                            return;
                          }
                          setSelectedProductForQuote(product);
                          setShowQuoteModal(true);
                        }}
                      >
                        <FileText size={16} /> Get Quote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-modern">
              <div className="empty-icon-wrapper">
                <Package size={48} />
              </div>
              <h3 className="empty-heading">No products found</h3>
              <p className="empty-desc">
                We couldn't find any products matching your selected category or search.
              </p>
              <button className="empty-action" onClick={() => handleCategoryClick(null)}>
                <RotateCcw size={14} /> Reset Category
              </button>
            </div>
          )}
        </main>
      </div>

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
