import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const signup = (data) =>
  apiClient(ENDPOINTS.AUTH.SIGNUP, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const resendOTP = (data) =>
  apiClient(ENDPOINTS.AUTH.RESEND_OTP, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const verifyOTP = (data) =>
  apiClient(ENDPOINTS.AUTH.VERIFY_OTP, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const loginCustomer = (data) =>
  apiClient(ENDPOINTS.AUTH.LOGIN_CUSTOMER, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const verifyLoginOTP = (data) =>
  apiClient(ENDPOINTS.AUTH.LOGIN_CUSTOMER_VERIFY, {
    method: "POST",
    body: JSON.stringify(data)
  });