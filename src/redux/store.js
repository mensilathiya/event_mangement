import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import userReducer from './user/userSlice';
import eventReducer from './event/eventSlice';
export const store = configureStore({
    reducer:{
         auth:authReducer,
         user: userReducer,
             event: eventReducer,
    }

})