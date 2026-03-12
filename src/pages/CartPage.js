import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineLocationOn,
  MdEdit,
  MdAccessTime,
  MdPerson,
  MdClose,
  MdMyLocation,
  MdArrowBack,
  MdPlace
} from 'react-icons/md';
import { getMyAddresses } from '../services/addressService';
import { checkout } from '../services/cartService';
import { loadRazorpayScript, createPaymentOrder, verifyPayment } from '../services/paymentService';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = ({ isActive, cartItems, removeFromCart, updateQuantity, showToast, currentUser, fetchCart }) => {
  const navigate = useNavigate();
  const [profileData] = useState(currentUser || {});
  const [selectedTip, setSelectedTip] = useState(null);
  const [customTip, setCustomTip] = useState('');
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    name: '',
    address: 'No address added yet.',
    phone: '',
    id: null
  });

  // Separate Contact state (optional)
  const [contactDetails, setContactDetails] = useState({
    name: currentUser?.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : '',
    phone: currentUser?.mobileNumber || currentUser?.identifier || ''
  });

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await getMyAddresses();
      if (response?.success && response.result?.length > 0) {
        setAddresses(response.result);
        const defaultAddr = response.result.find(addr => addr.isDefault) || response.result[0];
        setAddressForm({
          name: defaultAddr.name || '',
          address: `${defaultAddr.landmark ? defaultAddr.landmark + ', ' : ''}${defaultAddr.address || ''} ${defaultAddr.city || ''} ${defaultAddr.state || ''}`.trim(),
          phone: defaultAddr.phone || '',
          id: defaultAddr._id
        });
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  }, []);

  useEffect(() => {
    if (isActive && currentUser) {
      fetchAddresses();
    }
  }, [isActive, currentUser, fetchAddresses]);

  // Update contact details when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setContactDetails({
        name: currentUser.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : '',
        phone: currentUser.mobileNumber || currentUser.identifier || ''
      });
    }
  }, [currentUser]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }

    showToast('Fetching your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app, you'd reverse geocode here. 
        showToast('Location fetched! (Reverse geocoding not implemented)');
        console.log('Lat:', latitude, 'Lng:', longitude);
      },
      (error) => {
        console.error('Error fetching location:', error);
        showToast('Unable to retrieve your location');
      }
    );
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

  const totalAmount = getTotal();

