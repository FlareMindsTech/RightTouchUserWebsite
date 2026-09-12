import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Wrench, Package, Layers } from 'lucide-react';
import { formatPriceSmart } from '../utils/format';
import './SearchDropdown.css';

const SearchDropdown = ({
  searchQuery = '',
  onSearchChange,
  allServices = [],
  allProducts = [],
  serviceCategories = [],
  productCategories = [],
  placeholder: customPlaceholder,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Determine current page scope (Home/All vs Service vs Product)
  const currentPath = location.pathname;
  const searchScope = useMemo(() => {
    if (currentPath === '/' || currentPath === '/home') return 'all';
    if (currentPath.startsWith('/services')) return 'services';
    if (currentPath.startsWith('/products')) return 'products';
    return 'all';
  }, [currentPath]);

  // Context-aware placeholder
  const placeholder = useMemo(() => {
    if (customPlaceholder) return customPlaceholder;
    if (searchScope === 'services') return 'Search services...';
    if (searchScope === 'products') return 'Search products...';
    return 'Search services or products...';
  }, [customPlaceholder, searchScope]);

  // Close dropdown on click outside or Escape key press
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        if (inputRef.current) inputRef.current.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter results dynamically with memoization based on searchScope
  const results = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    if (!query) return [];

    const includeServices = searchScope === 'all' || searchScope === 'services';
    const includeProducts = searchScope === 'all' || searchScope === 'products';

    const matchedServices = includeServices
      ? (allServices || [])
          .filter((s) => {
            const name = (s.serviceName || s.name || '').toLowerCase();
            const cat = (s.categoryId?.category || s.category || '').toLowerCase();
            return name.includes(query) || cat.includes(query);
          })
          .map((s) => ({
            id: s._id || s.id,
            title: s.serviceName || s.name,
            category: s.categoryId?.category || 'Service',
            typeLabel: 'Service',
            price: s.serviceCost || s.discountedPrice || s.estimatedPriceFrom,
            image: s.serviceImages?.[0] || s.image,
            type: 'service',
            raw: s,
          }))
      : [];

    const matchedProducts = includeProducts
      ? (allProducts || [])
          .filter((p) => {
            const name = (p.productName || p.name || '').toLowerCase();
            const cat = (p.category || p.productType || '').toLowerCase();
            return name.includes(query) || cat.includes(query);
          })
          .map((p) => ({
            id: p._id || p.id,
            title: p.productName || p.name,
            category: p.category || p.productType || 'Product',
            typeLabel: 'Product',
            price: p.discountedPrice || p.productPrice || p.estimatedPriceFrom,
            image: p.productImages?.[0] || p.image,
            type: 'product',
            raw: p,
          }))
      : [];

    const matchedCategories = includeServices
      ? (serviceCategories || [])
          .filter((c) => (c.category || '').toLowerCase().includes(query))
          .map((c) => ({
            id: c._id || c.id,
            title: c.category,
            category: 'Service Category',
            typeLabel: 'Category',
            price: null,
            image: c.image,
            type: 'service-category',
            raw: c,
          }))
      : [];

    const matchedProductCategories = includeProducts
      ? (productCategories || [])
          .filter((c) => (c.category || '').toLowerCase().includes(query))
          .map((c) => ({
            id: c._id || c.id,
            title: c.category,
            category: 'Product Category',
            typeLabel: 'Category',
            price: null,
            image: c.image,
            type: 'product-category',
            raw: c,
          }))
      : [];

    // Combine and limit results
    return [...matchedServices, ...matchedProducts, ...matchedCategories, ...matchedProductCategories].slice(0, 10);
  }, [searchQuery, allServices, allProducts, serviceCategories, productCategories, searchScope]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (onSearchChange) onSearchChange(val);
    setIsOpen(true);
  };

  const handleClear = () => {
    if (onSearchChange) onSearchChange('');
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectResult = (item) => {
    setIsOpen(false);
    if (onSearchChange) onSearchChange('');

    if (item.type === 'service') {
      const catName = item.category || 'Service';
      navigate(`/product-services?type=${encodeURIComponent(catName)}&serviceId=${item.id}`);
    } else if (item.type === 'product') {
      navigate(`/product-detail?productId=${item.id}`);
    } else if (item.type === 'service-category') {
      navigate(`/services?category=${item.id}`);
    } else if (item.type === 'product-category') {
      navigate(`/products?category=${item.id}`);
    }
  };

  const showDropdown = isOpen && searchQuery && searchQuery.trim().length > 0;

  return (
    <div className={`search-dropdown-wrapper ${className}`} ref={dropdownRef}>
      <div className="search-input-box">
        <Search className="search-box-icon" size={18} />
        <input
          ref={inputRef}
          type="text"
          className="search-box-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        {searchQuery ? (
          <button className="search-box-clear" onClick={handleClear} aria-label="Clear search">
            <X size={16} />
          </button>
        ) : (
          <kbd className="search-shortcut desktop-only">⌘K</kbd>
        )}
      </div>

      {showDropdown && (
        <div className="search-results-dropdown" role="listbox">
          {results.length > 0 ? (
            <div className="search-results-list">
              {results.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="search-result-item"
                  onClick={() => handleSelectResult(item)}
                  role="option"
                  tabIndex={0}
                  aria-selected={false}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectResult(item);
                    }
                  }}
                >
                  <div className="search-result-thumb">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" />
                    ) : item.type === 'product' ? (
                      <Package size={20} className="thumb-icon" />
                    ) : item.type.includes('category') ? (
                      <Layers size={20} className="thumb-icon" />
                    ) : (
                      <Wrench size={20} className="thumb-icon" />
                    )}
                  </div>
                  <div className="search-result-details">
                    <div className="search-result-title">{item.title}</div>
                    <div className="search-result-meta">
                      <span className={`search-type-badge ${item.type.split('-')[0]}`}>
                        {item.typeLabel || item.category}
                      </span>
                      <span className="search-cat-name" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.category}
                      </span>
                      {item.price ? (
                        <span className="search-result-price">₹{formatPriceSmart(item.price)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="search-no-results">
              <p>No results found for &ldquo;<strong>{searchQuery}</strong>&rdquo;</p>
              <span>
                {searchScope === 'services'
                  ? 'Try searching for AC repair, RO service, or plumbing'
                  : searchScope === 'products'
                  ? 'Try searching for RO filter, solar panel, or inverter'
                  : 'Try searching for AC repair, RO filter, or solar panel'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;

