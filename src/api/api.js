const BASE_URL = process.env.REACT_APP_API_URL;

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  // Ensure the base URL doesn't end with a slash and the endpoint starts with a slash
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  console.log(`[API Request] Fetching: ${url} (${process.env.NODE_ENV === 'development' ? 'via proxy' : 'from env'})`);

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

      // Handle 401 Unauthorized - clear token if invalid, expired, or account not found
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("user");
        console.warn("[Auth] Token cleared due to 401 Unauthorized");
        window.dispatchEvent(new Event('userLoggedOut'));
        
        // Only reload if we were previously logged in to prevent reload loops
        if (validToken && !url.includes('/login') && !url.includes('/signup') && !url.includes('/verify-otp')) {
          // Instead of a forced reload which abruptly stops UX, let event listeners handle the UI update.
          // The error will still be thrown below so the specific action can handle it (e.g. show a toast).
        }
      }

      const errorMessage = errorData?.message || errorData?.error?.message || `API request failed with status ${response.status}`;
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