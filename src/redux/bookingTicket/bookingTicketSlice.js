import { createSlice } from "@reduxjs/toolkit";
import {
  getRegisterUser,
  updateRegisterUser,
} from "./bookingTicketThunk";

const initialState = {
  registerUser: null,

  loading: false,
  success: false,
  error: null,
  message: "",
};

const bookingTicketSlice = createSlice({
  name: "bookingTicket",

  initialState,

  reducers: {
    clearBookingTicketState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = "";
    },

    clearRegisterUser: (state) => {
      state.registerUser = null;
    },
  },

  extraReducers: (builder) => {
    // ================= GET REGISTER USER =================
    builder
      .addCase(getRegisterUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRegisterUser.fulfilled, (state, action) => {
        state.loading = false;
        state.registerUser = action.payload.data;
      })
      .addCase(getRegisterUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ================= UPDATE REGISTER USER =================
    builder
      .addCase(updateRegisterUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRegisterUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        state.registerUser = action.payload.data;
      })
      .addCase(updateRegisterUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearBookingTicketState,
  clearRegisterUser,
} = bookingTicketSlice.actions;

export default bookingTicketSlice.reducer;