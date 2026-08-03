import { HiOutlineMenu } from "react-icons/hi";
import { LuScanQrCode } from "react-icons/lu";
import "../assets/CSS/Header.css";
import QRScannerModal from "./QRScanner/QRScannerModal";
import { useState } from "react";

const PROFILE_IMAGE_URL =
  "https://ui-avatars.com/api/?name=User&background=17a2b8&color=ffffff&bold=true";

export default function Header({ title = "Dashboard" }) {
  const [openScanner,setOpenScanner]=useState(false);
  const handleMenuClick = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  const handleScanQr = () => {
    console.log('hello');
    
    setOpenScanner(true);
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

          <div className="profileWrap">
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