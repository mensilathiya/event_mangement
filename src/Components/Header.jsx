import { HiOutlineMenu, HiOutlineLogout } from "react-icons/hi";
import { LuScanQrCode } from "react-icons/lu";
import "../assets/CSS/Header.css";
import QRScannerModal from "./QRScanner/QRScannerModal";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "../redux/auth/authSlice";
import Swal from "sweetalert2";

export default function Header({ title = "Dashboard" }) {
  const [openScanner, setOpenScanner] = useState(false);

  const profile = useSelector((state) => state.auth.profile);
  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Current logged-in user
  // Prefer profile API data, otherwise use login data
  const currentUser = profile || authUser;

  // Resolved per-field, not by picking `profile` OR `authUser` wholesale —
  // see the matching comment in Sidebar.jsx. If /auth/profile ever omits
  // role/permissions for a Checker while `authUser` (from login) still has
  // them, an all-or-nothing pick would silently blank both out.
  const role = profile?.role ?? authUser?.role;

  const userPermissions = Array.isArray(profile?.permissions)
    ? profile.permissions
    : Array.isArray(authUser?.permissions)
      ? authUser.permissions
      : [];

  // Admin can always scan.
  // Checker/User needs QR Pass permission.
  const canScanQr =
    role === "admin" || userPermissions.includes("QR Pass");

  // Checker's header is locked to the QR Scanner action only — the
  // profile image becomes display-only (no click, no navigation to
  // /profile) for this role. Logout is intentionally left available for
  // every role, Checker included, since there's otherwise no way to end
  // the session.
  const isChecker = role === "checker";
  // Open sidebar
  const handleMenuClick = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  // Open QR Scanner
  const handleScanQr = () => {
    setOpenScanner(true);
  };

  // Profile image
  const PROFILE_IMAGE_URL =
    currentUser?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      currentUser?.name || "User"
    )}&background=17a2b8&color=ffffff&bold=true`;

  // Logout
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

    // Clear local auth state
    dispatch(clearAuth());

    // Navigate without page refresh
    navigate("/", { replace: true });
  };

  return (
    <>
      <header className="header">
        {/* Hamburger */}
        <button
          type="button"
          className="hamburgerButton"
          onClick={handleMenuClick}
          aria-label="Open sidebar"
        >
          <HiOutlineMenu />
        </button>

        {/* Page Title */}
        <span className="pageTitle">{title}</span>

        <div className="headerRight">
          {/* Scan QR */}
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

          {/* Logout */}
          <button
            type="button"
            className="logoutButton"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <HiOutlineLogout />
          </button>

          {/* Profile — display-only for Checker: no click, no /profile nav */}
          <div
            onClick={() => navigate("/profile")}
            className="profileWrap"
            style={isChecker ? { cursor: "default" } : undefined}
            aria-disabled={isChecker || undefined}
          >
            <img
              src={PROFILE_IMAGE_URL}
              alt={currentUser?.name || "User profile"}
              className="profileImage"
            />
          </div>
        </div>
      </header>

      {/* QR Scanner */}
      <QRScannerModal
        isOpen={openScanner}
        onClose={() => setOpenScanner(false)}
      />
    </>
  );
}