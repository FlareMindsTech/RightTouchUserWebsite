import React, { useState, useEffect } from 'react';
import {
  MdEdit,
  MdOutlineChevronRight,
  MdOutlineAccountBalanceWallet,
  MdOutlineStarOutline,
  MdOutlineLocationOn,
  MdOutlinePayments,
  MdOutlineSettings,
  MdClose,
  MdMoreVert,
  MdStarOutline,
  MdDeleteOutline,
  MdCheck,
  MdLogin
} from 'react-icons/md';
import {
  LuClipboardList,
  LuHeadphones,
  LuBookOpen,
  LuBookmark,
  LuPlus,
  LuLogOut
} from 'react-icons/lu';
import './AccountPage.css';
import { getMyProfile, updateProfile } from '../services/userService';

const AccountPage = ({ isActive, showToast, onNavigate, currentUser, onLoginClick }) => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(currentUser || {});
  const [loading, setLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    gender: ''
  });

  useEffect(() => {
    if (currentUser && isActive) {
      fetchProfile();
    }
  }, [currentUser, isActive]);

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
          gender: response.result.gender || ''
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

  // Sample addresses data
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: 'Home',
      address: '123, Anna Nagar, Chennai - 600040',
      isDefault: true
    },
    {
      id: 2,
      name: 'Office',
      address: '45, T Nagar, Chennai - 600017',
      isDefault: false
    },
    {
      id: 3,
      name: 'Other',
      address: '78, Marina Beach Road, Chennai - 600005',
      isDefault: false
    }
  ]);

  const handleMenuItemClick = (item) => {
    if (item === 'My bookings') {
      onNavigate('bookings');
    } else if (item === 'Manage address') {
      setShowAddressModal(true);
    } else if (item === 'Manage payment methods') {
      onNavigate('payment-methods');
    } else {
      showToast(`Opening ${item}`);
    }
  };

  const handleSetDefault = (id) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
    setActiveDropdown(null);
    showToast('Default address updated');
  };

  const handleDelete = (id) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    setActiveDropdown(null);
    showToast('Address deleted');
  };

  const handleEdit = (id) => {
    setActiveDropdown(null);
    showToast('Edit address');
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    showToast('Logged out successfully');
    if (onNavigate) {
      onNavigate('home');
    }
    window.dispatchEvent(new Event('userLoggedOut'));
  };

  return (
    <section className={`page-wrapper content-a page ${isActive ? '' : 'hidden'}`} id="page-account">
      {/* Header Section */}
      <div className="account-header">
        <div className="user-info">
          {currentUser ? (
            <>
              <h2 className="account-name">
                {profileData.fname ? `${profileData.fname} ${profileData.lname || ''}` : (currentUser.name || currentUser.fname || 'User')}
              </h2>
              <p className="account-email">{profileData.email || 'Complete your profile'}</p>
              <p className="account-phone">+91 {profileData.identifier || currentUser.identifier || currentUser.phone || ''}</p>
            </>
          ) : (
            <>
              <h2 className="account-name">Welcome</h2>
              <p className="account-phone">Login to access your account</p>
            </>
          )}
        </div>
        {currentUser && <MdEdit className="edit-icon" onClick={() => setIsEditing(true)} />}
      </div>

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

      {/* Top Quick Cards */}
      <div className="quick-cards">
        <div className="quick-card" onClick={() => handleMenuItemClick('My bookings')}>
          <LuClipboardList className="card-icon" />
          <p>My bookings</p>
        </div>
        <div className="quick-card" onClick={() => handleMenuItemClick('Help & Support')}>
          <LuHeadphones className="card-icon" />
          <p>Help &<br />Support</p>
        </div>
      </div>

      {/* Menu List */}
      <div className="menu-list">
        {/* <div className="menu-item" onClick={() => handleMenuItemClick('My plans')}>
          <LuBookOpen className="menu-icon" />
          <span className="menu-text">My plans</span>
          <MdOutlineChevronRight className="menu-arrow" />
        </div>
        <div className="menu-item" onClick={() => handleMenuItemClick('Wallet')}>
          <MdOutlineAccountBalanceWallet className="menu-icon" />
          <span className="menu-text">Wallet</span>
          <MdOutlineChevronRight className="menu-arrow" />
        </div>
        <div className="menu-item" onClick={() => handleMenuItemClick('Plus membership')}>
          <LuBookmark className="menu-icon" />
          <span className="menu-text">Plus membership</span>
          <MdOutlineChevronRight className="menu-arrow" />
        </div> */}
        <div className="menu-item" onClick={() => handleMenuItemClick('My rating')}>
          <MdOutlineStarOutline className="menu-icon" />
          <span className="menu-text">My rating</span>
          <MdOutlineChevronRight className="menu-arrow" />
        </div>
        <div className="menu-item" onClick={() => handleMenuItemClick('Manage address')}>
          <MdOutlineLocationOn className="menu-icon" />
          <span className="menu-text">Manage address</span>
          <MdOutlineChevronRight className="menu-arrow" />
        </div>
        <div className="menu-item" onClick={() => handleMenuItemClick('Manage payment methods')}>
          <MdOutlinePayments className="menu-icon" />
          <span className="menu-text">Manage payment methods</span>
          <MdOutlineChevronRight className="menu-arrow" />
        </div>
        <div className="menu-item" onClick={() => handleMenuItemClick('Settings')}>
          <MdOutlineSettings className="menu-icon" />
          <span className="menu-text">Settings</span>
          <MdOutlineChevronRight className="menu-arrow" />
        </div>
      </div>

      {/* Login/Logout Button */}
      {currentUser ? (
        <button className="logout-btn" onClick={handleLogout}>
          <LuLogOut className="btn-icon" />
          Logout
        </button>
      ) : (
        <button className="login-btn" onClick={handleLoginClick}>
          <MdLogin className="btn-icon" />
          Login
        </button>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className="modal-backdrop" onClick={(e) => { setShowAddressModal(false); setActiveDropdown(null); }}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h2>Manage Address</h2>
              <button className="modal-close" onClick={() => { setShowAddressModal(false); setActiveDropdown(null); }}>
                <MdClose />
              </button>
            </div>

            <button className="add-address-btn">
              <LuPlus className="add-icon" />
              Add New Address
            </button>

            <div className="address-list">
              {addresses.map((address) => (
                <div key={address.id} className="address-card">
                  <div className="address-card-header">
                    <div className="address-badge">
                      <MdOutlineLocationOn className="badge-icon" />
                      <span>{address.name}</span>
                    </div>
                    {address.isDefault && (
                      <span className="default-badge">
                        <MdCheck className="check-icon" /> Default
                      </span>
                    )}
                  </div>

                  <p className="address-text">{address.address}</p>

                  <div className="address-card-actions">
                    <button
                      className="three-dots-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === address.id ? null : address.id);
                      }}
                    >
                      <MdMoreVert />
                    </button>

                    {activeDropdown === address.id && (
                      <div className="dropdown-menu">
                        {!address.isDefault && (
                          <button
                            className="dropdown-item"
                            onClick={() => handleSetDefault(address.id)}
                          >
                            <MdStarOutline className="dropdown-icon" />
                            <span>Set as Default</span>
                          </button>
                        )}
                        <button
                          className="dropdown-item"
                          onClick={() => handleEdit(address.id)}
                        >
                          <MdEdit className="dropdown-icon" />
                          <span>Edit</span>
                        </button>
                        <button
                          className="dropdown-item delete"
                          onClick={() => handleDelete(address.id)}
                        >
                          <MdDeleteOutline className="dropdown-icon" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountPage;

