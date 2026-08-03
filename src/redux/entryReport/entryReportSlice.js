import { createSlice } from "@reduxjs/toolkit";

import { getAllEntryReport, exportEntryReport } from "./entryReportThunk";

const initialState = {
  entryReports: [],
  pagination: null,

  loading: false,
  exportLoading: false,

  success: false,
  error: null,
  message: "",
};

const entryReportSlice = createSlice({
  name: "entryReport",

  initialState,

  reducers: {
    clearEntryReportState: (state) => {
      state.loading = false;
      state.exportLoading = false;
      state.success = false;
      state.error = null;
      state.message = "";
    },
  },

  extraReducers: (builder) => {
    // ================= GET ENTRY REPORT =================

    builder
      .addCase(getAllEntryReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllEntryReport.fulfilled, (state, action) => {
        state.loading = false;
        // Optional chaining — API response is always { data: { rows, pagination } }
        // but we guard defensively in case of an unexpected/empty payload.
        state.entryReports = action.payload?.data?.rows ?? [];
        state.pagination = action.payload?.data?.pagination ?? null;
        state.message = action.payload?.message ?? "";
      })
      .addCase(getAllEntryReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ================= EXPORT ENTRY REPORT =================

    builder
      .addCase(exportEntryReport.pending, (state) => {
        state.exportLoading = true;
        state.error = null;
      })
      .addCase(exportEntryReport.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportEntryReport.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEntryReportState } = entryReportSlice.actions;

export default entryReportSlice.reducer;
