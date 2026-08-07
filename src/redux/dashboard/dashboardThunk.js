import { createAsyncThunk } from "@reduxjs/toolkit";
import { getDashboardSummaryApi } from "../../services/dashboardService";

// ================= GET DASHBOARD SUMMARY =================
export const getDashboardSummary = createAsyncThunk(
  "dashboard/getDashboardSummary",
  async (_, thunkAPI) => {
    try {
      return await getDashboardSummaryApi();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard summary"
      );
    }
  }
);
