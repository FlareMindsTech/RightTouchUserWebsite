import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdOutlineChevronRight,
  MdAssignment,
  MdCheckCircle,
  MdCancel,
  MdPriceCheck,
  MdRefresh,
  MdClose,
  MdInfo,
  MdReceiptLong,
  MdShield
} from 'react-icons/md';
import { Package, Loader2, Calendar, LayoutGrid, FileText } from 'lucide-react';
import {
  listMyQuotations,
  listMyQuoteRequests,
  markQuotationViewed,
  acceptQuotation,
  rejectQuotation,
  cancelQuoteRequest,
  getProductBookings
} from '../services/quotationService';
import { getAllProductBookings } from '../services/productBookingService';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { safeParseDate } from '../utils/browserUtils';
import ConfirmModal from '../components/ConfirmModal';
import './ServicePage.css';
import './QuotationsPage.css';

const parseQuotationNotes = (q) => {
  if (!q) return { adminMessage: '', termsList: [] };
  const notesText = q.notes || q.adminNotes || q.vendorNotes || '';
  const termsText = q.termsAndConditions || '';
  
  let adminMessage = '';
  let rawTerms = '';

  const extractSections = (text) => {
    if (!text || typeof text !== 'string') return;
    if (text.includes('[Terms & Conditions]:') || text.includes('[Terms and Conditions]:')) {
      const sep = text.includes('[Terms & Conditions]:') ? '[Terms & Conditions]:' : '[Terms and Conditions]:';
      const parts = text.split(sep);
      const msg = parts[0].replace(/\[Admin Message\]:?/i, '').trim();
      if (msg && !adminMessage) adminMessage = msg;
      if (parts[1] && !rawTerms) rawTerms = parts[1];
    } else if (text.includes('[Admin Message]:')) {
      const msg = text.replace(/\[Admin Message\]:?/i, '').trim();
      if (msg && !adminMessage) adminMessage = msg;
    } else if (!rawTerms) {
      rawTerms = text;
    }
  };

  if (termsText) extractSections(termsText);
  if (notesText) extractSections(notesText);

  const cleanTermLine = (line) => {
    let t = (line || '').trim();
    t = t.replace(/^\[Terms\s*(&|and)?\s*Conditions\]:?/i, '').trim();
    t = t.replace(/^\[Admin\s*Message\]:?/i, '').trim();
    t = t.replace(/^\d+[\.\)]\s*/, '').trim();
    t = t.replace(/^[-*•]\s*/, '').trim();
    return t;
  };

  const termsList = (rawTerms || '')
    .split('\n')
    .map(cleanTermLine)
    .filter((t) => t.length > 0 && !/^\[.*?\]:?$/.test(t) && !/terms\s*(&|and)?\s*conditions/i.test(t));

  return { adminMessage, termsList };
};

