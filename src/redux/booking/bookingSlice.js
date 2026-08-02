import { createSlice } from "@reduxjs/toolkit";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  deleteBooking,
} from "./bookingThunk";

const initialState = {
  booking: null,
  bookings: [],

  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,

  loading: false,
  error: null,
  success: false,
  message: "",
};

const bookingSlice = createSlice({
  name: "booking",

  initialState,

  reducers: {
    clearBookingState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = "";
    },

    clearBookingDetails: (state) => {
      state.booking = null;
    },
  },

  extraReducers: (builder) => {
    // ================= CREATE =================
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        state.booking = action.payload.data;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ================= GET ALL =================
    builder
      .addCase(getAllBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBookings.fulfilled, (state, action) => {
        state.bookings = action.payload.data;

        state.total = action.payload.pagination.total;
        state.page = action.payload.pagination.page;
        state.limit = action.payload.pagination.limit;
        state.totalPages = action.payload.pagination.totalPages;

        state.error = null;
      })
      .addCase(getAllBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ================= GET BY ID =================
    builder
      .addCase(getBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.booking = action.payload.data;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ================= DELETE =================
    builder
      .addCase(deleteBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;

        state.bookings = state.bookings.filter(
          (booking) => booking._id !== action.meta.arg.id
        );
      })
      .addCase(deleteBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBookingState, clearBookingDetails } =
  bookingSlice.actions;

export default bookingSlice.reducer;