import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const createAddress = (data) =>
  apiClient(ENDPOINTS.ADDRESS.CREATE, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getMyAddresses = () =>
  apiClient(ENDPOINTS.ADDRESS.GET_ALL);

export const updateAddress = (data) =>
  apiClient(ENDPOINTS.ADDRESS.UPDATE, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteAddress = (data) =>
  apiClient(ENDPOINTS.ADDRESS.DELETE, {
    method: "DELETE",
    body: JSON.stringify(data)
  });

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

const fetchNominatim = async (path, params) => {
  const query = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    "accept-language": "en",
    ...params
  });
  const response = await fetch(`${NOMINATIM_BASE}${path}?${query.toString()}`, {
    headers: {
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`OpenStreetMap error: ${response.status}`);
  }
  return response.json();
};

export const searchAddress = async (query) => {
  const result = await fetchNominatim("/search", {
    q: query,
    limit: "6"
  });
  return { result: Array.isArray(result) ? result : [] };
};

export const reverseNominatim = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 
        Accept: "application/json" 
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
    const result = await res.json();
    const addr = result?.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      addr.state_district ||
      addr.suburb ||
      "";
    const state = addr.state || addr.state_district || "";
    const pincode = addr.postcode || "";
    const country = addr.country || "";

    const landmark = addr.amenity || addr.building || addr.shop || "";
    const houseNo = addr.house_number ? `No. ${addr.house_number}` : "";
    const road = addr.road || addr.street || "";
    const area = addr.suburb || addr.neighbourhood || addr.residential || "";
    const cleanCity = addr.city || addr.town || addr.village || addr.municipality || "";
    const cleanState = addr.state || "";
    const cleanPincode = addr.postcode || "";

    // Build deduplicated parts
    const rawParts = [landmark, houseNo, road, area, cleanCity, cleanState, cleanPincode];
    const parts = rawParts
      .filter(Boolean)
      .map((p) => p.trim())
      .filter((item, pos, arr) => arr.indexOf(item) === pos);

    let addressLine = parts.join(", ");
    if (!addressLine || addressLine.length < 8) {
      addressLine = result?.display_name || "";
    }

    if (!addressLine && !cleanCity) throw new Error("Nominatim returned empty location");

    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      addressLine,
<<<<<<< HEAD
      displayName: result?.display_name || addressLine,
      houseNumber: addr.house_number ? `No. ${addr.house_number}` : "",
      road: addr.road || "",
      neighbourhood: addr.neighbourhood || addr.suburb || addr.residential || "",
      city,
      state,
      pincode,
      country,
      raw: result,
      source: "openstreetmap"
=======
<<<<<<< HEAD
      city: cleanCity || city,
      state: cleanState || state,
      pincode: cleanPincode || pincode
>>>>>>> 3c3daefb95ede1effd0d5bd0eae5984974c9538b
=======
      landmark,
      city: cleanCity || city,
      state: cleanState || state,
      pincode: cleanPincode || pincode
>>>>>>> origin/bharath
>>>>>>> origin/vicky
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

const reverseBigDataCloud = async (lat, lng) => {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BigDataCloud error ${res.status}`);
  const data = await res.json();

  const city = data.city || data.locality || (data.localityInfo?.administrative || []).find((a) => a.order === 4)?.name || "";
  const state = data.principalSubdivision || (data.localityInfo?.administrative || []).find((a) => a.order === 3)?.name || "";
  const pincode = data.postcode || "";

  const informative = (data.localityInfo?.informative || []).map((i) => i.name).filter(Boolean);
  const administrative = (data.localityInfo?.administrative || []).map((a) => a.name).filter(Boolean);
  const areaName = data.locality || informative[0] || administrative[0] || "";

  const addressParts = [
    areaName && areaName !== city ? areaName : "",
    city,
    state,
    pincode
  ].filter(Boolean);

  const addressLine = addressParts.join(", ") || [city, state, pincode].filter(Boolean).join(", ");

  return {
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    addressLine: addressLine || `Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
    landmark: areaName && areaName !== city ? areaName : "",
    city,
    state,
    pincode
  };
};

