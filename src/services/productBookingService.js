import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const getAllProductBookings = () =>
    apiClient(ENDPOINTS.PRODUCT_BOOKING.GET_ALL);

export const updateProductBooking = (id, data) =>
    apiClient(ENDPOINTS.PRODUCT_BOOKING.UPDATE(id), {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const cancelProductBooking = (id, data) =>
    apiClient(ENDPOINTS.PRODUCT_BOOKING.CANCEL(id), {
        method: "PUT",
        body: JSON.stringify(data)
    });
