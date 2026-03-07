const BASE_URL = process.env.REACT_APP_API_URL || "https://fullrighttouch.onrender.com";

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  // Ensure the base URL doesn't end with a slash and the endpoint starts with a slash
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  console.log(`[API Request] Fetching: ${url} (${process.env.NODE_ENV === 'development' ? 'via proxy' : 'from env'})`);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
      },
      ...options
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API Error] Status: ${response.status}, URL: ${url}, Body:`, (text && typeof text === 'string') ? text.substring(0, 200) : "Empty response");
      throw new Error(`API request failed with status ${response.status}`);
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