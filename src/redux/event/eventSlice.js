import { createSlice } from "@reduxjs/toolkit";
import {
  createEvent,
  getEventById,
} from "./eventThunk";

const initialState = {
  event: null,

  loading: false,
  error: null,
  success: false,
  message: "",
};

const eventSlice = createSlice({
  name: "event",

  initialState,

  reducers: {
    clearEventState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },
  },

  extraReducers: (builder) => {
    // ================= CREATE EVENT =================
    builder
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        state.event = action.payload.data;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ================= GET EVENT =================
    builder
      .addCase(getEventById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.event = action.payload.data;
      })
      .addCase(getEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEventState } = eventSlice.actions;

export default eventSlice.reducer;