const handleProceedToCheckout = () => {
    if (!currentUser) {
      showToast('Please login to checkout');
      return;
    }
    navigate('/checkout');
  };

  const handleIncreaseQty = (item) => {
    const currentQty = item.quantity || 1;
    updateQuantity(item.originalId, item.itemType, currentQty + 1);
    showToast(`Added another ${item.name}`);
  };

  const handleDecreaseQty = (item) => {
    const currentQty = item.quantity || 1;
    if (currentQty > 1) {
      updateQuantity(item.originalId, item.itemType, currentQty - 1);
      showToast(`Removed one ${item.name}`);
    } else {
      removeFromCart(item.id);
      showToast(`${item.name} removed from cart`);
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
            {addressForm.id ? (
              <>
                <p className="address-name">{addressForm.type}</p>
                <p className="address-text">{addressForm.address}</p>
              </>
            ) : (
              <p className="address-text">No address added yet.</p>
            )}
          </div>
          <button className="change-link" onClick={() => setShowAddressPopup(true)}>Change</button>
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
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="placeholder-image">🛒</div>
                    )}
                  </div>
                </div>
                <div className="cart-item-middle">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <span className="service-badge">{item.itemType}</span>
                  <div className="service-duration">
                    <MdAccessTime className="duration-icon" />
                    <span>{item.itemId?.serviceDuration || '1-2hr'}</span>
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
              <div className="contact-title-group">
                <span className="contact-title">Contact Details</span>
                <span className="contact-subtitle">(Editable & Optional)</span>
              </div>
            </div>
            <div className="contact-details">
              <p className="contact-name">{contactDetails.name || 'Not provided'}</p>
              <p className="contact-phone">{contactDetails.phone || 'Not provided'}</p>
            </div>
            <button className="edit-contact-btn" onClick={() => setShowContactPopup(true)}>
              <MdEdit className="edit-icon" />
            </button>
          </div>
        )}

        {/* Contact Edit Popup */}
        {showContactPopup && (
          <div className="address-popup-overlay" onClick={() => setShowContactPopup(false)}>
            <div className="address-popup" onClick={(e) => e.stopPropagation()}>
              <button className="address-popup-close" onClick={() => setShowContactPopup(false)}>
                <MdClose />
              </button>
              <h3 className="address-popup-heading">Edit Contact Details</h3>
              <div className="address-form-container">
                <div className="address-form-group">
                  <label className="address-form-label">Contact Name (Optional)</label>
                  <input
                    type="text"
                    className="address-form-input"
                    placeholder="Receiver's name"
                    value={contactDetails.name}
                    onChange={(e) => setContactDetails({ ...contactDetails, name: e.target.value })}
                  />
                </div>
                <div className="address-form-group">
                  <label className="address-form-label">Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    className="address-form-input"
                    placeholder="Receiver's phone"
                    value={contactDetails.phone}
                    onChange={(e) => setContactDetails({ ...contactDetails, phone: e.target.value })}
                  />
                </div>
                <div className="address-popup-buttons">
                  <button className="address-save-btn" style={{ width: '100%' }} onClick={() => {
                    showToast('Contact updated!');
                    setShowContactPopup(false);
                  }}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Location Selection Popup */}
        {showAddressPopup && (
          <div className="address-popup-overlay location-overlay-premium" onClick={() => setShowAddressPopup(false)}>
            <div className="address-popup location-popup-premium" onClick={(e) => e.stopPropagation()}>

              {/* Header with Search */}
              <div className="location-header-premium">
                <button className="location-back-btn" onClick={() => setShowAddressPopup(false)}>
                  <MdArrowBack />
                </button>
                <div className="location-search-wrapper">
                  <input
                    type="text"
                    placeholder="Search for area, street name..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    autoFocus
                  />
                  {locationSearch && (
                    <button className="location-clear-btn" onClick={() => setLocationSearch('')}>
                      <MdClose />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="location-actions-premium">
                <button className="use-current-loc-btn" onClick={handleUseCurrentLocation}>
                  <MdMyLocation className="loc-icon-gps" />
                  <span>Use current location</span>
                </button>
              </div>

              {/* Address List */}
              <div className="location-list-premium">
                {addresses
                  .filter(addr =>
                    addr.address?.toLowerCase().includes(locationSearch.toLowerCase()) ||
                    addr.city?.toLowerCase().includes(locationSearch.toLowerCase()) ||
                    addr.name?.toLowerCase().includes(locationSearch.toLowerCase())
                  )
                  .map(addr => (
                    <div
                      key={addr._id}
                      className={`location-item-premium ${addressForm.id === addr._id ? 'active' : ''}`}
                      onClick={() => {
                        setAddressForm({
                          name: addr.name || '',
                          address: `${addr.landmark ? addr.landmark + ', ' : ''}${addr.address || ''} ${addr.city || ''} ${addr.state || ''}`.trim(),
                          phone: addr.phone || '',
                          id: addr._id
                        });
                        setShowAddressPopup(false);
                        showToast('Address selected');
                      }}
                    >
                      <div className="loc-item-icon">
                        <MdPlace />
                      </div>
                      <div className="loc-item-content">
                        <h4 className="loc-item-title">{addr.name || 'Saved Address'}</h4>
                        <p className="loc-item-subtitle">{addr.address}, {addr.city}</p>
                      </div>
                    </div>
                  ))}

                {addresses.length === 0 && (
                  <div className="no-addresses-found">
                    <p>No saved addresses found</p>
                  </div>
                )}

                <button className="add-new-loc-btn-premium" onClick={() => navigate('/account?edit=address')}>
                  <div className="loc-item-icon add-icon-wrap">
                    <span>+</span>
                  </div>
                  <div className="loc-item-content">
                    <h4 className="loc-item-title">Add New Address</h4>
                    <p className="loc-item-subtitle">Manage addresses in your profile</p>
                  </div>
                </button>
              </div>

              {/* Google Attribution */}
              <div className="google-attribution-premium">
                <p>powered by <span>Google</span></p>
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
            <button
              className="checkout-btn-premium"
              onClick={handleProceedToCheckout}
              disabled={cartItems.length === 0}
            >
              {loading ? 'Processing...' : (
                <>
                  Proceed to Checkout • ₹{totalAmount}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
