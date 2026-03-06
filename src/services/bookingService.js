import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const getBookings = () =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.GET_ALL);

export const cancelBooking = (id, data) =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.CANCEL(id), {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const getCustomerBookings = () =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.GET_CUSTOMER_BOOKINGS);

export const getBookingSchedule = () =>
  apiClient(ENDPOINTS.SERVICE_BOOKING.GET_SCHEDULE);