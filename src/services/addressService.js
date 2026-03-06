import { apiClient } from "../api/apiClient";
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