import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const getMyProfile = () =>
    apiClient(ENDPOINTS.USER.GET_MY_PROFILE);

export const completeProfile = (data) =>
    apiClient(ENDPOINTS.USER.COMPLETE_PROFILE, {
        method: "POST",
        body: JSON.stringify(data)
    });

export const updateProfile = (data) =>
    apiClient(ENDPOINTS.USER.UPDATE_PROFILE, {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const deleteMyAccount = () =>
    apiClient(ENDPOINTS.USER.DELETE_MY_ACCOUNT, {
        method: "DELETE"
    });
