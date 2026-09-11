import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack, MdFlag, MdOutlineErrorOutline,
  MdHandshake, MdBugReport, MdOutlineOtherHouses,
  MdCheckCircle, MdBuild, MdReportProblem,
  MdSupportAgent, MdShoppingBag, MdHistory, MdAddCircleOutline,
  MdBookmarkBorder, MdCheck, MdSearch, MdClose, MdKeyboardArrowDown, MdKeyboardArrowUp
} from 'react-icons/md';
import { createReport, getReportCategories, getMyReports, withdrawReport } from '../services/reportService';
import { getCustomerBookings } from '../services/bookingService';
import { getAllProductBookings } from '../services/productBookingService';
import { rtAlert } from '../components/RtAlert';
import { goBackSmart } from '../utils/browserUtils';
import './ReportPage.css';

// Default fallback categories matching backend schema if API is unreachable
const DEFAULT_CATEGORIES = [
  {
    key: "quality_dispute",
    label: "Quality Dispute",
    description: "Work did not meet agreed quality standards.",
    bookingTypes: ["service", "product"],
    defaultFaultParty: "technician"
  },
  {
    key: "damage",
    label: "Damage",
    description: "Property or item was damaged during the service.",
    bookingTypes: ["service", "product"],
    defaultFaultParty: "technician"
  },
  {
    key: "incomplete_work",
    label: "Incomplete Work",
    description: "Service was left unfinished or not as described.",
    bookingTypes: ["service"],
    defaultFaultParty: "technician"
  },
  {
    key: "technician_misconduct",
    label: "Technician Misconduct",
    description: "Unprofessional or inappropriate behaviour by the technician.",
    bookingTypes: ["service"],
    defaultFaultParty: "technician"
  },
  {
    key: "goodwill",
    label: "Goodwill / Courtesy",
    description: "Customer goodwill adjustment, no fault assigned.",
    bookingTypes: ["service", "product"],
    defaultFaultParty: "platform"
  },
  {
    key: "product_issue",
    label: "Product Issue",
    description: "Defective, wrong, or damaged product delivered.",
    bookingTypes: ["product"],
    defaultFaultParty: "platform"
  },
  {
    key: "other",
    label: "Other",
    description: "Any other complaint not covered above.",
    bookingTypes: ["service", "product"],
    defaultFaultParty: "platform"
  }
];

const getCategoryIcon = (key) => {
  switch (key) {
    case 'quality_dispute':
      return <MdOutlineErrorOutline size={24} className="cat-icon-svg quality" />;
    case 'damage':
      return <MdReportProblem size={24} className="cat-icon-svg damage" />;
    case 'incomplete_work':
      return <MdBuild size={24} className="cat-icon-svg incomplete" />;
    case 'technician_misconduct':
      return <MdHandshake size={24} className="cat-icon-svg misconduct" />;
    case 'goodwill':
      return <MdSupportAgent size={24} className="cat-icon-svg goodwill" />;
    case 'product_issue':
      return <MdShoppingBag size={24} className="cat-icon-svg product" />;
    case 'other':
    default:
      return <MdOutlineOtherHouses size={24} className="cat-icon-svg other" />;
  }
};

