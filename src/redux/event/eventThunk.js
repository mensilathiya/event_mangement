import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createEventApi,
  getEventByIdApi,
} from "../../services/eventService";

// ================= CREATE EVENT =================
export const createEvent = createAsyncThunk(
  "event/createEvent",
  async (data, thunkAPI) => {
    try {
      const response = await createEventApi(data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create event"
      );
    }
  }
);

// ================= GET EVENT BY ID =================
export const getEventById = createAsyncThunk(
  "event/getEventById",
  async (id, thunkAPI) => {
    try {
      const response = await getEventByIdApi(id);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch event"
      );
    }
  }
);