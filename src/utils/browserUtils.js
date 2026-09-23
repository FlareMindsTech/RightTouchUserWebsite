/**
 * Browser Utilities for iOS/Safari Compatibility
 */

/**
 * Safely parses a date string, handling common Safari-specific issues.
 * @param {string|Date} dateVal - The date value to parse.
 * @param {Date} fallback - Fallback date if parsing fails (default: new Date()).
 * @returns {Date} - A valid Date object.
 */
export const safeParseDate = (dateVal, fallback = new Date()) => {
  if (!dateVal) return fallback;
  if (dateVal instanceof Date) return isNaN(dateVal) ? fallback : dateVal;

  try {
    // If it's a string, attempt to normalize it for Safari
    // Safari prefers ISO 8601 (YYYY-MM-DDTHH:mm:SSZ)
    // Common backend format YYYY-MM-DD HH:mm:ss needs 'T'
    let normalized = dateVal;
    if (typeof dateVal === 'string') {
      normalized = dateVal.replace(' ', 'T');
      // If it looks like a date but doesn't have a timezone, append 'Z' if appropriate
      // or at least ensure it's parseable.
    }

    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Last ditch effort: try the original value
    const originalParsed = new Date(dateVal);
    return !isNaN(originalParsed.getTime()) ? originalParsed : fallback;
  } catch (e) {
    console.warn('[safeParseDate] Failed to parse:', dateVal, e);
    return fallback;
  }
};

/**
 * Safe wrapper for localStorage to handle Safari Private Mode errors.
 */
/**
 * Smart Back Navigation
 * Tracks in-app navigation so back buttons return to the actual previous
 * page the user came from, instead of a hard-coded destination.
 */
const navStack = [];
const MAX_NAV_STACK = 60;

export const trackNavigation = (path) => {
  if (!path) return;
  const clean = String(path).split('?')[0].replace(/\/+$/, '') || '/';
  if (navStack[navStack.length - 1] !== clean) {
    navStack.push(clean);
    if (navStack.length > MAX_NAV_STACK) navStack.shift();
  }
};

export const goBackSmart = (navigate, fallback) => {
  if (navStack.length > 1) {
    navStack.pop();
    const previous = navStack.pop();
    navigate(previous || fallback);
  } else {
    navigate(fallback);
  }
};

export const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[safeStorage] Error getting ${key}:`, e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[safeStorage] Error setting ${key}:`, e);
      // Fail silently without crashing the app
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[safeStorage] Error removing ${key}:`, e);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('[safeStorage] Error clearing storage:', e);
    }
  }
};

/**
 * Robust Auth Token & Session Helpers
 */

/**
 * Checks whether a JWT token is expired based on its 'exp' claim.
 * @param {string} token
 * @returns {boolean} true if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const cleanToken = token.trim();
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      // If not standard 3-part JWT, do not prematurely expire
      return false;
    }
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed && typeof parsed.exp === 'number') {
      const nowSeconds = Math.floor(Date.now() / 1000);
      return parsed.exp < nowSeconds;
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const getAuthToken = () => {
  try {
    let token = safeStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      const userStr = safeStorage.getItem('currentUser') || safeStorage.getItem('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        token = parsed?.token || parsed?.accessToken || parsed?.result?.token;
      }
    }

    if (token && typeof token === 'string' && token !== 'null' && token !== 'undefined') {
      const clean = token.trim();
      if (clean !== '') {
        if (isTokenExpired(clean)) {
          console.warn('[getAuthToken] Token has expired. Clearing session.');
          clearAuthSession();
          return null;
        }
        return clean;
      }
    }
  } catch (e) {
    console.warn('[getAuthToken] Error reading token:', e);
  }
  return null;
};

export const setAuthSession = (token, user = {}) => {
  try {
    const cleanToken = (token && token !== 'null' && token !== 'undefined') ? String(token).trim() : '';
    if (cleanToken) {
      safeStorage.setItem('token', cleanToken);
    }
    safeStorage.removeItem('adminToken');
    safeStorage.removeItem('user');

    const existingUserStr = safeStorage.getItem('currentUser');
    let existingUser = {};
    if (existingUserStr) {
      try {
        existingUser = JSON.parse(existingUserStr) || {};
      } catch (e) {}
    }

    const mergedUser = {
      ...existingUser,
      ...user,
      token: cleanToken || user.token || existingUser.token || safeStorage.getItem('token') || ''
    };

    safeStorage.setItem('currentUser', JSON.stringify(mergedUser));
    return mergedUser;
  } catch (e) {
    console.error('[setAuthSession] Error setting session:', e);
    return user;
  }
};

export const clearAuthSession = () => {
  try {
    safeStorage.removeItem('token');
    safeStorage.removeItem('currentUser');
    safeStorage.removeItem('user');
    safeStorage.removeItem('adminToken');
  } catch (e) {
    console.warn('[clearAuthSession] Error clearing session:', e);
  }
};

export const getSavedUser = () => {
  try {
    const userStr = safeStorage.getItem('currentUser') || safeStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    const token = user?.token || safeStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      clearAuthSession();
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
};

