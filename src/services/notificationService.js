import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const listNotifications = () =>
  apiClient(ENDPOINTS.NOTIFICATION.LIST);

export const getUnreadNotificationCount = () =>
  apiClient(ENDPOINTS.NOTIFICATION.UNREAD_COUNT);

export const markNotificationRead = (id) =>
  apiClient(ENDPOINTS.NOTIFICATION.MARK_READ(id), {
    method: "PATCH",
    body: JSON.stringify({})
  });

export const markAllNotificationsRead = () =>
  apiClient(ENDPOINTS.NOTIFICATION.MARK_ALL_READ, {
    method: "PATCH",
    body: JSON.stringify({})
  });

export const markNotificationReceived = (id) =>
  apiClient(ENDPOINTS.NOTIFICATION.MARK_RECEIVED(id), {
    method: "POST",
    body: JSON.stringify({})
  });

export const markNotificationOpened = (id) =>
  apiClient(ENDPOINTS.NOTIFICATION.MARK_OPENED(id), {
    method: "POST",
    body: JSON.stringify({})
  });
