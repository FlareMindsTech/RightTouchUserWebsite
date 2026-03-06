import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const createReport = (data) =>
    apiClient(ENDPOINTS.REPORT.CREATE, {
        method: "POST",
        body: JSON.stringify(data)
    });

export const getAllReports = () =>
    apiClient(ENDPOINTS.REPORT.GET_ALL);

export const getReportById = (id) =>
    apiClient(ENDPOINTS.REPORT.GET_BY_ID(id));
