import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MdEdit,
  MdOutlineChevronRight,
  MdOutlineLocationOn,
  MdClose,
  MdLogin,
  MdOutlineStarOutline,
  MdArrowBack,
  MdPlace,
  MdMyLocation,
  MdOutlineReportProblem,
  MdOutlineInfo
} from 'react-icons/md';
import {
  LuClipboardList,
  LuHeadphones,
  LuBookOpen,
  LuLogOut,
  LuFileText
} from 'react-icons/lu';
import { ShieldCheck, Zap, RotateCcw, ArrowRight, Wrench, Package, CheckCircle2, User } from 'lucide-react';
import './AccountPage.css';
import './CartPage.css';
import ConfirmModal from '../components/ConfirmModal';
import AddressModal from '../components/AddressModal';
import acImg from '../assets/AC.jpg';
import fridgeImg from '../assets/fridge.jpg';
import washingMachineImg from '../assets/washing machine.jpg';
import waterPurifierImg from '../assets/water purifier.jpg';
import accountBannerImg from '../assets/account_banner.jpg';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  searchAddress,
  reverseAddress,
  getCurrentUserLocation
} from '../services/addressService';
import { getMyProfile, updateProfile, deleteMyAccount } from '../services/userService';
import { safeStorage, setAuthSession, clearAuthSession } from '../utils/browserUtils';

const mapAddressToSelection = (addr) => {
  let displayAddress = addr?.addressLine || addr?.address || '';
  if (!displayAddress || displayAddress.toLowerCase().includes('pinned location')) {
    const parts = [addr?.city, addr?.state, addr?.pincode].filter(Boolean);
    if (parts.length > 0) displayAddress = parts.join(', ');
    else displayAddress = 'Pinned Location';
  }
  return {
    id: addr?._id,
    name: addr?.name || '',
    label: addr?.label || addr?.type || 'Address',
    addressLine: displayAddress,
    phone: addr?.mobileNumber || addr?.phone || ''
  };
};

