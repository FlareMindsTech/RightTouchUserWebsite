import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const resolveZone = (data) =>
  apiClient(ENDPOINTS.ZONE.RESOLVE, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const checkServiceAvailability = (data) =>
  apiClient(ENDPOINTS.ZONE.CHECK_SERVICE, {
    method: "POST",
    body: JSON.stringify(data)
  });