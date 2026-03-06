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
    CalendarCheck
} from 'lucide-react';
import { getProductById } from '../services/productService';

const ProductDetailPage = ({ isActive, showToast, addToCart, isInCart, removeFromCart, cartItems }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const productId = searchParams.get('productId');

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        navigate('/products');
    };

    if (loading && isActive) {
        return (
            <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if ((error || !product) && isActive) {
        return (
            <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h2 style={{ color: '#ef4444' }}>{error || "Product Not Found"}</h2>
                <button className="back-btn-simple" onClick={handleBack} style={{ marginTop: '20px' }}>
                    <ChevronLeft size={20} /> Back to Products
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

    return (
        <section className={`page ${isActive ? '' : 'hidden'}`} id="page-product-detail">
            {/* Detail Header */}
            <div className="services-hero" style={{ textAlign: 'left', padding: '30px 20px' }}>
                <button className="back-btn-simple" onClick={handleBack} style={{ marginBottom: '15px' }}>
                    <ChevronLeft size={20} /> Back
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <h1 style={{ fontSize: '28px', margin: 0 }}>{product.productName}</h1>
                            {product.isActive && <span className="badge" style={{ background: 'var(--green-bg)', color: 'var(--green-dark)', fontSize: '10px' }}>AVAILABLE</span>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '700' }}>
                                <Star size={18} fill="#f59e0b" />
                                <span>{product.ratingSummary?.averageRating || 0}</span>
                                <span style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                                    ({product.ratingSummary?.totalRatings || 0} reviews)
                                </span>
                            </div>
                            <span className="accent" style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                {product.productType}
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '750px' }}>{product.description}</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>{product.usageType}</span>
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>{product.pricingModel === 'starting_from' ? 'Estimation Based' : 'Fixed Price'}</span>
                        </div>
                    </div>

                    <div className="price-card-sticky">
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '5px' }}>Estimated Price Range</div>
                            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--green)' }}>
                                ₹{product.estimatedPriceFrom?.toLocaleString()} - ₹{product.estimatedPriceTo?.toLocaleString()}
                            </span>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '10px' }}>
                                <CalendarCheck size={18} style={{ color: 'var(--green)' }} />
                                <span>Installation: <strong>{product.installationDuration}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: product.siteInspectionRequired ? '#f59e0b' : 'var(--green)' }}>
                                <Truck size={18} />
                                <span>{product.siteInspectionRequired ? 'Site Inspection Required' : 'No Site Visit Needed'}</span>
                            </div>
                        </div>

                        {isInCart && product && isInCart(product._id) ? (
                            <button className="cart-btn remove-from-cart" style={{ width: '100%', height: '48px' }} onClick={handleRemoveFromCart}>
                                Remove from Cart
                            </button>
                        ) : (
                            <button className="cart-btn add-to-cart" style={{ width: '100%', height: '48px' }} onClick={handleAddToCart}>
                                Add to Cart
                            </button>
                        )}
                        <p style={{ fontSize: '11px', textAlign: 'center', marginTop: '10px', color: 'var(--text-muted)' }}>
                            Final price depends on site inspection and capacity needs.
                        </p>
                    </div>
                </div>
            </div>

            <div className="section-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', padding: '0 20px' }}>

                {/* Technical Specifications */}
                <div className="detail-card-new" style={{ gridRow: 'span 2' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                        <Settings size={22} color="#3b82f6" /> Technical Specifications
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(product.technicalSpecifications || {}).map(([key, value]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>{key}</span>
                                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits/Included */}
                <div className="detail-card-new">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                        <CheckCircle2 size={22} color="var(--green)" /> Components & Inclusions
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {product.whatIncluded?.map((item, idx) => (
                            <li key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✓</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warranty & Compliances */}
                <div className="detail-card-new" style={{ background: '#f8fafc' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e293b' }}>
                            <ShieldCheck size={18} color="var(--green)" /> Warranty Period
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', margin: 0 }}>{product.warrantyPeriod}</p>
                    </div>

                    {product.amcAvailable && (
                        <div style={{ marginBottom: '20px', padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>Annual Maintenance (AMC)</span>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#059669' }}>₹{product.amcPricePerYear}/yr</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e293b' }}>
                            <Zap size={18} color="#f59e0b" /> Compliances & Certifications
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {product.complianceCertificates?.map(cert => (
                                <span key={cert} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{cert}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Exclusions */}
                <div className="detail-card-new">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                        <XCircle size={22} color="#ef4444" /> Standard Exclusions
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {product.whatNotIncluded?.map((item, idx) => (
                            <li key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </section>
    );
};

export default ProductDetailPage;
