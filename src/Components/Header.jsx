import { HiOutlineMenu } from "react-icons/hi";
import "../assets/CSS/Header.css";

const PROFILE_IMAGE_URL = "https://ui-avatars.com/api/?name=User&background=17a2b8&color=ffffff&bold=true";

export default function Header({ title = "Dashboard" }) {
  const handleMenuClick = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  return (
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

      <div className="profileWrap">
        <img src={PROFILE_IMAGE_URL} alt="User profile" className="profileImage" />
      </div>
    </header>
  );
}
