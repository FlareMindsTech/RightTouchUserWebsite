import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const getAvailableSlots = () =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.GET_SLOTS);

export const scheduleBooking = (data) =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.SCHEDULE, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const cancelBooking = (id, data) =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.CANCEL(id), {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const getCancelReasons = () =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.GET_REASONS);

export const getCustomerBookings = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `${ENDPOINTS.SERVICE_BOOKING.GET_CUSTOMER_BOOKINGS}?${query}` : ENDPOINTS.SERVICE_BOOKING.GET_CUSTOMER_BOOKINGS;
  return apiClient(endpoint);
};

export const getBookings = getCustomerBookings;

export const getCompletedServices = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `${ENDPOINTS.SERVICE_BOOKING.GET_COMPLETED}?${query}` : ENDPOINTS.SERVICE_BOOKING.GET_COMPLETED;
  return apiClient(endpoint);
};

export const bookAgain = (data) => {
  let payload = {};
  if (typeof data === "string") {
    payload = { bookingId: data, previousBookingId: data, id: data };
  } else if (data && typeof data === "object") {
    const id = data.previousBookingId || data.bookingId || data.id || data._id;
    payload = {
      ...data,
      previousBookingId: id,
      bookingId: id,
      id: id
    };
  }
  return apiClient(ENDPOINTS.SERVICE_BOOKING.BOOK_AGAIN, {
    method: "POST",
    body: JSON.stringify(payload)
  });
};

export const deleteAllBookings = () =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.DELETE_ALL, {
    method: "DELETE"
  });