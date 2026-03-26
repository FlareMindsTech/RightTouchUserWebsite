import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { createAddress, getMyAddresses, searchAddress, reverseAddress, updateAddress } from '../services/addressService';
import { checkout, getMyCart } from '../services/cartService';
import { loadRazorpayScript, createPaymentOrder, verifyPayment } from '../services/paymentService';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = ({ isActive, cartItems, removeFromCart, updateQuantity, showToast, currentUser, fetchCart, onLoginClick }) => {
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
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null });

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    name: '',
    label: '',
    addressLine: 'No address added yet.',
    phone: '',
    id: null
  });
  const [newAddressForm, setNewAddressForm] = useState({
    name: currentUser?.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : '',
    mobileNumber: currentUser?.mobileNumber || currentUser?.identifier || '',
    label: 'Home',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    landmark: '',
    isDefault: false
  });

  // Separate Contact state
  const [contactDetails, setContactDetails] = useState({
    name: currentUser?.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : '',
    phone: currentUser?.mobileNumber || currentUser?.identifier || ''
  });

  const mapAddressToSelection = useCallback((addr) => {
    let displayAddress = addr?.addressLine || addr?.address || '';
    if (!displayAddress || displayAddress.toLowerCase().includes('pinned location')) {
      const parts = [addr?.city, addr?.state, addr?.pincode].filter(Boolean);
      if (parts.length > 0) displayAddress = parts.join(', ');
      else displayAddress = 'Pinned Location';
    }

    return {
      name: addr?.name || '',
      label: addr?.label || addr?.type || 'Address',
      addressLine: displayAddress,
      phone: addr?.phone || addr?.mobileNumber || '',
      id: addr?._id || null
    };
  }, []);

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
          label: '',
          addressLine: 'No address added yet.',
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
      addressLine: suggestion?.display_name || composedAddress || prev.addressLine,
      city: addressMeta.city || addressMeta.town || addressMeta.village || addressMeta.municipality || addressMeta.county || addressMeta.state_district || addressMeta.suburb || prev.city,
      state: addressMeta.state || prev.state,
      pincode: addressMeta.postcode || prev.pincode,
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
        const response = await searchAddress(searchTerm);
        const data = response?.result;
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
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Direct frontend call to Nominatim (as requested: only frontend)
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`;
          
          const response = await fetch(nominatimUrl, {
            headers: { 'User-Agent': 'RightTouchApp/1.0 (vigneshubi24@gmail.com)' }
          });

          if (!response.ok) {
            throw new Error(`Nominatim error: ${response.status}`);
          }

          const result = await response.json();
          console.log('[Geocoding] Frontend API Response:', result);
          
          const addr = result.address || {};
          console.log('[Geocoding] Extracted Address Object:', addr);
          
          // Construct a human-readable address line
          const details = [
            addr.house_number,
            addr.road,
            addr.neighbourhood,
            addr.suburb,
            addr.city_district,
            addr.town,
            addr.village,
            addr.municipality,
            addr.county
          ].filter(Boolean).join(', ');

          const finalAddressLine = result.display_name || details || 'Pinned Location';
          console.log('[Geocoding] Calculated addressLine:', finalAddressLine);

          const finalCity = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || addr.suburb || '';
          const finalState = addr.state || addr.state_district || '';
          const finalPincode = addr.postcode || '';

          console.log('[Geocoding] Updating form with:', { city: finalCity, state: finalState, pincode: finalPincode });

          setNewAddressForm((prev) => ({
            ...prev,
            addressLine: finalAddressLine,
            city: finalCity,
            state: finalState,
            pincode: finalPincode,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));

          setLocationSearch(result.display_name || finalAddressLine);
          setShowAddAddressForm(true);
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
    if (!newAddressForm.addressLine.trim()) {
      showToast('Please enter a valid address');
      return;
    }

    const finalAddressLine = newAddressForm.landmark.trim()
      ? `${newAddressForm.addressLine.trim()} (Landmark: ${newAddressForm.landmark.trim()})`
      : newAddressForm.addressLine.trim();

    /* Name and mobile removed from form as per user request - will use profile details */

    setIsSavingAddress(true);
    try {
      const payload = {
        ...newAddressForm,
        addressLine: finalAddressLine,
        label: newAddressForm.label.toLowerCase(),
        name: currentUser.name || currentUser.fname || 'User',
        mobileNumber: currentUser.mobileNumber || currentUser.identifier || '',
        latitude: parseFloat(newAddressForm.latitude) || 0,
        longitude: parseFloat(newAddressForm.longitude) || 0,
        isDefault: true // Automatically set new addresses as default
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

      // Close modal if we're just adding/changing address, or proceed to checkout
      if (pendingCheckout) {
        setShowAddressPopup(false);
        setPendingCheckout(false);
        await startCheckout();
      } else {
        setShowAddressPopup(false);
        setLocationSearch('');
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

      showToast('Booking created! Redirecting to payment...');

      // Extract bookingId from the response robustly
      const bookingData = checkoutRes.result || checkoutRes;
      let bookingId = null;

      if (Array.isArray(bookingData)) {
        // If it's an array of created bookings, take the first one's ID
        bookingId = bookingData[0]?._id || bookingData[0];
      } else if (bookingData && typeof bookingData === 'object') {
        // Try direct IDs first
        bookingId = bookingData._id || bookingData.bookingId || bookingData.id ||
          bookingData.booking?._id || bookingData.data?._id || bookingData.data?.bookingId;

        // Try 'bookings' array
        if (!bookingId && Array.isArray(bookingData.bookings) && bookingData.bookings.length > 0) {
          bookingId = bookingData.bookings[0]?._id || bookingData.bookings[0];
        }

        // Try serviceBookings or productBookings arrays (as seen in the console log payload)
        if (!bookingId && Array.isArray(bookingData.serviceBookings) && bookingData.serviceBookings.length > 0) {
           bookingId = bookingData.serviceBookings[0]?._id || bookingData.serviceBookings[0];
        }
        
        if (!bookingId && Array.isArray(bookingData.productBookings) && bookingData.productBookings.length > 0) {
           bookingId = bookingData.productBookings[0]?._id || bookingData.productBookings[0];
        }

        // Check if checkoutRes itself has bookingId (some APIs place it at top level)
        if (!bookingId) {
          bookingId = checkoutRes.bookingId || checkoutRes.id || checkoutRes._id;
        }

        // Additional fail-safe: Check nested booking objects inside properties 
        if (!bookingId && bookingData.data && Array.isArray(bookingData.data.bookings) && bookingData.data.bookings.length > 0) {
          bookingId = bookingData.data.bookings[0]?._id || bookingData.data.bookings[0];
        }
      }

      console.log('Checkout complete. BookingData:', bookingData, 'Extracted bookingId:', bookingId);

      if (!bookingId) {
        // Display what we got so user/developer can see what's wrong if it fails
        const debugInfo = typeof bookingData === 'object' ? JSON.stringify(bookingData).substring(0, 50) : String(bookingData);
        console.error(`ID missing in response (${debugInfo})`);
        showToast('Booking created successfully, preparing payment...');
        
        // Refresh cart and redirect
        fetchCart();
        navigate('/bookings');
        setLoading(false);
        return;
      }

      // Payment Flow Removed as per user request
      // We just log success, fetch the cart, and navigate to bookings.
      showToast('Booking placed successfully!');
      fetchCart();
      navigate('/bookings');
      setLoading(false);
      return;

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
    if (loading) return;

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

    // Auto-select default if available and proceed
    if (addressForm.id) {
      await startCheckout();
    } else {
      setShowAddressPopup(true);
      setShowAddAddressForm(false);
      setLocationSearch('');
    }
  };

  const handleIncreaseQty = (item) => {
    const currentQty = item.quantity || 1;
    updateQuantity(item.originalId, item.itemType, currentQty + 1);
  };

  const handleDecreaseQty = (item) => {
    const currentQty = item.quantity || 1;
    if (currentQty > 1) {
      updateQuantity(item.originalId, item.itemType, currentQty - 1);
    } else {
      setConfirmDialog({ open: true, item });
    }
  };

  const handleConfirmRemove = async () => {
    const { item } = confirmDialog;
    setConfirmDialog({ open: false, item: null });
    if (!item) return;
    await removeFromCart(item.id);
  };

  const handleCancelRemove = () => {
    setConfirmDialog({ open: false, item: null });
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
        {currentUser ? (
          <>
            {/* Address Section */}
            <div className="address-section">
              <div className="address-header">
                <MdOutlineLocationOn className="address-icon" />
                <span className="address-title">Delivery Address</span>
              </div>
              <div className="address-details">
                {addressForm.id ? (
                  <>
                    <p className="address-name">{addressForm.label}</p>
                    <p className="address-text">{addressForm.addressLine}</p>
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
        {cartItems.length > 0 && currentUser && (
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
                  <h4 style={{ marginBottom: '16px' }}>Add New Address</h4>
                  <div className="new-address-grid">
                    <select
                      className="address-form-input"
                      value={newAddressForm.label}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                    >
                      <option value="home">Home</option>
                      <option value="office">Office</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="Pincode"
                      value={newAddressForm.pincode}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="address-form-input"
                      placeholder="Landmark (Optional)"
                      value={newAddressForm.landmark}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, landmark: e.target.value }))}
                      style={{ gridColumn: 'span 2' }}
                    />
                    <textarea
                      className="address-form-input"
                      placeholder="Complete Address (House No, Street, Area, etc.)"
                      value={newAddressForm.addressLine}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, addressLine: e.target.value }))}
                      style={{ gridColumn: 'span 2', minHeight: '80px' }}
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

                  <div className="checkbox-group" style={{ margin: '12px 0' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newAddressForm.isDefault}
                        onChange={(e) => setNewAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      />
                      <span style={{ fontSize: '14px' }}>Set as Default Address</span>
                    </label>
                  </div>

                  <div className="address-popup-buttons" style={{ marginTop: '16px' }}>
                    <button
                      className="address-save-btn"
                      onClick={handleSaveNewAddress}
                      disabled={isSavingAddress}
                      style={{ width: '100%' }}
                    >
                      {isSavingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      className="address-cancel-btn"
                      onClick={() => setShowAddAddressForm(false)}
                      style={{ width: '100%', marginTop: '8px', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0' }}
                    >
                      Cancel
                    </button>
                  </div>
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
                        onClick={async () => {
                          setAddressForm(mapAddressToSelection(addr));
                          try {
                            // Automatically update the backend to make the selected address the default one
                            const updatePayload = {
                              id: addr._id,
                              isDefault: true
                            };
                            await updateAddress(updatePayload);
                            // Refresh list so UI moves it to 'Default Address' section instantly
                            await fetchAddresses();
                          } catch (err) {
                            console.error('Failed to set address as default:', err);
                          }
                          showToast('Address selected as default');
                        }}
                      >
                        <div className="loc-item-icon">
                          <MdPlace />
                        </div>
                        <div className="loc-item-content">
                          <h4 className="loc-item-title">{addr.label || 'Saved Address'} <span className="default-pill">Default</span></h4>
                          <p className="loc-item-subtitle">
                            {(addr.addressLine && !addr.addressLine.toLowerCase().includes('pinned location'))
                              ? addr.addressLine
                              : [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'Pinned Location'}
                          </p>
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
                        onClick={async () => {
                          setAddressForm(mapAddressToSelection(addr));
                          try {
                            const updatePayload = {
                              id: addr._id,
                              isDefault: true
                            };
                            await updateAddress(updatePayload);
                            // Refresh list to instantly move this address under 'Default Address' heading
                            await fetchAddresses();
                          } catch (err) {
                            console.error('Failed to set address as default:', err);
                          }
                          showToast('Address selected as default');
                        }}
                      >
                        <div className="loc-item-icon">
                          <MdPlace />
                        </div>
                        <div className="loc-item-content">
                          <h4 className="loc-item-title">{addr.label || 'Saved Address'}</h4>
                          <p className="loc-item-subtitle">{addr.addressLine || addr.address}</p>
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

              </div>

              <div className="address-popup-footer">
                <button
                  className="checkout-btn-premium"
                  disabled={loading || (showAddAddressForm ? !newAddressForm.addressLine.trim() : !addressForm.id)}
                  onClick={async () => {
                    if (showAddAddressForm) {
                      await handleSaveNewAddress();
                      return;
                    }

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
                  {showAddAddressForm ? 'Save & Use Address' : (pendingCheckout ? 'Continue to payment' : 'Use this address')}
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
                  {loading ? 'Processing...' : 'CHECKOUT'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="cart-empty guest-view-cart">
            <div className="empty-cart-icon">🛒</div>
            <h3>Your Cart</h3>
            <p>Please login to view your cart items and manage addresses</p>
            <button className="login-button-simple" onClick={onLoginClick} style={{ marginTop: '20px' }}>
              Login to Continue
            </button>
          </div>
        )}
      </div>

      {/* Removal Confirmation Dialog */}
      {confirmDialog.open && (
        <div className="confirm-overlay" onClick={handleCancelRemove}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <span className="confirm-icon-inner">🗑️</span>
            </div>
            <h3 className="confirm-title">Remove from Cart?</h3>
            <p className="confirm-message">
              <strong>{confirmDialog.item?.name}</strong> will be removed from your cart.
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-cancel" onClick={handleCancelRemove}>
                Keep It
              </button>
              <button className="confirm-btn confirm-remove" onClick={handleConfirmRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
