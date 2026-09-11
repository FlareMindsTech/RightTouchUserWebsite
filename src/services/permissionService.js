import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const updatePermissions = (data) =>
  apiClient(ENDPOINTS.PERMISSION.UPDATE, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const getMyPermissions = () =>
  apiClient(ENDPOINTS.PERMISSION.GET_MINE);
