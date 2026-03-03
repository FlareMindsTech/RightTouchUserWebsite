// components/ServiceSheet.jsx
import React, { useState, useEffect } from 'react';

const ServiceSheet = ({ service, onClose, showToast }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedSubcat, setSelectedSubcat] = useState('Basic');

  // Service data (in real app, this would come from an API)
  const serviceData = {
    'Kitchen Cleaning': {
      rating: 4.8,
      bookings: '845K',
      subcats: ['Basic', 'Premium', 'Deep Clean'],
      sections: [
        {
          title: 'Basic Cleaning',
          items: [
            { name: 'Sink & Countertop Cleaning', price: 299, originalPrice: 399 },
            { name: 'Cabinet Exterior Wipe', price: 199, originalPrice: 249 }
          ]
        },
        {
          title: 'Premium Cleaning',
          items: [
            { name: 'Chimney Cleaning', price: 499, originalPrice: 599 },
            { name: 'Oven & Hob Cleaning', price: 399, originalPrice: 499 }
          ]
        }
      ]
    }
  };

  const data = serviceData[service] || {
    rating: 4.7,
    bookings: '500K',
    subcats: ['Basic', 'Standard', 'Premium'],
    sections: [
      {
        title: 'Basic Service',
        items: [
          { name: 'Standard Checkup', price: 299, originalPrice: 399 },
          { name: 'Basic Repair', price: 399, originalPrice: 499 }
        ]
      }
    ]
  };

  const addToCart = (item) => {
    setCartItems([...cartItems, item]);
    showToast(`${item.name} added to cart`);
  };

  const removeFromCart = (itemName) => {
    setCartItems(cartItems.filter(item => item.name !== itemName));
  };

  const isInCart = (itemName) => {
    return cartItems.some(item => item.name === itemName);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    // Prevent body scroll when sheet is open
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <>
      <div className="sheet-backdrop" onClick={handleBackdropClick}></div>
      <div className="service-sheet">
        <div className="sheet-handle"></div>

        <div className="sheet-header">
          <div className="sheet-header-left">
            <button className="sheet-back-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <div>
              <h2 className="sheet-title" id="sheetTitle">{service}</h2>
              <div className="sheet-rating">
                <span className="star-icon">★</span>
                <span className="sheet-rating-val">{data.rating}</span>
                <span className="sheet-rating-count">({data.bookings} bookings)</span>
              </div>
            </div>
          </div>
          <button className="sheet-share-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>

        {/* Sub-category pills */}
        <div className="sheet-subcats">
          {data.subcats.map(cat => (
            <button 
              key={cat}
              className={`subcat-pill ${selectedSubcat === cat ? 'active' : ''}`}
              onClick={() => setSelectedSubcat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="sheet-body">
          {data.sections.map(section => (
            <div key={section.title} className="sheet-section">
              <h3 className="section-head">{section.title}</h3>
              {section.items.map(item => (
                <div key={item.name} className="service-item">
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">
                      <span className="current-price">₹{item.price}</span>
                      <span className="original-price">₹{item.originalPrice}</span>
                    </div>
                  </div>
                  {isInCart(item.name) ? (
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.name)}
                    >
                      Remove
                    </button>
                  ) : (
                    <button 
                      className="add-btn"
                      onClick={() => addToCart(item)}
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Sticky bottom cart bar */}
        {cartItems.length > 0 && (
          <div className="sheet-cart-bar">
            <div className="cart-info">
              <span className="cart-count">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
              <span className="cart-total">₹{getCartTotal()}</span>
            </div>
            <button className="cart-view-btn" onClick={onClose}>
              View Cart →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ServiceSheet;