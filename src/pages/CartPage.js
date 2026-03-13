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
import { createAddress, getMyAddresses } from '../services/addressService';
import { checkout, getMyCart } from '../services/cartService';
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
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    name: '',
    type: '',
    address: 'No address added yet.',
    phone: '',
    id: null
  });
  const [newAddressForm, setNewAddressForm] = useState({
    name: currentUser?.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : '',
    mobileNumber: currentUser?.mobileNumber || currentUser?.identifier || '',
    type: 'Home',
    address: '',
    city: '',
    state: '',
    landmark: '',
    latitude: '',
    longitude: '',
    isDefault: false
  });

  // Separate Contact state (optional)
  const [contactDetails, setContactDetails] = useState({
    name: currentUser?.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : '',
    phone: currentUser?.mobileNumber || currentUser?.identifier || ''
  });

  const mapAddressToSelection = useCallback((addr) => ({
    name: addr?.name || '',
    type: addr?.type || 'Address',
    address: `${addr?.landmark ? `${addr.landmark}, ` : ''}${addr?.address || ''}${addr?.city ? `, ${addr.city}` : ''}${addr?.state ? `, ${addr.state}` : ''}`.trim(),
    phone: addr?.phone || addr?.mobileNumber || '',
    id: addr?._id || null
  }), []);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await getMyAddresses();
      const result = Array.isArray(response?.result) ? response.result : [];
      setAddresses(result);

      if (result.length > 0) {
        const defaultAddr = result.find((addr) => addr.isDefault) || result[0];
        setAddressForm((prev) => (prev.id ? prev : mapAddressToSelection(defaultAddr)));
      } else {
        setAddressForm({
          name: '',
          type: '',
          address: 'No address added yet.',
          phone: '',
          id: null
        });
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  }, [mapAddressToSelection]);

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
      setNewAddressForm((prev) => ({
        ...prev,
        name: prev.name || (currentUser.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : ''),
        mobileNumber: prev.mobileNumber || currentUser.mobileNumber || currentUser.identifier || ''
      }));
    }
  }, [currentUser]);

  const applyLocationToAddressForm = (suggestion) => {
    const addressMeta = suggestion?.address || {};
    const composedAddress = [
      addressMeta.house_number,
      addressMeta.road,
      addressMeta.neighbourhood,
      addressMeta.suburb,
      addressMeta.city_district
    ].filter(Boolean).join(', ');

    setNewAddressForm((prev) => ({
      ...prev,
      address: composedAddress || suggestion?.display_name || prev.address,
      city: addressMeta.city || addressMeta.town || addressMeta.village || prev.city,
      state: addressMeta.state || prev.state,
      landmark: addressMeta.amenity || addressMeta.building || prev.landmark,
      latitude: suggestion?.lat || prev.latitude,
      longitude: suggestion?.lon || prev.longitude
    }));
    setLocationSearch(suggestion?.display_name || '');
    setLocationSuggestions([]);
    setShowAddAddressForm(true);
    showToast('Location selected. Review and save address.');
  };

  useEffect(() => {
    if (!showAddressPopup) return;

    const searchTerm = locationSearch.trim();
    if (searchTerm.length < 3) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }

    const controller = new AbortController();
    const debounceId = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(searchTerm)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Location search failed');
        const data = await res.json();
        setLocationSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Location search failed:', error);
          setLocationSuggestions([]);
        }
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(debounceId);
    };
  }, [locationSearch, showAddressPopup]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    showToast('Fetching your current location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`
          );
          if (!response.ok) throw new Error('Reverse geocoding failed');
          const data = await response.json();
          const addressMeta = data?.address || {};
          const composedAddress = [
            addressMeta.house_number,
            addressMeta.road,
            addressMeta.neighbourhood,
            addressMeta.suburb,
            addressMeta.city_district
          ].filter(Boolean).join(', ');

          setNewAddressForm((prev) => ({
            ...prev,
            address: composedAddress || data?.display_name || prev.address,
            city: addressMeta.city || addressMeta.town || addressMeta.village || prev.city,
            state: addressMeta.state || prev.state,
            landmark: addressMeta.amenity || addressMeta.building || prev.landmark,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
          setLocationSearch(data?.display_name || '');
          setShowAddAddressForm(true);
          showToast('Current location detected!');
        } catch (geoError) {
          console.error('Reverse geocoding error:', geoError);
          setShowAddAddressForm(true);
          showToast('Location found. Please fill address details manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Error fetching location:', error);
        showToast('Unable to retrieve your location');
        setIsLocating(false);
      }
    );
  };

  const getFilteredAddresses = useCallback(() => {
    const query = locationSearch.trim().toLowerCase();
    if (!query) return addresses;

    return addresses.filter((addr) => (
      [addr.name, addr.address, addr.city, addr.state, addr.landmark, addr.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  }, [addresses, locationSearch]);

  const validateCartBeforeCheckout = async () => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      showToast('Your cart is empty. Add items before checkout.');
      return false;
    }

    try {
      const response = await getMyCart();
      const serverItems = Array.isArray(response?.result)
        ? response.result
        : (Array.isArray(response?.result?.items) ? response.result.items : []);

      if (!response?.success || serverItems.length === 0) {
        showToast('Your cart is empty on server. Refreshing cart...');
        fetchCart();
        return false;
      }
    } catch (error) {
      console.error('Cart validation failed before checkout:', error);
      showToast('Unable to validate cart right now. Please try again.');
      return false;
    }

    return true;
  };

  const resetAddressPopupState = () => {
    setShowAddressPopup(false);
    setLocationSearch('');
    setLocationSuggestions([]);
    setShowAddAddressForm(false);
    setPendingCheckout(false);
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressForm.address.trim()) {
      showToast('Please enter a valid address');
      return;
    }

    if (!newAddressForm.mobileNumber.trim()) {
      showToast('Please enter mobile number for this address');
      return;
    }

    setIsSavingAddress(true);
    try {
      const payload = {
        ...newAddressForm,
        name: newAddressForm.name.trim() || contactDetails.name || 'User',
        mobileNumber: newAddressForm.mobileNumber.trim(),
        latitude: newAddressForm.latitude,
        longitude: newAddressForm.longitude,
        isDefault: addresses.length === 0 || newAddressForm.isDefault
      };
      const response = await createAddress(payload);

      if (!response?.success) {
        showToast(response?.message || 'Failed to add address');
        return;
      }

      const created = response?.result && !Array.isArray(response.result)
        ? response.result
        : null;

      if (created?._id) {
        setAddressForm(mapAddressToSelection(created));
      }

      await fetchAddresses();
      setShowAddAddressForm(false);
      showToast('Address added successfully');

      if (pendingCheckout) {
        setShowAddressPopup(false);
        setPendingCheckout(false);
        await startCheckout();
      }
    } catch (error) {
      console.error('Failed to save new address:', error);
      showToast('Error while saving address');
    } finally {
      setIsSavingAddress(false);
    }
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

  const startCheckout = async () => {
    if (!addressForm.id) {
      showToast('Please select a delivery address');
      setShowAddressPopup(true);
      return;
    }

    const isCartValid = await validateCartBeforeCheckout();
    if (!isCartValid) return;

    setLoading(true);
    try {
      // 1. Create Booking / Checkout First
      const checkoutRes = await checkout({
        addressId: addressForm.id,
        paymentMethod: 'razorpay',
        tip: getTipAmount()
      });

      if (!checkoutRes?.success) {
        showToast(checkoutRes?.message || 'Failed to create booking');
        setLoading(false);
        return;
      }

      // Extract bookingId from the response robustly
      const bookingData = checkoutRes.result;
      let bookingId = null;

      if (Array.isArray(bookingData)) {
        // If it's an array of created bookings, take the first one's ID
        bookingId = bookingData[0]?._id;
      } else if (bookingData && typeof bookingData === 'object') {
        bookingId = bookingData._id || bookingData.bookingId || bookingData.id || bookingData.booking?._id;

        if (!bookingId && Array.isArray(bookingData.bookings) && bookingData.bookings.length > 0) {
          bookingId = bookingData.bookings[0]?._id;
        }
      }

      console.log('Checkout complete. BookingData:', bookingData, 'Extracted bookingId:', bookingId);

      if (!bookingId) {
        // Display what we got so user/developer can see what's wrong if it fails
        const debugInfo = typeof bookingData === 'object' ? JSON.stringify(bookingData).substring(0, 50) : String(bookingData);
        showToast(`Booking created, but ID missing in response (${debugInfo})`);
        setLoading(false);
        return;
      }

      // 2. Load Razorpay Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // 3. Create Payment Order
      const amount = getTotal();
      const orderRes = await createPaymentOrder({
        bookingId: bookingId,
        amount: amount
      });

      if (!orderRes?.success) {
        showToast(orderRes?.message || 'Failed to create payment order');
        setLoading(false);
        return;
      }

      const orderData = orderRes.result || orderRes;

      // 4. Configure Razorpay Options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY || orderData.key || 'rzp_test_YourKeyHere',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'RightTouch Services',
        description: 'Appliance Repair & Services',
        image: '/logo.png',
        order_id: orderData.orderId || orderData.id,
        handler: async (response) => {
          try {
            // 5. Verify Payment on Backend
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingId
            };

            const verifyRes = await verifyPayment(verificationData);
            if (verifyRes?.success) {
              showToast('Payment successful and order placed!');
              fetchCart();
              navigate('/bookings');
            } else {
              showToast('Payment verification failed');
            }
          } catch (err) {
            console.error('Verification Error:', err);
            showToast('Error verifying payment');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: currentUser.name || `${currentUser.fname || ''} ${currentUser.lname || ''}`.trim() || '',
          email: currentUser.email || '',
          contact: currentUser.phoneNumber || currentUser.mobileNumber || ''
        },
        theme: {
          color: '#2ecc71'
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled. Booking is saved.');
            fetchCart();
            // navigate to bookings since backend might have cleared the cart
            navigate('/bookings');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Checkout Error:', error);
      if ((error?.message || '').toLowerCase().includes('cart is empty')) {
        fetchCart();
        showToast('Your cart is empty. Please add items and try again.');
      } else {
        showToast(error?.message || 'Error during checkout process');
      }
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    // 1. Check Profile Completion (Mandatory: First Name & Phone)
    const hasFirstName = currentUser?.fname || profileData?.fname;
    const hasPhone = currentUser?.mobileNumber || currentUser?.identifier || profileData?.mobileNumber;

    if (!hasFirstName || !hasPhone) {
      showToast('Please complete your profile details first');
      navigate('/account?edit=profile');
      return;
    }

    if (!currentUser) {
      showToast('Please login to checkout');
      return;
    }

    const isCartValid = await validateCartBeforeCheckout();
    if (!isCartValid) {
      return;
    }

    setPendingCheckout(true);
    setShowAddressPopup(true);
    setShowAddAddressForm(false);
    setLocationSearch('');
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
      removeFromCart(item.itemId?._id || item.originalId);
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
          <button
            className="change-link"
            onClick={() => {
              setPendingCheckout(false);
              setShowAddressPopup(true);
            }}
          >
            Change
          </button>
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
          <div className="address-popup-overlay location-overlay-premium" onClick={resetAddressPopupState}>
            <div className="address-popup location-popup-premium" onClick={(e) => e.stopPropagation()}>

              {/* Header with Search */}
              <div className="location-header-premium">
                <button className="location-back-btn" onClick={resetAddressPopupState}>
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
                <button className="use-current-loc-btn" onClick={handleUseCurrentLocation} disabled={isLocating}>
                  <MdMyLocation className="loc-icon-gps" />
                  <span>{isLocating ? 'Detecting location...' : 'Use current location'}</span>
                </button>
                <button
                  className="add-new-inline-btn"
                  onClick={() => setShowAddAddressForm((prev) => !prev)}
                >
                  {showAddAddressForm ? 'Hide new address form' : 'Add new address'}
                </button>
              </div>

              {isSearchingLocation && (
                <div className="location-search-status">Searching locations...</div>
              )}

              {!isSearchingLocation && locationSuggestions.length > 0 && (
                <div className="location-suggestions-box">
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.place_id}`}
                      className="location-suggestion-item"
                      onClick={() => applyLocationToAddressForm(suggestion)}
                    >
                      <MdPlace />
                      <span>{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {showAddAddressForm && (
                <div className="new-address-form-box">
                  <h4>Add New Address</h4>
                  <div className="new-address-grid">
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="Name"
                      value={newAddressForm.name}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                      type="tel"
                      className="address-form-input"
                      placeholder="Mobile number"
                      value={newAddressForm.mobileNumber}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    />
                    <select
                      className="address-form-input"
                      value={newAddressForm.type}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="Landmark"
                      value={newAddressForm.landmark}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, landmark: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="City"
                      value={newAddressForm.city}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="State"
                      value={newAddressForm.state}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>

                  <div className="new-address-grid">
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="Latitude (e.g. 11.0123)"
                      value={newAddressForm.latitude}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, latitude: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="Longitude (e.g. 77.0456)"
                      value={newAddressForm.longitude}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, longitude: e.target.value }))}
                    />
                  </div>
                  <textarea
                    className="address-form-input address-form-textarea"
                    placeholder="Complete address"
                    value={newAddressForm.address}
                    onChange={(e) => setNewAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                  />

                  <label className="new-address-default">
                    <input
                      type="checkbox"
                      checked={newAddressForm.isDefault}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    />
                    <span>Set as default address</span>
                  </label>

                  <button className="address-save-btn" onClick={handleSaveNewAddress} disabled={isSavingAddress}>
                    {isSavingAddress ? 'Saving address...' : 'Save address'}
                  </button>
                </div>
              )}

              {/* Address List */}
              <div className="location-list-premium">
                {getFilteredAddresses().length > 0 && (
                  <>
                    {getFilteredAddresses().some((addr) => addr.isDefault) && (
                      <p className="address-group-title">Default Address</p>
                    )}
                    {getFilteredAddresses().filter((addr) => addr.isDefault).map((addr) => (
                      <div
                        key={addr._id}
                        className={`location-item-premium ${addressForm.id === addr._id ? 'active' : ''}`}
                        onClick={() => {
                          setAddressForm(mapAddressToSelection(addr));
                          showToast('Address selected');
                        }}
                      >
                        <div className="loc-item-icon">
                          <MdPlace />
                        </div>
                        <div className="loc-item-content">
                          <h4 className="loc-item-title">{addr.name || 'Saved Address'} <span className="default-pill">Default</span></h4>
                          <p className="loc-item-subtitle">{addr.address}{addr.city ? `, ${addr.city}` : ''}</p>
                        </div>
                      </div>
                    ))}

                    {getFilteredAddresses().some((addr) => !addr.isDefault) && (
                      <p className="address-group-title">Other Addresses</p>
                    )}
                    {getFilteredAddresses().filter((addr) => !addr.isDefault).map((addr) => (
                      <div
                        key={addr._id}
                        className={`location-item-premium ${addressForm.id === addr._id ? 'active' : ''}`}
                        onClick={() => {
                          setAddressForm(mapAddressToSelection(addr));
                          showToast('Address selected');
                        }}
                      >
                        <div className="loc-item-icon">
                          <MdPlace />
                        </div>
                        <div className="loc-item-content">
                          <h4 className="loc-item-title">{addr.name || 'Saved Address'}</h4>
                          <p className="loc-item-subtitle">{addr.address}{addr.city ? `, ${addr.city}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {getFilteredAddresses().length === 0 && (
                  <div className="no-addresses-found">
                    <p>No addresses found. Add a new address to continue.</p>
                  </div>
                )}

                <button className="add-new-loc-btn-premium" onClick={() => setShowAddAddressForm(true)}>
                  <div className="loc-item-icon add-icon-wrap">
                    <span>+</span>
                  </div>
                  <div className="loc-item-content">
                    <h4 className="loc-item-title">Add New Address</h4>
                    <p className="loc-item-subtitle">Create address here and continue checkout</p>
                  </div>
                </button>
              </div>

              <div className="address-popup-footer">
                <button
                  className="checkout-btn-premium"
                  disabled={!addressForm.id || loading}
                  onClick={async () => {
                    if (!addressForm.id) {
                      showToast('Please select a delivery address');
                      return;
                    }

                    if (pendingCheckout) {
                      resetAddressPopupState();
                      await startCheckout();
                      return;
                    }

                    resetAddressPopupState();
                  }}
                >
                  {pendingCheckout ? 'Continue to payment' : 'Use this address'}
                </button>
              </div>

              {/* Attribution */}
              <div className="google-attribution-premium">
                <p>Location search by <span>OpenStreetMap</span></p>
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
              onClick={handleCheckout}
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
