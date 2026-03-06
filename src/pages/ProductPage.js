import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Search,
    Package,
    Sun,
    Star,
    ShieldCheck,
    Zap,
    Building2
} from 'lucide-react';
import { getAllCategories } from '../services/categoryService';
import { getAllProducts } from '../services/productService';
import '../styles/services.css';

const ProductPage = ({ isActive, addToCart, isInCart, cartItems, removeFromCart }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [view, setView] = useState('categories'); // 'categories' or 'products'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Icon Map for Product Categories
    const iconMap = {
        'Solar': <Sun size={32} />,
        'Inverter': <Zap size={32} />,
        'Battery': <Zap size={32} />,
        'Commercial': <Building2 size={32} />,
        'Security': <ShieldCheck size={32} />,
        'default': <Package size={32} />
    };

    useEffect(() => {
        const fetchProductData = async () => {
            if (!isActive) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch product categories and all products
                const [catRes, prodRes] = await Promise.all([
                    getAllCategories({ categoryType: 'product' }),
                    getAllProducts()
                ]);

                const cats = catRes?.result || catRes?.data || catRes;
                if (Array.isArray(cats)) {
                    setCategories(cats);
                }

                const prods = prodRes?.result || prodRes?.data || prodRes?.products || prodRes;
                if (Array.isArray(prods)) {
                    setProducts(prods);
                } else if (prodRes?.result?.products) {
                    setProducts(prodRes.result.products);
                }
            } catch (err) {
                console.error("Error fetching product data:", err);
                setError("Failed to load products. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [isActive]);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setView('products');
        window.scrollTo(0, 0);
    };

    const handleProductClick = (product) => {
        navigate(`/product-detail?productId=${product._id}`);
    };

    const filteredProducts = products.filter(prod => {
        const matchesCategory = selectedCategory ? (prod.categoryId === selectedCategory._id || prod.categoryId?._id === selectedCategory._id) : true;
        const matchesSearch = prod.productName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (!isActive) return null;

    return (
        <div className="page-wrapper" style={{ padding: '20px' }}>
            {/* Header Section */}
            <div className="section-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    {view === 'products' ? (
                        <button className="back-btn-simple" onClick={() => setView('categories')} style={{ marginBottom: '10px' }}>
                            <ChevronLeft size={20} /> Back to Categories
                        </button>
                    ) : null}
                    <h1 style={{ margin: 0 }}>
                        Our <span className="accent">{view === 'categories' ? 'Product Categories' : selectedCategory?.category}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>
                        {view === 'categories' ? 'Select a category to explore professional products' : `Showing professional products for ${selectedCategory?.category}`}
                    </p>
                </div>

                <div className="search-box" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-input)'
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    <div className="spinner"></div>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>
            ) : (
                <>
                    {view === 'categories' ? (
                        <div className="category-grid">
                            {categories.map(cat => (
                                <div key={cat._id} className="category-card" onClick={() => handleCategoryClick(cat)}>
                                    <div className="cat-icon-wrap" style={{ display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
                                        {cat.image ? (
                                            <img src={cat.image} alt={cat.category} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            iconMap[cat.category] || iconMap['default']
                                        )}
                                    </div>
                                    <span>{cat.category}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {filteredProducts.length > 0 ? (
                                <div className="massive-list">
                                    {filteredProducts.map(product => (
                                        <div key={product._id} className="massive-section-wrap">
                                            <div className="massive-card" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>
                                                <div className="massive-card-content">
                                                    <h3 className="massive-card-title">{product.productName}</h3>

                                                    <div className="massive-card-rating">
                                                        <Star size={16} className="star-icon" />
                                                        <span>
                                                            {product.ratingSummary?.averageRating || 0.0} ({product.ratingSummary?.totalRatings || 0} reviews)
                                                        </span>
                                                    </div>

                                                    <div className="massive-card-price">
                                                        ₹{product.estimatedPriceFrom?.toLocaleString()} •
                                                    </div>

                                                    <ul className="massive-card-description">
                                                        <li style={{ color: 'var(--green)', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>
                                                            {product.productType}
                                                        </li>
                                                        <li>Usage: {product.usageType}</li>
                                                        <li>{product.siteInspectionRequired ? 'Site Inspection Required' : 'Instant Setup'}</li>
                                                    </ul>

                                                    <div className="massive-card-link">
                                                        View details
                                                    </div>
                                                </div>

                                                <div className="massive-card-right">
                                                    <div className="massive-card-image" style={{ background: '#f8fafc' }}>
                                                        {product.productImages?.[0] ? (
                                                            <img src={product.productImages[0]} alt={product.productName} />
                                                        ) : (
                                                            <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--green)' }}>
                                                                <Package size={40} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isInCart && isInCart(product._id) ? (
                                                        <button
                                                            className="massive-add-btn"
                                                            style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const cartItem = cartItems?.find(item => (item.itemId?._id || item.originalId) === product._id);
                                                                if (cartItem && removeFromCart) removeFromCart(cartItem.id);
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="massive-add-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToCart({ ...product, itemType: 'product' });
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
                            ) : (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '12px' }}>
                                    No products found in this category.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductPage;
