import { createSlice } from "@reduxjs/toolkit";

import { getAllEntryReport, exportEntryReport } from "./entryReportThunk";

const initialState = {
  entryReports: [],
  pagination: null,
  event: null,

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

      // Previously this action only cleared transient loading/error flags.
      // It was not dispatched anywhere in the codebase, so widening it to
      // also reset the fetched report data is safe. EntryReport.jsx now
      // dispatches this when the active event disappears (goes
      // Inactive/Expired) while the user is on the page, so the old
      // event's rows/pagination don't linger on screen looking valid.
      state.entryReports = [];
      state.pagination = null;
      state.event = null;
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

        state.entryReports = action.payload?.data?.rows ?? [];
        state.pagination = action.payload?.data?.pagination ?? null;
        state.event = action.payload?.data?.event ?? null;

        state.success = action.payload?.success ?? false;
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