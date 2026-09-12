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

const reverseNominatim = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
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
      latitude: lat,
      longitude: lng,
      addressLine,
      city: cleanCity || city,
      state: cleanState || state,
      pincode: cleanPincode || pincode
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
    latitude: lat,
    longitude: lng,
    addressLine: addressLine || `Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
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
    latitude: lat,
    longitude: lng,
    addressLine,
    city,
    state,
    pincode
  };
};

export const reverseAddress = async (lat, lng) => {
  // 1. Try Nominatim jsonv2 first for maximum detail (house number, road, area, pincode)
  try {
    return await reverseNominatim(lat, lng);
  } catch (err1) {
    console.warn("Nominatim reverse geocode failed, trying Photon:", err1);
    // 2. Fallback to Photon (komoot) - free, CORS enabled, no API key
    try {
      return await reversePhoton(lat, lng);
    } catch (err2) {
      console.warn("Photon reverse geocode failed, trying BigDataCloud:", err2);
      // 3. Fallback to BigDataCloud
      try {
        return await reverseBigDataCloud(lat, lng);
      } catch (err3) {
        console.warn("BigDataCloud reverse geocode failed:", err3);
        return {
          latitude: lat,
          longitude: lng,
          addressLine: `Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
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
            latitude: d.latitude,
            longitude: d.longitude,
            city: d.city || "",
            state: d.region || d.region_code || "",
            pincode: d.postal || ""
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
        pincode: d.postal || ""
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
            pincode: d.postal_code || d.postal || ""
          }
        : null
  },
  {
    url: "https://ipapi.co/json/",
    parse: (d) =>
      d && !d.error && d.latitude && d.longitude
        ? {
            latitude: d.latitude,
            longitude: d.longitude,
            city: d.city || "",
            state: d.region || "",
            pincode: d.postal || ""
          }
        : null
  }
];

// Fallback to IP-based location if browser GPS fails or is unavailable
const fetchIpLocation = async () => {
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
 * Gets the user's precise live GPS location.
 * Uses watchPosition with enableHighAccuracy: true to wait for true satellite GPS lock (<30m accuracy).
 */
export const getCurrentUserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    // 1. Check if browser supports Geolocation API
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser."));
    }

    // 2. Check if running on an insecure origin (e.g. http://192.168.x.x)
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !isLocalhost) {
      console.warn("Live Geolocation requires HTTPS or localhost. Current origin:", window.location.origin);
    }

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
    const maxWaitTime = options.timeout || 8000; // 8 seconds to get GPS lock

    // Start watchPosition for true live GPS fix
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const accuracy = pos.coords.accuracy || 9999;
          console.log(
            `[Live GPS Fix] Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}, Accuracy: ±${Math.round(accuracy)}m`
          );

          if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }

          // If we achieved high precision (<30m), lock in immediately
          if (accuracy <= targetAccuracy) {
            cleanup();
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
          }
        },
        (err) => {
          console.warn("[GPS Watch Error]:", err.message);
          // If permission explicitly denied, stop immediately
          if (err.code === 1) {
            cleanup();
            let msg = "Location permission denied. Please allow location access in your browser settings.";
            if (!window.isSecureContext && !isLocalhost) {
              msg = "Live GPS is blocked on insecure HTTP (192.168.x.x). Please access via http://localhost:3000 or HTTPS.";
            }
            return reject(new Error(msg));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Do NOT accept stale cached coordinates
        }
      );

      // Timeout after maxWaitTime: resolve with best live fix obtained, or fail
      timerId = setTimeout(() => {
        cleanup();
        if (bestPosition) {
          resolve({
            latitude: bestPosition.coords.latitude,
            longitude: bestPosition.coords.longitude,
            accuracy: bestPosition.coords.accuracy
          });
        } else {
          // Fallback to one-shot attempt
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
            },
            (err) => {
              let msg = "Unable to get live GPS location. Please enter your address or area manually.";
              if (err.code === 1) {
                msg = "Location permission denied. Please enable location access in browser settings.";
              }
              reject(new Error(msg));
            },
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
          );
        }
      }, maxWaitTime);
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
};

/**
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