const AccountPage = ({ isActive, showToast, onNavigate, currentUser, onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(currentUser || {});
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null
  });
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const fetchedRef = useRef(false);

  const [editFormData, setEditFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    gender: ''
  });

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
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const fetchProfile = useCallback(async () => {
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
        setAuthSession(null, response.result);
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await getMyAddresses();
      const addrList = response?.result || response?.data || response || [];
      if (Array.isArray(addrList)) {
        setAddresses(addrList);
        const defaultAddr = addrList.find((a) => a.isDefault);
        if (defaultAddr) {
          setAddressForm(mapAddressToSelection(defaultAddr));
        } else if (addrList.length > 0) {
          setAddressForm(mapAddressToSelection(addrList[0]));
        } else {
          setAddressForm({
            name: '',
            label: '',
            addressLine: 'No address added yet.',
            phone: '',
            id: null
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  }, []);

  const getFilteredAddresses = () => {
    const query = locationSearch.trim().toLowerCase();
    if (!query) return addresses;

    return addresses.filter((addr) => (
      [addr.name, addr.address, addr.city, addr.state, addr.landmark, addr.label]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    ));
  };

  const resetAddressPopupState = () => {
    setShowAddressModal(false);
    setLocationSearch('');
    setLocationSuggestions([]);
    setShowAddAddressForm(false);
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
        name: currentUser?.name || currentUser?.fname || 'User',
        mobileNumber: currentUser?.mobileNumber || currentUser?.identifier || '',
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
      showToast('Address saved successfully');
    } catch (error) {
      console.error('Failed to save address:', error);
      showToast('Error saving address');
    } finally {
      setIsSavingAddress(false);
    }
  };

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
  }, [currentUser?._id, isActive, fetchProfile, fetchAddresses]);

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

  // ===== LOCATION SEARCH (debounced, same as CartPage) =====
  useEffect(() => {
    if (!showAddressModal) return;

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
  }, [locationSearch, showAddressModal]);

  // ===== USE CURRENT LOCATION =====
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
      const accMsg = coords.accuracy ? ` (±${Math.round(coords.accuracy)}m)` : '';
      showToast(`Current location detected${accMsg}`);
    } catch (error) {
      console.error('Geolocation error:', error);
      showToast(error.message || 'Unable to retrieve your location');
    } finally {
      setIsLocating(false);
    }
  };

  // ===== SELECT LOCATION FROM SUGGESTION (same as CartPage) =====
  const applyLocationToAddressForm = (suggestion) => {
    const addressMeta = suggestion?.address || {};
    const composedAddress = [
      addressMeta.house_number,
      addressMeta.road,
      addressMeta.suburb,
      addressMeta.city || addressMeta.town,
      addressMeta.state,
      addressMeta.postcode
    ].filter(Boolean).join(', ');

    setNewAddressForm((prev) => ({
      ...prev,
      addressLine: suggestion?.display_name || composedAddress || prev.addressLine,
      city: addressMeta.city || addressMeta.town || addressMeta.village || prev.city,
      state: addressMeta.state || prev.state,
      pincode: addressMeta.postcode || prev.pincode,
      landmark: addressMeta.amenity || addressMeta.building || prev.landmark,
      latitude: suggestion?.lat || prev.latitude,
      longitude: suggestion?.lon || prev.longitude
    }));

    setShowAddAddressForm(true);
    showToast('Location selected. Review and save address.');
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const performLogout = () => {
    clearAuthSession();
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
        clearAuthSession();
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

  // eslint-disable-next-line no-unused-vars
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
      case 'Product Quotations':
        navigate('/quotations');
        break;
      case 'Manage address':
        setShowAddressModal(true);
        break;
      case 'Help & Support':
        navigate('/help');
        break;
      case 'Report issue':
        navigate('/report');
        break;
      case 'About Us':
        navigate('/about');
        break;
      default:
        showToast(`${menuItem} coming soon!`);
    }
  };

  return (
    <section className={`account-page-simple page ${isActive ? '' : 'hidden'}`} id="page-account">
      <div className="account-container-simple">
        {currentUser ? (
          <>
            {/* User Profile Card at the very top */}
            <div className="account-profile-header-simple">
              <div className="avatar-simple">
                <User size={26} strokeWidth={2.2} />
              </div>
              <div className="profile-info-simple">
                <h2 className="desktop-only">{profileData.fname ? `${profileData.fname} ${profileData.lname || ''}` : (currentUser?.name || 'User')}</h2>
                <h2 className="mobile-only">{profileData.fname || currentUser?.name || 'User'}</h2>
                <p className="email">{profileData.email || 'Complete your profile'}</p>
                <p className="phone">{profileData.mobileNumber || profileData.identifier || currentUser?.mobileNumber || currentUser?.identifier || ''}</p>
              </div>
              <button className="edit-profile-btn-simple" onClick={() => setIsEditing(true)}>
                <MdEdit size={18} /> Edit Profile
              </button>
            </div>

            <div className="account-dashboard-layout">
              {/* Left Column: Orders & Bookings at the very top, followed by other menus & logout */}
              <div className="account-sidebar-col">
                <div className="account-menu-simple">
                  <div className="account-menu-group-title">Orders &amp; Bookings</div>
                  <div className="menu-item-simple" onClick={() => handleMenuItemClick('My bookings')}>
                    <div className="menu-left-simple">
                      <LuClipboardList className="icon" />
                      <span>My Bookings</span>
                    </div>
                    <MdOutlineChevronRight className="arrow" />
                  </div>

                  <div className="menu-item-simple" onClick={() => handleMenuItemClick('Product Quotations')}>
                    <div className="menu-left-simple">
                      <LuFileText className="icon" />
                      <span>Product Quotations</span>
                    </div>
                    <MdOutlineChevronRight className="arrow" />
                  </div>

                  <div className="account-menu-group-title">Saved Locations</div>
                  <div className="menu-item-simple" onClick={() => handleMenuItemClick('Manage address')}>
                    <div className="menu-left-simple">
                      <MdOutlineLocationOn className="icon" />
                      <span>Manage Addresses</span>
                    </div>
                    <MdOutlineChevronRight className="arrow" />
                  </div>

                  <div className="account-menu-group-title">Settings &amp; Support</div>
                  <div className="menu-item-simple" onClick={() => handleMenuItemClick('Help & Support')}>
                    <div className="menu-left-simple">
                      <LuHeadphones className="icon" />
                      <span>Help &amp; Support</span>
                    </div>
                    <MdOutlineChevronRight className="arrow" />
                  </div>

                  <div className="menu-item-simple" onClick={() => handleMenuItemClick('Report issue')}>
                    <div className="menu-left-simple">
                      <MdOutlineReportProblem className="icon" />
                      <span>Report Issue</span>
                    </div>
                    <MdOutlineChevronRight className="arrow" />
                  </div>

                  <div className="menu-item-simple" onClick={() => handleMenuItemClick('About Us')}>
                    <div className="menu-left-simple">
                      <MdOutlineInfo className="icon" />
                      <span>About Us</span>
                    </div>
                    <MdOutlineChevronRight className="arrow" />
                  </div>
                </div>

                {/* Logout Button */}
                <div className="account-footer-simple">
                  <button className="logout-button-simple" onClick={openLogoutConfirm} style={{ width: '100%' }}>
                    <LuLogOut size={20} /> Logout
                  </button>
                </div>
              </div>

              {/* Right Column: banners, services & trust */}
              <div className="account-content-col">
                {/* Service Hero Banner */}
                <div className="acc-hero-banner">
                <div className="acc-hero-banner-text">
                  <span className="acc-hero-badge">
                    <CheckCircle2 size={14} /> RIGHTTOUCH HOME SERVICES
                  </span>
                  <h3>Need an Appliance Repair or Checkup?</h3>
                  <p>Certified, background-checked technicians at your doorstep within 120 minutes with genuine spares and 30-day warranty.</p>
                  <div className="acc-hero-actions">
                    <button
                      className="acc-btn-primary"
                      onClick={() => (onNavigate ? onNavigate('services') : navigate('/services'))}
                    >
                      <Wrench size={16} /> Book a Service
                    </button>
                    <button
                      className="acc-btn-secondary"
                      onClick={() => (onNavigate ? onNavigate('products') : navigate('/products'))}
                    >
                      <Package size={16} /> Explore Products
                    </button>
                  </div>
                </div>
                <div className="acc-hero-banner-img-wrap">
                  <img src={accountBannerImg} alt="Appliance Repair & Maintenance" className="acc-hero-img" />
                </div>
              </div>

              {/* Core Appliance Services Grid */}
              <div className="acc-appliances-box">
                <div className="acc-box-header">
                  <h4>Popular Appliance Services</h4>
                  <button
                    className="acc-link-btn"
                    onClick={() => (onNavigate ? onNavigate('services') : navigate('/services'))}
                  >
                    View All <ArrowRight size={14} />
                  </button>
                </div>
                <div className="acc-appliances-grid">
                  <div
                    className="acc-appliance-card"
                    onClick={() => (onNavigate ? onNavigate('services') : navigate('/services'))}
                  >
                    <div className="acc-appliance-img">
                      <img src={acImg} alt="AC Repair" />
                    </div>
                    <h5>AC Servicing</h5>
                    <p>Deep jet cleaning &amp; gas refill</p>
                  </div>
                  <div
                    className="acc-appliance-card"
                    onClick={() => (onNavigate ? onNavigate('services') : navigate('/services'))}
                  >
                    <div className="acc-appliance-img">
                      <img src={washingMachineImg} alt="Washing Machine" />
                    </div>
                    <h5>Washing Machine</h5>
                    <p>Drum check &amp; motor repair</p>
                  </div>
                  <div
                    className="acc-appliance-card"
                    onClick={() => (onNavigate ? onNavigate('services') : navigate('/services'))}
                  >
                    <div className="acc-appliance-img">
                      <img src={fridgeImg} alt="Refrigerator" />
                    </div>
                    <h5>Refrigerator</h5>
                    <p>Cooling coil &amp; thermostat</p>
                  </div>
                  <div
                    className="acc-appliance-card"
                    onClick={() => (onNavigate ? onNavigate('services') : navigate('/services'))}
                  >
                    <div className="acc-appliance-img">
                      <img src={waterPurifierImg} alt="Water Purifier" />
                    </div>
                    <h5>Water Purifier</h5>
                    <p>Filter change &amp; RO service</p>
                  </div>
                </div>
              </div>

              {/* Default Address & Support Row */}
              <div className="acc-sub-row">
                <div className="acc-sub-card">
                  <div className="acc-sub-card-header">
                    <h5>Default Service Address</h5>
                    <button className="acc-sub-btn" onClick={() => setShowAddressModal(true)}>
                      {addressForm.addressLine ? 'Change' : 'Add'}
                    </button>
                  </div>
                  <div className="acc-sub-card-body">
                    {addressForm.addressLine ? (
                      <>
                        <span className="acc-addr-tag">{addressForm.label || 'Home'}</span>
                        <p className="acc-addr-line">{addressForm.addressLine}</p>
                        {addressForm.phone && <p className="acc-addr-phone">Phone: {addressForm.phone}</p>}
                      </>
                    ) : (
                      <p className="acc-addr-empty">No default address saved yet.</p>
                    )}
                  </div>
                </div>

                <div className="acc-sub-card">
                  <div className="acc-sub-card-header">
                    <h5>RightTouch Guarantee</h5>
                  </div>
                  <div className="acc-sub-card-body acc-guarantee-list">
                    <div className="acc-guarantee-item">
                      <ShieldCheck size={16} className="text-emerald" />
                      <span>100% Background-Checked Pros</span>
                    </div>
                    <div className="acc-guarantee-item">
                      <Zap size={16} className="text-amber" />
                      <span>120-Minute Doorstep Response</span>
                    </div>
                    <div className="acc-guarantee-item">
                      <RotateCcw size={16} className="text-indigo" />
                      <span>30-Day Re-service Guarantee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        currentUser={currentUser}
        onSelectAddress={(formattedLine, addrObj) => {
          if (addrObj) {
            setAddressForm(mapAddressToSelection(addrObj));
          } else if (formattedLine) {
            setAddressForm((prev) => ({ ...prev, addressLine: formattedLine }));
          }
          fetchAddresses();
        }}
        showToast={showToast}
      />

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
        <div className="modal-backdrop profile-edit-backdrop" onClick={() => setIsEditing(false)}>
          <div className="profile-edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-edit-modal-header">
              <h2>Edit Profile</h2>
              <button
                type="button"
                className="profile-edit-modal-close-btn"
                onClick={() => setIsEditing(false)}
                aria-label="Close"
              >
                <MdClose size={18} />
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
              <div className="profile-edit-btn-row">
                <button
                  type="button"
                  className="cancel-profile-btn"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="save-profile-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountPage;