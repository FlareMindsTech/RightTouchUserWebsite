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

export const searchAddress = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&accept-language=en`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'RightTouchApp/1.0 (vigneshubi24@gmail.com)' }
  });
  if (!response.ok) throw new Error('Failed to fetch address');
  const data = await response.json();
  return { result: data };
};

export const reverseAddress = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'RightTouchApp/1.0 (vigneshubi24@gmail.com)' }
  });
  if (!response.ok) throw new Error('Failed to reverse geocode');
  const data = await response.json();
  return { result: data };
};