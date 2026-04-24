import React, { useState, useEffect, useRef } from 'react';
import {
  MdEdit,
  MdOutlineChevronRight,
  MdOutlineLocationOn,
  MdClose,
  MdMoreVert,
  MdStarOutline,
  MdDeleteOutline,
  MdCheck,
  MdLogin,
  MdOutlineStarOutline,
  MdArrowBack,
  MdPlace,
  MdMyLocation,
  MdOutlineEdit
} from 'react-icons/md';
import {
  LuClipboardList,
  LuHeadphones,
  LuBookOpen,
  LuPlus,
  LuLogOut,
  LuSearch
} from 'react-icons/lu';
import './AccountPage.css';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  searchAddress,
  reverseAddress
} from '../services/addressService';
import { getMyProfile, updateProfile, deleteMyAccount } from '../services/userService';

const AccountPage = ({ isActive, showToast, onNavigate, currentUser, onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddr, setIsAddingAddr] = useState(false);
  const [profileData, setProfileData] = useState(currentUser || {});
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null
  });
  const [addrLimit, setAddrLimit] = useState(3);
  const [addressStep, setAddressStep] = useState('picker'); // 'picker' or 'form'
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const fetchedRef = useRef(false);

  const [editFormData, setEditFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    gender: ''
  });

  const [addrFormData, setAddrFormData] = useState({
    name: '',
    mobileNumber: '',
    label: 'home',
    addressLine: '',
    city: '',
    state: '',
    landmark: '',
    houseNo: '',
    latitude: '',
    longitude: '',
    isDefault: false
  });

  // Handle URL parameters for auto-editing
  useEffect(() => {
    if (isActive) {
      const searchParams = new URLSearchParams(location.search);
      const editType = searchParams.get('edit');

      if (editType === 'profile') {
        setIsEditing(true);
      } else if (editType === 'address') {
        setShowAddressModal(true);
      }
    }
  }, [location.search, isActive]);

  useEffect(() => {
    if (currentUser?._id && isActive && !fetchedRef.current) {
      fetchProfile();
      fetchAddresses();
      fetchedRef.current = true;
    }
    if (!isActive) {
      fetchedRef.current = false;
    }
  }, [currentUser?._id, isActive]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getMyProfile();
      if (response?.success && response.result) {
        setProfileData(response.result);
        setEditFormData({
          fname: response.result.fname || '',
          lname: response.result.lname || '',
          email: response.result.email || '',
          gender: response.result.gender || '',
          mobileNumber: response.result.mobileNumber || response.result.identifier || ''
        });
        localStorage.setItem('currentUser', JSON.stringify(response.result));
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await getMyAddresses();
      const addrList = response?.result || response?.data || response || [];
      if (Array.isArray(addrList)) {
        setAddresses(addrList);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await updateProfile(editFormData);
      if (response?.success) {
        showToast('Profile updated successfully');
        setIsEditing(false);
        fetchProfile();
      } else {
        showToast('Failed to update profile');
      }
    } catch (error) {
      showToast('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Construct descriptive address line
    const baseAddr = addrFormData.addressLine.trim();
    const house = addrFormData.houseNo?.trim() || '';
    const ldmrk = addrFormData.landmark?.trim() || '';
    
    let descriptiveAddress = baseAddr;
    if (house) descriptiveAddress = `${house}, ${descriptiveAddress}`;
    if (ldmrk) descriptiveAddress = `${descriptiveAddress} (Landmark: ${ldmrk})`;

    try {
      const payload = {
        ...addrFormData,
        addressLine: descriptiveAddress,
        id: editingAddressId // Backend uses 'id' for updates
      };

      const response = editingAddressId 
        ? await updateAddress(payload)
        : await createAddress(payload);

      if (response?.success) {
        showToast(editingAddressId ? 'Address updated' : 'Address added');
        setIsAddingAddr(false);
        setEditingAddressId(null);
        fetchAddresses();
      } else {
        showToast(response?.message || 'Failed to save address');
      }
    } catch (err) {
      showToast('Error saving address');
      console.error('Save Address Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    setLoading(true);
    try {
      // Find the address and update it with isDefault: true
      const addr = addresses.find(a => a._id === id);
      if (addr) {
        const response = await updateAddress({ ...addr, id, isDefault: true });
        if (response?.success) {
          showToast('Default address updated');
          fetchAddresses();
        }
      }
    } catch (err) {
      showToast('Failed to set default address');
    } finally {
      setLoading(false);
      setActiveDropdown(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    setLoading(true);
    try {
      const response = await deleteAddress({ id });
      if (response?.success) {
        showToast('Address deleted');
        fetchAddresses();
      }
    } catch (err) {
      showToast('Failed to delete address');
    } finally {
      setLoading(false);
      setActiveDropdown(null);
    }
  };

  const handleLocationSearch = async (query) => {
    setLocationSearch(query);
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const response = await searchAddress(query);
      setLocationSuggestions(response?.result || []);
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await reverseAddress(latitude, longitude);
          const result = response?.result;
          const addr = result?.address || {};

          const composed = [
            addr.house_number,
            addr.road,
            addr.neighbourhood,
            addr.suburb,
            addr.city_district,
            addr.town,
            addr.village
          ].filter(Boolean).join(', ');

          const finalAddress = result?.display_name || composed || 'Pinned Location';

          setAddrFormData(prev => ({
            ...prev,
            addressLine: finalAddress,
            city: addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.suburb || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
          setAddressStep('form');
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setAddressStep('form');
          showToast('Location found. Please fill details manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        showToast('Unable to retrieve your location');
        setIsLocating(false);
      }
    );
  };

  const selectLocation = (suggestion) => {
    const addr = suggestion.address || {};
    const composed = [
      addr.house_number,
      addr.road,
      addr.neighbourhood,
      addr.suburb,
      addr.city_district
    ].filter(Boolean).join(', ');

    setAddrFormData(prev => ({
      ...prev,
      addressLine: suggestion.display_name || composed,
      city: addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.suburb || '',
      state: addr.state || '',
      pincode: addr.postcode || '',
      latitude: suggestion.lat,
      longitude: suggestion.lon
    }));
    setAddressStep('form');
  };

  const openAddModal = () => {
    setAddrFormData({
      name: currentUser?.fname ? `${currentUser.fname} ${currentUser.lname || ''}`.trim() : '',
      mobileNumber: currentUser?.mobileNumber || currentUser?.identifier || '',
      label: 'home',
      addressLine: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: addresses.length === 0
    });
    setAddressStep('picker');
    setLocationSearch('');
    setLocationSuggestions([]);
    setShowAddressModal(true);
    setActiveDropdown(null);
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const performLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    showToast('Logged out successfully');
    if (onNavigate) {
      onNavigate('home');
    }
    window.dispatchEvent(new Event('userLoggedOut'));
  };

  const openLogoutConfirm = () => {
    setConfirmDialog({ open: true, action: 'logout' });
  };

  const performDeleteAccount = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await deleteMyAccount();
      if (response?.success) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        showToast('Your account has been deleted');
        if (onNavigate) onNavigate('home');
        window.dispatchEvent(new Event('userLoggedOut'));
      } else {
        showToast(response?.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast('Error deleting account');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteAccountConfirm = () => {
    if (!currentUser) return;
    setConfirmDialog({ open: true, action: 'delete-account' });
  };

  const closeConfirmDialog = () => {
    if (loading) return;
    setConfirmDialog({ open: false, action: null });
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.action === 'logout') {
      performLogout();
      closeConfirmDialog();
      return;
    }

    if (confirmDialog.action === 'delete-account') {
      await performDeleteAccount();
      closeConfirmDialog();
    }
  };

  const handleMenuItemClick = (menuItem) => {
    switch (menuItem) {
      case 'My bookings':
        onNavigate('bookings');
        break;
      case 'Manage address':
        setShowAddressModal(true);
        break;
      case 'My rating':
        navigate('/ratings');
        break;
      case 'Help & Support':
        navigate('/help');
        break;
      case 'Report issue':
        navigate('/report');
        break;
      default:
        showToast(`${menuItem} coming soon!`);
    }
  };

  const handleEditAddress = (addr) => {
    setAddrFormData({
      ...addr,
      houseNo: addr.houseNo || '', // Ensure houseNo exists in state
      landmark: addr.landmark || ''
    });
    setEditingAddressId(addr._id);
    setIsAddingAddr(true);
    setAddressStep('form'); // Edit directly shows form
    setActiveDropdown(null);
  };

  return (
    <section className={`account-page-simple page ${isActive ? '' : 'hidden'}`} id="page-account">
      <div className="account-container-simple">
        {currentUser ? (
          <>
            {/* User Profile Header - Minimal on mobile */}
            <div className="account-profile-header-simple">
              <div className="avatar-simple">
                {profileData.fname?.charAt(0) || currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="profile-info-simple">
                <h2 className="desktop-only">{profileData.fname ? `${profileData.fname} ${profileData.lname || ''}` : (currentUser?.name || 'User')}</h2>
                <h2 className="mobile-only">{profileData.fname || currentUser?.name || 'User'}</h2>
                <p className="email">{profileData.email || 'Complete your profile'}</p>
                <p className="phone">{profileData.mobileNumber || profileData.identifier || currentUser?.mobileNumber || currentUser?.identifier || ''}</p>
              </>
            ) : (
              <>
                <h2>Welcome Guest</h2>
                <p className="email">Please login to view your profile and bookings</p>
              </>
            )}
          </div>
          {currentUser && (
            <button className="edit-profile-btn-simple" onClick={() => setIsEditing(true)}>
              <MdEdit size={18} /> Edit Profile
            </button>
          )}
        </div>

        {currentUser ? (
          <>
            {/* Action List */}
            <div className="account-menu-simple">
              <div className="menu-item-simple" onClick={() => handleMenuItemClick('My bookings')}>
                <div className="menu-left-simple">
                  <LuClipboardList className="icon" />
                  <span>My Bookings</span>
                </div>
                <MdOutlineChevronRight className="arrow" />
              </div>

              <div className="menu-item-simple" onClick={() => handleMenuItemClick('Manage address')}>
                <div className="menu-left-simple">
                  <MdOutlineLocationOn className="icon" />
                  <span>Manage Addresses</span>
                </div>
                <MdOutlineChevronRight className="arrow" />
              </div>

              <div className="menu-item-simple" onClick={() => handleMenuItemClick('My rating')}>
                <div className="menu-left-simple">
                  <MdOutlineStarOutline className="icon" />
                  <span>My Ratings</span>
                </div>
                <MdOutlineChevronRight className="arrow" />
              </div>

              <div className="menu-item-simple" onClick={() => handleMenuItemClick('Help & Support')}>
                <div className="menu-left-simple">
                  <LuHeadphones className="icon" />
                  <span>Help & Support</span>
                </div>
                <MdOutlineChevronRight className="arrow" />
              </div>

              <div className="menu-item-simple" onClick={() => handleMenuItemClick('Report issue')}>
                <div className="menu-left-simple">
                  <LuBookOpen className="icon" />
                  <span>Report Issue</span>
                </div>
                <MdOutlineChevronRight className="arrow" />
              </div>
            </div>

            {/* Logout/Delete Buttons */}
            <div className="account-footer-simple">
              <button className="logout-button-simple" onClick={openLogoutConfirm}>
                <LuLogOut size={20} /> Logout
              </button>
              <button className="delete-account-button-simple" onClick={openDeleteAccountConfirm} disabled={loading}>
                <MdDeleteOutline size={20} /> {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </>
        ) : (
          <div className="guest-account-prompt">
            <button className="login-prompt-btn" onClick={handleLoginClick}>
              <MdLogin size={20} /> Login Now
            </button>
          </div>
        )}
      </div>

      {/* Address Management Modal */}
      {showAddressModal && (
        <div className="modal-backdrop" onClick={() => { setShowAddressModal(false); setIsAddingAddr(false); setActiveDropdown(null); }}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <div className="header-left">
                {isAddingAddr && addressStep === 'form' ? (
                  <button className="back-btn-simple" onClick={() => setAddressStep('picker')}>
                    <MdArrowBack />
                  </button>
                ) : isAddingAddr ? (
                  <button className="back-btn-simple" onClick={() => setIsAddingAddr(false)}>
                    <MdArrowBack />
                  </button>
                ) : null}
                <h2>{isAddingAddr ? (addressStep === 'picker' ? 'Select Location' : 'Address Details') : 'Manage Address'}</h2>
              </div>
              <button className="modal-close" onClick={() => {
                setShowAddressModal(false);
                setIsAddingAddr(false);
                setActiveDropdown(null);
              }}>
                <MdClose />
              </button>
            </div>

            {isAddingAddr ? (
              <div className="address-flow-container">
                {addressStep === 'picker' ? (
                  <div className="location-picker-step">
                    <div className="search-input-wrapper">
                      <LuSearch className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search for area, street name..."
                        value={locationSearch}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        autoFocus
                      />
                      {isSearchingLocation && <div className="search-loader"></div>}
                    </div>

                    <button 
                      className={`current-location-btn ${isLocating ? 'locating' : ''}`}
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                    >
                      <MdMyLocation className="gps-icon" />
                      <span>{isLocating ? 'Detecting location...' : 'Use Current Location'}</span>
                    </button>

                    <div className="location-suggestions">
                      {locationSuggestions.map((suggestion, idx) => (
                        <div 
                          key={idx} 
                          className="suggestion-item"
                          onClick={() => selectLocation(suggestion)}
                        >
                          <MdPlace className="item-icon" />
                          <div className="item-info">
                            <p className="item-display">{suggestion.display_name}</p>
                          </div>
                        </div>
                      ))}
                      {locationSearch.length >= 3 && locationSuggestions.length === 0 && !isSearchingLocation && (
                        <div className="no-suggestions">No locations found. Try a different search.</div>
                      )}
                    </div>

                    <div className="picker-footer">
                      <p className="osm-attribution">Location search by <b>OpenStreetMap</b></p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAddress} className="address-form-premium fade-in">
                    <div className="selected-location-preview">
                      <MdPlace className="preview-icon" />
                      <div className="preview-text">
                        <p className="preview-addr">{addrFormData.addressLine}</p>
                        <button type="button" className="change-loc-btn" onClick={() => setAddressStep('picker')}>Change</button>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="input-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={addrFormData.name}
                          onChange={(e) => setAddrFormData({ ...addrFormData, name: e.target.value })}
                          placeholder="e.g. John Doe"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Mobile Number</label>
                        <input
                          type="tel"
                          value={addrFormData.mobileNumber}
                          onChange={(e) => setAddrFormData({ ...addrFormData, mobileNumber: e.target.value })}
                          placeholder="10-digit mobile number"
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>House / Flat / Block No.</label>
                      <input
                        type="text"
                        value={addrFormData.houseNo || ''}
                        onChange={(e) => setAddrFormData({ ...addrFormData, houseNo: e.target.value })}
                        placeholder="e.g. Flat 101, Block B"
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label>Landmark (Optional)</label>
                      <input
                        type="text"
                        value={addrFormData.landmark}
                        onChange={(e) => setAddrFormData({ ...addrFormData, landmark: e.target.value })}
                        placeholder="e.g. Near Central Park"
                      />
                    </div>

                    <div className="input-group">
                      <label>Save as</label>
                      <div className="type-selector">
                        {['home', 'office', 'other'].map(label => (
                          <button
                            key={label}
                            type="button"
                            className={`type-btn ${addrFormData.label === label ? 'active' : ''}`}
                            onClick={() => setAddrFormData({ ...addrFormData, label })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="save-addr-btn" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Address & Proceed'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                <button className="add-address-btn" onClick={openAddModal}>
                  <LuPlus className="add-icon" />
                  Add New Address
                </button>

                <div className="address-list">
                  {addresses.length === 0 ? (
                    <div className="empty-addresses">
                      <MdOutlineLocationOn size={48} />
                      <p>No addresses saved yet</p>
                    </div>
                  ) : (
                    <>
                      {addresses.slice(0, addrLimit).map((address) => (
                        <div key={address._id} className={`address-card ${address.isDefault ? 'is-default' : ''}`}>
                          <div className="address-card-header">
                            <div className="header-left-group">
                              <div className="address-badge">
                                <MdPlace className="badge-icon" />
                                <span>{address.label || 'home'}</span>
                              </div>
                              <h4 className="addr-name">{address.name || 'User'}</h4>
                            </div>
                            
                            <div className="header-right-group">
                              {address.isDefault && (
                                <span className="default-tag">
                                  <MdCheck /> Default
                                </span>
                              )}
                              <div className="address-card-actions">
                                <button
                                  className="three-dots-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === address._id ? null : address._id);
                                  }}
                                >
                                  <MdMoreVert />
                                </button>

                                {activeDropdown === address._id && (
                                  <div className="dropdown-menu">
                                    {!address.isDefault && (
                                      <button className="dropdown-item" onClick={() => handleSetDefault(address._id)}>
                                        <MdStarOutline className="dropdown-icon" />
                                        <span>Set as Default</span>
                                      </button>
                                    )}
                                    <button className="dropdown-item" onClick={() => handleEditAddress(address)}>
                                      <MdOutlineEdit className="dropdown-icon" />
                                      <span>Edit Address</span>
                                    </button>
                                    <button className="dropdown-item delete" onClick={() => handleDelete(address._id)}>
                                      <MdDeleteOutline className="dropdown-icon" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="address-content">
                            <p className="addr-text">{address.addressLine || address.address}</p>
                            {address.mobileNumber && (
                              <p className="addr-phone">
                                <MdLogin size={14} style={{ opacity: 0.7 }} /> {address.mobileNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {addresses.length > 3 && (
                        <button 
                          className="view-more-addr-btn" 
                          onClick={() => setAddrLimit(addrLimit >= addresses.length ? 3 : addresses.length)}
                        >
                          {addrLimit >= addresses.length ? 'Show Less' : `View More (${addresses.length - 3} more)`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <ConfirmModal
          isOpen={confirmDialog.open}
          icon={confirmDialog.action === 'logout' ? '🚪' : '🗑️'}
          iconBg={confirmDialog.action === 'logout' ? '#fff7ed' : '#fee2e2'}
          iconColor={confirmDialog.action === 'logout' ? '#f59e0b' : '#ef4444'}
          title={confirmDialog.action === 'logout' ? 'Confirm Logout' : 'Delete Account'}
          desc={confirmDialog.action === 'logout'
            ? 'Are you sure you want to logout now?'
            : 'Are you sure you want to delete your account permanently? This cannot be undone.'}
          confirmLabel={confirmDialog.action === 'logout' ? 'Logout' : 'Delete'}
          cancelLabel="Keep It"
          confirmClass={confirmDialog.action === 'logout' ? 'cm-confirm-warning' : 'cm-confirm-danger'}
          onConfirm={handleConfirmAction}
          onCancel={closeConfirmDialog}
          loading={loading}
        />
      )}

      {/* Profile Edit Modal */}
      {isEditing && (
        <div className="modal-backdrop" onClick={() => setIsEditing(false)}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={() => setIsEditing(false)}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="profile-edit-form">
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={editFormData.fname}
                  onChange={(e) => setEditFormData({ ...editFormData, fname: e.target.value })}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={editFormData.lname}
                  onChange={(e) => setEditFormData({ ...editFormData, lname: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="save-profile-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountPage;