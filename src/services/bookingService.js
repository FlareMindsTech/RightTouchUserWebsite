import { apiClient } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";

export const getBookings = () =>
  apiClient(ENDPOINTS.BOOKING.GET_ALL);

export const cancelBooking = (id, data) =>
  apiClient(`${ENDPOINTS.BOOKING.CANCEL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const getCustomerBookings = () =>
  apiClient(ENDPOINTS.BOOKING.CUSTOMER_BOOKINGS);