import { HiOutlineMenu, HiOutlineLogout } from "react-icons/hi";
import { LuScanQrCode } from "react-icons/lu";
import "../assets/CSS/Header.css";
import QRScannerModal from "./QRScanner/QRScannerModal";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, clearAuth } from "../redux/auth/authSlice";

export default function Header({ title = "Dashboard" }) {
  const [openScanner, setOpenScanner] = useState(false);
  const profile = useSelector((state) => state.auth.profile);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleMenuClick = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  const handleScanQr = () => {
    console.log('hello');

    setOpenScanner(true);
  };

  const PROFILE_IMAGE_URL =
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.name || "Admin"
    )}&background=17a2b8&color=ffffff&bold=true`;

  const handleLogout = () => {
    if (!token) return; // already logged out / guards a double click

    // Local logout is instant and synchronous — the user is logged out
    // and can navigate immediately, with no wait on the network.
    // The backend call is fired alongside it as a best-effort
    // notification only; the UI never awaits it, since the backend's
    // JWT logout is stateless and doesn't need to complete for the
    // user to be safely logged out on this device.
    dispatch(logout());
    dispatch(clearAuth());
    navigate("/", { replace: true });
  };

  return (
    <>
      <header className="header">
        <button
          type="button"
          className="hamburgerButton"
          onClick={handleMenuClick}
          aria-label="Open sidebar"
        >
          <HiOutlineMenu />
        </button>

        <span className="pageTitle">{title}</span>

        <div className="headerRight">
          <button
            type="button"
            className="scanQrButton"
            onClick={handleScanQr}
          >
            <LuScanQrCode />
            <span>Scan QR</span>
          </button>

          <button
            type="button"
            className="logoutButton"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <HiOutlineLogout />
          </button>

          <div
            onClick={() => navigate("/profile")}
            className="profileWrap"
          >
            <img
              src={PROFILE_IMAGE_URL}
              alt="User profile"
              className="profileImage"
            />
          </div>
        </div>
      </header>
      {/* // qr scanner */}
      <QRScannerModal
        isOpen={openScanner}
        onClose={() => setOpenScanner(false)}
      />
    </>
  );
}