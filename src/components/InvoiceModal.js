import React from 'react';
import { MdClose, MdReceiptLong } from 'react-icons/md';
import { safeParseDate } from '../utils/browserUtils';
import './InvoiceModal.css';

const InvoiceModal = ({ isOpen, onClose, booking, details, paymentStatusUpper }) => {
  if (!isOpen) return null;

  const issuedDate = booking?.updatedAt || booking?.createdAt || new Date().toISOString();
  const serviceDate = booking?.scheduledAt || booking?.createdAt;

  return (
    <div className="invoice-overlay" onClick={onClose}>
      <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-header">
          <div className="invoice-header-left">
            <MdReceiptLong className="invoice-header-icon" />
            <div>
              <h3>Invoice</h3>
              <p>RightTouch Services</p>
            </div>
          </div>
          <button className="invoice-close" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className="invoice-meta-grid">
          <div>
            <span>Invoice ID</span>
            <strong>{details?.id || 'N/A'}</strong>
          </div>
          <div>
            <span>Booking ID</span>
            <strong>{booking?._id || 'N/A'}</strong>
          </div>
          <div>
            <span>Issued On</span>
            <strong>{safeParseDate(issuedDate).toLocaleString()}</strong>
          </div>
          <div>
            <span>Service Date</span>
            <strong>{serviceDate ? safeParseDate(serviceDate).toLocaleString() : 'N/A'}</strong>
          </div>
        </div>

        <div className="invoice-customer-box">
          <p className="invoice-label">Customer</p>
          <h4>{booking?.customerSnapshot?.name || 'Customer'}</h4>
          <p>{booking?.customerSnapshot?.mobileNumber || booking?.customerSnapshot?.phone || 'Mobile not available'}</p>
          <p>{details?.location || 'Address not available'}</p>
        </div>

        <div className="invoice-table">
          <div className="invoice-row invoice-row-head">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="invoice-row">
            <span>{details?.serviceName || 'Service Charge'}</span>
            <span>{details?.amount || '₹0'}</span>
          </div>
          <div className="invoice-row">
            <span>Booking Fee</span>
            <span>{details?.bookingFee || '₹0'}</span>
          </div>
          <div className="invoice-row invoice-row-total">
            <span>Total Paid</span>
            <span>{details?.total || '₹0'}</span>
          </div>
        </div>

        <div className="invoice-footer">
          <div className={`invoice-payment-status ${paymentStatusUpper === 'PAID' ? 'paid' : 'unpaid'}`}>
            {paymentStatusUpper === 'PAID' ? 'Payment: Paid' : 'Payment: Unpaid'}
          </div>
          <p>Thank you for choosing RightTouch.</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
