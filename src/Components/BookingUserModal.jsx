import { FaTimes, FaPencilAlt, FaUser } from "react-icons/fa";
import "../assets/CSS/BookingUserModal.css";

export default function BookingUserModal({ onClose }) {
  return (
    <div className="bookingUserOverlay" onClick={onClose}>
      <div className="bookingUserContainer" onClick={(e) => e.stopPropagation()}>
        <div className="bookingUserHeader">
          <h2 className="bookingUserTitle">Book User</h2>
          <button
            type="button"
            className="bookingUserCloseIconButton"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="bookingUserProfileSection">
          <span className="bookingUserProfileLabel">Profile</span>

          <div className="bookingUserPhotoBlock">
            <div className="bookingUserPhotoCircleWrap">
              <div className="bookingUserPhotoCircle">
                <FaUser className="bookingUserAvatarIcon" />
              </div>
              <button
                type="button"
                className="bookingUserEditPhotoButton"
                aria-label="Upload photo"
              >
                <FaPencilAlt />
              </button>
              <button
                type="button"
                className="bookingUserRemovePhotoButton"
                aria-label="Remove photo"
              >
                <FaTimes />
              </button>
            </div>
            <p className="bookingUserPhotoHint">Allowed file types: png, jpg, jpeg.</p>
          </div>
        </div>

        <div className="bookingUserGrid">
          <div className="bookingUserFieldGroup">
            <label className="bookingUserLabel">
              Name <span className="bookingUserRequired">*</span>
            </label>
            <input type="text" className="bookingUserInput" placeholder="Name" />
          </div>

          <div className="bookingUserFieldGroup">
            <label className="bookingUserLabel">
              Mobile Number <span className="bookingUserRequired">*</span>
            </label>
            <input type="text" className="bookingUserInput" placeholder="Mobile Number" />
          </div>

          <div className="bookingUserFieldGroup bookingUserFullRow">
            <label className="bookingUserLabel">Email Id</label>
            <input type="email" className="bookingUserInput" placeholder="Email Id" />
          </div>
        </div>

        <div className="bookingUserFooter">
          <button type="button" className="bookingUserCloseButton" onClick={onClose}>
            Close
          </button>
          <button type="button" className="bookingUserCreateButton">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
