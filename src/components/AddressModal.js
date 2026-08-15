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

const AddressModal = ({ isOpen, onClose, currentUser, onSelectAddress, showToast }) => {
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
    setLoading(true);
    try {
      const res = await getMyAddresses();
      const list = res?.result || res?.data || res || [];
      const addrArr = Array.isArray(list) ? list : [];
      setAddresses(addrArr);

      const defaultAddr = addrArr.find((a) => a.isDefault) || addrArr[0];
      if (defaultAddr) {
        setSelectedId(defaultAddr._id);
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

  if (!isOpen) return null;

  const resetAddressPopupState = () => {
    setLocationSearch('');
    setLocationSuggestions([]);
    setShowAddAddressForm(false);
    onClose();
  };

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
      if (showToast) showToast('Current location detected successfully');
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
        isDefault: newAddressForm.isDefault,
        latitude: newAddressForm.latitude,
        longitude: newAddressForm.longitude
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
    setSelectedId(addr._id);
    const line = (addr.addressLine && !addr.addressLine.toLowerCase().includes('pinned location'))
      ? addr.addressLine
      : [addr.addressLine || addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'Saved Address';

    try {
      await updateAddress({ id: addr._id, isDefault: true });
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
    <div className="address-popup-overlay location-overlay-premium" onClick={resetAddressPopupState}>
      <div className="address-popup location-popup-premium" onClick={(e) => e.stopPropagation()}>
        
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
              placeholder="Search for area, street name..."
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
              <div className="gps-icon-badge">
                <MdMyLocation className="loc-icon-gps" />
              </div>
              <div className="gps-text-content">
                <span className="gps-main-title">{isLocating ? 'Detecting location...' : 'Use current location'}</span>
                <span className="gps-sub-title">Using GPS for precise location</span>
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
              <div className="input-field-group">
                <label className="input-label">Address Tag</label>
                <select
                  className="address-form-input"
                  value={newAddressForm.label}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                >
                  <option value="home">Home</option>
                  <option value="office">Office / Work</option>
                  <option value="other">Other</option>
                </select>
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
                  placeholder="Flat No / House No, Street Name, Area..."
                  value={newAddressForm.addressLine}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, addressLine: e.target.value }))}
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

              <div className="input-field-group">
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
                  className="address-cancel-btn"
                  onClick={() => setShowAddAddressForm(false)}
                >
                  Cancel
                </button>
                <button
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
          /* Saved Addresses List */
          <div className="location-list-premium">
            {!currentUser?._id ? (
              <div className="empty-addresses-box">
                <p className="empty-msg-text">Please sign in to view and select your saved delivery addresses.</p>
              </div>
            ) : loading ? (
              <div className="loading-state-container">
                <Loader2 className="spinner" size={28} />
                <span>Loading saved addresses...</span>
              </div>
            ) : addresses.length === 0 ? (
              <div className="empty-addresses-box">
                <p className="empty-msg-text">No saved addresses found.</p>
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
                  const isSelected = selectedId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      className={`location-item-premium ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectAddress(addr)}
                    >
                      <div className="loc-item-icon">
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
                  const isSelected = selectedId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      className={`location-item-premium ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectAddress(addr)}
                    >
                      <div className="loc-item-icon">
                        {getLabelIcon(addr.label)}
                      </div>
                      <div className="loc-item-content">
                        <h4 className="loc-item-title">{addr.label || 'Address'}</h4>
                        <p className="loc-item-subtitle">
                          {(addr.addressLine && !addr.addressLine.toLowerCase().includes('pinned location'))
                            ? addr.addressLine
                            : [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'Pinned Location'}
                        </p>
                      </div>
                      <div className="loc-selection-indicator">
                        <div className={`radio-outer ${isSelected ? 'selected' : ''}`}>
                          {isSelected && <div className="radio-inner" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  className="add-address-trigger-btn"
                  onClick={() => setShowAddAddressForm(true)}
                >
                  <Plus size={18} /> Add New Address
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AddressModal;
