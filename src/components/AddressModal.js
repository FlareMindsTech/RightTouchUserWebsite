import React, { useState, useEffect, useCallback } from 'react';
import {
  MdArrowBack,
  MdClose,
  MdMyLocation,
  MdPlace,
  MdSearch,
  MdHome,
  MdWork,
  MdLocationOn,
  MdChevronRight
} from 'react-icons/md';
import { Plus, Loader2 } from 'lucide-react';
import { getMyAddresses, updateAddress, createAddress, searchAddress, reverseAddress, getCurrentUserLocation } from '../services/addressService';
import './AddressModal.css';

const AddressModal = ({ isOpen, onClose, currentUser, onSelectAddress, showToast, onLoginClick }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Location Search & Auto-suggest state
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Form State
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'home',
    addressLine: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
    latitude: '',
    longitude: '',
  });

  const fetchAddresses = useCallback(async () => {
    if (!currentUser?._id) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setAddresses((prev) => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });
    try {
      const res = await getMyAddresses();
      const list = res?.result || res?.data || res || [];
      const addrArr = Array.isArray(list) ? list : [];
      setAddresses(addrArr);

      const getAddrId = (a) => a?._id || a?.id || a?.addressId;
      const defaultAddr = addrArr.find((a) => a.isDefault) || addrArr[0];
      if (defaultAddr) {
        setSelectedId((prevId) => prevId || getAddrId(defaultAddr));
      }
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen, fetchAddresses]);

  // Debounced location search API call
  useEffect(() => {
    if (!isOpen) return;

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
  }, [locationSearch, isOpen]);

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (isRendered && !isClosing) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        document.body.style.overflow = 'unset';
      }, 260);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isRendered, isClosing]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setLocationSearch('');
      setLocationSuggestions([]);
      setShowAddAddressForm(false);
      setIsClosing(false);
      setIsRendered(false);
      document.body.style.overflow = 'unset';
      if (onClose) onClose();
    }, 260);
  }, [isClosing, onClose]);

  useEffect(() => {
    if (!isRendered) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendered, handleClose]);

  if (!isOpen && !isRendered) return null;

  const resetAddressPopupState = handleClose;

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentUserLocation();
      const location = await reverseAddress(coords.latitude, coords.longitude);

      setNewAddressForm((prev) => ({
        ...prev,
        addressLine: location.addressLine || prev.addressLine,
        landmark: location.landmark || prev.landmark,
        city: location.city || coords.city || prev.city,
        state: location.state || coords.state || prev.state,
        pincode: location.pincode || coords.pincode || prev.pincode,
        latitude: (location.latitude ?? coords.latitude ?? '').toString(),
        longitude: (location.longitude ?? coords.longitude ?? '').toString()
      }));

      setLocationSearch(location.addressLine || '');
      setShowAddAddressForm(true);
      if (showToast) {
        const accInfo = coords.accuracy ? ` (±${Math.round(coords.accuracy)}m)` : '';
        showToast(`Live location detected${accInfo}`);
      }
    } catch (err) {
      console.error('Error fetching location:', err);
      if (showToast) showToast(err.message || 'Unable to retrieve your location');
    } finally {
      setIsLocating(false);
    }
  };

  const applyLocationToAddressForm = (suggestion) => {
    const composedAddress = [
      suggestion?.address?.road,
      suggestion?.address?.suburb,
      suggestion?.address?.city || suggestion?.address?.town,
      suggestion?.address?.state,
      suggestion?.address?.postcode
    ].filter(Boolean).join(', ');

    setNewAddressForm((prev) => ({
      ...prev,
      addressLine: suggestion?.display_name || composedAddress || prev.addressLine,
      city: suggestion?.address?.city || suggestion?.address?.town || suggestion?.address?.village || prev.city,
      state: suggestion?.address?.state || prev.state,
      pincode: suggestion?.address?.postcode || prev.pincode,
      landmark: suggestion?.address?.amenity || suggestion?.address?.building || prev.landmark,
      latitude: suggestion?.lat || prev.latitude,
      longitude: suggestion?.lon || prev.longitude
    }));

    setLocationSuggestions([]);
    setShowAddAddressForm(true);
    if (showToast) showToast('Location selected. Review and save address.');
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressForm.addressLine.trim()) {
      if (showToast) showToast('Please enter complete address line');
      return;
    }

    const finalAddressLine = newAddressForm.landmark.trim()
      ? `${newAddressForm.addressLine.trim()} (Landmark: ${newAddressForm.landmark.trim()})`
      : newAddressForm.addressLine.trim();

    setIsSavingAddress(true);
    try {
      const payload = {
        label: newAddressForm.label || 'home',
        addressLine: finalAddressLine,
        city: newAddressForm.city.trim(),
        state: newAddressForm.state.trim(),
        pincode: newAddressForm.pincode.trim(),
        landmark: newAddressForm.landmark.trim(),
        isDefault: newAddressForm.isDefault,
        latitude: parseFloat(newAddressForm.latitude) || 0,
        longitude: parseFloat(newAddressForm.longitude) || 0
      };

      const res = await createAddress(payload);
      if (showToast) showToast('Address saved successfully');

      const created = res?.result || res?.data || payload;
      if (onSelectAddress) {
        onSelectAddress(finalAddressLine, created);
      }

      await fetchAddresses();
      setShowAddAddressForm(false);
      resetAddressPopupState();
    } catch (error) {
      console.error('Failed to save address:', error);
      if (showToast) showToast(error?.message || 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSelectAddress = async (addr) => {
    const targetId = addr._id || addr.id || addr.addressId;
    setSelectedId(targetId);
    const line = (addr.addressLine && !addr.addressLine.toLowerCase().includes('pinned location'))
      ? addr.addressLine
      : [addr.addressLine || addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'Saved Address';

    try {
      if (targetId) {
        await updateAddress({ id: targetId, addressId: targetId, isDefault: true });
      }
      if (showToast) showToast('Delivery address updated');
    } catch (err) {
      console.warn('Could not set address as default:', err);
    }

    if (onSelectAddress) {
      onSelectAddress(line, addr);
    }
    resetAddressPopupState();
  };

  const getLabelIcon = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('home')) return <MdHome className="tag-icon" />;
    if (l.includes('work') || l.includes('office')) return <MdWork className="tag-icon" />;
    return <MdLocationOn className="tag-icon" />;
  };

  const defaultAddresses = addresses.filter((a) => a.isDefault);
  const otherAddresses = addresses.filter((a) => !a.isDefault);

  return (
    <div
      className={`address-popup-overlay location-overlay-premium ${isClosing ? 'is-closing' : 'is-opening'}`}
      onClick={handleClose}
    >
      <div
        className={`address-popup location-popup-premium ${isClosing ? 'is-closing' : 'is-opening'}`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Mobile drag handle indicator */}
        <div className="address-sheet-handle mobile-only"></div>

        {/* Header Title */}
        <div className="modal-title-header">
          <div className="title-with-icon">
            <div className="title-icon-badge">
              <MdLocationOn />
            </div>
            <div>
              <h3 className="modal-heading-text">Select Delivery Location</h3>
              <p className="modal-subheading-text">Choose your address for fast service delivery</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={resetAddressPopupState} aria-label="Close modal">
            <MdClose />
          </button>
        </div>

        {/* Location Search Bar */}
        <div className="location-header-premium">
          <div className="location-search-wrapper">
            <MdSearch className="search-leading-icon" />
            <input
              type="text"
              placeholder="Search for area, street name, apartment..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
            />
            {locationSearch && (
              <button className="location-clear-btn" onClick={() => setLocationSearch('')} aria-label="Clear search">
                <MdClose />
              </button>
            )}
          </div>
        </div>

        {/* Search Suggestions */}
        {!isSearchingLocation && locationSuggestions.length > 0 && (
          <div className="location-suggestions-box">
            {locationSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.place_id}`}
                className="location-suggestion-item"
                onClick={() => applyLocationToAddressForm(suggestion)}
              >
                <MdPlace className="sug-icon" />
                <span className="sug-text">{suggestion.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {isSearchingLocation && (
          <div className="location-search-status">
            <Loader2 className="spinner-icon" size={16} /> Searching locations...
          </div>
        )}

        {/* Current Location Action Card */}
        {!showAddAddressForm && locationSuggestions.length === 0 && (
          <div className="location-actions-container">
            <button className="use-current-loc-card" onClick={handleUseCurrentLocation} disabled={isLocating}>
              <div className={`gps-icon-badge ${isLocating ? 'pulsing' : ''}`}>
                <MdMyLocation className="loc-icon-gps" />
              </div>
              <div className="gps-text-content">
                <span className="gps-main-title">{isLocating ? 'Detecting your GPS location...' : 'Use current location'}</span>
                <span className="gps-sub-title">Auto-detect area via GPS for precise delivery</span>
              </div>
              <MdChevronRight className="gps-chevron" />
            </button>
          </div>
        )}

        {/* Add New Address Form */}
        {showAddAddressForm ? (
          <div className="new-address-form-box">
            <div className="form-header-row">
              <h4 className="form-section-title">Add New Address</h4>
              <button
                type="button"
                className="form-back-link"
                onClick={() => setShowAddAddressForm(false)}
              >
                <MdArrowBack /> Back to addresses
              </button>
            </div>

            <div className="new-address-grid">
              <div className="input-field-group full-width">
                <label className="input-label">Address Tag / Type</label>
                <div className="address-tag-pill-group">
                  <button
                    type="button"
                    className={`tag-pill-btn ${(newAddressForm.label || 'home').toLowerCase() === 'home' ? 'active tag-home' : ''}`}
                    onClick={() => setNewAddressForm((prev) => ({ ...prev, label: 'home' }))}
                  >
                    <MdHome size={18} /> Home
                  </button>
                  <button
                    type="button"
                    className={`tag-pill-btn ${(newAddressForm.label || '').toLowerCase() === 'work' || (newAddressForm.label || '').toLowerCase() === 'office' ? 'active tag-work tag-office' : ''}`}
                    onClick={() => setNewAddressForm((prev) => ({ ...prev, label: 'work' }))}
                  >
                    <MdWork size={18} /> Work
                  </button>
                  <button
                    type="button"
                    className={`tag-pill-btn ${(newAddressForm.label || '').toLowerCase() === 'other' ? 'active tag-other' : ''}`}
                    onClick={() => setNewAddressForm((prev) => ({ ...prev, label: 'other' }))}
                  >
                    <MdLocationOn size={18} /> Other
                  </button>
                </div>
              </div>

              <div className="input-field-group">
                <label className="input-label">Pincode</label>
                <input
                  type="text"
                  className="address-form-input"
                  placeholder="e.g. 625001"
                  value={newAddressForm.pincode}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
                />
              </div>

              <div className="input-field-group">
                <label className="input-label">City</label>
                <input
                  type="text"
                  className="address-form-input"
                  placeholder="City"
                  value={newAddressForm.city}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div className="input-field-group full-width">
                <label className="input-label">Landmark (Optional)</label>
                <input
                  type="text"
                  className="address-form-input"
                  placeholder="e.g. Near Bus Stand, Opposite City Mall"
                  value={newAddressForm.landmark}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, landmark: e.target.value }))}
                />
              </div>

              <div className="input-field-group full-width">
                <label className="input-label">Complete Address *</label>
                <textarea
                  className="address-form-input textarea-input"
                  placeholder="Flat No / House No, Building Name, Street, Area..."
                  value={newAddressForm.addressLine}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, addressLine: e.target.value }))}
                />
              </div>

              <div className="input-field-group full-width">
                <label className="input-label">State</label>
                <input
                  type="text"
                  className="address-form-input"
                  placeholder="State"
                  value={newAddressForm.state}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                />
              </div>
            </div>

            <div className="checkbox-field-row">
              <label className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={newAddressForm.isDefault}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                />
                <span className="checkbox-custom-box"></span>
                <span className="checkbox-text">Set as default delivery address</span>
              </label>
            </div>

            <div className="form-action-buttons">
              <div className="btn-row">
                <button
                  type="button"
                  className="address-cancel-btn"
                  onClick={() => setShowAddAddressForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="address-save-btn"
                  onClick={handleSaveNewAddress}
                  disabled={isSavingAddress}
                >
                  {isSavingAddress ? 'Saving address...' : 'Save & Use Address'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Saved Addresses List View */
          <>
            <div className="location-list-premium">
              {!currentUser?._id ? (
                <div className="empty-addresses-box">
                  <div className="empty-address-icon-wrap">
                    <MdLocationOn size={36} />
                  </div>
                  <p className="empty-msg-title">Sign in to view addresses</p>
                  <p className="empty-msg-text">Please sign in to access your saved delivery locations.</p>
                  {onLoginClick && (
                    <button
                      className="add-address-trigger-btn"
                      onClick={() => {
                        resetAddressPopupState();
                        onLoginClick();
                      }}
                      style={{ marginTop: '16px' }}
                    >
                      Sign In / Register
                    </button>
                  )}
                </div>
              ) : loading ? (
                <div className="loading-state-container">
                  <Loader2 className="spinner" size={28} />
                  <span>Loading your addresses...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="empty-addresses-box">
                  <div className="empty-address-icon-wrap">
                    <MdPlace size={36} />
                  </div>
                  <p className="empty-msg-title">No addresses saved yet</p>
                  <p className="empty-msg-text">Add your home or work address for faster checkout.</p>
                  <button
                    className="add-address-trigger-btn"
                    onClick={() => setShowAddAddressForm(true)}
                  >
                    <Plus size={18} /> Add New Address
                  </button>
                </div>
              ) : (
                <>
                  {defaultAddresses.length > 0 && (
                    <p className="address-section-divider">Default Address</p>
                  )}
                  {defaultAddresses.map((addr) => {
                    const itemKey = addr._id || addr.id || addr.addressId;
                    const isSelected = selectedId === itemKey;
                    const labelTag = (addr.label || 'home').toLowerCase();
                    return (
                      <div
                        key={itemKey}
                        className={`location-item-premium tag-type-${labelTag} ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectAddress(addr)}
                      >
                        <div className={`loc-item-icon tag-type-${labelTag}`}>
                          {getLabelIcon(addr.label)}
                        </div>
                        <div className="loc-item-content">
                          <div className="loc-title-row">
                            <h4 className="loc-item-title">{addr.label || 'Home'}</h4>
                            <span className="default-pill">DEFAULT</span>
                          </div>
                          <p className="loc-item-subtitle">
                            {(addr.addressLine && !addr.addressLine.toLowerCase().includes('pinned location'))
                              ? addr.addressLine
                              : [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'Pinned Location'}
                          </p>
                          {(addr.city || addr.pincode) && (
                            <div className="loc-item-meta-row">
                              <span className="loc-city-pill">{[addr.city, addr.state].filter(Boolean).join(', ')}</span>
                              {addr.pincode && <span className="loc-pin-pill">PIN: {addr.pincode}</span>}
                            </div>
                          )}
                        </div>
                        <div className="loc-selection-indicator">
                          <div className={`radio-outer ${isSelected ? 'selected' : ''}`}>
                            {isSelected && <div className="radio-inner" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {otherAddresses.length > 0 && (
                    <p className="address-section-divider">Other Saved Addresses</p>
                  )}
                  {otherAddresses.map((addr) => {
                    const itemKey = addr._id || addr.id || addr.addressId;
                    const isSelected = selectedId === itemKey;
                    const labelTag = (addr.label || 'home').toLowerCase();
                    return (
                      <div
                        key={itemKey}
                        className={`location-item-premium tag-type-${labelTag} ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectAddress(addr)}
                      >
                        <div className={`loc-item-icon tag-type-${labelTag}`}>
                          {getLabelIcon(addr.label)}
                        </div>
                        <div className="loc-item-content">
                          <div className="loc-title-row">
                            <h4 className="loc-item-title">{addr.label || 'Address'}</h4>
                          </div>
                          <p className="loc-item-subtitle">
                            {(addr.addressLine && !addr.addressLine.toLowerCase().includes('pinned location'))
                              ? addr.addressLine
                              : [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'Pinned Location'}
                          </p>
                          {(addr.city || addr.pincode) && (
                            <div className="loc-item-meta-row">
                              <span className="loc-city-pill">{[addr.city, addr.state].filter(Boolean).join(', ')}</span>
                              {addr.pincode && <span className="loc-pin-pill">PIN: {addr.pincode}</span>}
                            </div>
                          )}
                        </div>
                        <div className="loc-selection-indicator">
                          <div className={`radio-outer ${isSelected ? 'selected' : ''}`}>
                            {isSelected && <div className="radio-inner" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {currentUser?._id && addresses.length > 0 && !loading && (
              <div className="modal-sticky-footer">
                <button
                  type="button"
                  className="add-address-trigger-btn"
                  onClick={() => setShowAddAddressForm(true)}
                >
                  <Plus size={18} /> Add New Address
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default AddressModal;
