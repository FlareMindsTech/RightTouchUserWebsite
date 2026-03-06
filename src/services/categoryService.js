import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

/**
 * Get all categories
 * @param {Object} params - Query parameters
 * @param {string} params.categoryType - Must be 'service' or 'product'
 */
export const getAllCategories = (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiClient(`${ENDPOINTS.CATEGORY.GET_ALL}${query}`);
};

export const getCategoryById = (id) =>
    apiClient(ENDPOINTS.CATEGORY.GET_BY_ID(id));
