import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const createRating = (data) =>
  apiClient(ENDPOINTS.RATING.CREATE, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getMyRatings = () =>
  apiClient(ENDPOINTS.RATING.GET_MY_RATINGS);

export const updateRating = (id, data) =>
  apiClient(ENDPOINTS.RATING.UPDATE(id), {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteRating = (id) =>
  apiClient(ENDPOINTS.RATING.DELETE(id), {
    method: "DELETE"
  });

export const getRatingById = (id) =>
  apiClient(ENDPOINTS.RATING.GET_BY_ID(id));