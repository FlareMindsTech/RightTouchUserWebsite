import { apiClient } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";

export const getAllServices = () =>
  apiClient(ENDPOINTS.SERVICE.GET_ALL);

export const getServiceById = (id) =>
  apiClient(`${ENDPOINTS.SERVICE.GET_BY_ID}/${id}`);