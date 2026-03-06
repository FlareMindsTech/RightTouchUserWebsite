import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const getAllCategories = () =>
    apiClient(ENDPOINTS.CATEGORY.GET_ALL);

export const getCategoryById = (id) =>
    apiClient(ENDPOINTS.CATEGORY.GET_BY_ID(id));
