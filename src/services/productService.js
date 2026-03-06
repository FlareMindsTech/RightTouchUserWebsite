import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

/**
 * Get all products with optional filters
 * @param {Object} params - Query parameters (categoryId, type, usageType, active, search, page, limit)
 */
export const getAllProducts = (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiClient(`${ENDPOINTS.PRODUCT.GET_ALL}${query}`);
};

/**
 * Get single product details by ID
 */
export const getProductById = (id) =>
    apiClient(ENDPOINTS.PRODUCT.GET_ONE(id));
