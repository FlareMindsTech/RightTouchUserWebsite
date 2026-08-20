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

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};