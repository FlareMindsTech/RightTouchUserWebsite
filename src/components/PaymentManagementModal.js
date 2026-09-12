import React, { useState, useEffect, useCallback } from 'react';
import {
  MdClose,
  MdOutlineCreditCard,
  MdReceiptLong,
  MdRefresh,
  MdCheckCircle,
  MdPending,
  MdErrorOutline,
  MdOutlineShield,
  MdFileDownload
} from 'react-icons/md';
import { LuCreditCard, LuWallet, LuDownload, LuRotateCw } from 'react-icons/lu';
import { listMyPayments, getPaymentSummary, downloadReceipt } from '../services/paymentService';
import './PaymentManagementModal.css';

const PaymentManagementModal = ({ isOpen, onClose, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.allSettled([
        getPaymentSummary(),
        listMyPayments()
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.success) {
        setSummary(summaryRes.value.result || summaryRes.value.data || null);
      }

      if (listRes.status === 'fulfilled') {
        const rawList = listRes.value?.result || listRes.value?.data || listRes.value?.payments || listRes.value || [];
        setPayments(Array.isArray(rawList) ? rawList : []);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentData();
    }
  }, [isOpen, fetchPaymentData]);

  if (!isOpen) return null;

  const getFilteredPayments = () => {
    if (filter === 'completed') {
      return payments.filter(
        (p) => p.status === 'paid' || p.paymentStatus === 'paid' || p.status === 'completed'
      );
    }
    if (filter === 'refunds') {
      return payments.filter(
        (p) => p.status === 'refunded' || p.paymentStatus === 'refunded' || p.isRefunded
      );
    }
    return payments;
  };

  const handleDownloadReceipt = async (payment) => {
    const bId = payment.bookingId || payment._id || payment.id;
    if (!bId) return;

    setDownloadingId(bId);
    try {
      const res = await downloadReceipt(bId);
      if (res?.receiptUrl || res?.result?.url) {
        window.open(res.receiptUrl || res.result.url, '_blank');
      } else {
        showToast && showToast('Receipt details retrieved successfully');
      }
    } catch (err) {
      console.error('Download receipt error:', err);
      showToast && showToast('Unable to fetch receipt at this moment.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredList = getFilteredPayments();

  // Helper to format currency
  const formatMoney = (val) => {
    if (val === undefined || val === null) return '₹0';
    const amount = typeof val === 'number' && val > 1000 && Number.isInteger(val) ? val / 100 : val;
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="payment-modal-header">
          <div className="header-badge-group">
            <div className="pay-icon-badge">
              <LuCreditCard />
            </div>
            <div>
              <h3 className="pay-modal-title">Payment Management</h3>
              <p className="pay-modal-subtitle">Track receipts, transactions & payment gateways</p>
            </div>
          </div>
          <button className="pay-close-btn" onClick={onClose} aria-label="Close modal">
            <MdClose />
          </button>
        </div>

        {/* Modal Body */}
        <div className="payment-modal-body">
          {/* Spend Summary Widgets */}
          <div className="summary-widgets-row">
            <div className="summary-widget-card total-spent">
              <span className="widget-label">Total Spent</span>
              <span className="widget-value">{formatMoney(summary?.totalSpent || summary?.totalPaidAmount || 0)}</span>
              <span className="widget-tag green">Verified Payments</span>
            </div>
            <div className="summary-widget-card total-orders">
              <span className="widget-label">Total Transactions</span>
              <span className="widget-value">{summary?.totalTransactions || payments.length || 0}</span>
              <span className="widget-tag blue">Razorpay Secured</span>
            </div>
            <div className="summary-widget-card total-refunds">
              <span className="widget-label">Refunds & Credits</span>
              <span className="widget-value">{formatMoney(summary?.totalRefunded || 0)}</span>
              <span className="widget-tag purple">Processed</span>
            </div>
          </div>

          {/* Payment Methods Section */}
          <div className="payment-methods-box">
            <div className="methods-header">
              <MdOutlineShield className="shield-icon" />
              <span>Supported Payment Gateways & Saved Methods</span>
            </div>
            <div className="methods-pills">
              <span className="method-pill"><LuWallet /> Razorpay UPI / GPay</span>
              <span className="method-pill"><LuCreditCard /> Credit / Debit Cards</span>
              <span className="method-pill">Net Banking</span>
              <span className="method-pill">Cash on Delivery</span>
            </div>
          </div>

          {/* Transactions Header & Filter Tabs */}
          <div className="transactions-header-row">
            <h4 className="trans-title">Transaction History</h4>
            <div className="trans-tabs">
              <button
                className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`tab-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Paid
              </button>
              <button
                className={`tab-btn ${filter === 'refunds' ? 'active' : ''}`}
                onClick={() => setFilter('refunds')}
              >
                Refunds
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="payment-loading-state">
              <LuRotateCw className="spin-icon" />
              <span>Loading payment history...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="payment-empty-state">
              <MdReceiptLong className="empty-icon" />
              <h5>No transactions found</h5>
              <p>Your payment details and receipts will automatically appear here after booking a service or product.</p>
            </div>
          ) : (
            <div className="transactions-list">
              {filteredList.map(item => {
                const status = (item.status || item.paymentStatus || 'completed').toLowerCase();
                const isPaid = status === 'paid' || status === 'completed' || status === 'success';
                const isRefunded = status === 'refunded';

                return (
                  <div key={item._id || item.id} className="transaction-item-card">
                    <div className="trans-left-icon">
                      {isPaid ? (
                        <div className="status-badge-circle paid"><MdCheckCircle /></div>
                      ) : isRefunded ? (
                        <div className="status-badge-circle refunded"><MdRefresh /></div>
                      ) : (
                        <div className="status-badge-circle pending"><MdPending /></div>
                      )}
                    </div>

                    <div className="trans-info">
                      <div className="trans-name">
                        {item.serviceName || item.bookingTitle || item.description || `Transaction #${(item._id || item.id || '').slice(-6)}`}
                      </div>
                      <div className="trans-meta">
                        <span>ID: {item.razorpayPaymentId || item.orderId || item._id || 'N/A'}</span>
                        <span className="dot">•</span>
                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</span>
                      </div>
                    </div>

                    <div className="trans-right">
                      <div className="trans-amount">{formatMoney(item.amount || item.totalAmount || item.amountPaise || 0)}</div>
                      <div className={`trans-status-tag ${status}`}>
                        {status.toUpperCase()}
                      </div>
                    </div>

                    <div className="trans-actions">
                      <button
                        className="receipt-btn"
                        onClick={() => handleDownloadReceipt(item)}
                        disabled={downloadingId === (item.bookingId || item._id)}
                      >
                        <LuDownload size={14} />
                        {downloadingId === (item.bookingId || item._id) ? 'Fetching...' : 'Receipt'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default PaymentManagementModal;
