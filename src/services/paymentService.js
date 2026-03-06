import { apiClient } from "../api/apiClient";
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