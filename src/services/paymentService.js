import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const createPaymentOrder = (data) =>
  apiClient(ENDPOINTS.PAYMENT.CREATE_ORDER, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const verifyPayment = (data) =>
  apiClient(ENDPOINTS.PAYMENT.VERIFY, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getPaymentByBooking = (bookingId) =>
  apiClient(ENDPOINTS.PAYMENT.GET_BY_BOOKING(bookingId));

export const listMyPayments = () =>
  apiClient(ENDPOINTS.PAYMENT.LIST_MINE);

export const getPaymentSummary = () =>
  apiClient(ENDPOINTS.PAYMENT.SUMMARY);

export const getPaymentDetail = (bookingId) =>
  apiClient(ENDPOINTS.PAYMENT.GET_DETAIL(bookingId));

export const downloadReceipt = (bookingId) =>
  apiClient(ENDPOINTS.PAYMENT.RECEIPT(bookingId));

export const getRefundsOnBooking = (bookingId) =>
  apiClient(ENDPOINTS.PAYMENT.REFUNDS(bookingId));

export const initiatePaymentOrder = (bookingId, data) =>
  apiClient(ENDPOINTS.PAYMENT.INITIATE(bookingId), {
    method: "POST",
    body: JSON.stringify(data)
  });

export const retryPayment = (bookingId, data) =>
  apiClient(ENDPOINTS.PAYMENT.RETRY(bookingId), {
    method: "POST",
    body: JSON.stringify(data)
  });

export const declareCashPayment = (bookingId, data) =>
  apiClient(ENDPOINTS.PAYMENT.CASH_DECLARE(bookingId), {
    method: "POST",
    body: JSON.stringify(data)
  });

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};