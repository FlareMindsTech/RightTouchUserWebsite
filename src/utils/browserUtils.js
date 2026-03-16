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
