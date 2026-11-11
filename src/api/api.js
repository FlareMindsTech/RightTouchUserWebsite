import { logger } from "../utils/logger";
import { safeStorage, getAuthToken, notifySessionExpired } from "../utils/browserUtils";

const BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || "";

export const apiClient = async (endpoint, options = {}) => {
  let token = getAuthToken();
  const currentUserStr = safeStorage.getItem("currentUser");

  if (currentUserStr) {
    try {
      const userObj = JSON.parse(currentUserStr);
      const role = (userObj?.role || '').toUpperCase();
      if (['ADMIN', 'OWNER', 'TECHNICIAN', 'SUPERADMIN', 'EMPLOYEE'].includes(role)) {
        logger.warn('[API Auth Guard] Admin/Technician session active in localStorage on Customer app. Suppressing token for customer API request.');
        token = null;
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  // Ensure the base URL doesn't end with a slash and the endpoint starts with a slash
  const cleanBase = BASE_URL ? BASE_URL.replace(/\/$/, "") : "";
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  const isSecureOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isTargetInsecure = url.startsWith('http://');
  
  if (isSecureOrigin && isTargetInsecure) {
    logger.warn(`[API Warning] Mixed Content detected! The page is HTTPS but target is HTTP: ${url}. This request will likely fail in most browsers.`);
  }

  logger.log(`[API Request] Fetching: ${url} ${BASE_URL ? '(from env)' : '(via proxy)'}`);

  try {
    const validToken = token && token !== "null" && token !== "undefined" ? token : null;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(validToken ? { Authorization: `Bearer ${validToken}` } : {})
      },
      ...options
    });

    if (!response.ok) {
      const text = await response.text();
      let errorData = null;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        // Not JSON
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Exclude authentication submission endpoints (where 401 is an invalid OTP/password during login attempt)
        const isAuthAttemptEndpoint = (
          url.includes('/api/user/auth/') ||
          url.includes('/api/user/login') ||
          url.includes('/api/user/signup') ||
          url.includes('/api/user/owner/') ||
          url.includes('verify-otp') ||
          url.includes('request-otp') ||
          url.includes('resend-otp') ||
          url.includes('set-password')
        );

        // Exclude payment gateway technical errors (e.g. Razorpay merchant credential issue)
        const isGatewayError = 
          errorData?.result?.error?.code === 'BAD_REQUEST_ERROR' || 
          Boolean(errorData?.result?.error?.description) ||
          (typeof errorData?.message === 'string' && errorData?.message.toLowerCase().includes('gateway'));

        const shouldInvalidateSession = !isAuthAttemptEndpoint && !isGatewayError;

        if (shouldInvalidateSession && (validToken || safeStorage.getItem('currentUser') || safeStorage.getItem('token'))) {
          logger.warn(`[API Auth] 401 Unauthorized for ${url}. Clearing expired session.`);
          notifySessionExpired();
        } else {
          logger.warn(`[API 401] 401 returned from ${url} (session not invalidated).`);
        }
      } else {
        logger.error(`[API Error] Status: ${response.status}, URL: ${url}, Body:`, (text && typeof text === 'string') ? text.substring(0, 200) : "Empty response");
      }

      let errorMessage = 
        errorData?.result?.error?.description ||
        errorData?.message || 
        errorData?.error?.message || 
        (errorData?.result?.error ? JSON.stringify(errorData.result.error) : null);

      if (!errorMessage) {
        if (text && typeof text === 'string' && !text.trim().startsWith('<')) {
          errorMessage = text;
        } else {
          errorMessage = `API request failed with status ${response.status}`;
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = { data: errorData || { message: errorMessage } };
      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      logger.error(`[API Error] Expected JSON but got:`, (text && typeof text === 'string') ? text.substring(0, 100) : "Non-text response");
      throw new Error("API returned non-JSON response (likely HTML for 404)");
    }
  } catch (error) {
    if (error?.status !== 401) {
      logger.error(`[API Fetch Error] URL: ${url}, Error:`, error?.message || error);
    }
    throw error;
  }
};
