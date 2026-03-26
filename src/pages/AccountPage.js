import React, { useState, useEffect, useRef } from 'react';
import {
  MdEdit,
  MdOutlineChevronRight,
  MdOutlineLocationOn,
  MdOutlinePayments,
  MdClose,
  MdMoreVert,
  MdStarOutline,
  MdDeleteOutline,
  MdCheck,
  MdLogin,
  MdOutlineStarOutline,
  MdArrowBack,
  MdPlace
} from 'react-icons/md';
import {
  LuClipboardList,
  LuHeadphones,
  LuBookOpen,
  LuPlus,
  LuLogOut
} from 'react-icons/lu';
import './AccountPage.css';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress
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
    pincode: '',
    landmark: '',
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
    const finalAddressLine = addrFormData.landmark.trim() 
      ? `${addrFormData.addressLine.trim()} (Landmark: ${addrFormData.landmark.trim()})`
      : addrFormData.addressLine.trim();

    try {
      const response = await createAddress({
        ...addrFormData,
        addressLine: finalAddressLine
      });

      if (response?.success) {
        showToast('Address added');
        setIsAddingAddr(false);
        fetchAddresses();
      } else {
        showToast(response?.message || 'Failed to save address');
      }
    } catch (err) {
      showToast('Error saving address');
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

  const openAddModal = () => {
    setAddrFormData({
      name: '',
      mobileNumber: '',
      label: 'home',
      addressLine: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: addresses.length === 0
    });
    setIsAddingAddr(true);
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
      case 'Manage payment methods':
        onNavigate('payment-methods');
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

  return (
    <section className={`account-page-simple page ${isActive ? '' : 'hidden'}`} id="page-account">
      <div className="account-container-simple">
        {currentUser ? (
          <>
            {/* User Profile Header */}
            <div className="account-profile-header-simple">
              <div className="avatar-simple">
                {profileData.fname?.charAt(0) || currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="profile-info-simple">
                <h2>{profileData.fname ? `${profileData.fname} ${profileData.lname || ''}` : (currentUser?.name || 'User')}</h2>
                <p className="email">{profileData.email || 'Complete your profile'}</p>
                <p className="phone">{profileData.mobileNumber || profileData.identifier || currentUser?.mobileNumber || currentUser?.identifier || ''}</p>
              </div>
              <button className="edit-profile-btn-simple" onClick={() => setIsEditing(true)}>
                <MdEdit size={18} /> Edit Profile
              </button>
            </div>

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

              <div className="menu-item-simple" onClick={() => handleMenuItemClick('Manage payment methods')}>
                <div className="menu-left-simple">
                  <MdOutlinePayments className="icon" />
                  <span>Payment Methods</span>
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
          </>
        ) : (
          <div className="account-profile-header-simple guest-view">
            <div className="avatar-simple">U</div>
            <div className="profile-info-simple">
              <h2>Welcome Guest</h2>
              <p className="email">Please login to view your profile and bookings</p>
            </div>
          </div>
        )}

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
            <p>Please login to access your account features</p>
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
              <h2>{isAddingAddr ? 'Add New Address' : 'Manage Address'}</h2>
              <button className="modal-close" onClick={() => {
                if (isAddingAddr) setIsAddingAddr(false);
                else setShowAddressModal(false);
                setActiveDropdown(null);
              }}>
                {isAddingAddr ? <MdArrowBack /> : <MdClose />}
              </button>
            </div>

            {isAddingAddr ? (
              <form onSubmit={handleSaveAddress} className="address-form-premium">
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
                  <label>Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    value={addrFormData.mobileNumber}
                    onChange={(e) => setAddrFormData({ ...addrFormData, mobileNumber: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="input-group">
                  <label>Address Type</label>
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
                <div className="input-group">
                  <label>Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addrFormData.landmark}
                    onChange={(e) => setAddrFormData({ ...addrFormData, landmark: e.target.value })}
                    placeholder="E.g. Near Apollo Hospital"
                  />
                </div>
                <div className="input-group">
                  <label>Complete Address</label>
                  <textarea
                    value={addrFormData.addressLine}
                    onChange={(e) => setAddrFormData({ ...addrFormData, addressLine: e.target.value })}
                    placeholder="House No, Building Name, Area, etc."
                    required
                  />
                </div>
                <button type="submit" className="save-addr-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
              </form>
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
                    addresses.map((address) => (
                      <div key={address._id} className={`address-card ${address.isDefault ? 'is-default' : ''}`}>
                        <div className="address-card-header">
                          <div className="address-badge">
                            <MdPlace className="badge-icon" />
                            <span>{address.label || 'home'}</span>
                          </div>
                          {address.isDefault && (
                            <span className="default-tag">
                              <MdCheck /> Default
                            </span>
                          )}
                        </div>

                        <div className="address-content">
                          <h4 className="addr-name">{address.name || 'User'}</h4>
                          <p className="addr-text">{address.addressLine || address.address}</p>
                          {address.mobileNumber && <p className="addr-phone">{address.mobileNumber}</p>}
                        </div>

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
                              <button className="dropdown-item delete" onClick={() => handleDelete(address._id)}>
                                <MdDeleteOutline className="dropdown-icon" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
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
