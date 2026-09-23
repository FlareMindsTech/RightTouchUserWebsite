import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Star,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Zap,
    Truck,
    Settings,
    CalendarCheck,
    FileText,
    Package,
    ShoppingBag
} from 'lucide-react';
import { getProductById } from '../services/productService';
import { goBackSmart } from '../utils/browserUtils';
import QuoteRequestModal from '../components/QuoteRequestModal';
import { formatPriceSmart } from '../utils/format';
import './ProductDetailPage.css';

const ProductDetailPage = ({ isActive, showToast, addToCart, isInCart, removeFromCart, cartItems, currentUser, onNavigate }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const productId = searchParams.get('productId');

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showQuoteModal, setShowQuoteModal] = useState(false);

    useEffect(() => {
        const fetchProductDetails = async () => {
            if (!productId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await getProductById(productId);

                const data = response?.result || response?.data || response;
                if (data && data._id) {
                    setProduct(data);
                } else {
                    setError("Product not found");
                }
            } catch (err) {
                console.error("Error fetching product details:", err);
                setError("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };

        if (isActive) {
            fetchProductDetails();
        }
    }, [productId, isActive]);

    const handleBack = () => {
        goBackSmart(navigate, '/products');
    };

    if (loading && isActive) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="loader-spinner"></div>
            </div>
        );
    }

    if ((error || !product) && isActive) {
        return (
            <div className="page" style={{ textAlign: 'center', paddingTop: '80px' }}>
                <div className="error-emoji">😕</div>
                <h2 style={{ color: '#ef4444', marginTop: '16px' }}>{error || "Product Not Found"}</h2>
                <button
                    className="error-btn"
                    onClick={handleBack}
                    style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    <ChevronLeft size={18} /> Back to Products
                </button>
            </div>
        );
    }

    const handleAddToCart = () => {
        if (!product) return;
        addToCart({ ...product, itemType: 'product' });
    };

    const handleRemoveFromCart = () => {
        if (!product) return;
        const cartItem = cartItems?.find(item => (item.itemId?._id || item.originalId) === product._id);
        if (cartItem) {
            removeFromCart(cartItem.id);
        }
    };

    const productImage = product.productImages?.[0] || product.image;
    const isProductInCart = isInCart && product && isInCart(product._id);
    const minPrice = product.estimatedPriceFrom || product.discountedPrice || product.productPrice || 0;
    const maxPrice = product.estimatedPriceTo || product.originalPrice || minPrice;

    return (
        <section className={`page ${isActive ? '' : 'hidden'}`} id="page-product-detail">
            {/* Top Navigation Row */}
            <div className="pdetail-top-nav">
                <button
                    onClick={handleBack}
                    className="pdetail-back-btn"
                    aria-label="Back to Products"
                >
                    <span className="pdetail-back-icon">
                        <ChevronLeft size={18} />
                    </span>
                    <span>Back to Products</span>
                </button>
            </div>

            {/* Product Hero Layout */}
            <div className="pdetail-hero-card">
                <div className="pdetail-hero-grid">
                    {/* Left Column: Product Image */}
                    <div className="pdetail-image-wrap">
                        {productImage ? (
                            <img
                                src={productImage}
                                alt={product.productName}
                                className="pdetail-main-img"
                            />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
                                <Package size={56} />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>No Image Available</span>
                            </div>
                        )}
                        {product.isActive && (
                            <span className="pdetail-badge-available">
                                AVAILABLE
                            </span>
                        )}
                    </div>

                    {/* Middle Column: Title & Overview Info */}
                    <div className="pdetail-info-col">
                        <div className="pdetail-tags-row">
                            <span className="pdetail-tag-category">
                                {product.productType || product.category || 'Product'}
                            </span>
                            {product.usageType && (
                                <span className="pdetail-tag-usage">
                                    {product.usageType}
                                </span>
                            )}
                        </div>

                        <h1 className="pdetail-title">
                            {product.productName}
                        </h1>

                        <div className="pdetail-rating-row">
                            <div className="pdetail-rating-score">
                                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                                <span>{product.ratingSummary?.averageRating || 0}</span>
                            </div>
                            <span className="pdetail-rating-count">
                                ({product.ratingSummary?.totalRatings || 0} customer reviews)
                            </span>
                        </div>

                        {product.description && (
                            <p className="pdetail-desc">
                                {product.description}
                            </p>
                        )}

                        {/* Pricing & Action Box */}
                        <div className="pdetail-price-box">
                            <div>
                                <span className="pdetail-price-label">
                                    {maxPrice > minPrice ? 'Price Range' : 'Price'}
                                </span>
                                <div className="pdetail-price-amount">
                                    ₹{formatPriceSmart(minPrice)}
                                    {maxPrice > minPrice && ` - ₹${formatPriceSmart(maxPrice)}`}
                                </div>
                            </div>

                            <div className="pdetail-meta-list">
                                {product.installationDuration && (
                                    <div className="pdetail-meta-item">
                                        <CalendarCheck size={16} color="#22ba73" />
                                        <span>Installation: <strong>{product.installationDuration}</strong></span>
                                    </div>
                                )}
                                <div className="pdetail-meta-item" style={{ color: product.siteInspectionRequired ? '#d97706' : '#22ba73' }}>
                                    <Truck size={16} />
                                    <span>{product.siteInspectionRequired ? 'Site Inspection Required' : 'No Site Visit Needed'}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '4px' }}>
                                <button
                                    onClick={() => {
                                        if (!currentUser) {
                                            if (showToast) showToast('Please sign in to request a quote');
                                            return;
                                        }
                                        setShowQuoteModal(true);
                                    }}
                                    className="pdetail-quote-btn"
                                >
                                    <FileText size={18} /> Get Quote
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Specifications & Details Section */}
            <div className="pdetail-sections-grid">
                {/* Technical Specifications */}
                {product.technicalSpecifications && Object.keys(product.technicalSpecifications).length > 0 && (
                    <div className="pdetail-card">
                        <h3 className="pdetail-card-title">
                            <Settings size={20} color="#3b82f6" /> Technical Specifications
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(product.technicalSpecifications || {}).map(([key, value]) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{key}</span>
                                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Benefits / Included */}
                {product.whatIncluded && product.whatIncluded.length > 0 && (
                    <div className="pdetail-card">
                        <h3 className="pdetail-card-title">
                            <CheckCircle2 size={20} color="#22ba73" /> Included Components
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {product.whatIncluded?.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', color: '#334155', fontSize: '14px' }}>
                                    <span style={{ color: '#22ba73', fontWeight: 'bold' }}>✓</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Warranty & Compliances */}
                <div className="pdetail-card">
                    {product.warrantyPeriod && (
                        <div style={{ marginBottom: '18px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', margin: '0 0 8px 0', color: '#1e293b' }}>
                                <ShieldCheck size={18} color="#22ba73" /> Warranty Period
                            </h4>
                            <p style={{ fontSize: '14px', color: '#475569', fontWeight: '600', margin: 0 }}>{product.warrantyPeriod}</p>
                        </div>
                    )}

                    {product.amcAvailable && (
                        <div style={{ marginBottom: '18px', padding: '12px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>Annual Maintenance (AMC)</span>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#059669' }}>₹{formatPriceSmart(product.amcPricePerYear)}/yr</span>
                            </div>
                        </div>
                    )}

                    {product.complianceCertificates && product.complianceCertificates.length > 0 && (
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', margin: '0 0 8px 0', color: '#1e293b' }}>
                                <Zap size={18} color="#f59e0b" /> Certifications & Compliances
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {product.complianceCertificates?.map(cert => (
                                    <span key={cert} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                                        {cert}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Exclusions */}
                {product.whatNotIncluded && product.whatNotIncluded.length > 0 && (
                    <div className="pdetail-card">
                        <h3 className="pdetail-card-title">
                            <XCircle size={20} color="#ef4444" /> Standard Exclusions
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {product.whatNotIncluded?.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', color: '#334155', fontSize: '14px' }}>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Quotation Modal */}
            <QuoteRequestModal
                isOpen={showQuoteModal}
                onClose={() => setShowQuoteModal(false)}
                product={product}
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

export default ProductDetailPage;
