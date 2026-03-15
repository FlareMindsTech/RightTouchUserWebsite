import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MdOutlineLocationOn,
  MdChevronLeft,
  MdDelete,
  MdEdit,
  MdCheckBoxOutlineBlank,
  MdCheckBox,
  MdSecurity
} from 'react-icons/md';
import { getMyAddresses, createAddress, updateAddress } from '../services/addressService';
import './CheckoutPage.css';

const CheckoutPage = ({ 
  isActive, 
  cartItems, 
  removeFromCart, 
  updateQuantity,
  fetchCart,
  showToast, 
  currentUser, 
  onNavigate 
}) => {
  const navigateInternal = useNavigate();
  const location = useLocation();

  const handleContinueToPayment = () => {
    if (!termsAgreed || cartItems.length === 0 || !selectedAddressId) {
      showToast('Please select address and accept terms');
      return;
    }
    const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
    if (!selectedAddress) {
      showToast('Selected address not found');
      return;
    }
    setSelectedAddress(selectedAddress);
    setTotal(getSubtotal());
    setShowPaymentSection(true);
    // Scroll to payment section
    const paymentSection = document.querySelector('.payment-section-display');
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [total, setTotal] = useState(0);
  const [addressForm, setAddressForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    landmark: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await getMyAddresses();
      if (response?.success) {
        setAddresses(response.result || []);
        if (response.result?.length > 0) {
          const defaultAddr = response.result.find(addr => addr.isDefault) || response.result[0];
          setSelectedAddressId(defaultAddr._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      showToast('Failed to load addresses');
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Refetch cart when cartItems change
  useEffect(() => {
    // Cart items updated externally
  }, [cartItems]);

  const handleDeleteItem = (itemId) => {
    removeFromCart(itemId);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const qty = item.quantity || 1;
      return total + (item.price * qty);
    }, 0);
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await createAddress({ ...addressForm, userId: currentUser._id });
      if (response?.success) {
        showToast('Address added');
        setShowAddModal(false);
        setAddressForm({ name: '', address: '', city: '', state: '', phone: '', landmark: '' });
        fetchAddresses();
      } else {
        showToast('Failed to add address');
      }
    } catch (error) {
      showToast('Error adding address');
    }
    setLoading(false);
  };

  const handleEditAddress = async (e) => {
    e.preventDefault();
    if (!editingAddress || !currentUser) return;
    setLoading(true);
    try {
      const response = await updateAddress({ ...addressForm, _id: editingAddress._id });
      if (response?.success) {
        showToast('Address updated');
        setShowEditModal(false);
        setAddressForm({ name: '', address: '', city: '', state: '', phone: '', landmark: '' });
        setEditingAddress(null);
        fetchAddresses();
      } else {
        showToast('Failed to update address');
      }
    } catch (error) {
      showToast('Error updating address');
    }
    setLoading(false);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      phone: addr.phone || '',
      landmark: addr.landmark || ''
    });
    setShowEditModal(true);
  };

  if (!isActive) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Checkout page is active only when navigated to /checkout
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Back button or header */}
        <div className="checkout-header">
          <button onClick={() => onNavigate?.('cart') || navigateInternal('/cart')} className="back-btn">
            <MdChevronLeft />
            
          </button>
          <h1>Checkout</h1>
        </div>

        <div className="checkout-content">
          {/* Left: Order Summary */}
          <div className="order-summary">
            <div className="summary-header">
              <h2>Order Summary</h2>
              <span className="items-badge">
                {(() => {
                  const count = cartItems.length;
                  return `${count} ${count === 1 ? 'item' : 'items'}`;
                })()}
              </span>
            </div>
            <div className="summary-items">
              {cartItems.map((item, index) => {
                const qty = item.quantity || 1;
                const itemTotal = item.price * qty;
                return (
                  <div key={item.id || index} className="summary-item">
                    <button className="trash-icon" onClick={() => handleDeleteItem(item.id)}>
                      <MdDelete />
                    </button>
                    <div className="item-image">
                      {item.image ? <img src={item.image} alt={item.name} /> : 'No Image'}
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                        <div className="quantity-container-cart">
                          <button 
                            className="qty-btn-cart qty-minus"
                            onClick={async () => {
                              if (qty > 1) {
                                try {
                                  await updateQuantity(item.originalId, item.itemType || 'service', qty - 1);
                                  await fetchCart();
                                } catch (error) {
                                  console.error('Failed to decrease quantity:', error);
                                  showToast('Failed to update quantity');
                                }
                              } else {
                                handleDeleteItem(item.id);
                              }
                            }}
                          >
                            −
                          </button>
                          <span className="qty-value-cart">{qty}</span>
                          <button 
                            className="qty-btn-cart qty-plus"
                            onClick={async () => {
                              try {
                                await updateQuantity(item.originalId, item.itemType || 'service', qty + 1);
                                await fetchCart();
                                showToast('Quantity increased');
                              } catch (error) {
                                console.error('Failed to increase quantity:', error);
                                showToast('Failed to update quantity');
                              }
                            }}
                          >
                            +
                          </button>
                        </div>
                      <div className="prices">
                        {/* <span className="original-price">₹{item.price}</span> */}
                        <div className="item-total">₹{itemTotal}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="subtotal">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{getSubtotal()}</span>
            </div>
          </div>

          {/* Right: Address & Payment */}
          <div className="address-section">
            <div className="address-header">
              <MdOutlineLocationOn />
              <h2>Address</h2>
              <button className="add-new-btn" onClick={() => setShowAddModal(true)}>
                + Add New
              </button>
            </div>
{!showPaymentSection ? (
              <>
                <div className="addresses-list">
                  {addresses.map(addr => (
                    <div key={addr._id} className={`address-card ${selectedAddressId === addr._id ? 'selected' : ''}`} onClick={() => setSelectedAddressId(addr._id)}>
                      <div>
                        <h4>{addr.name || 'Home'}</h4>
                        <p>{addr.address}, {addr.city}, {addr.landmark}</p>
                        <p>{addr.phone}</p>
                      </div>
                      <button className="edit-icon-btn" onClick={(e) => { e.stopPropagation(); openEditModal(addr); }}>
                        <MdEdit />
                      </button>
                    </div>
                  ))}
                  {addresses.length === 0 && <p>No addresses. Add one above.</p>}
                </div>
                <div className="terms-section">
                  <label className="terms-checkbox">
                    <input type="checkbox" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} />
                    <span className="checkmark">{termsAgreed ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}</span>
                    I have read and agree to the Terms & Conditions and Privacy Policy.
                  </label>
                  <button 
                    className="payment-btn" 
                    disabled={!termsAgreed || cartItems.length === 0 || !selectedAddressId}
                    onClick={handleContinueToPayment}
                  >
                    {(() => {
                      const total = getSubtotal();
                      return `Proceed to Pay ₹${total.toFixed(2)}`;
                    })()}
                  </button>
                </div>
              </>
            ) : (
              <div className="payment-section-display">
                <div className="payment-header">
                  <button className="back-to-address" onClick={() => setShowPaymentSection(false)}>
                    <MdChevronLeft />
                    <span>Back to Address</span>
                  </button>
                </div>
                {/* Selected Address Display */}
                <div className="selected-address-card">
                  <h4>{selectedAddress.name || 'Home'}</h4>
                  <p>{selectedAddress.address}, {selectedAddress.city}</p>
                  {selectedAddress.landmark && <p>Landmark: {selectedAddress.landmark}</p>}
                  <p>Phone: {selectedAddress.phone}</p>
                </div>

                {/* Payment Method */}
                <div className="payment-method-section">
                  <h3>Select Payment Method</h3>
                  <div className="razorpay-card">
                    <MdSecurity className="razorpay-icon" />
                    <div>
                      <h4>Pay securely using Razorpay</h4>
                      <p>UPI, Credit/Debit Card, Net banking</p>
                    </div>
                  </div>
                </div>

                {/* Total & Pay */}
                <div className="final-payment">
                  <div className="total-row">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <button className="final-pay-btn" onClick={() => {}}>
                    Pay ₹{total.toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Address</h3>
            <form onSubmit={handleAddNewAddress}>
              <input placeholder="Name (e.g. Home)" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} />
              <input placeholder="Address" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} />
              <input placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
              <input placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
              <input placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} />
              <input placeholder="Landmark (optional)" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" disabled={loading}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Address</h3>
            <form onSubmit={handleEditAddress}>
              <input placeholder="Name" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} />
              <input placeholder="Address" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} />
              <input placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
              <input placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
              <input placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} />
              <input placeholder="Landmark (optional)" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" disabled={loading}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

