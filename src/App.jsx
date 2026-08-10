import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { getProfile } from "./redux/auth/authSlice";

import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./Pages/Login";
import DashboardPage from "./Pages/DashboardPage";
import User from "./Pages/User";
import Role from "./Pages/Role";
import Permission from "./Pages/Permission";
import Event from "./Pages/Event";
import Booking from "./Pages/Booking";
import ViewBooking from "./Pages/ViewBooking";
import RegisterUsers from "./Components/RegisterUsers";
import EntryReport from "./Pages/EntryReport";
import CreateEvent from "./Pages/CreateEvent";
import ViewEvent from "./Pages/ViewEvent";
import TicketType from "./Components/TicketType";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from "./Pages/Profile";
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      dispatch(getProfile());
    }
  }, [dispatch]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      <BrowserRouter>
        <Routes>

          {/* Public Route */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/user" element={<User />} />
            <Route path="/role" element={<Role />} />
            <Route path="/permission" element={<Permission />} />
            <Route path="/event" element={<Event />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/view-event/:id" element={<ViewEvent />} />
            <Route path="/ticket-type/:eventId" element={<TicketType />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/view-booking/:id" element={<ViewBooking />} />
            <Route path="/register-users/:id" element={<RegisterUsers />} />
            <Route path="/entry-report" element={<EntryReport />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;