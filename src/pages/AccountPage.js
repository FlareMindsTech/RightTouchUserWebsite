import React, { useState } from 'react';
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
  MdCheck
} from 'react-icons/md';
import { 
  LuClipboardList, 
  LuHeadphones, 
  LuBookOpen, 
  LuBookmark,
  LuPlus
} from 'react-icons/lu';
import BookingsPage from './BookingsPage';
import './AccountPage.css';

const AccountPage = ({ isActive, showToast, onNavigate }) => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
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

  // Close dropdown when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setActiveDropdown(null);
    }
  };

  return (
    <section className={`page ${isActive ? '' : 'hidden'}`} id="page-account">
      {/* Header Section */}
      <div className="account-header">
        <div className="user-info">
          <h2 className="account-name">Adam</h2>
          <p className="account-phone">+91 8462749236</p>
        </div>
        <MdEdit className="edit-icon" />
      </div>

      {/* Top Quick Cards */}
      <div className="quick-cards">
        <div className="quick-card" onClick={() => handleMenuItemClick('My bookings')}>
          <LuClipboardList className="card-icon" />
          <p>My bookings</p>
        </div>
        <div className="quick-card" onClick={() => handleMenuItemClick('Help & Support')}>
          <LuHeadphones className="card-icon" />
          <p>Help &<br/>Support</p>
        </div>
      </div>

      {/* Menu List */}
      <div className="menu-list">
        <div className="menu-item" onClick={() => handleMenuItemClick('My plans')}>
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
        </div>
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

      {/* Logout Button */}
      <button className="logout-btn" onClick={() => showToast('Logged out successfully')}>
        Logout
      </button>

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
