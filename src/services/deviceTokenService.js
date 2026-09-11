import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const registerDeviceToken = (data) =>
  apiClient(ENDPOINTS.DEVICE_TOKEN.REGISTER, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const unregisterDeviceToken = () =>
  apiClient(ENDPOINTS.DEVICE_TOKEN.UNREGISTER, {
    method: "DELETE"
  });
