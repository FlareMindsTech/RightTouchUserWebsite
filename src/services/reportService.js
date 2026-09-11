import { apiClient } from "../api/api";
import { ENDPOINTS } from "../api/endpoints";

export const createReport = (data) =>
  apiClient(ENDPOINTS.REPORT.CREATE, {
    method: "POST",
    body: JSON.stringify(data)
  });

export const getMyReports = () =>
  apiClient(ENDPOINTS.REPORT.GET_MINE);

export const getReportById = (id) =>
  apiClient(ENDPOINTS.REPORT.GET_BY_ID(id));

export const getReportCategories = () =>
  apiClient(ENDPOINTS.REPORT.GET_CATEGORIES);

export const withdrawReport = (id, data = {}) =>
  apiClient(`/api/user/reports/${id}/withdraw`, {
    method: "POST",
    body: JSON.stringify(data)
  });
