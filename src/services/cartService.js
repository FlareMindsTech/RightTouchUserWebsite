import { apiClient } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";

export const addToCart = (data) =>
  apiClient(ENDPOINTS.CART.ADD, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getMyCart = () =>
  apiClient(ENDPOINTS.CART.GET);

export const updateCartItem = (data) =>
  apiClient(ENDPOINTS.CART.UPDATE, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const checkout = (data) =>
  apiClient(ENDPOINTS.CART.CHECKOUT, {
    method: "POST",
    body: JSON.stringify(data)
  });