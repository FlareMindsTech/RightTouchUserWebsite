import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const createQuoteRequest = (data) =>
  apiClient(ENDPOINTS.QUOTATION.CREATE_QUOTE_REQUEST, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const updateQuoteRequest = (id, data) =>
  apiClient(ENDPOINTS.QUOTATION.UPDATE_QUOTE_REQUEST(id), {
    method: "PATCH",
    body: JSON.stringify(data)
  });

export const listMyQuoteRequests = () =>
  apiClient(ENDPOINTS.QUOTATION.LIST_MY_QUOTE_REQUESTS);

export const getQuoteRequestById = (id) =>
  apiClient(ENDPOINTS.QUOTATION.GET_QUOTE_REQUEST_BY_ID(id));

export const cancelQuoteRequest = (id) =>
  apiClient(ENDPOINTS.QUOTATION.CANCEL_QUOTE_REQUEST(id), {
    method: "POST"
  });

export const listMyQuotations = () =>
  apiClient(ENDPOINTS.QUOTATION.LIST_MY_QUOTATIONS);

export const getQuotationById = (id) =>
  apiClient(ENDPOINTS.QUOTATION.GET_QUOTATION_BY_ID(id));

export const markQuotationViewed = (id) =>
  apiClient(ENDPOINTS.QUOTATION.MARK_VIEWED(id), {
    method: "POST"
  });

export const acceptQuotation = (id) =>
  apiClient(ENDPOINTS.QUOTATION.ACCEPT(id), {
    method: "POST"
  });

export const rejectQuotation = (id, data) =>
  apiClient(ENDPOINTS.QUOTATION.REJECT(id), {
    method: "POST",
    body: JSON.stringify(data)
  });

export const declineQuotation = (id, data) =>
  apiClient(ENDPOINTS.QUOTATION.DECLINE(id), {
    method: "POST",
    body: JSON.stringify(data)
  });

export const requestProductQuoteAlias = (data) =>
  apiClient(ENDPOINTS.QUOTATION.CREATE_QUOTE_REQUEST_ALIAS, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getProductBookings = () =>
  apiClient(ENDPOINTS.QUOTATION.LIST_PRODUCT_BOOKINGS);

export const getProductBookingById = (id) =>
  apiClient(ENDPOINTS.QUOTATION.GET_PRODUCT_BOOKING_BY_ID(id));

