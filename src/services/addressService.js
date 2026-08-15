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

    const specificParts = [
      addr.amenity || addr.building,
      addr.house_number ? `No. ${addr.house_number}` : "",
      addr.road,
      addr.neighbourhood || addr.suburb || addr.residential
    ].filter(Boolean);

    let addressLine = "";
    if (specificParts.length > 0) {
      addressLine = [specificParts.join(", "), city, state, pincode].filter(Boolean).join(", ");
    }
    
    if (!addressLine || addressLine.length < 10) {
      addressLine = result?.display_name || "";
    }

    if (!addressLine && !city) throw new Error("Nominatim returned empty location");

    return {
      latitude: lat,
      longitude: lng,
      addressLine,
      city,
      state,
      pincode
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
 * Gets user current location coordinates using browser HTML5 Geolocation API (frontend).
 */
export const getCurrentUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      fetchIpLocation()
        .then(resolve)
        .catch(() => reject(new Error("Geolocation is not supported by your browser.")));
      return;
    }

    const highAccuracyOpts = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
    const lowAccuracyOpts = { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        console.warn("High-accuracy location attempt failed, trying low accuracy:", err.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          },
          (err2) => {
            console.warn("Low-accuracy location attempt failed, falling back to IP location:", err2.message);
            fetchIpLocation()
              .then(resolve)
              .catch(() => {
                let msg = "Unable to retrieve your location.";
                if (err.code === 1) {
                  msg = "Location access denied. Please enable location permissions in browser settings.";
                } else if (err.code === 3) {
                  msg = "Location request timed out. Please enter your address manually.";
                }
                reject(new Error(msg));
              });
          },
          lowAccuracyOpts
        );
      },
      highAccuracyOpts
    );
  });
};
