import React, { useState } from 'react';
import { 
  MdOutlineLocationOn,
  MdEdit,
  MdAccessTime,
  MdPerson,
  MdArrowForwardIos,
  MdClose
} from 'react-icons/md';
import './CartPage.css';

const CartPage = ({ isActive, cartItems, removeFromCart, updateQuantity, showToast }) => {
  const [selectedTip, setSelectedTip] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponPopup, setShowCouponPopup] = useState(false);
  const [customTip, setCustomTip] = useState('');
const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: 'Kavin',
    address: 'Door 123, Main Street, Anna Nagar, Chennai - 600040',
    phone: '+91 98765 43210'
  });
  
  // Mock default address (now uses addressForm state)
  const defaultAddress = addressForm;

  // Mock contact person
  const contactPerson = {
    name: 'John Doe',
    phone: '+91 98765 43210'
  };

  // Mock service durations
  const serviceDurations = {
    'Basic AC Service': '1-2hr',
    'Standard AC Service': '1-3hr',
    'Premium AC Service': '2-4hr',
    'Basic Washing Machine Service': '1-2hr',
    'Standard Washing Machine Service': '1-3hr',
    'Premium Washing Machine Service': '2-3hr',
    'Basic Refrigerator Service': '1-2hr',
    'Standard Refrigerator Service': '1-3hr',
    'Premium Refrigerator Service': '2-3hr',
    'Basic Water Purifier Service': '1hr',
    'Standard Water Purifier Service': '1-2hr',
    'Premium Water Purifier Service': '2hr',
    'Basic TV Service': '1hr',
    'Standard TV Service': '1-2hr',
    'Premium TV Service': '2hr'
  };

  // Calculate totals
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const qty = item.quantity || 1;
      return total + (item.price * qty);
    }, 0);
  };

  const getTax = () => {
    return Math.round(getSubtotal() * 0.08); // 8% tax
  };

  const getTipAmount = () => {
    if (customTip) return parseInt(customTip) || 0;
    return selectedTip || 0;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getTipAmount();
  };

  const handleIncreaseQty = (item) => {
    const currentQty = item.quantity || 1;
    updateQuantity(item.name, currentQty + 1);
    showToast(`Added another ${item.name}`);
  };

  const handleDecreaseQty = (item) => {
    const currentQty = item.quantity || 1;
    if (currentQty > 1) {
      updateQuantity(item.name, currentQty - 1);
      showToast(`Removed one ${item.name}`);
    } else {
      removeFromCart(item.name);
      showToast(`${item.name} removed from cart`);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      showToast(`Coupon "${couponCode}" applied successfully!`);
      setShowCouponPopup(false);
      setCouponCode('');
    }
  };

  const tipOptions = [
    { amount: 50, label: '₹50' },
    { amount: 75, label: '₹75', mostTipped: true },
    { amount: 100, label: '₹100' },
    { amount: 'custom', label: 'Custom' }
  ];

  if (!isActive) return null;

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Address Section */}
        <div className="address-section">
          <div className="address-header">
            <MdOutlineLocationOn className="address-icon" />
            <span className="address-title">Delivery Address</span>
          </div>
          <div className="address-details">
            <p className="address-name">{defaultAddress.name}</p>
            <p className="address-text">{defaultAddress.address}</p>
          </div>
<a href="#" className="change-link" onClick={(e) => { e.preventDefault(); setShowAddressPopup(true); }}>Change</a>
        </div>

        {/* Cart Items */}
        <div className="cart-items-section">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="empty-cart-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add services to get started</p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="cart-item-card">
                <div className="cart-item-left">
                  <div className="cart-item-image">
                    {item.serviceType === 'AC' && <img src={require('../assets/AC.jpg')} alt={item.name} />}
                    {item.serviceType === 'Washing Machine' && <img src={require('../assets/washing machine.jpg')} alt={item.name} />}
                    {item.serviceType === 'Refrigerator' && <img src={require('../assets/fridge.jpg')} alt={item.name} />}
                    {item.serviceType === 'Water Purifier' && <img src={require('../assets/water purifier.jpg')} alt={item.name} />}
                    {item.serviceType === 'Television' && <img src={require('../assets/AC.jpg')} alt={item.name} />}
                  </div>
                </div>
                <div className="cart-item-middle">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <span className="service-badge">{item.serviceType}</span>
                  <div className="service-duration">
                    <MdAccessTime className="duration-icon" />
                    <span>{serviceDurations[item.name] || '1-2hr'}</span>
                  </div>
                  <p className="cart-item-price">₹{item.price}</p>
                </div>
                <div className="cart-item-right">
                  <div className="quantity-container-cart">
                    <button 
                      className="qty-btn-cart qty-minus"
                      onClick={() => handleDecreaseQty(item)}
                    >
                      −
                    </button>
                    <span className="qty-value-cart">{item.quantity || 1}</span>
                    <button 
                      className="qty-btn-cart qty-plus"
                      onClick={() => handleIncreaseQty(item)}
                    >
                      +
                    </button>
                  </div>
                  <p className="item-subtotal">₹{item.price * (item.quantity || 1)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Details Section */}
        {cartItems.length > 0 && (
          <div className="contact-section">
            <div className="contact-header">
              <MdPerson className="contact-icon" />
              <span className="contact-title">Contact Details</span>
            </div>
            <div className="contact-details">
              <p className="contact-name">{contactPerson.name}</p>
              <p className="contact-phone">{contactPerson.phone}</p>
            </div>
            <button className="edit-contact-btn">
              <MdEdit className="edit-icon" />
            </button>
          </div>
        )}

        {/* Offers Section */}
        {cartItems.length > 0 && (
          <div className="offers-section" onClick={() => setShowCouponPopup(true)}>
            <span className="offers-title">Coupons & offers</span>
            <div className="offers-arrow">
              <span className="offers-count">3 offers</span>
              <MdArrowForwardIos className="arrow-icon" />
            </div>
          </div>
        )}

