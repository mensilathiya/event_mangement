import { useState } from "react";
import { HiOutlinePencil, HiOutlineX, HiOutlineUser } from "react-icons/hi";
import "../assets/CSS/Profile.css";

export default function EditProfileModal({ user, onClose, onSave }) {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
  };

  const handleSave = () => {
    onSave({ fullName, email, avatar });
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <h2 className="modalTitle">Edit User</h2>

        <div className="modalInnerCard">
          <h3 className="modalInnerTitle">Profile Details</h3>

          <div className="modalFormGrid">
            <div className="modalFormRow">
              <label>Profile</label>
              <div className="avatarEditWrap">
                <div className="avatarEditImage">
                  {avatar && <img src={avatar} alt="Profile" />}
                  <label className="avatarEditPencil" htmlFor="avatarUpload">
                    <HiOutlinePencil />
                  </label>
                  <input
                    id="avatarUpload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleAvatarChange}
                    hidden
                  />
                  {avatar && (
                    <button
                      type="button"
                      className="avatarEditRemove"
                      onClick={handleRemoveAvatar}
                      aria-label="Remove photo"
                    >
                      <HiOutlineX />
                    </button>
                  )}
                </div>
                <p className="avatarHint">Allowed file types: png, jpg, jpeg.</p>
              </div>
            </div>

            <div className="modalFormRow">
              <label>
                Full Name <span className="requiredStar">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="modalInput"
              />
            </div>

            <div className="modalFormRow">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modalInput"
              />
            </div>

            <div className="modalFormRow">
              <label>
                Role <HiOutlineUser className="roleIcon" />
              </label>
              <span className="roleValue">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="modalActions">
          <button type="button" className="primaryButton" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
