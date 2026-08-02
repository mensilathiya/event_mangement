import { createSlice } from "@reduxjs/toolkit";
import {
  createEvent,
  getEventById,
  getAllEvents,
  changeEventStatus,
} from "./eventThunk";

const initialState = {
  event: null,
  events: [],

  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,

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
    // ================= GET ALL EVENTS =================
    builder
      .addCase(getAllEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllEvents.fulfilled, (state, action) => {
        state.loading = false;

        state.events = action.payload.data;

        state.total = action.payload.pagination.total;
        state.page = action.payload.pagination.page;
        state.limit = action.payload.pagination.limit;
        state.totalPages = action.payload.pagination.totalPages;
      })
      .addCase(getAllEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ================= CHANGE EVENT STATUS =================
    builder
      .addCase(changeEventStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(changeEventStatus.fulfilled, (state, action) => {
        state.loading = false;

        state.events = state.events.map((event) =>
          event._id === action.payload.data._id
            ? action.payload.data
            : event
        );
      })
      .addCase(changeEventStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEventState } = eventSlice.actions;

export default eventSlice.reducer;