{/* Coupon Popup */}
        {showCouponPopup && (
          <div className="coupon-popup-overlay" onClick={() => setShowCouponPopup(false)}>
            <div className="coupon-popup" onClick={(e) => e.stopPropagation()}>
              <button className="coupon-close" onClick={() => setShowCouponPopup(false)}>
                <MdClose />
              </button>
              <h3 className="coupon-heading">Apply Coupon</h3>
              <div className="coupon-input-container">
                <input 
                  type="text" 
                  className="coupon-input" 
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button className="apply-btn" onClick={handleApplyCoupon}>Apply</button>
              </div>
              <div className="available-coupons">
                <p className="coupons-title">Available Coupons</p>
                <div className="coupon-option">
                  <span className="coupon-code">SAVE10</span>
                  <span className="coupon-desc">Get 10% off on orders above ₹500</span>
                </div>
                <div className="coupon-option">
                  <span className="coupon-code">FIRST50</span>
                  <span className="coupon-desc">Flat ₹50 off on first order</span>
                </div>
                <div className="coupon-option">
                  <span className="coupon-code">FREESERVICE</span>
                  <span className="coupon-desc">Free basic service on AC repair</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Address Popup */}
        {showAddressPopup && (
          <div className="address-popup-overlay" onClick={() => setShowAddressPopup(false)}>
            <div className="address-popup" onClick={(e) => e.stopPropagation()}>
              <button className="address-popup-close" onClick={() => setShowAddressPopup(false)}>
                <MdClose />
              </button>
              <h3 className="address-popup-heading">Change Delivery Address</h3>
              <div className="address-form-container">
                <div className="address-form-group">
                  <label className="address-form-label">Name</label>
                  <input 
                    type="text" 
                    className="address-form-input" 
                    placeholder="Enter your name"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                  />
                </div>
                <div className="address-form-group">
                  <label className="address-form-label">Address</label>
                  <textarea 
                    className="address-form-input address-form-textarea" 
                    placeholder="Enter your address"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                  />
                </div>
                <div className="address-form-group">
                  <label className="address-form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="address-form-input" 
                    placeholder="Enter phone number"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  />
                </div>
                <div className="address-popup-buttons">
                  <button className="address-cancel-btn" onClick={() => setShowAddressPopup(false)}>
                    Cancel
                  </button>
                  <button className="address-save-btn" onClick={() => {
                    showToast('Address updated successfully!');
                    setShowAddressPopup(false);
                  }}>
                    Save Address
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary Section */}
        {cartItems.length > 0 && (
          <div className="payment-summary-section">
            <h3 className="summary-title">Payment Summary</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span className="summary-label">Total Item{cartItems.length > 1 ? 's' : ''}</span>
                <span className="summary-value">₹{getSubtotal()}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Taxes and Fee</span>
                <span className="summary-value">₹{getTax()}</span>
              </div>
              {getTipAmount() > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Tip</span>
                  <span className="summary-value">₹{getTipAmount()}</span>
                </div>
              )}
            </div>
            <div className="total-row">
              <span className="total-label">Amount to pay</span>
              <span className="total-value">₹{getTotal()}</span>
            </div>
          </div>
        )}

        {/* Cancellation Policy Section */}
        {cartItems.length > 0 && (
          <div className="cancellation-section">
            <h4 className="cancellation-title">Cancellation policy</h4>
            <p className="cancellation-text">
              Free cancellation is done more than 12 hrs before the service or if professional isn't assigned. A fee will be charged otherwise.
            </p>
            <a href="#" className="read-policy-link">Read full policy</a>
          </div>
        )}

        {/* Tip Section */}
        {cartItems.length > 0 && (
          <div className="tip-section">
            <h4 className="tip-title">Add a tip to thank the professional</h4>
            <div className="tip-options">
              {tipOptions.map((option, index) => (
                <button 
                  key={index}
                  className={`tip-option ${selectedTip === option.amount ? 'selected' : ''} ${option.mostTipped ? 'most-tipped' : ''}`}
                  onClick={() => {
                    if (option.amount === 'custom') {
                      setSelectedTip(null);
                      setCustomTip('');
                    } else {
                      setSelectedTip(option.amount);
                      setCustomTip('');
                    }
                  }}
                >
                  {option.label}
                  {option.mostTipped && <span className="most-tipped-badge">Most tipped</span>}
                </button>
              ))}
            </div>
            {selectedTip === null && (
              <div className="custom-tip-container">
                <input 
                  type="number" 
                  className="custom-tip-input" 
                  placeholder="Enter custom amount"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Checkout Button */}
        {cartItems.length > 0 && (
          <div className="checkout-section">
            <button className="checkout-btn">
              Proceed to Checkout • ₹{getTotal()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;

