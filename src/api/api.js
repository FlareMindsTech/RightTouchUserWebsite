const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:7372";

export const apiClient = async (endpoint, options = {}) => {

  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    },
    ...options
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
};