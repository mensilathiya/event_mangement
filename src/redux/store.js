import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import userReducer from './user/userSlice';
import eventReducer from './event/eventSlice';
import ticketTypeReducer from "./ticketType/ticketTypeSlice";
import bookingReducer from '../redux/booking/bookingSlice';
import bookingTicketReducer from "./bookingTicket/bookingTicketSlice";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        event: eventReducer,
        ticketType: ticketTypeReducer,
        booking: bookingReducer,
        bookingTicket: bookingTicketReducer,
    }

})