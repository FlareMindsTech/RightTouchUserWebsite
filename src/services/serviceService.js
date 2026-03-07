import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

/**
 * Get all services with optional filters
 * @param {Object} params - Query parameters (categoryId, search, page, limit)
 */
export const getAllServices = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return apiClient(`${ENDPOINTS.SERVICE.GET_ALL}${query}`);
};

/**
 * Get single service details by ID
 */
export const getServiceById = (id) =>
  apiClient(ENDPOINTS.SERVICE.GET_BY_ID(id));