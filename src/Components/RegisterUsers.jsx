import React from "react";
import "../assets/CSS/RegisterUsers.css";

const members = [1, 2, 3, 4, 5];

function UploadPhotoPlaceholder() {
  return (
    <svg
      className="bookingRegister-avatarIcon"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4" fill="#ffffff" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="#ffffff" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="bookingRegister-editIcon"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 20l1-4 11-11 3 3-11 11-4 1z"
        fill="none"
        stroke="#3a3d4d"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const RegisterUsers = () => {
  return (
    <div className="bookingRegister-page">
      <div className="bookingRegister-hero">
        <h1 className="bookingRegister-title">
          Ticket
          <br />
          Registration <span className="bookingRegister-wave">&#128075;</span>
        </h1>
      </div>

      <div className="bookingRegister-grid">
        {members.map((member) => (
          <div className="bookingRegister-card" key={member}>
            <span className="bookingRegister-memberLabel">MEMBER {member}</span>

            <div className="bookingRegister-cardBody">
              <div className="bookingRegister-photoWrap">
                <span className="bookingRegister-photoCircle">
                  <UploadPhotoPlaceholder />
                </span>
                <button
                  type="button"
                  className="bookingRegister-editBtn"
                  aria-label="Upload photo"
                >
                  <EditIcon />
                </button>
              </div>

              <span className="bookingRegister-uploadText">upload photo</span>

              <div className="bookingRegister-fieldGroup">
                <input
                  type="text"
                  className="bookingRegister-input"
                  placeholder="Name"
                />
                <input
                  type="text"
                  className="bookingRegister-input"
                  placeholder="Mobile No."
                />
                <input
                  type="email"
                  className="bookingRegister-input"
                  placeholder="Email"
                />
              </div>

              <button type="button" className="bookingRegister-submitBtn">
                Submit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegisterUsers;
