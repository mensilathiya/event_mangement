import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  createBookingApi,
  getAllBookingsApi,
  getBookingByIdApi,
  deleteBookingApi,
} from "../../services/bookingService";

// ================= CREATE BOOKING =================
export const createBooking = createAsyncThunk(
  "booking/createBooking",
  async (data, thunkAPI) => {
    try {
      return await createBookingApi(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create booking"
      );
    }
  }
);

// ================= GET ALL BOOKINGS =================
export const getAllBookings = createAsyncThunk(
  "booking/getAllBookings",
  async (
    {
      page = 1,
      limit = 10,
      bookingId = "",
      mobileNumber = "",
      name = "",
      eventId = "",
      createdBy = "",
      status = "",
      fromDate = "",
      toDate = "",
    } = {},
    thunkAPI
  ) => {
    try {
      const response = await getAllBookingsApi({
        page,
        limit,
        bookingId,
        mobileNumber,
        name,
        eventId,
        createdBy,
        status,
        fromDate,
        toDate,
      });

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

// ================= GET BOOKING BY ID =================
export const getBookingById = createAsyncThunk(
  "booking/getBookingById",
  async (id, thunkAPI) => {
    try {
      return await getBookingByIdApi(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch booking"
      );
    }
  }
);

// ================= DELETE BOOKING =================
export const deleteBooking = createAsyncThunk(
  "booking/deleteBooking",
  async ({ id, remark }, thunkAPI) => {
    try {
      return await deleteBookingApi(id, { remark });
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete booking"
      );
    }
  }
);