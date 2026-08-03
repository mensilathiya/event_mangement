import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  verifyQrApi,
  checkInQrApi,
} from "../../services/qrService";

/**
 * Extracts a clean, user-facing error message regardless of
 * whether the failure came from the server, a network drop,
 * or a timeout.
 */
const extractErrorMessage = (error, fallback) => {
  return (
    error.response?.data?.message ||
    error.message ||
    fallback
  );
};

// ================= VERIFY QR =================
export const verifyQr = createAsyncThunk(
  "qr/verifyQr",
  async (data, thunkAPI) => {
    try {
      return await verifyQrApi(data, { signal: thunkAPI.signal });
    } catch (error) {
      if (thunkAPI.signal.aborted) {
        return thunkAPI.rejectWithValue(null);
      }
      return thunkAPI.rejectWithValue(
        extractErrorMessage(error, "Failed to verify QR")
      );
    }
  },
  {
    // Prevent firing a second verify request while one is already in-flight
    condition: (_data, { getState }) => {
      const { qr } = getState();
      if (qr?.verify?.loading) return false;
      return true;
    },
  }
);

// ================= CHECK-IN QR =================
export const checkInQr = createAsyncThunk(
  "qr/checkInQr",
  async (data, thunkAPI) => {
    try {
      return await checkInQrApi(data, { signal: thunkAPI.signal });
    } catch (error) {
      if (thunkAPI.signal.aborted) {
        return thunkAPI.rejectWithValue(null);
      }
      return thunkAPI.rejectWithValue(
        extractErrorMessage(error, "Failed to check-in QR")
      );
    }
  },
  {
    // Prevent double check-in taps from firing duplicate requests
    condition: (_data, { getState }) => {
      const { qr } = getState();
      if (qr?.checkIn?.loading) return false;
      return true;
    },
  }
);
