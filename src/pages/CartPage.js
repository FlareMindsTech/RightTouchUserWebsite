import React, { useState, useEffect, useCallback } from 'react';
import {
  MdOutlineLocationOn,
  MdEdit,
  MdAccessTime,
  MdPerson,
  MdClose,
  MdMyLocation,
  MdArrowBack,
  MdPlace,
  MdCheck
} from 'react-icons/md';
import { createAddress, getMyAddresses, searchAddress, updateAddress, reverseAddress, getCurrentUserLocation } from '../services/addressService';
import { checkout, getMyCart, getAvailableSlots, setSchedule } from '../services/cartService';
import { useNavigate } from 'react-router-dom';
import AddressModal from '../components/AddressModal';
import { formatPriceSmart } from '../utils/format';
import './CartPage.css';

const CartPage = ({ isActive, cartItems, removeFromCart, updateQuantity, showToast, currentUser, fetchCart, onLoginClick }) => {
  const navigate = useNavigate();
  const [profileData] = useState(currentUser || {});
  const [selectedTip, setSelectedTip] = useState(null);
  const [customTip, setCustomTip] = useState('');
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
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
    label: 'home',
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

  // Schedule state
  const [scheduledItemId, setScheduledItemId] = useState(null);
  const [slotsData, setSlotsData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [faultReason, setFaultReason] = useState('');
  const [isInstant, setIsInstant] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const faultSections = [
    {
      title: "Most Common Issues",
      reasons: [
        "Unit not turning on",
        "Error code on display",
        "Abnormal noise or smell",
        "Frequent tripping/shorts"
      ]
    },
    {
      title: "Solar & Battery Issues",
      reasons: [
        "Battery not charging properly",
        "Low solar output efficiency",
        "Inverter erratic operation",
        "Backup duration is low"
      ]
    }
  ];

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        setBookingSuccessData(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const response = await getAvailableSlots();
      if (response?.success && response?.result) {
        setSlotsData(response.result);
        if (response.result.schedule?.days?.length > 0 && !selectedDay) {
          setSelectedDay(response.result.schedule.days[0]);
        }
        if (response.result.schedule?.timeSlots?.length > 0 && !selectedTime) {
          setSelectedTime(response.result.schedule.timeSlots[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      showToast('Could not fetch available slots');
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDay, selectedTime, showToast]);

  const handleSaveSchedule = async () => {
    if (!isInstant && (!selectedDay || !selectedTime)) {
      showToast('Please select a date and time');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const payload = {
        itemId: scheduledItemId,
        faultProblem: faultReason,
        scheduledDate: isInstant ? null : selectedDay.fullDate,
        scheduledTime: isInstant ? null : selectedTime.value
      };
      const response = await setSchedule(payload);

      if (response?.success) {
        showToast('Schedule and fault updated!');
        await fetchCart();
        setScheduledItemId(null);
      } else {
        showToast(response?.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Failed to set schedule:', error);
      showToast('Error saving schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const openScheduleModal = (item) => {
    setScheduledItemId(item.originalId);
    setFaultReason(item.faultProblem || '');
    setIsInstant(!item.scheduledAt);
    fetchSlots();
  };

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

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentUserLocation();
      const location = await reverseAddress(coords.latitude, coords.longitude);

      setNewAddressForm((prev) => ({
        ...prev,
        addressLine: location.addressLine || prev.addressLine,
        city: location.city || coords.city || prev.city,
        state: location.state || coords.state || prev.state,
        pincode: location.pincode || coords.pincode || prev.pincode,
        latitude: (location.latitude || coords.latitude).toString(),
        longitude: (location.longitude || coords.longitude).toString()
      }));

      setLocationSearch(location.addressLine || '');
      setShowAddAddressForm(true);
      showToast('Current location detected successfully');
    } catch (geoError) {
      console.error('Error fetching location:', geoError);
      showToast(geoError.message || 'Unable to retrieve your location');
    } finally {
      setIsLocating(false);
    }
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
        isDefault: true
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
        setShowConfirmOrderModal(true);
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
    return Math.round(getSubtotal() * 0.08);
  };

  const getTipAmount = () => {
    if (customTip) return parseInt(customTip) || 0;
    return selectedTip || 0;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getTipAmount();
  };

  const startCheckout = async () => {
    if (!addressForm.id) {
      showToast('Please select a delivery address');
      setShowConfirmOrderModal(false);
      setShowAddressPopup(true);
      return;
    }

    const isCartValid = await validateCartBeforeCheckout();
    if (!isCartValid) return;

    const now = new Date();
    const pastDatedItems = cartItems.filter(item => {
      if (!item.scheduledAt) return false;
      const scheduledDate = new Date(item.scheduledAt);
      return scheduledDate < now;
    });

    if (pastDatedItems.length > 0) {
      showToast(`Some items have past scheduled dates. Please update schedule for: ${pastDatedItems.map(i => i.name).join(', ')}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
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

      const bookingData = checkoutRes.result || checkoutRes;
      let bookingId = null;

      if (Array.isArray(bookingData)) {
        bookingId = bookingData[0]?._id || bookingData[0];
      } else if (bookingData && typeof bookingData === 'object') {
        bookingId = bookingData._id || bookingData.bookingId || bookingData.id ||
          bookingData.booking?._id || bookingData.data?._id || bookingData.data?.bookingId;

        if (!bookingId && Array.isArray(bookingData.bookings) && bookingData.bookings.length > 0) {
          bookingId = bookingData.bookings[0]?._id || bookingData.bookings[0];
        }
        if (!bookingId && Array.isArray(bookingData.serviceBookings) && bookingData.serviceBookings.length > 0) {
           bookingId = bookingData.serviceBookings[0]?._id || bookingData.serviceBookings[0];
        }
        if (!bookingId && Array.isArray(bookingData.productBookings) && bookingData.productBookings.length > 0) {
           bookingId = bookingData.productBookings[0]?._id || bookingData.productBookings[0];
        }
        if (!bookingId) {
          bookingId = checkoutRes.bookingId || checkoutRes.id || checkoutRes._id;
        }
      }

      const displayRef = bookingId ? `#RT-${String(bookingId).slice(-6).toUpperCase()}` : '#RT-SUCCESS';

      setBookingSuccessData({
        bookingId: displayRef
      });

      setShowConfirmOrderModal(false);
      setPendingCheckout(false);
      setShowSuccessModal(true);
      fetchCart();
      setLoading(false);

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

    if (!addressForm.id && addresses.length === 0) {
      setShowAddressPopup(true);
      setShowAddAddressForm(false);
      setLocationSearch('');
    } else {
      setShowConfirmOrderModal(true);
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
                      <p className="cart-item-price">₹{formatPriceSmart(item.price)}</p>
                      
                      {(item.itemType === 'service' || item.itemId?.category === 'service') && (
                        <div className="item-schedule-info">
                          <button 
                            className="set-schedule-btn"
                            onClick={() => openScheduleModal(item)}
                          >
                            <MdAccessTime className="btn-icon" />
                            {item.scheduledAt ? 'Edit Schedule' : 'Set Schedule & Fault'}
                          </button>
                          {item.scheduledAt && (
                            <div className="scheduled-details-mini">
                              <span className="mini-text">📅 {new Date(item.scheduledAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at {new Date(item.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                              {item.faultProblem && <span className="mini-text fault-mini-text">🛠️ {item.faultProblem}</span>}
                            </div>
                          )}
                        </div>
                      )}
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
                      <p className="item-subtotal">₹{formatPriceSmart(item.price * (item.quantity || 1))}</p>
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

            {/* Schedule Popup */}
            {scheduledItemId && (
              <div className="address-popup-overlay" onClick={() => setScheduledItemId(null)}>
                <div className="address-popup schedule-popup" onClick={(e) => e.stopPropagation()}>
                  <button className="address-popup-close" onClick={() => setScheduledItemId(null)}>
                    <MdClose />
                  </button>
                  <h3 className="address-popup-heading">Schedule Your Service</h3>
                  
                  <div className="schedule-form-container">
                    <div className="booking-type-toggle">
                      <button 
                        className={`toggle-btn ${isInstant ? 'active' : ''}`}
                        onClick={() => setIsInstant(true)}
                      >
                        Instant (In 30 mins)
                      </button>
                      <button 
                        className={`toggle-btn ${!isInstant ? 'active' : ''}`}
                        onClick={() => setIsInstant(false)}
                      >
                        Schedule for Later
                      </button>
                    </div>

                    {!isInstant && (
                      <>
                        {loadingSlots ? (
                          <div className="slots-loading">Loading slots...</div>
                        ) : (
                          <>
                            <div className="days-selection">
                              <label className="section-label">Select Day</label>
                              <div className="days-grid">
                                {slotsData?.schedule?.days?.map((day, idx) => (
                                  <button
                                    key={idx}
                                    className={`day-card ${selectedDay?.fullDate === day.fullDate ? 'active' : ''}`}
                                    onClick={() => setSelectedDay(day)}
                                  >
                                    <span className="day-name">{day.dayName}</span>
                                    <span className="day-date">{day.date} {day.month}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="time-slots-selection">
                              <label className="section-label">Select Time Slot</label>
                              <div className="slots-grid">
                                {slotsData?.schedule?.timeSlots?.map((slot, idx) => (
                                  <button
                                    key={idx}
                                    className={`slot-pill ${selectedTime?.value === slot.value ? 'active' : ''}`}
                                    onClick={() => setSelectedTime(slot)}
                                  >
                                    {slot.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className="fault-reason-input">
                      <label className="section-label">Describe the Problem (Optional)</label>
                      
                      {faultSections.map((section, sIdx) => (
                        <div key={sIdx} className="fault-section-group">
                          <h5 className="fault-section-title">{section.title}</h5>
                          <div className="fault-reasons-chips">
                            {section.reasons.map((reason, idx) => (
                              <button
                                key={idx}
                                className={`reason-chip ${faultReason === reason ? 'active' : ''}`}
                                onClick={() => setFaultReason(reason)}
                              >
                                <span className="reason-text">{reason}</span>
                                {faultReason === reason && <div className="active-tick"><MdCheck /></div>}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <textarea
                        placeholder="Or describe the issue specifically..."
                        value={faultReason}
                        onChange={(e) => setFaultReason(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="address-popup-buttons">
                      <button 
                        className="address-save-btn" 
                        style={{ width: '100%' }} 
                        onClick={handleSaveSchedule}
                        disabled={isSavingSchedule}
                      >
                        {isSavingSchedule ? 'Saving...' : 'Done'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Location Selection Popup */}
            <AddressModal
              isOpen={showAddressPopup}
              onClose={() => {
                setShowAddressPopup(false);
                if (pendingCheckout && addressForm.id) {
                  startCheckout();
                }
              }}
              currentUser={currentUser}
              onSelectAddress={(formattedLine, addrObj) => {
                if (addrObj) {
                  setAddressForm(mapAddressToSelection(addrObj));
                } else if (formattedLine) {
                  setAddressForm((prev) => ({ ...prev, addressLine: formattedLine }));
                }
                fetchAddresses();
                if (pendingCheckout) {
                  setShowAddressPopup(false);
                  startCheckout();
                }
              }}
              showToast={showToast}
            />

            {/* Confirm Order Modal */}
            {showConfirmOrderModal && (
              <div className="address-popup-overlay confirm-order-overlay" onClick={() => setShowConfirmOrderModal(false)}>
                <div className="confirm-order-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="confirm-order-header">
                    <h3>Confirm Your Order</h3>
                    <button className="confirm-order-close" onClick={() => setShowConfirmOrderModal(false)}>
                      <MdClose />
                    </button>
                  </div>

                  <div className="confirm-order-body">
                    <div className="confirm-address-card">
                      <div className="confirm-address-icon-box">
                        <MdOutlineLocationOn />
                      </div>
                      <div className="confirm-address-content">
                        <div className="confirm-address-top-row">
                          <div className="confirm-address-title-group">
                            <span className="confirm-address-label">{addressForm.label || 'Home'}</span>
                            <span className="confirm-address-badge">DELIVERY ADDRESS</span>
                          </div>
                          <button
                            className="confirm-change-addr-btn"
                            onClick={() => {
                              setShowConfirmOrderModal(false);
                              setShowAddressPopup(true);
                            }}
                          >
                            Change
                          </button>
                        </div>
                        {addressForm.id ? (
                          <>
                            <p className="confirm-address-text">{addressForm.addressLine}</p>
                            {addressForm.phone && <p className="confirm-address-phone">📞 {addressForm.phone}</p>}
                          </>
                        ) : (
                          <p className="confirm-address-text warning-text">No address selected. Click change to select one.</p>
                        )}
                      </div>
                    </div>

                    <div className="confirm-items-section">
                      <div className="confirm-section-title-row">
                        <span className="confirm-section-title">ITEMS ({cartItems.length})</span>
                      </div>
                      <div className="confirm-items-list">
                        {cartItems.map((item, idx) => (
                          <div key={`confirm-item-${item.id || idx}`} className="confirm-item-card">
                            <div className="confirm-item-main">
                              <div className="confirm-item-left-details">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="confirm-item-img" />
                                ) : (
                                  <div className="confirm-item-img-placeholder">🛒</div>
                                )}
                                <div className="confirm-item-info">
                                  <span className="confirm-item-name">{item.name}</span>
                                  <span className="confirm-item-qty">Qty: {item.quantity || 1}</span>
                                </div>
                              </div>
                              <span className="confirm-item-price">₹{formatPriceSmart((item.price * (item.quantity || 1)).toFixed(2))}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="confirm-summary-box">
                      <div className="confirm-summary-row">
                        <span>Subtotal</span>
                        <span>₹{formatPriceSmart(getSubtotal().toFixed(2))}</span>
                      </div>
                      <div className="confirm-summary-row">
                        <span>Taxes & Fee</span>
                        <span>₹{formatPriceSmart(getTax().toFixed(2))}</span>
                      </div>
                      {getTipAmount() > 0 && (
                        <div className="confirm-summary-row">
                          <span>Tip</span>
                          <span>₹{formatPriceSmart(getTipAmount().toFixed(2))}</span>
                        </div>
                      )}
                      <div className="confirm-summary-row total">
                        <span>Total Amount</span>
                        <span>₹{formatPriceSmart(getTotal().toFixed(2))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="confirm-order-footer">
                    <button
                      className="confirm-place-order-btn"
                      onClick={startCheckout}
                      disabled={loading || !addressForm.id}
                    >
                      {loading ? 'Processing...' : `Place Order • ₹${getTotal().toFixed(2)}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Simple Booking Confirmed Toast - Auto Closes after 3 seconds */}
            {showSuccessModal && (
              <div className="success-toast-overlay">
                <div className="success-toast">
                  <div className="success-toast-icon">✅</div>
                  <div className="success-toast-content">
                    <h3 className="success-toast-title">Booking Confirmed!</h3>
                    <p className="success-toast-subtitle">Your order has been placed successfully</p>
                    {bookingSuccessData?.bookingId && (
                      <span className="success-toast-ref">{bookingSuccessData.bookingId}</span>
                    )}
                  </div>
                  <div className="success-toast-progress"></div>
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
                <a href="/policy" className="read-policy-link">Read full policy</a>
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