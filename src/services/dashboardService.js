import api from "../api/axios";

// Get Dashboard Summary
export const getDashboardSummaryApi = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};
