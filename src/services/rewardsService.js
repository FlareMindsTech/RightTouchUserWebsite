import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

/**
 * Fetch customer rewards wallet balance
 * @param {Object} params - Query params (page, limit)
 */
export const getRewardsBalance = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `${ENDPOINTS.REWARDS.GET_BALANCE}?${query}` : ENDPOINTS.REWARDS.GET_BALANCE;
  return apiClient(endpoint);
};

/**
 * Fetch customer rewards wallet transaction history
 * @param {Object} params - Query params (page, limit)
 */
export const getRewardsHistory = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `${ENDPOINTS.REWARDS.GET_HISTORY}?${query}` : ENDPOINTS.REWARDS.GET_HISTORY;
  return apiClient(endpoint);
};

/**
 * Reconcile rewards wallet balance with backend ledger
 */
export const reconcileRewards = () =>
  apiClient(ENDPOINTS.REWARDS.RECONCILE);