const QuotationsPage = ({ isActive, showToast, currentUser, onNavigate }) => {
  const navigate = useNavigate();
  const { initiatePayment, loading: paymentLoading } = useRazorpayPayment();
  const [activeCategory, setActiveCategory] = useState('requests'); // 'requests' | 'received' | 'accepted' | 'completed' | 'all'
  const [quotations, setQuotations] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [productBookings, setProductBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingQuotation, setRejectingQuotation] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(null);

  // Detailed Quotation View Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);

  const fetchQuotationData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [quotesRes, requestsRes, pBookingsRes1, pBookingsRes2] = await Promise.all([
        listMyQuotations().catch(() => null),
        listMyQuoteRequests().catch(() => null),
        getProductBookings().catch(() => null),
        getAllProductBookings().catch(() => null)
      ]);

      const qList = quotesRes?.result || quotesRes?.data || quotesRes || [];
      const rList = requestsRes?.result || requestsRes?.data || requestsRes || [];
      const pbList1 = pBookingsRes1?.result || pBookingsRes1?.data || pBookingsRes1 || [];
      const pbList2 = pBookingsRes2?.result || pBookingsRes2?.data || pBookingsRes2 || [];

      const combinedPb = [...(Array.isArray(pbList1) ? pbList1 : []), ...(Array.isArray(pbList2) ? pbList2 : [])];
      const uniquePbMap = new Map();
      combinedPb.forEach((item) => {
        const idKey = String(item._id || item.id || item.bookingId || '');
        if (idKey && !uniquePbMap.has(idKey)) {
          uniquePbMap.set(idKey, item);
        }
      });

      setQuotations(Array.isArray(qList) ? qList : []);
      setQuoteRequests(Array.isArray(rList) ? rList : []);
      setProductBookings(Array.from(uniquePbMap.values()));
    } catch (err) {
      console.error('Error fetching quotation data:', err);
      if (showToast) showToast('Failed to load quotation data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    if (isActive && currentUser) {
      fetchQuotationData();
    }
  }, [isActive, currentUser, fetchQuotationData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuotationData();
  };

  const handleViewQuotation = async (quotation) => {
    try {
      await markQuotationViewed(quotation._id || quotation.id);
      fetchQuotationData();
    } catch (err) {
      console.warn('Failed to mark viewed:', err);
    }
  };

  const handleOpenDetailsModal = (item) => {
    setSelectedItemForDetails(item);
    setShowDetailsModal(true);
    if (item._hasQuotation && item._quotationObj) {
      handleViewQuotation(item._quotationObj);
    }
  };

  const handleAcceptQuotation = async (quotation) => {
    setActionLoading(true);
    try {
      const qId = quotation._id || quotation.id;
      const res = await acceptQuotation(qId);
      if (res?.success || res?.result || res?.data) {
        if (showToast) showToast("Quotation accepted! Please complete payment in Accepted tab.", "success");
        setShowDetailsModal(false);
        await fetchQuotationData();
        setActiveCategory("accepted");
      } else {
        const msg = res?.message || "Failed to accept quotation";
        if (showToast) showToast(msg, "error");
      }
    } catch (err) {
      console.error("Accept error:", err);
      const msg = err?.message || "Failed to accept quotation";
      if (showToast) showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (quotation) => {
    setRejectingQuotation(quotation);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingQuotation) return;
    setActionLoading(true);
    try {
      const res = await rejectQuotation(rejectingQuotation._id || rejectingQuotation.id, {
        reason: rejectionReason.trim() || 'Price exceeds budget'
      });
      if (res?.success || res?.result || res?.data) {
        if (showToast) showToast('Quotation rejected', 'info');
        setShowRejectModal(false);
        setRejectingQuotation(null);
        fetchQuotationData();
      } else {
        if (showToast) showToast(res?.message || 'Failed to reject quotation', 'error');
      }
    } catch (err) {
      console.error('Reject error:', err);
      if (showToast) showToast(err?.message || 'Failed to reject quotation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancelRequest = async () => {
    if (!cancellingRequest) return;
    setActionLoading(true);
    try {
      const res = await cancelQuoteRequest(cancellingRequest._id || cancellingRequest.id);
      if (res?.success || res?.result || res?.data) {
        if (showToast) showToast('Quote request cancelled', 'info');
        setShowCancelModal(false);
        setCancellingRequest(null);
        fetchQuotationData();
      } else {
        if (showToast) showToast(res?.message || 'Failed to cancel request', 'error');
      }
    } catch (err) {
      console.error('Cancel request error:', err);
      if (showToast) showToast(err?.message || 'Failed to cancel request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayOnline = async (item) => {
    if (!item) return;
    if (item.paymentStatus === "paid") {
      if (showToast) showToast("This order is already paid in full.", "info");
      return;
    }
    setActionLoading(true);
    try {
      const qId = item.quotationId || item._quotationObj?._id || item._id;
      const targetBookingId = item.bookingId || item._bookingObj?._id || qId;

      await initiatePayment({
        bookingId: targetBookingId,
        customerUser: currentUser,
        onSuccess: async (payRes) => {
          if (payRes?.free) {
            if (showToast) showToast("Order Confirmed (No payment required)!", "success");
          } else if (payRes?.alreadyPaid) {
            if (showToast) showToast("This quotation order is already paid!", "info");
          } else {
            if (showToast) showToast("Payment Successful! Order Confirmed.", "success");
          }
          setShowDetailsModal(false);
          await fetchQuotationData();
          setActionLoading(false);
        },
        onFailure: (err) => {
          console.error("[Pay Online Error]:", err);
          if (showToast) showToast(err?.message || "Payment was not completed", "error");
          setActionLoading(false);
        }
      });
    } catch (err) {
      console.error("Pay Online error:", err);
      if (showToast) showToast(err?.message || "Failed to process payment", "error");
      setActionLoading(false);
    }
  };

// Helper to evaluate quotation expiry: Expiry ONLY applies when awaiting customer response (accept/reject).
// Once accepted, paid, rejected, cancelled, or completed, the response window is concluded and expiry is disabled.
const evaluateQuotationStatus = (q, req) => {
  const rawStatus = (q?.status || req?.status || 'sent').toLowerCase();
  const paymentStatus = (q?.paymentStatus || (q?.paymentGroupId ? 'paid' : 'unpaid')).toLowerCase();

  const isRespondedOrClosed = [
    'accepted',
    'approved',
    'converted',
    'completed',
    'fulfilled',
    'service_completed',
    'rejected',
    'cancelled',
    'declined'
  ].includes(rawStatus) || paymentStatus === 'paid' || Boolean(q?.paymentGroupId);

  let isExpired = false;
  if (!isRespondedOrClosed) {
    const isPastValidDate = Boolean(q?.validUntil && new Date(q.validUntil) < new Date());
    isExpired = isPastValidDate || rawStatus === 'expired';
  }

  const qStatus = isExpired ? 'EXPIRED' : (q?.status || req?.status || 'SENT').toUpperCase();

  return { isExpired, qStatus, rawStatus, paymentStatus };
};

  const getUnifiedItems = useCallback(() => {
    const matchedQuotationIds = new Set();
    const matchedPbIds = new Set();
    const unified = [];

    const findMatchingProductBooking = (q, req) => {
      if (!Array.isArray(productBookings) || productBookings.length === 0) return null;
      const qIdStr = q ? String(q._id || q.id || '') : '';
      const qBookingIdStr = q ? String(q.bookingId || q.productBookingId || '') : '';
      const reqIdStr = req ? String(req._id || req.id || '') : '';

      return productBookings.find((pb) => {
        const pbIdStr = String(pb._id || pb.id || '');
        const pbBookingIdStr = String(pb.bookingId || pb.bookingNumber || '');
        const pbQuotationIdStr = String(
          pb.quotationId?._id || pb.quotationId?.id || pb.quotationId || pb.quotation || ''
        );
        const pbQuoteReqIdStr = String(
          pb.quoteRequestId?._id || pb.quoteRequestId?.id || pb.quoteRequestId || pb.requestId || ''
        );

        if (qIdStr && (pbQuotationIdStr === qIdStr || pbIdStr === qIdStr)) return true;
        if (qBookingIdStr && (pbBookingIdStr === qBookingIdStr || pbIdStr === qBookingIdStr)) return true;
        if (pbBookingIdStr && qIdStr && pbBookingIdStr === qIdStr) return true;
        if (reqIdStr && (pbQuoteReqIdStr === reqIdStr)) return true;
        return false;
      });
    };

    // Process each customer quote request
    quoteRequests.forEach((req) => {
      const reqIdStr = String(req._id || req.id || '');

      // Find matching quotation from admin
      const q = quotations.find((qItem) => {
        const qReqId = String(
          qItem.quoteRequestId?._id || qItem.quoteRequestId || qItem.requestId || ''
        );
        return qReqId === reqIdStr;
      });

      if (q) {
        matchedQuotationIds.add(String(q._id || q.id || ''));
        const { isExpired, qStatus } = evaluateQuotationStatus(q, req);
        
        const qFin = q.financialSnapshot || {};
        const quantity = q.quantity || req.quantity || 1;
        const totalPrice = (qFin.totalAmountPaise ? qFin.totalAmountPaise / 100 : null)
          ?? (qFin.unitPricePaise ? (qFin.unitPricePaise * quantity) / 100 : null)
          ?? (q.unitPricePaise ? (q.unitPricePaise * quantity) / 100 : null)
          ?? q.finalAmount
          ?? q.totalAmount
          ?? q.quotedPrice
          ?? (q.items?.[0]?.total)
          ?? null;

        const unitPrice = qFin.unitPricePaise ? qFin.unitPricePaise / 100 : (totalPrice && quantity ? totalPrice / quantity : totalPrice);
        const discountAmount = qFin.discountPaise ? qFin.discountPaise / 100 : 0;
        const gstPercent = qFin.gstPercent ?? 5;
        const gstAmount = qFin.gstAmountPaise ? qFin.gstAmountPaise / 100 : 0;

        const prod = q.productId || q.quoteRequestId?.productId || req.productId || {};

        let finalStatus = qStatus;
        let finalPaymentStatus = (q.paymentStatus || (q.paymentGroupId ? 'paid' : 'unpaid')).toLowerCase();
        let finalBookingId = q.bookingId || q.productBookingId || null;

        const pb = findMatchingProductBooking(q, req);
        if (pb) {
          matchedPbIds.add(String(pb._id || pb.id || pb.bookingId || ''));
          const pbStatus = (pb.status || pb.bookingStatus || pb.orderStatus || '').toUpperCase();
          const pbPayment = (pb.paymentStatus || pb.paymentState || (pb.isPaid ? 'paid' : '') || '').toLowerCase();

          if (pbStatus) finalStatus = pbStatus;
          if (pbPayment) finalPaymentStatus = pbPayment;
          if (pb.bookingId || pb._id) finalBookingId = pb.bookingId || pb._id;
        }

        unified.push({
          _id: req._id || req.id,
          quotationId: q._id || q.id,
          bookingId: finalBookingId,
          quoteRequestId: req._id || req.id,
          requestNumber: req.requestNumber,
          productId: prod._id || prod.id,
          productName: q.productSnapshot?.productName || prod.productName || prod.name || req.productSnapshot?.productName || 'Requested Product',
          productImage: q.productSnapshot?.imageUrls?.[0] || prod.productImages?.[0] || req.productSnapshot?.imageUrl || null,
          quantity: quantity,
          quotedPrice: totalPrice,
          unitPrice: unitPrice,
          discountAmount: discountAmount,
          gstPercent: gstPercent,
          gstAmount: gstAmount,
          vendorNotes: q.notes || q.adminNotes || '',
          requestNotes: req.requirementDescription || req.notes || req.additionalNotes || '',
          validUntil: q.validUntil,
          rejectedReason: q.rejectedReason || '',
          isExpired: isExpired,
          status: finalStatus,
          rawStatus: q.status || req.status,
          paymentStatus: finalPaymentStatus,
          createdAt: q.createdAt || req.createdAt,
          _isQuotation: true,
          _hasQuotation: true,
          _quotationObj: q,
          _requestObj: req,
          _bookingObj: pb || null,
        });
      } else {
        const rStatus = (req.status || 'QUOTE_REQUESTED').toUpperCase();
        const prod = req.productId || {};

        let finalStatus = rStatus;
        let finalPaymentStatus = 'unpaid';
        let finalBookingId = null;

        const pb = findMatchingProductBooking(null, req);
        if (pb) {
          matchedPbIds.add(String(pb._id || pb.id || pb.bookingId || ''));
          const pbStatus = (pb.status || pb.bookingStatus || pb.orderStatus || '').toUpperCase();
          const pbPayment = (pb.paymentStatus || pb.paymentState || (pb.isPaid ? 'paid' : '') || '').toLowerCase();

          if (pbStatus) finalStatus = pbStatus;
          if (pbPayment) finalPaymentStatus = pbPayment;
          if (pb.bookingId || pb._id) finalBookingId = pb.bookingId || pb._id;
        }

        unified.push({
          _id: req._id || req.id,
          bookingId: finalBookingId,
          quoteRequestId: req._id || req.id,
          requestNumber: req.requestNumber,
          productId: prod._id || prod.id,
          productName: req.productSnapshot?.productName || prod.productName || prod.name || 'Requested Product',
          productImage: req.productSnapshot?.imageUrl || prod.productImages?.[0] || null,
          quantity: req.quantity || 1,
          quotedPrice: null,
          vendorNotes: '',
          requestNotes: req.requirementDescription || req.notes || req.additionalNotes || '',
          validUntil: null,
          status: finalStatus,
          rawStatus: req.status,
          paymentStatus: finalPaymentStatus,
          createdAt: req.createdAt,
          _isQuotation: false,
          _hasQuotation: false,
          _requestObj: req,
          _bookingObj: pb || null,
        });
      }
    });

    // Also include standalone quotations not linked to any request in quoteRequests
    quotations.forEach((q) => {
      const qIdStr = String(q._id || q.id || '');
      if (!matchedQuotationIds.has(qIdStr)) {
        const { isExpired, qStatus } = evaluateQuotationStatus(q, null);
        const qFin = q.financialSnapshot || {};
        const quantity = q.quantity || 1;
        const totalPrice = (qFin.totalAmountPaise ? qFin.totalAmountPaise / 100 : null)
          ?? (qFin.unitPricePaise ? (qFin.unitPricePaise * quantity) / 100 : null)
          ?? (q.unitPricePaise ? (q.unitPricePaise * quantity) / 100 : null)
          ?? q.finalAmount
          ?? q.totalAmount
          ?? q.quotedPrice
          ?? (q.items?.[0]?.total)
          ?? null;

        const unitPrice = qFin.unitPricePaise ? qFin.unitPricePaise / 100 : (totalPrice && quantity ? totalPrice / quantity : totalPrice);
        const discountAmount = qFin.discountPaise ? qFin.discountPaise / 100 : 0;
        const gstPercent = qFin.gstPercent ?? 5;
        const gstAmount = qFin.gstAmountPaise ? qFin.gstAmountPaise / 100 : 0;

        const prod = q.productId || {};

        let finalStatus = qStatus;
        let finalPaymentStatus = (q.paymentStatus || (q.paymentGroupId ? 'paid' : 'unpaid')).toLowerCase();
        let finalBookingId = q.bookingId || q.productBookingId || null;

        const pb = findMatchingProductBooking(q, null);
        if (pb) {
          matchedPbIds.add(String(pb._id || pb.id || pb.bookingId || ''));
          const pbStatus = (pb.status || pb.bookingStatus || pb.orderStatus || '').toUpperCase();
          const pbPayment = (pb.paymentStatus || pb.paymentState || (pb.isPaid ? 'paid' : '') || '').toLowerCase();

          if (pbStatus) finalStatus = pbStatus;
          if (pbPayment) finalPaymentStatus = pbPayment;
          if (pb.bookingId || pb._id) finalBookingId = pb.bookingId || pb._id;
        }

        unified.push({
          _id: q._id || q.id,
          quotationId: q._id || q.id,
          bookingId: finalBookingId,
          quoteRequestId: q.quoteRequestId?._id || q.quoteRequestId || q.requestId,
          productId: prod._id || prod.id,
          productName: q.productSnapshot?.productName || prod.productName || prod.name || 'Custom Product Quote',
          productImage: q.productSnapshot?.imageUrls?.[0] || prod.productImages?.[0] || null,
          quantity: quantity,
          quotedPrice: totalPrice,
          unitPrice: unitPrice,
          discountAmount: discountAmount,
          gstPercent: gstPercent,
          gstAmount: gstAmount,
          vendorNotes: q.notes || q.adminNotes || '',
          requestNotes: '',
          validUntil: q.validUntil,
          rejectedReason: q.rejectedReason || '',
          isExpired: isExpired,
          status: finalStatus,
          rawStatus: q.status,
          paymentStatus: finalPaymentStatus,
          createdAt: q.createdAt,
          _isQuotation: true,
          _hasQuotation: true,
          _quotationObj: q,
          _bookingObj: pb || null,
        });
      }
    });

    // Also include unmatched standalone product bookings
    productBookings.forEach((pb) => {
      const pbIdStr = String(pb._id || pb.id || pb.bookingId || '');
      if (pbIdStr && !matchedPbIds.has(pbIdStr)) {
        const prod = pb.productId || pb.product || {};
        const statusStr = (pb.status || pb.bookingStatus || pb.orderStatus || 'COMPLETED').toUpperCase();
        const paymentStatusStr = (pb.paymentStatus || (pb.isPaid ? 'paid' : 'unpaid')).toLowerCase();

        unified.push({
          _id: pb._id || pb.id || pb.bookingId,
          quotationId: pb.quotationId?._id || pb.quotationId || null,
          bookingId: pb.bookingId || pb._id || pb.id,
          quoteRequestId: pb.quoteRequestId?._id || pb.quoteRequestId || null,
          bookingNumber: pb.bookingId || pb.bookingNumber,
          productId: prod._id || prod.id,
          productName: pb.productSnapshot?.productName || prod.productName || prod.name || pb.productName || 'Product Booking',
          productImage: pb.productSnapshot?.imageUrls?.[0] || prod.productImages?.[0] || pb.productImage || null,
          quantity: pb.quantity || 1,
          quotedPrice: pb.totalAmount ?? pb.totalPrice ?? pb.amount ?? pb.quotedPrice ?? null,
          unitPrice: pb.unitPrice || (pb.totalAmount && pb.quantity ? pb.totalAmount / pb.quantity : null),
          discountAmount: pb.discountAmount || 0,
          gstPercent: pb.gstPercent ?? 5,
          gstAmount: pb.gstAmount || 0,
          vendorNotes: pb.notes || pb.adminNotes || '',
          requestNotes: pb.requirementDescription || '',
          validUntil: null,
          rejectedReason: '',
          isExpired: false,
          status: statusStr,
          rawStatus: pb.status || pb.bookingStatus,
          paymentStatus: paymentStatusStr,
          createdAt: pb.createdAt,
          _isQuotation: true,
          _hasQuotation: true,
          _bookingObj: pb,
          _quotationObj: pb.quotationId || null
        });
      }
    });

    return unified;
  }, [quoteRequests, quotations, productBookings]);

  if (!isActive) return null;

  const unifiedItems = getUnifiedItems();
  const requestsCount = unifiedItems.filter(i =>
    !i._hasQuotation &&
    !["CANCELLED", "REJECTED", "COMPLETED"].includes((i.status || "").toUpperCase())
  ).length;

  const receivedQuotesCount = unifiedItems.filter(i =>
    i._hasQuotation &&
    !i.isExpired &&
    i.paymentStatus !== "paid" &&
    !["ACCEPTED", "APPROVED", "CONVERTED", "REJECTED", "CANCELLED", "COMPLETED", "FULFILLED", "SERVICE_COMPLETED", "PAID", "CONFIRMED", "IN_PROGRESS"].includes((i.status || "").toUpperCase())
  ).length;

  const acceptedCount = unifiedItems.filter(i =>
    i._hasQuotation &&
    (["ACCEPTED", "APPROVED", "CONVERTED", "PAID", "CONFIRMED", "IN_PROGRESS"].includes((i.status || "").toUpperCase()) || i.paymentStatus === "paid") &&
    !["COMPLETED", "FULFILLED", "SERVICE_COMPLETED"].includes((i.status || "").toUpperCase())
  ).length;

  const completedCount = unifiedItems.filter(i =>
    ["COMPLETED", "FULFILLED", "SERVICE_COMPLETED"].includes((i.status || "").toUpperCase())
  ).length;

  const getStatusBadge = (item) => {
    const s = (typeof item === "string" ? item : item?.status || "").toUpperCase();
    const isPaid = typeof item === "object" && item?.paymentStatus === "paid";

    if (["COMPLETED", "FULFILLED", "SERVICE_COMPLETED"].includes(s)) {
      return (
        <span className="q-badge badge-success" style={{ background: "#d1fae5", color: "#047857", border: "1px solid #a7f3d0" }}>
          <MdCheckCircle /> COMPLETED & DELIVERED
        </span>
      );
    }
    if (isPaid || ["ACCEPTED", "APPROVED"].includes(s)) {
      if (isPaid) {
        return (
          <span className="q-badge badge-success" style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
            <MdCheckCircle /> ACCEPTED & PAID (IN PROGRESS)
          </span>
        );
      }
      return (
        <span className="q-badge badge-warning" style={{ background: "#fef9c3", color: "#854d0e", border: "1px solid #fef08a" }}>
          <MdPriceCheck /> PAYMENT PENDING
        </span>
      );
    }
    if (["REJECTED", "CANCELLED", "EXPIRED"].includes(s)) {
      return <span className="q-badge badge-error"><MdCancel /> {s}</span>;
    }
    if (["SENT", "VIEWED", "DELIVERED", "QUOTE_SENT"].includes(s)) {
      return <span className="q-badge badge-info"><MdPriceCheck /> QUOTE RECEIVED</span>;
    }
    if (["UNDER_REVIEW", "QUOTATION_PREPARED"].includes(s)) {
      return <span className="q-badge badge-warning"><MdAssignment /> UNDER REVIEW</span>;
    }
    return <span className="q-badge badge-warning"><MdAssignment /> REQUEST SENT</span>;
  };

  // Extract financial properties for details modal
  let detailsFin = {
    unitPrice: 0,
    baseAmount: 0,
    discountAmount: 0,
    discountPercent: 0,
    taxableAmount: 0,
    gstPercent: 5,
    gstAmount: 0,
    totalAmount: 0,
    adminMessage: '',
    termsList: [],
  };

  if (selectedItemForDetails?._quotationObj) {
    const qObj = selectedItemForDetails._quotationObj;
    const snap = qObj.financialSnapshot || {};
    const qty = selectedItemForDetails.quantity || 1;
    
    detailsFin.unitPrice = snap.unitPricePaise ? snap.unitPricePaise / 100 : (selectedItemForDetails.unitPrice || 0);
    detailsFin.baseAmount = snap.baseAmountPaise ? snap.baseAmountPaise / 100 : detailsFin.unitPrice * qty;
    detailsFin.discountAmount = snap.discountPaise ? snap.discountPaise / 100 : (selectedItemForDetails.discountAmount || 0);
    detailsFin.discountPercent = detailsFin.baseAmount > 0 ? Math.round((detailsFin.discountAmount / detailsFin.baseAmount) * 100) : 0;
    detailsFin.taxableAmount = snap.taxableAmountPaise ? snap.taxableAmountPaise / 100 : Math.max(0, detailsFin.baseAmount - detailsFin.discountAmount);
    detailsFin.gstPercent = snap.gstPercent ?? selectedItemForDetails.gstPercent ?? 5;
    detailsFin.gstAmount = snap.gstAmountPaise ? snap.gstAmountPaise / 100 : Math.round((detailsFin.taxableAmount * detailsFin.gstPercent) / 100);
    detailsFin.totalAmount = snap.totalAmountPaise ? snap.totalAmountPaise / 100 : (detailsFin.taxableAmount + detailsFin.gstAmount);

    const parsedNotes = parseQuotationNotes(qObj);
    detailsFin.adminMessage = parsedNotes.adminMessage;
    detailsFin.termsList = parsedNotes.termsList;
  }

  const isDetailsActionable = selectedItemForDetails?._hasQuotation &&
    !selectedItemForDetails?.isExpired &&
    selectedItemForDetails?.paymentStatus !== 'paid' &&
    !['REJECTED', 'CANCELLED', 'ACCEPTED', 'APPROVED', 'CONVERTED', 'COMPLETED', 'FULFILLED', 'SERVICE_COMPLETED', 'PAID', 'CONFIRMED', 'IN_PROGRESS'].includes((selectedItemForDetails?.status || '').toUpperCase());

  return (
    <div className="quotations-page-container">
      {/* Header */}
      <div className="q-header">
        <button className="q-back-btn" onClick={() => navigate('/bookings')}>
          <MdOutlineChevronRight style={{ transform: 'rotate(180deg)', fontSize: '20px' }} />
          <span>Back to Bookings</span>
        </button>
        <div className="q-header-title-row">
          <div>
            <h2>Product Quotations</h2>
            <p>Manage custom price quotes and formal product estimations</p>
          </div>
          <button className="q-refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh Data">
            <MdRefresh className={refreshing ? 'spinning' : ''} size={20} />
          </button>
        </div>
      </div>

      {/* Top Category Filter Ribbon Bar */}
      <nav className="category-nav">
        <div className="category-nav-scroll">
          <button
            className={`category-nav-item ${activeCategory === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveCategory('requests')}
          >
            <span className="category-nav-icon"><FileText size={16} /></span>
            <span>My Requests ({requestsCount})</span>
          </button>
          <button
            className={`category-nav-item ${activeCategory === 'quotations' || activeCategory === 'received' ? 'active' : ''}`}
            onClick={() => setActiveCategory('received')}
          >
            <span className="category-nav-icon"><Package size={16} /></span>
            <span>Received Quotes ({receivedQuotesCount})</span>
          </button>
          <button
            className={`category-nav-item ${activeCategory === 'accepted' ? 'active' : ''}`}
            onClick={() => setActiveCategory('accepted')}
          >
            <span className="category-nav-icon"><MdCheckCircle size={16} /></span>
            <span>Accepted ({acceptedCount})</span>
          </button>
          <button
            className={`category-nav-item ${activeCategory === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveCategory('completed')}
          >
            <span className="category-nav-icon"><MdCheckCircle size={16} /></span>
            <span>Completed ({completedCount})</span>
          </button>
          <button
            className={`category-nav-item ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span className="category-nav-icon"><LayoutGrid size={16} /></span>
            <span>All Items ({unifiedItems.length})</span>
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <div className="q-content-box">
        {loading ? (
          <div className="q-loading-state">
            <Loader2 className="spinner" size={32} />
            <p>Loading product quotations...</p>
          </div>
        ) : !currentUser ? (
          <div className="q-empty-card">
            <MdInfo size={40} color="var(--green, #22ba73)" />
            <h3>Please Sign In</h3>
            <p>You need to be logged in to view your requested quotes.</p>
          </div>
        ) : (() => {
          let displayItems = [];
          if (activeCategory === "quotations" || activeCategory === "received") {
            displayItems = unifiedItems.filter(item =>
              item._hasQuotation &&
              !item.isExpired &&
              item.paymentStatus !== "paid" &&
              !["ACCEPTED", "APPROVED", "CONVERTED", "REJECTED", "CANCELLED", "COMPLETED", "FULFILLED", "SERVICE_COMPLETED", "PAID", "CONFIRMED", "IN_PROGRESS"].includes((item.status || "").toUpperCase())
            );
          } else if (activeCategory === "requests") {
            displayItems = unifiedItems.filter(item =>
              !item._hasQuotation &&
              !["CANCELLED", "REJECTED", "COMPLETED"].includes((item.status || "").toUpperCase())
            );
          } else if (activeCategory === "accepted") {
            displayItems = unifiedItems.filter(item =>
              item._hasQuotation &&
              (["ACCEPTED", "APPROVED", "CONVERTED", "PAID", "CONFIRMED", "IN_PROGRESS"].includes((item.status || "").toUpperCase()) || item.paymentStatus === "paid") &&
              !["COMPLETED", "FULFILLED", "SERVICE_COMPLETED"].includes((item.status || "").toUpperCase())
            );
          } else if (activeCategory === "completed") {
            displayItems = unifiedItems.filter(item =>
              ["COMPLETED", "FULFILLED", "SERVICE_COMPLETED"].includes((item.status || "").toUpperCase())
            );
          } else {
            displayItems = unifiedItems;
          }

          if (displayItems.length === 0) {
            return (
              <div className="q-empty-card">
                <Package size={44} color="#cbd5e1" />
                <h3>No Items Found</h3>
                <p>No quotation entries match your current category filter.</p>
                <button className="q-explore-btn" onClick={() => navigate('/products')}>
                  Explore Products
                </button>
              </div>
            );
          }

          return (
            <div className="q-cards-grid">
              {displayItems.map((item) => {
                const prodName = item.productName || 'Custom Product Quote';
                const prodImg = item.productImage;
                const status = (item.status || 'QUOTE_REQUESTED').toUpperCase();
                const isActionable = item._hasQuotation && !item.isExpired && item.paymentStatus !== 'paid' && !['REJECTED', 'CANCELLED', 'ACCEPTED', 'APPROVED', 'CONVERTED', 'COMPLETED', 'FULFILLED', 'SERVICE_COMPLETED', 'PAID', 'CONFIRMED', 'IN_PROGRESS'].includes(status);
                const canCancel = !item._hasQuotation && ['PENDING', 'QUOTE_REQUESTED', 'UNDER_REVIEW', 'QUOTATION_PREPARED'].includes(status);
                const dateStr = item.createdAt ? safeParseDate(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                const { adminMessage } = parseQuotationNotes(item._quotationObj);

                return (
                  <div
                    key={item._id}
                    className="q-card"
                    onClick={() => handleOpenDetailsModal(item)}
                  >
                    <div className="q-card-header-bar">
                      <div className="q-card-prod-info">
                        <div className="q-card-img">
                          {prodImg ? <img src={prodImg} alt={prodName} /> : <Package size={26} />}
                        </div>
                        <div className="q-card-details">
                          <h4>{prodName}</h4>
                          <div className="q-card-meta">
                            <span className="q-meta-date"><Calendar size={13} /> {dateStr}</span>
                            <span className="q-meta-dot">•</span>
                            <span className="q-meta-qty">Qty: <strong>{item.quantity || 1}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="q-card-badge-wrap">
                        {getStatusBadge(item)}
                      </div>
                    </div>

                    <div className="q-card-price-section">
                      <div className="q-price-row">
                        <span className="q-price-label">Quoted Net Total</span>
                        {item._hasQuotation && item.quotedPrice !== null ? (
                          <span className="q-price-val">₹{Number(item.quotedPrice).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="q-price-val" style={{ fontSize: '13px', color: '#b45309', fontWeight: '600' }}>
                            Estimating Price...
                          </span>
                        )}
                      </div>

                      {/* Subtotal, Discount & GST Tags */}
                      {item._hasQuotation && (
                        <div className="q-card-tax-tags">
                          {item.discountAmount > 0 && (
                            <span className="q-tax-tag tag-discount">
                              Discount: ₹{Number(item.discountAmount).toLocaleString('en-IN')} OFF
                            </span>
                          )}
                          <span className="q-tax-tag tag-gst">
                            GST ({item.gstPercent || 5}%): ₹{Number(item.gstAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.status === 'REJECTED' && item.rejectedReason ? (
                      <div className="q-card-notes" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
                        <strong>Rejection Reason:</strong> {item.rejectedReason}
                      </div>
                    ) : adminMessage ? (
                      <div className="q-card-notes">
                        <strong>Admin Note:</strong> {adminMessage}
                      </div>
                    ) : item.vendorNotes ? (
                      <div className="q-card-notes">
                        <strong>Vendor Note:</strong> {item.vendorNotes}
                      </div>
                    ) : item.requestNotes ? (
                      <div className="q-card-notes" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                        <strong>My Requirement:</strong> {item.requestNotes}
                      </div>
                    ) : null}

                    <div className="q-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="q-btn q-view-details-btn"
                        onClick={() => handleOpenDetailsModal(item)}
                      >
                        View Details
                      </button>

                      {item.paymentStatus === 'paid' ? (
                        <button
                          className="q-btn q-paid-btn"
                          disabled={true}
                          style={{
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            cursor: 'default',
                            fontWeight: '600',
                            opacity: 0.95,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MdCheckCircle color="#10b981" size={16} /> Paid & Confirmed
                        </button>
                      ) : ['ACCEPTED', 'APPROVED', 'CONVERTED', 'COMPLETED', 'FULFILLED', 'SERVICE_COMPLETED'].includes(status) ? (
                        <button
                          className="q-btn q-accept-btn"
                          onClick={() => handlePayOnline(item)}
                          disabled={actionLoading || paymentLoading}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            border: 'none',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MdPriceCheck size={18} /> Pay Now (₹{Number(item.quotedPrice || 0).toLocaleString('en-IN')})
                        </button>
                      ) : isActionable && item._quotationObj ? (
                        <>
                          <button
                            className="q-btn q-reject-btn"
                            onClick={() => handleOpenRejectModal(item._quotationObj)}
                            disabled={actionLoading || paymentLoading}
                          >
                            Reject
                          </button>
                          <button
                            className="q-btn q-accept-btn"
                            onClick={() => handleAcceptQuotation(item._quotationObj)}
                            disabled={actionLoading || paymentLoading}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              fontWeight: 'bold',
                              border: 'none',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <MdCheckCircle size={18} /> Accept
                          </button>
                        </>
                      ) : null}

                      {canCancel && item._requestObj && (
                        <button
                          className="q-btn q-cancel-req-btn"
                          onClick={() => {
                            setCancellingRequest(item._requestObj);
                            setShowCancelModal(true);
                          }}
                          disabled={actionLoading || paymentLoading}
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Full Quotation Details Statement Modal */}
      {showDetailsModal && selectedItemForDetails && (
        <div className="q-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="q-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="q-details-header">
              <div className="q-details-header-title">
                <div className="q-details-num-row">
                  <span className="q-details-number">
                    {selectedItemForDetails._quotationObj?.quotationNumber || `QT-${String(selectedItemForDetails._id).slice(-6).toUpperCase()}`}
                  </span>
                  {getStatusBadge(selectedItemForDetails.status)}
                </div>
                <p className="q-details-subtitle">Official Product Quotation Statement</p>
              </div>
              <button className="q-details-close-btn" onClick={() => setShowDetailsModal(false)}>
                <MdClose size={22} />
              </button>
            </div>

            <div className="q-details-body">
              {/* Date & Validity Banner */}
              <div className="q-details-valid-banner">
                <div>
                  <span className="banner-label">Quote Date: </span>
                  <span className="banner-val">{selectedItemForDetails.createdAt ? safeParseDate(selectedItemForDetails.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                {selectedItemForDetails.validUntil && (
                  <div>
                    <span className="banner-label">
                      {selectedItemForDetails.isExpired
                        ? 'Expired On: '
                        : ['ACCEPTED', 'APPROVED', 'COMPLETED', 'FULFILLED', 'SERVICE_COMPLETED'].includes((selectedItemForDetails.status || '').toUpperCase()) || selectedItemForDetails.paymentStatus === 'paid'
                        ? 'Quotation Validity: '
                        : 'Response Window: '}
                    </span>
                    <span className={`banner-val ${selectedItemForDetails.isExpired ? 'expired-val' : 'highlight'}`}>
                      {safeParseDate(selectedItemForDetails.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Snapshot Card */}
              <div className="q-details-product-card">
                <div className="q-details-prod-img">
                  {selectedItemForDetails.productImage ? (
                    <img src={selectedItemForDetails.productImage} alt={selectedItemForDetails.productName} />
                  ) : (
                    <Package size={36} />
                  )}
                </div>
                <div className="q-details-prod-info">
                  <h4>{selectedItemForDetails.productName}</h4>
                  <div className="q-details-prod-qty">
                    <span>Quantity Requested: <strong>{selectedItemForDetails.quantity || 1} Unit(s)</strong></span>
                  </div>
                </div>
              </div>

              {/* Customer Rejection Reason Box */}
              {selectedItemForDetails.status === 'REJECTED' && selectedItemForDetails.rejectedReason && (
                <div className="q-details-message-box" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                  <div className="msg-box-header" style={{ color: '#991b1b' }}>
                    <MdCancel size={18} color="#dc2626" />
                    <strong>My Rejection Feedback:</strong>
                  </div>
                  <p className="msg-box-text" style={{ color: '#7f1d1d', fontWeight: '500' }}>{selectedItemForDetails.rejectedReason}</p>
                </div>
              )}

              {/* Customer Requirement Description Box */}
              {selectedItemForDetails.requestNotes && (
                <div className="q-details-message-box" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <div className="msg-box-header" style={{ color: '#475569' }}>
                    <MdAssignment size={18} color="#008080" />
                    <strong>My Requirement Description:</strong>
                  </div>
                  <p className="msg-box-text" style={{ color: '#334155' }}>{selectedItemForDetails.requestNotes}</p>
                </div>
              )}

              {/* Financial Estimation Breakdown Box */}
              {selectedItemForDetails._hasQuotation && (
                <div className="q-details-financial-box">
                  <h4 className="financial-box-title"><MdReceiptLong size={18} /> Price Estimation & Tax Breakdown</h4>
                  
                  <div className="q-financial-rows">
                    <div className="q-fin-row">
                      <span>Unit Price ({selectedItemForDetails.quantity || 1} × ₹{Number(detailsFin.unitPrice).toLocaleString('en-IN')})</span>
                      <span>₹{Number(detailsFin.baseAmount).toLocaleString('en-IN')}</span>
                    </div>
                    
                    {detailsFin.discountAmount > 0 && (
                      <div className="q-fin-row discount-row">
                        <span>Special Discount ({detailsFin.discountPercent}% OFF)</span>
                        <span>- ₹{Number(detailsFin.discountAmount).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    
                    <div className="q-fin-row">
                      <span>Taxable Subtotal</span>
                      <span>₹{Number(detailsFin.taxableAmount).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="q-fin-row gst-row">
                      <span>GST ({detailsFin.gstPercent}%)</span>
                      <span>+ ₹{Number(detailsFin.gstAmount).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="q-fin-row total-net-row">
                      <span>Total Estimated Net Price</span>
                      <span className="net-total-price">₹{Number(detailsFin.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Message / Remarks Box */}
              {detailsFin.adminMessage && (
                <div className="q-details-message-box">
                  <div className="msg-box-header">
                    <MdInfo size={18} color="#0284c7" />
                    <strong>Message from RightTouch Admin:</strong>
                  </div>
                  <p className="msg-box-text">{detailsFin.adminMessage}</p>
                </div>
              )}

              {/* Terms & Conditions List */}
              {detailsFin.termsList && detailsFin.termsList.length > 0 && (
                <div className="q-details-terms-box">
                  <h4><MdShield size={18} color="#16a34a" /> Terms & Conditions</h4>
                  <ul className="q-terms-list">
                    {detailsFin.termsList.map((term, idx) => (
                      <li key={idx}>
                        <span className="term-num">#{idx + 1}</span>
                        <span className="term-text">{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="q-details-footer">
              <button className="q-btn-sec" onClick={() => setShowDetailsModal(false)}>Close</button>
              {selectedItemForDetails.paymentStatus === 'paid' ? (
                <button
                  className="q-btn q-paid-btn"
                  disabled={true}
                  style={{
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    cursor: 'default',
                    fontWeight: '600',
                    opacity: 0.95,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MdCheckCircle color="#10b981" size={16} /> Paid & Confirmed
                </button>
              ) : ['ACCEPTED', 'APPROVED', 'CONVERTED', 'COMPLETED', 'FULFILLED', 'SERVICE_COMPLETED'].includes((selectedItemForDetails.status || '').toUpperCase()) ? (
                <button
                  className="q-btn q-accept-btn"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handlePayOnline(selectedItemForDetails);
                  }}
                  disabled={actionLoading || paymentLoading}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MdPriceCheck size={18} /> Pay Now (₹{Number(detailsFin.totalAmount || selectedItemForDetails.quotedPrice || 0).toLocaleString('en-IN')})
                </button>
              ) : isDetailsActionable && selectedItemForDetails._quotationObj ? (
                <>
                  <button
                    className="q-btn q-reject-btn"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleOpenRejectModal(selectedItemForDetails._quotationObj);
                    }}
                    disabled={actionLoading || paymentLoading}
                  >
                    Reject
                  </button>
                  <button
                    className="q-btn q-accept-btn"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleAcceptQuotation(selectedItemForDetails._quotationObj);
                    }}
                    disabled={actionLoading || paymentLoading}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      border: 'none',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MdCheckCircle size={18} /> Accept
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Reject Quotation Reason Dialog */}
      {showRejectModal && (
        <div className="q-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="q-reject-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="q-dialog-header">
              <h3>Reject Quotation</h3>
              <button onClick={() => setShowRejectModal(false)}><MdClose /></button>
            </div>
            <div className="q-dialog-body">
              <p>Please state the reason for rejecting this quotation (optional):</p>
              <textarea
                rows={3}
                placeholder="E.g. Found cheaper alternative, budget mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="q-dialog-footer">
              <button className="q-btn-sec" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="q-btn-danger" onClick={handleConfirmReject} disabled={actionLoading || paymentLoading}>
                {actionLoading ? <Loader2 className="spinner" size={16} /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cancel Request Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        icon="❓"
        iconBg="#fee2e2"
        iconColor="#dc2626"
        title="Cancel Quote Request?"
        desc="Are you sure you want to cancel this quotation request?"
        confirmLabel="Yes, Cancel Request"
        cancelLabel="Keep Request"
        confirmClass="cm-confirm-danger"
        loading={actionLoading}
        onConfirm={handleConfirmCancelRequest}
        onCancel={() => {
          setShowCancelModal(false);
          setCancellingRequest(null);
        }}
      />
    </div>
  );
};

export default QuotationsPage;
