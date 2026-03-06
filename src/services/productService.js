import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const getAllProducts = () =>
    apiClient(ENDPOINTS.PRODUCT.GET_ALL);

export const getProductById = (id) =>
    apiClient(ENDPOINTS.PRODUCT.GET_ONE(id));
