import { useState } from "react";
import { HiOutlineUser, HiOutlineMail, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

import DashboardLayout from "../Components/DashboardLayout";
import EditProfileModal from "../Components/EditProfileModal";
import "../assets/CSS/Profile.css";

// Reusing the same placeholder-avatar convention already used in Header.jsx
const PROFILE_IMAGE_URL =
  "https://ui-avatars.com/api/?name=Shailesh+Savani&background=17a2b8&color=ffffff&bold=true";

export default function Profile() {
  const [user, setUser] = useState({
    fullName: "Shailesh Savani",
    email: "",
    role: "admin",
    avatar: PROFILE_IMAGE_URL,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleSaveProfile = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
    setIsEditOpen(false);
  };

  const handleCancelPasswordReset = () => {
    setIsResettingPassword(false);
  };

  return (
    <DashboardLayout title="Profile">
      {/* Breadcrumb */}
      <div className="profileBreadcrumbWrap">
        <h1 className="profilePageTitle">Profile</h1>
        <div className="profileBreadcrumb">
          <span>Dashboard</span>
          <span className="breadcrumbDivider">-</span>
          <span className="breadcrumbActive">Profile</span>
        </div>
      </div>

      {/* Profile summary */}
      <div className="profileSummary">
        <img src={user.avatar} alt={user.fullName} className="profileSummaryAvatar" />
        <div className="profileSummaryInfo">
          <h2 className="profileSummaryName">{user.fullName}</h2>
          <div className="profileSummaryMeta">
            <span className="metaItem">
              <HiOutlineUser />
              {user.role}
            </span>
            <span className="metaItem">
              <HiOutlineMail />
            </span>
          </div>
        </div>
      </div>

      {/* Profile Details card */}
      <section className="profileCard">
        <div className="profileCardHeader">
          <h3>Profile Details</h3>
          <button
            type="button"
            className="primaryButton"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Profile
          </button>
        </div>

        <div className="profileDetailsGrid">
          <div className="detailRow">
            <span className="detailLabel">Full Name</span>
            <span className="detailValue">{user.fullName}</span>
          </div>
          <div className="detailRow">
            <span className="detailLabel">Email</span>
            <span className="detailValue">{user.email}</span>
          </div>
          <div className="detailRow">
            <span className="detailLabel">
              Role <HiOutlineUser className="detailLabelIcon" />
            </span>
            <span className="detailValue">{user.role}</span>
          </div>
        </div>
      </section>

      {/* Sign-in Method card */}
      <section className="profileCard">
        <div className="profileCardHeader">
          <h3>Sign-in Method</h3>
        </div>

        {!isResettingPassword ? (
          <div className="passwordRow">
            <div className="passwordInfo">
              <span className="detailLabel">Password</span>
              <span className="passwordMask">••••••••••••</span>
            </div>
            <button
              type="button"
              className="primaryButton"
              onClick={() => setIsResettingPassword(true)}
            >
              Reset Password
            </button>
          </div>
        ) : (
          <div className="passwordEditGrid">
            <div className="passwordField">
              <label>Current Password</label>
              <div className="passwordInputWrap">
                <input type={showCurrentPwd ? "text" : "password"} placeholder="Password" />
                <button
                  type="button"
                  className="pwdToggle"
                  onClick={() => setShowCurrentPwd((v) => !v)}
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
              <p className="passwordHint">
                Password must be at least 8 character and contain symbols
              </p>
            </div>

            <div className="passwordField">
              <label>New Password</label>
              <div className="passwordInputWrap">
                <input type={showNewPwd ? "text" : "password"} placeholder="Password" />
                <button
                  type="button"
                  className="pwdToggle"
                  onClick={() => setShowNewPwd((v) => !v)}
                  aria-label="Toggle new password visibility"
                >
                  {showNewPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <div className="passwordField">
              <label>Confirm New Password</label>
              <div className="passwordInputWrap">
                <input type={showConfirmPwd ? "text" : "password"} placeholder="Password" />
                <button
                  type="button"
                  className="pwdToggle"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <div className="passwordEditActions">
              <button type="button" className="primaryButton">
                Update Password
              </button>
              <button
                type="button"
                className="textButton"
                onClick={handleCancelPasswordReset}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="profileFooter">
        <span>2026 © Keenthemes</span>
        <div className="profileFooterLinks">
          <a href="#">About</a>
          <a href="#">Support</a>
          <a href="#">Purchase</a>
        </div>
      </footer>

      {isEditOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </DashboardLayout>
  );
}
