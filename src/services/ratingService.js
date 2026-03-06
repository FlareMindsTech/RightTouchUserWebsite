import { apiClient } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";

export const createRating = (data) =>
  apiClient(ENDPOINTS.RATING.CREATE, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getMyRatings = () =>
  apiClient(ENDPOINTS.RATING.GET_MY);

export const updateRating = (id, data) =>
  apiClient(`${ENDPOINTS.RATING.UPDATE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteRating = (id) =>
  apiClient(`${ENDPOINTS.RATING.DELETE}/${id}`, {
    method: "DELETE"
  });