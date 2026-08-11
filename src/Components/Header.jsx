import { HiOutlineMenu, HiOutlineLogout } from "react-icons/hi";
import { LuScanQrCode } from "react-icons/lu";
import "../assets/CSS/Header.css";
import QRScannerModal from "./QRScanner/QRScannerModal";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {  clearAuth } from "../redux/auth/authSlice";
import Swal from "sweetalert2";

export default function Header({ title = "Dashboard" }) {
  const [openScanner, setOpenScanner] = useState(false);
  const profile = useSelector((state) => state.auth.profile);
  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Same current-user resolution pattern as Sidebar/ProtectedRoute:
  // prefer the live profile, fall back to the user cached at login.
  // Admin always sees the button (existing behavior preserved); a
  // Checker/User needs the "QR Pass" permission.
  const currentUser = profile || authUser;
  const role = currentUser?.role;
  const userPermissions = Array.isArray(currentUser?.permissions)
    ? currentUser.permissions
    : [];
  const canScanQr = role === "admin" || userPermissions.includes("QR Pass");

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

  const handleLogout = async () => {
    if (!token) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    // Only clear local auth state
    dispatch(clearAuth());

    // SPA navigation — NO refresh
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
          {canScanQr && (
            <button
              type="button"
              className="scanQrButton"
              onClick={handleScanQr}
            >
              <LuScanQrCode />
              <span>Scan QR</span>
            </button>
          )}

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