const reversePhoton = async (lat, lng) => {
  const url = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Photon error ${res.status}`);
  const data = await res.json();
  const props = data?.features?.[0]?.properties;
  if (!props) throw new Error("Photon returned empty location");

  const city = props.city || props.county || props.state || "";
  const state = props.state || "";
  const pincode = props.postcode || "";
  const locality = props.locality || props.district || "";

  const addressLine = [locality, city, state, pincode].filter(Boolean).join(", ");

  return {
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    addressLine,
    landmark: props.name || locality || "",
    city,
    state,
    pincode
  };
};

export const reverseAddress = async (lat, lng) => {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  // 1. Try Nominatim jsonv2 first for maximum detail (house number, road, area, pincode)
  try {
    return await reverseNominatim(numLat, numLng);
  } catch (err1) {
    console.warn("Nominatim reverse geocode failed, trying BigDataCloud:", err1);
    // 2. Fallback to BigDataCloud (fast, CORS enabled)
    try {
      return await reverseBigDataCloud(numLat, numLng);
    } catch (err2) {
      console.warn("BigDataCloud reverse geocode failed, trying Photon:", err2);
      // 3. Fallback to Photon
      try {
        return await reversePhoton(numLat, numLng);
      } catch (err3) {
        console.warn("Photon reverse geocode failed:", err3);
        return {
          latitude: numLat,
          longitude: numLng,
          addressLine: `Location (${Number(numLat).toFixed(4)}, ${Number(numLng).toFixed(4)})`,
          landmark: "",
          city: "",
          state: "",
          pincode: ""
        };
      }
    }
  }
};

const IP_PROVIDERS = [
  {
    url: "https://ipwho.is/",
    parse: (d) =>
      d && d.success !== false && d.latitude && d.longitude
        ? {
            latitude: parseFloat(d.latitude),
            longitude: parseFloat(d.longitude),
            city: d.city || "",
            state: d.region || d.region_code || "",
            pincode: d.postal || "",
            isIpFallback: true
          }
        : null
  },
  {
    url: "https://ipinfo.io/json",
    parse: (d) => {
      if (!d || !d.loc) return null;
      const [latitude, longitude] = d.loc.split(",").map((n) => parseFloat(n.trim()));
      return {
        latitude,
        longitude,
        city: d.city || "",
        state: d.region || "",
        pincode: d.postal || "",
        isIpFallback: true
      };
    }
  },
  {
    url: "https://get.geojs.io/v1/ip/geo.json",
    parse: (d) =>
      d && d.latitude && d.longitude
        ? {
            latitude: parseFloat(d.latitude),
            longitude: parseFloat(d.longitude),
            city: d.city || "",
            state: d.region || "",
            pincode: d.postal_code || d.postal || "",
            isIpFallback: true
          }
        : null
  },
  {
    url: "https://ipapi.co/json/",
    parse: (d) =>
      d && !d.error && d.latitude && d.longitude
        ? {
            latitude: parseFloat(d.latitude),
            longitude: parseFloat(d.longitude),
            city: d.city || "",
            state: d.region || "",
            pincode: d.postal || "",
            isIpFallback: true
          }
        : null
  }
];

// Fallback to IP-based location if browser GPS fails or is unavailable
export const fetchIpLocation = async () => {
  for (const provider of IP_PROVIDERS) {
    try {
      const res = await fetch(provider.url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = provider.parse(data);
      if (parsed && parsed.latitude && parsed.longitude) {
        return parsed;
      }
    } catch (e) {
      console.warn("IP location provider failed:", provider.url, e);
    }
  }
  throw new Error("Unable to fetch location via IP fallback");
};

/**
 * Gets the user's precise live GPS location with graceful fallback.
 */
export const getCurrentUserLocation = async (options = {}) => {
  const tryFallback = async () => {
    try {
      const ipLoc = await fetchIpLocation();
      if (ipLoc) return ipLoc;
    } catch (ipErr) {
      console.warn("IP location fallback failed:", ipErr);
    }
    throw new Error("Unable to detect location. Please check browser location permissions or enter address manually.");
  };

  if (!navigator.geolocation) {
    return tryFallback();
  }

  return new Promise((resolve, reject) => {
    let bestPosition = null;
    let watchId = null;
    let timerId = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    const targetAccuracy = options.targetAccuracy || 30; // 30 meters
    const maxWaitTime = options.timeout || 7000;

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const accuracy = pos.coords.accuracy || 9999;
          if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }

          if (accuracy <= targetAccuracy) {
            cleanup();
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
          }
        },
        async (err) => {
          cleanup();
          try {
            const fallback = await tryFallback();
            resolve(fallback);
          } catch (e) {
            reject(e);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );

      timerId = setTimeout(async () => {
        cleanup();
        if (bestPosition) {
          resolve({
            latitude: bestPosition.coords.latitude,
            longitude: bestPosition.coords.longitude,
            accuracy: bestPosition.coords.accuracy
          });
        } else {
          try {
            const fallback = await tryFallback();
            resolve(fallback);
          } catch (e) {
            reject(e);
          }
        }
      }, maxWaitTime);
    } catch (e) {
      cleanup();
      tryFallback().then(resolve).catch(reject);
    }
  });
};

/**
<<<<<<< HEAD
 * Convenience function to fetch the user's current GPS location coordinates
 * and resolve them into a detailed street address using OpenStreetMap Nominatim.
 */
export const fetchCurrentLocationAddress = async () => {
  const coords = await getCurrentUserLocation();
  const addressDetails = await reverseAddress(coords.latitude, coords.longitude);
  return {
    ...coords,
    ...addressDetails
  };
};

/**
 * Alias for fetchCurrentLocationAddress to fetch user address using OpenStreetMap.
 */
export const fetchUserAddress = fetchCurrentLocationAddress;

/**
 * Get address details from latitude and longitude coordinates.
 */
export const getAddressFromCoordinates = (lat, lng) => reverseAddress(lat, lng);

=======
 * Continuous Live Location Tracker
 * Subscribes to live position updates as the user moves.
 * Returns an unsubscribe function to stop tracking.
 */
export const watchUserLiveLocation = (onLocationUpdate, onError, options = {}) => {
  if (!navigator.geolocation) {
    if (onError) onError(new Error("Geolocation not supported."));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (onLocationUpdate) {
        onLocationUpdate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp
        });
      }
    },
    (err) => {
      console.warn("Live location tracking error:", err);
      if (onError) onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
      ...options
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};
<<<<<<< HEAD
>>>>>>> 3c3daefb95ede1effd0d5bd0eae5984974c9538b
=======
>>>>>>> origin/bharath
>>>>>>> origin/vicky
