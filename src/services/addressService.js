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
  const response = await apiClient(`${ENDPOINTS.ADDRESS.SEARCH}?q=${encodeURIComponent(query)}`);
  const result = response?.result;
  return { result: Array.isArray(result) ? result : (result ? [result] : []) };
};

export const reverseAddress = async (lat, lng) => {
  return apiClient(`${ENDPOINTS.ADDRESS.REVERSE}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
};