import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const cancelBooking = (id, data) =>
    apiClient(ENDPOINTS.CANCELLATION.BOOKING_CANCEL(id), {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const getCancellationReasons = () =>
    apiClient(ENDPOINTS.CANCELLATION.GET_REASONS);
