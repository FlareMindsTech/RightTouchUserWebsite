import React, { useState, useEffect, useCallback } from 'react';
import { 
  MdClose, 
  MdLocationOn, 
  MdAssignment, 
  MdNotes, 
  MdCheckCircle 
} from 'react-icons/md';
import { Package, Loader2, Plus, ChevronDown } from 'lucide-react';
import { createQuoteRequest } from '../services/quotationService';
import { getMyAddresses } from '../services/addressService';
import AddressModal from './AddressModal';
import './QuoteRequestModal.css';

const QuoteRequestModal = ({ 
  isOpen, 
  onClose, 
  product, 
  currentUser, 
  showToast, 
  onNavigateToQuotations,
  onLoginClick
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!currentUser?._id) {
      setAddresses([]);
      setLoadingAddresses(false);
      return;
    }
    setLoadingAddresses(true);
    try {
      const res = await getMyAddresses();
      const list = res?.result || res?.data || res || [];
      const addrArr = Array.isArray(list) ? list : [];
      setAddresses(addrArr);

      if (addrArr.length > 0) {
        setSelectedAddressId((prev) => {
          if (prev && addrArr.some((a) => (a._id || a.id || a.addressId) === prev)) {
            return prev;
          }
          const defaultAddr = addrArr.find((a) => a.isDefault) || addrArr[0];
          return defaultAddr?._id || defaultAddr?.id || defaultAddr?.addressId || '';
        });
      } else {
        setSelectedAddressId('');
      }
    } catch (err) {
      console.warn('Failed to load user addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    if (isOpen && currentUser?._id) {
      fetchAddresses();
    }
  }, [isOpen, currentUser?._id, fetchAddresses]);

  // Reset quantity and notes when modal opens with a new product
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, product?._id, product?.id]);

  if (!isOpen || !product) return null;

  const selectedAddress = addresses.find(
    (a) => (a._id || a.id || a.addressId) === selectedAddressId
  );

  const handleAddressSaved = async (finalLine, newAddr) => {
    setIsAddressModalOpen(false);
    await fetchAddresses();
    const newId = newAddr?._id || newAddr?.id || newAddr?.addressId;
    if (newId) {
      setSelectedAddressId(newId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      if (showToast) showToast('Please sign in to request a quotation');
      if (onLoginClick) onLoginClick();
      return;
    }

    if (!selectedAddressId && addresses.length > 0) {
      if (showToast) showToast('Please select a delivery address');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: product._id || product.id,
        quantity: Number(quantity) || 1,
        locationType: 'saved',
        addressId: selectedAddressId || undefined,
        requirementDescription: notes.trim() || 'Need product supplied and installed',
        additionalNotes: notes.trim() ? notes.trim() : 'Please share a quotation for installation and setup.',
        preferredContactMethod: 'call'
      };

      const res = await createQuoteRequest(payload);
      if (res?.success || res?.data || res?.result) {
        const itemData = res?.result || res?.data || res;
        const isExisting = res?.isExisting || (itemData?.status && itemData?.status !== 'quote_requested');
        const msg = isExisting
          ? 'An active quote request already exists for this product. Redirecting to your quotations...'
          : 'Quotation request submitted successfully!';
        if (showToast) showToast(msg, 'success');
        onClose();
        if (onNavigateToQuotations) {
          onNavigateToQuotations();
        }
      } else {
        if (showToast) showToast(res?.message || 'Failed to submit quote request', 'error');
      }
    } catch (err) {
      console.error('Quote request error:', err);
      if (showToast) showToast(err?.message || 'Failed to submit quote request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="quote-modal-overlay" onClick={onClose}>
        <div className="quote-modal-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="quote-modal-header">
            <div className="header-title-badge">
              <div className="quote-header-icon-wrap">
                <MdAssignment className="quote-header-icon" />
              </div>
              <div className="quote-header-text">
                <h3>Request Product Quotation</h3>
                <p>Get a customized price estimate for installation & delivery</p>
              </div>
            </div>
            <button className="quote-modal-close" onClick={onClose} aria-label="Close modal">
              <MdClose />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="quote-modal-body">
            {/* Product Summary Mini Card */}
            <div className="quote-product-summary">
              <div className="quote-prod-img">
                {product.productImages?.[0] ? (
                  <img src={product.productImages[0]} alt={product.productName} loading="lazy" />
                ) : (
                  <Package size={24} />
                )}
              </div>
              <div className="quote-prod-info">
                <div className="quote-prod-type-row">
                  <span className="quote-prod-type">{product.productType || 'Hardware'}</span>
                  {product.category && <span className="quote-prod-cat">{product.category}</span>}
                </div>
                <h4 className="quote-prod-name" title={product.productName}>
                  {product.productName}
                </h4>
                <p className="quote-prod-price">
                  {product.estimatedPriceFrom !== undefined && product.estimatedPriceTo !== undefined ? (
                    `Est. ₹${product.estimatedPriceFrom?.toLocaleString()} - ₹${product.estimatedPriceTo?.toLocaleString()}`
                  ) : product.price ? (
                    `₹${product.price?.toLocaleString()}`
                  ) : (
                    'Price on Request'
                  )}
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="quote-field-group">
              <label className="quote-label">Quantity Required</label>
              <div className="quote-qty-control">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Address Selection */}
            <div className="quote-field-group">
              <div className="quote-field-header">
                <label className="quote-label">
                  <MdLocationOn className="quote-field-icon" /> Select Delivery Location
                </label>
                {currentUser && (
                  <button
                    type="button"
                    className="quote-add-address-link"
                    onClick={() => setIsAddressModalOpen(true)}
                  >
                    <Plus size={14} /> Add Address
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <div className="quote-loading-text">
                  <Loader2 className="spinner" size={15} /> Loading saved addresses...
                </div>
              ) : !currentUser ? (
                <div className="quote-no-address-warning">
                  <span>Please sign in to select a delivery address.</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="quote-no-address-card">
                  <p>No saved addresses found.</p>
                  <button
                    type="button"
                    className="quote-add-address-pill"
                    onClick={() => setIsAddressModalOpen(true)}
                  >
                    <Plus size={14} /> Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="quote-address-select-block">
                  <div className="quote-select-wrapper">
                    <select
                      className="quote-select-input"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                    >
                      {addresses.map((addr) => {
                        const idKey = addr._id || addr.id || addr.addressId;
                        const labelPrefix = addr.label ? `[${addr.label.toUpperCase()}] ` : '';
                        const text = [addr.addressLine, addr.city, addr.pincode].filter(Boolean).join(', ');
                        return (
                          <option key={idKey} value={idKey}>
                            {labelPrefix}{text}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="quote-select-arrow" size={16} />
                  </div>

                  {selectedAddress && (
                    <div className="quote-selected-address-badge">
                      <span className="quote-badge-tag">
                        {selectedAddress.label ? selectedAddress.label.toUpperCase() : 'SAVED'}
                      </span>
                      <span className="quote-badge-text">
                        {[
                          selectedAddress.addressLine,
                          selectedAddress.landmark,
                          selectedAddress.city,
                          selectedAddress.state,
                          selectedAddress.pincode
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Requirement Description Input */}
            <div className="quote-field-group">
              <label className="quote-label">
                <MdNotes className="quote-field-icon" /> Requirement / Installation Details
                <span className="quote-optional-tag">(Optional)</span>
              </label>
              <textarea
                className="quote-textarea-input"
                rows={2}
                placeholder="e.g., Rooftop mounting, cable length, site constraints..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="quote-actions-row">
              <button type="button" className="quote-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="quote-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="spinner" size={17} /> Submitting...
                  </>
                ) : (
                  <>
                    <MdCheckCircle size={17} /> Send Quote Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Address Modal for adding address directly */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        currentUser={currentUser}
        showToast={showToast}
        onSelectAddress={handleAddressSaved}
      />
    </>
  );
};

export default QuoteRequestModal;
