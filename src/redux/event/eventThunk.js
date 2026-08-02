import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createEventApi,
  getEventByIdApi,
  getAllEventsApi,
  changeEventStatusApi
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
// ================ GET ALL EVENT =================
export const getAllEvents = createAsyncThunk(
  "event/getAllEvents",
  async (params, thunkAPI) => {
    try {
      return await getAllEventsApi(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch events"
      );
    }
  }
);
// Change Event Status
export const changeEventStatus = createAsyncThunk(
  "event/changeEventStatus",
  async (id, thunkAPI) => {
    try {
      return await changeEventStatusApi(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to change status"
      );
    }
  }
);