export default function ReportPage({ showToast }) {
  const navigate = useNavigate();
  const comboboxRef = useRef(null);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [step, setStep] = useState(1); // 1 = pick category, 2 = details, 3 = done
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bookingType, setBookingType] = useState('service');
  const [form, setForm] = useState({ subject: '', description: '', bookingRef: '' });
  const [submitting, setSubmitting] = useState(false);

  // User Booked Items
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');

  // History state
  const [myReports, setMyReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Report Detail Modal state
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const getBookingInfoForReport = (repItem) => {
    if (!repItem) return { title: 'Unknown Order', displayId: '', type: 'service', status: '', image: null, amount: null, quantity: 1 };
    
    const targetRef = String(repItem.bookingId || repItem.bookingRef || repItem.booking || '').trim();
    const matched = userBookings.find(b =>
      String(b.id || '').trim() === targetRef ||
      String(b.displayId || '').trim() === targetRef
    );

    if (matched) {
      const raw = matched.raw || {};
      const img = raw.productSnapshot?.imageUrls?.[0] || raw.productSnapshot?.imageUrl || raw.productId?.productImages?.[0] || raw.productImages?.[0] || raw.imageUrl || raw.image || null;
      const amt = raw.totalAmount || raw.finalAmount || raw.quotedPrice || raw.price || null;
      const qty = raw.quantity || 1;
      return {
        matchedBooking: matched,
        title: matched.title || 'Product / Service Order',
        displayId: matched.displayId || matched.id,
        type: matched.type || repItem.bookingType || 'service',
        status: matched.status || 'Booked',
        image: img,
        amount: amt,
        quantity: qty
      };
    }

    const fallbackTitle = repItem.productName || repItem.serviceName || repItem.bookingTitle || (repItem.bookingType === 'product' ? 'Product Order' : 'Service Booking');
    return {
      matchedBooking: null,
      title: fallbackTitle,
      displayId: repItem.bookingRef || repItem.bookingId || '',
      type: repItem.bookingType || 'service',
      status: '',
      image: null,
      amount: null,
      quantity: 1
    };
  };

  const formatReportStatusBadge = (status) => {
    const s = String(status || 'open').toLowerCase();
    if (['resolved_refunded', 'refunded', 'completed'].includes(s)) {
      return <span className="rep-status-pill resolved" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}><MdCheckCircle /> Resolved - Refund Approved</span>;
    }
    if (['resolved_no_refund', 'dismissed'].includes(s)) {
      return <span className="rep-status-pill" style={{ background: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}><MdCheckCircle /> Resolved - Dismissed</span>;
    }
    if (['investigating', 'under_review'].includes(s)) {
      return <span className="rep-status-pill investigating" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}><MdSupportAgent /> Under Review</span>;
    }
    if (['rejected'].includes(s)) {
      return <span className="rep-status-pill" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>Rejected</span>;
    }
    if (['withdrawn'].includes(s)) {
      return <span className="rep-status-pill" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>Withdrawn</span>;
    }
    return <span className="rep-status-pill pending" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Open (Awaiting Review)</span>;
  };

  const handleWithdrawReport = async (reportId) => {
    if (!reportId) return;
    setWithdrawing(true);
    try {
      const res = await withdrawReport(reportId, { reason: "Customer requested withdrawal from website" });
      if (res?.success || res?.result || res?.status === 'withdrawn') {
        if (showToast) showToast("Report withdrawn successfully", "info");
        setShowModal(false);
        fetchHistory();
      } else {
        rtAlert(res?.message || "Failed to withdraw report", "error");
      }
    } catch (err) {
      console.error("Withdraw error:", err);
      rtAlert(err?.message || "Failed to withdraw report", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  // Load categories and user bookings on mount
  useEffect(() => {
    fetchCategories();
    fetchUserBookings();
  }, []);

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await getReportCategories();
      const catList = res?.result?.categories || res?.categories || (Array.isArray(res) ? res : null);
      if (catList && catList.length > 0) {
        setCategories(catList);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.warn("Failed to fetch report categories from API, using defaults:", err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchUserBookings = async () => {
    setLoadingBookings(true);
    try {
      const [serviceRes, productRes] = await Promise.allSettled([
        getCustomerBookings(),
        getAllProductBookings()
      ]);

      const list = [];

      if (serviceRes.status === 'fulfilled' && serviceRes.value) {
        const res = serviceRes.value;
        const items = res?.result?.bookings || res?.result || res?.bookings || (Array.isArray(res) ? res : []);
        if (Array.isArray(items)) {
          items.forEach(b => {
            const rawId = b._id || b.bookingId || b.id;
            const displayId = b.bookingId || (b._id ? `BK${b._id.slice(-6).toUpperCase()}` : 'BK');
            const title = b.serviceName || b.serviceId?.serviceName || b.serviceId?.name || b.serviceId?.title || b.service?.serviceName || b.service?.name || 'Service Booking';
            const status = b.bookingStatus || b.status || 'Booked';
            const dateStr = b.scheduledDate || b.bookingDate || b.createdAt || '';
            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            list.push({ id: rawId, displayId, title, type: 'service', status, date: formattedDate, raw: b });
          });
        }
      }

      if (productRes.status === 'fulfilled' && productRes.value) {
        const res = productRes.value;
        const items = res?.result?.bookings || res?.result?.orders || res?.result || res?.bookings || res?.orders || (Array.isArray(res) ? res : []);
        if (Array.isArray(items)) {
          items.forEach(p => {
            const rawId = p._id || p.bookingId || p.orderId || p.id;
            const displayId = p.bookingId || p.orderId || (p._id ? `ORD${p._id.slice(-6).toUpperCase()}` : 'ORD');
            const title = p.productName || p.productId?.productName || p.productId?.name || p.product?.productName || p.product?.name || (Array.isArray(p.items) && p.items[0]?.productName) || 'Product Order';
            const status = p.status || p.bookingStatus || p.orderStatus || 'Ordered';
            const dateStr = p.orderDate || p.createdAt || '';
            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            list.push({ id: rawId, displayId, title, type: 'product', status, date: formattedDate, raw: p });
          });
        }
      }

      setUserBookings(list);
    } catch (err) {
      console.warn("Failed to fetch user bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleBookingTypeChange = (type) => {
    setBookingType(type);
    setForm(f => ({ ...f, bookingRef: '' }));
    setComboboxSearch('');
    setComboboxOpen(false);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getMyReports();
      const reports = res?.result?.reports || res?.result || res?.reports || (Array.isArray(res) ? res : []);
      setMyReports(Array.isArray(reports) ? reports : []);
    } catch (err) {
      console.warn("Failed to fetch user reports history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      fetchHistory();
    }
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat.bookingTypes && cat.bookingTypes.length > 0) {
      handleBookingTypeChange(cat.bookingTypes[0]);
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookingRef) {
      rtAlert('Please select a related booking or order to submit a report', 'warning');
      return;
    }
    if (!form.description.trim()) {
      rtAlert('Please describe the issue in detail', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        category: selectedCategory?.key || 'quality_dispute',
        categoryKey: selectedCategory?.key || 'quality_dispute',
        bookingType,
        subject: form.subject || selectedCategory?.label,
        complaint: form.description.trim(),
        description: form.description.trim(),
        bookingId: form.bookingRef,
        bookingRef: form.bookingRef
      };
      const res = await createReport(payload);
      if (res?.success || res?.result || res?._id) {
        setStep(3);
        if (showToast) showToast('Report submitted successfully');
      } else {
        rtAlert(res?.message || 'Failed to submit report. Please try again.', 'error');
      }
    } catch (err) {
      rtAlert(err.message || 'Error submitting report. Please check your connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedCategory(null);
    setForm({ subject: '', description: '', bookingRef: '' });
    setComboboxSearch('');
    setComboboxOpen(false);
  };

  const selectedBookingDetails = userBookings.find(b => b.id === form.bookingRef);

  const filteredBookings = userBookings
    .filter(b => b.type === bookingType)
    .filter(b => {
      if (!comboboxSearch.trim()) return true;
      const q = comboboxSearch.toLowerCase();
      return (
        (b.displayId && b.displayId.toLowerCase().includes(q)) ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.status && b.status.toLowerCase().includes(q)) ||
        (b.date && b.date.toLowerCase().includes(q)) ||
        (b.id && b.id.toLowerCase().includes(q))
      );
    });

  return (
    <div className="rep-page">
      {/* Header */}
      <div className="rep-header">
        <button className="rep-back-btn" onClick={() => goBackSmart(navigate, '/account')}>
          <MdArrowBack size={22} />
        </button>
        <div className="rep-header-title-box">
          <h1 className="rep-title">Report an Issue</h1>
          <p className="rep-subtitle">We review and address every customer concern promptly</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="rep-tabs-bar">
        <button
          className={`rep-tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('new')}
        >
          <MdAddCircleOutline size={18} />
          <span>File a Report</span>
        </button>
        <button
          className={`rep-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('history')}
        >
          <MdHistory size={18} />
          <span>My Reports</span>
        </button>
      </div>

      <div className="rep-content">
        {/* TAB 1: FILE NEW REPORT */}
        {activeTab === 'new' && (
          <>
            {/* Step 1 – Pick Dynamic Category */}
            {step === 1 && (
              <div className="rep-step-card animate-in">
                <div className="rep-flag-icon"><MdFlag size={36} /></div>
                <h2 className="rep-step-title">What type of issue are you facing?</h2>
                <p className="rep-step-desc">Select a category below to help us direct your request to the right department</p>

                {loadingCategories ? (
                  <div className="rep-skeleton-grid">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="rep-skeleton-card" />
                    ))}
                  </div>
                ) : (
                  <div className="rep-categories-grid">
                    {categories.map((cat) => (
                      <div
                        key={cat.key}
                        className={`rep-cat-card ${selectedCategory?.key === cat.key ? 'selected' : ''}`}
                        onClick={() => handleSelectCategory(cat)}
                      >
                        <div className="rep-cat-card-header">
                          <div className="rep-cat-icon-wrapper">
                            {getCategoryIcon(cat.key)}
                          </div>
                          <div className="rep-cat-badge-list">
                            {(cat.bookingTypes || []).map(bt => (
                              <span key={bt} className={`rep-type-tag ${bt}`}>
                                {bt.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <h3 className="rep-cat-label">{cat.label}</h3>
                        <p className="rep-cat-description">{cat.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 – Issue Details Form */}
            {step === 2 && selectedCategory && (
              <div className="rep-step-card animate-in">
                <div className="rep-step-top">
                  <button className="rep-step-back" onClick={() => setStep(1)}>
                    ← Change Category
                  </button>
                  <div className="rep-chosen-cat">
                    {getCategoryIcon(selectedCategory.key)}
                    <span>{selectedCategory.label}</span>
                  </div>
                </div>

                <h2 className="rep-step-title">Describe your issue</h2>
                <p className="rep-step-desc">{selectedCategory.description}</p>

                <form onSubmit={handleSubmit} className="rep-form">
                  {/* Booking Type Selection if multi-supported */}
                  {selectedCategory.bookingTypes && selectedCategory.bookingTypes.length > 1 && (
                    <div className="rep-field">
                      <label>Applicable To</label>
                      <div className="rep-type-selector">
                        {selectedCategory.bookingTypes.map(bt => (
                          <button
                            type="button"
                            key={bt}
                            className={`rep-type-opt ${bookingType === bt ? 'selected' : ''}`}
                            onClick={() => handleBookingTypeChange(bt)}
                          >
                            {bt === 'service' ? 'Service Order' : 'Product Order'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Searchable Booking Combobox */}
                  <div className="rep-field">
                    <label>Select Related Booking / Order <span className="req">*</span></label>

                    <div className="rep-combobox" ref={comboboxRef}>
                      <div
                        className={`rep-combobox-trigger ${comboboxOpen ? 'open' : ''}`}
                        onClick={() => setComboboxOpen(!comboboxOpen)}
                      >
                        {selectedBookingDetails ? (
                          <div className="rep-combobox-value">
                            <span className="rep-combobox-id-badge">[{selectedBookingDetails.displayId}]</span>
                            <span className="rep-combobox-item-title">{selectedBookingDetails.title}</span>
                          </div>
                        ) : (
                          <span className="rep-combobox-placeholder">
                            {loadingBookings
                              ? 'Loading your recent orders…'
                              : `-- Search recent ${bookingType === 'service' ? 'Service Bookings' : 'Product Orders'} --`}
                          </span>
                        )}
                        {comboboxOpen ? <MdKeyboardArrowUp size={20} color="#64748b" /> : <MdKeyboardArrowDown size={20} color="#64748b" />}
                      </div>

                      {comboboxOpen && (
                        <div className="rep-combobox-dropdown">
                          <div className="rep-combobox-search-box">
                            <MdSearch size={18} color="#94a3b8" />
                            <input
                              type="text"
                              className="rep-combobox-search-input"
                              placeholder={`Search by title, ID [e.g. BK...], or status…`}
                              value={comboboxSearch}
                              onChange={(e) => setComboboxSearch(e.target.value)}
                              autoFocus
                            />
                            {comboboxSearch && (
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                onClick={() => setComboboxSearch('')}
                              >
                                <MdClose size={16} color="#94a3b8" />
                              </button>
                            )}
                          </div>

                          <div className="rep-combobox-options-list">
                            <div
                              className={`rep-combobox-item ${!form.bookingRef ? 'selected' : ''}`}
                              onClick={() => {
                                setForm(f => ({ ...f, bookingRef: '' }));
                                setComboboxOpen(false);
                              }}
                            >
                              <span style={{ fontSize: '13px', color: '#64748b' }}>-- None (General Complaint) --</span>
                            </div>

                            {filteredBookings.length === 0 ? (
                              <div className="rep-combobox-no-results">
                                {comboboxSearch ? 'No matching orders found' : 'No recent orders available'}
                              </div>
                            ) : (
                              filteredBookings.map(b => (
                                <div
                                  key={b.id}
                                  className={`rep-combobox-item ${form.bookingRef === b.id ? 'selected' : ''}`}
                                  onClick={() => {
                                    setForm(f => ({ ...f, bookingRef: b.id }));
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <div className="rep-combobox-item-left">
                                    <span className="rep-combobox-id-badge">[{b.displayId}]</span>
                                    <span className="rep-combobox-item-title">{b.title}</span>
                                  </div>
                                  <div className="rep-combobox-item-right">
                                    <span className={`rep-combobox-item-status ${(b.status || '').toLowerCase()}`}>
                                      {b.status}
                                    </span>
                                    {b.date && <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {b.date}</span>}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedBookingDetails && (
                      <div className="rep-selected-booking-card" style={{ marginTop: '8px' }}>
                        <MdBookmarkBorder size={20} className="rep-sel-icon" />
                        <div className="rep-sel-info">
                          <span className="rep-sel-title">{selectedBookingDetails.title}</span>
                          <span className="rep-sel-meta">
                            {selectedBookingDetails.type === 'service' ? 'SERVICE BOOKING' : 'PRODUCT ORDER'} • ID: {selectedBookingDetails.displayId || selectedBookingDetails.id}
                          </span>
                        </div>
                        <span className="rep-sel-status">{selectedBookingDetails.status}</span>
                      </div>
                    )}
                  </div>

                  <div className="rep-field">
                    <label>Subject / Summary</label>
                    <input
                      type="text"
                      placeholder={`e.g. Issue regarding ${selectedCategory.label}`}
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      maxLength={100}
                    />
                  </div>

                  <div className="rep-field">
                    <label>Detailed Explanation <span className="req">*</span></label>
                    <textarea
                      placeholder="Please share specific details (date, technician name, item name, or what went wrong)…"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={5}
                      required
                    />
                  </div>

                  <button type="submit" className="rep-submit-btn" disabled={submitting}>
                    {submitting ? 'Submitting Report…' : 'Submit Report'}
                  </button>
                </form>
              </div>
            )}

            {/* Step 3 – Success Confirmation */}
            {step === 3 && (
              <div className="rep-step-card rep-success animate-in">
                <MdCheckCircle size={64} className="rep-success-icon" />
                <h2 className="rep-step-title">Report Submitted Successfully</h2>
                <p className="rep-step-desc">
                  We have logged your ticket for <strong>{selectedCategory?.label}</strong>. Our customer support team will investigate and follow up with you within 24–48 hours.
                </p>

                <div className="rep-success-actions">
                  <button className="rep-submit-btn" onClick={() => handleTabSwitch('history')}>
                    View My Reports
                  </button>
                  <button className="rep-secondary-btn" onClick={resetForm}>
                    Submit Another Report
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: MY REPORT HISTORY */}
        {activeTab === 'history' && (
          <div className="rep-step-card animate-in">
            <h2 className="rep-step-title" style={{ textAlign: 'left' }}>Report Ticket History</h2>
            <p className="rep-step-desc" style={{ textAlign: 'left' }}>Track status and resolution of your submitted reports</p>

            {loadingHistory ? (
              <div className="rep-skeleton-grid">
                {[1, 2].map(n => <div key={n} className="rep-skeleton-card" />)}
              </div>
            ) : myReports.length === 0 ? (
              <div className="rep-empty-history">
                <MdCheckCircle size={48} className="rep-empty-icon" />
                <h3>No Submitted Reports</h3>
                <p>You currently have no active or past reports.</p>
                <button className="rep-submit-btn" onClick={() => handleTabSwitch('new')} style={{ maxWidth: 220, margin: '16px auto 0' }}>
                  File a Report
                </button>
              </div>
            ) : (
              <div className="rep-history-list">
                {myReports.map((item, idx) => {
                  const bookingInfo = getBookingInfoForReport(item);
                  const displayTitle = (item.subject && item.subject !== 'No Subject Provided')
                    ? item.subject
                    : bookingInfo.title;
                  const catLabel = (item.category || item.categoryKey || 'quality_dispute').replace(/_/g, ' ').toUpperCase();

                  return (
                    <div
                      key={item._id || idx}
                      className="rep-history-card rep-history-card-clickable"
                      onClick={() => {
                        setSelectedReportForModal(item);
                        setShowModal(true);
                      }}
                    >
                      <div className="rep-history-head">
                        <div className="rep-history-title-box">
                          <span className="rep-history-cat">{catLabel}</span>
                          <h4 className="rep-history-subject">{displayTitle}</h4>
                        </div>
                        {formatReportStatusBadge(item.status)}
                      </div>

                      <p className="rep-history-desc">{item.complaint || item.description}</p>

                      <div className="rep-history-foot">
                        <span className="rep-foot-ref">
                          {bookingInfo.displayId ? `Order Ref: [${bookingInfo.displayId}]` : (item.bookingRef ? `Ref: ${item.bookingRef}` : '')}
                        </span>
                        <span className="rep-card-view-btn">
                          View Details & Dossier →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Ticket Details Modal */}
      {showModal && selectedReportForModal && (() => {
        const rep = selectedReportForModal;
        const bookingInfo = getBookingInfoForReport(rep);
        const formattedCategory = (rep.categoryLabel || rep.categoryKey || rep.category || 'Quality Issue').replace(/_/g, ' ');
        const complaintText = rep.complaint || rep.description || 'No complaint details provided.';
        const evidenceImg = rep.image || rep.imageUrl || (Array.isArray(rep.images) ? rep.images[0] : null);
        const statusStr = String(rep.status || 'open').toLowerCase();
        const canWithdraw = ['open', 'pending', 'under_review'].includes(statusStr);
        const dateStr = rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

        return (
          <div className="rep-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="rep-modal-card animate-in" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="rep-modal-header">
                <div className="rep-modal-title-row">
                  <div>
                    <span className="rep-modal-ticket-id">
                      TICKET #{String(rep._id || rep.id || '').slice(-8).toUpperCase()}
                    </span>
                    <h3 className="rep-modal-heading">{rep.subject && rep.subject !== 'No Subject Provided' ? rep.subject : bookingInfo.title}</h3>
                  </div>
                  <button className="rep-modal-close-btn" onClick={() => setShowModal(false)}>
                    <MdClose size={20} />
                  </button>
                </div>
                <div className="rep-modal-badge-row">
                  {formatReportStatusBadge(rep.status)}
                  {dateStr && <span className="rep-modal-date-tag">Filed: {dateStr}</span>}
                </div>
              </div>

              <div className="rep-modal-body">
                {/* Product / Service Details Section */}
                <div className="rep-modal-section">
                  <h4 className="rep-section-title">
                    <MdShoppingBag size={18} color="#2DB84B" /> Product / Service Details
                  </h4>
                  <div className="rep-product-detail-card">
                    <div className="rep-prod-img-box">
                      {bookingInfo.image ? (
                        <img src={bookingInfo.image} alt={bookingInfo.title} />
                      ) : (
                        bookingInfo.type === 'product' ? <MdShoppingBag size={32} color="#0284c7" /> : <MdBuild size={32} color="#2563eb" />
                      )}
                    </div>
                    <div className="rep-prod-info-box">
                      <h4 className="rep-prod-name">{bookingInfo.title}</h4>
                      <div className="rep-prod-meta-list">
                        <span className="rep-meta-chip type">
                          {bookingInfo.type === 'product' ? 'PRODUCT ORDER' : 'SERVICE BOOKING'}
                        </span>
                        {bookingInfo.displayId && (
                          <span className="rep-meta-chip ref">
                            ID: <strong>{bookingInfo.displayId}</strong>
                          </span>
                        )}
                        {bookingInfo.status && (
                          <span className="rep-meta-chip status">
                            Status: {bookingInfo.status}
                          </span>
                        )}
                      </div>
                      {bookingInfo.amount && (
                        <div className="rep-prod-price">
                          Amount: <strong>₹{Number(bookingInfo.amount).toLocaleString('en-IN')}</strong> {bookingInfo.quantity > 1 ? `(Qty: ${bookingInfo.quantity})` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Complaint Statement Section */}
                <div className="rep-modal-section">
                  <h4 className="rep-section-title">
                    <MdReportProblem size={18} color="#e11d48" /> Complaint & Issue Statement
                  </h4>
                  <div className="rep-complaint-box">
                    <div className="rep-complaint-cat-row">
                      <span className="rep-complaint-cat-pill">{formattedCategory.toUpperCase()}</span>
                      {rep.subject && <span className="rep-complaint-subj">"{rep.subject}"</span>}
                    </div>
                    <p className="rep-complaint-text">{complaintText}</p>

                    {evidenceImg && (
                      <div className="rep-evidence-box">
                        <span className="rep-evidence-label">Attached Customer Evidence:</span>
                        <div className="rep-evidence-img-wrap">
                          <img src={evidenceImg} alt="Customer Evidence" onClick={() => window.open(evidenceImg, '_blank')} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Support Investigation / Resolution Section */}
                {(rep.resolutionNote || rep.adminNote || rep.rejectionReason || ['resolved_refunded', 'resolved_no_refund', 'rejected'].includes(statusStr)) && (
                  <div className="rep-modal-section">
                    <h4 className="rep-section-title">
                      <MdSupportAgent size={18} color="#7c3aed" /> Support Investigation & Resolution
                    </h4>
                    <div className={`rep-resolution-box ${statusStr}`}>
                      <div className="rep-res-header">
                        Resolution Status: {rep.status ? rep.status.replace(/_/g, ' ').toUpperCase() : 'UNDER REVIEW'}
                      </div>
                      {(rep.resolutionNote || rep.adminNote || rep.rejectionReason) && (
                        <p className="rep-res-text">
                          {rep.resolutionNote || rep.adminNote || rep.rejectionReason}
                        </p>
                      )}
                      {rep.refundId && (
                        <div className="rep-refund-tag">
                          <MdCheckCircle color="#16a34a" /> Refund Transaction Ref: {rep.refundId}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="rep-modal-footer">
                {canWithdraw && (
                  <button
                    className="rep-withdraw-btn"
                    onClick={() => handleWithdrawReport(rep._id || rep.id)}
                    disabled={withdrawing}
                  >
                    {withdrawing ? 'Withdrawing...' : 'Withdraw Ticket'}
                  </button>
                )}
                <button className="rep-secondary-btn" onClick={() => setShowModal(false)} style={{ margin: 0, flex: 1 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

