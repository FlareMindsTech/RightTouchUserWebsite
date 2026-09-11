const BASE_URL = process.env.REACT_APP_API_URL || "";

export const apiClient = async (endpoint, options = {}) => {
  let token = localStorage.getItem("token");
  const currentUserStr = localStorage.getItem("currentUser");

  if (currentUserStr) {
    try {
      const userObj = JSON.parse(currentUserStr);
      const role = (userObj?.role || '').toUpperCase();
      if (['ADMIN', 'OWNER', 'TECHNICIAN', 'SUPERADMIN', 'EMPLOYEE'].includes(role)) {
        console.warn('[API Auth Guard] Admin/Technician session active in localStorage on Customer app. Suppressing token for customer API request.');
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

  const isSecureOrigin = window.location.protocol === 'https:';
  const isTargetInsecure = url.startsWith('http://');
  
  if (isSecureOrigin && isTargetInsecure) {
    console.warn(`[API Warning] Mixed Content detected! The page is HTTPS but target is HTTP: ${url}. This request will likely fail in most browsers.`);
  }

  console.log(`[API Request] Fetching: ${url} ${BASE_URL ? '(from env)' : '(via proxy)'}`);

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

      console.error(`[API Error] Status: ${response.status}, URL: ${url}, Body:`, (text && typeof text === 'string') ? text.substring(0, 200) : "Empty response");

      // Handle 401 Unauthorized - only clear token if it is a genuine user authentication error
      // (e.g., token expired, invalid user session). Do NOT clear session on 3rd-party/gateway errors (such as Razorpay API key 401s).
      if (response.status === 401) {
        const isPaymentEndpoint = url.includes('/payment') || url.includes('/order') || url.includes('/verify');
        const isGatewayError = errorData?.result?.error?.code === 'BAD_REQUEST_ERROR' || 
                               Boolean(errorData?.result?.error?.description) ||
                               (typeof errorData?.message === 'string' && errorData?.message.toLowerCase().includes('gateway'));

        const authErrorMessage = (errorData?.message || errorData?.error || '').toString().toLowerCase();
        const isGenuineAuthFailure = 
          url.includes('/api/user/me') ||
          url.includes('/api/user/profile') ||
          authErrorMessage.includes('jwt expired') ||
          authErrorMessage.includes('token expired') ||
          authErrorMessage.includes('jwt malformed') ||
          authErrorMessage.includes('invalid token') ||
          authErrorMessage.includes('user not found');

        if (validToken && !isPaymentEndpoint && !isGatewayError && isGenuineAuthFailure) {
          console.warn("[Auth] User auth token expired or invalid (401). Clearing session.");
          localStorage.removeItem("token");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event('userLoggedOut'));
        } else {
          console.warn("[API 401] 401 returned from endpoint without invalidating user session:", { url, isPaymentEndpoint, isGatewayError });
        }
      }

      const errorMessage = 
        errorData?.result?.error?.description ||
        errorData?.message || 
        errorData?.error?.message || 
        (errorData?.result?.error ? JSON.stringify(errorData.result.error) : null) ||
        `API request failed with status ${response.status}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = { data: errorData || { message: text } };
      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      console.error(`[API Error] Expected JSON but got:`, (text && typeof text === 'string') ? text.substring(0, 100) : "Non-text response");
      throw new Error("API returned non-JSON response (likely HTML for 404)");
    }
  } catch (error) {
    console.error(`[API Fetch Error] URL: ${url}, Error:`, error);
    throw error;
  }
};