import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "../assets/CSS/RegisterUsers.css";
import { getBookingById } from "../redux/booking/bookingThunk";
import { updateRegisterUser } from "../redux/bookingTicket/bookingTicketThunk";
import { showError, showSuccess } from "../utilits/toast";

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

function RegisteredAvatarPlaceholder() {
  return (
    <svg
      className="bookingRegister-registeredAvatarIcon"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4" fill="#ffffff" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="#ffffff" />
    </svg>
  );
}

const emptyForm = {
  name: "",
  mobileNumber: "",
  email: "",
  profileImage: null,
  previewImage: "",
};

// Same validation rules used by BookingUserModal's single-ticket form, kept
// in sync here since each pending slot below submits through the same
// updateRegisterUser API.
const validateForm = (form) => {
  if (!form.name.trim()) return "Please enter name.";
  if (!/^[A-Za-z ]+$/.test(form.name)) return "Name is invalid.";
  if (!/^[6-9]\d{9}$/.test(form.mobileNumber))
    return "Please enter valid mobile number.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return "Please enter valid email.";
  return null;
};

const RegisterUsers = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { booking, detailsLoading, error } = useSelector(
    (state) => state.booking
  );

  // Pending-form input state per ticket slot, keyed by ticket _id. Only
  // slots that are currently unregistered ever have an entry here.
  const [formStates, setFormStates] = useState({});
  // Optimistic per-ticket overrides applied the instant a registration
  // succeeds, so that slot flips to the registered card immediately
  // instead of waiting on the background refetch below.
  const [registeredOverrides, setRegisteredOverrides] = useState({});
  // Which ticket is currently submitting, so only that slot's Submit
  // button shows a loading state — other pending forms stay usable.
  const [submittingTicketId, setSubmittingTicketId] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(getBookingById(id));
    }
  }, [dispatch, id]);

  const getFormState = (ticketId) => formStates[ticketId] || emptyForm;

  const updateFormField = (ticketId, field, value) => {
    setFormStates((prev) => ({
      ...prev,
      [ticketId]: { ...getFormState(ticketId), [field]: value },
    }));
  };

  const handleImageChange = (ticketId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select valid image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError("Image size should be less than 2MB.");
      return;
    }

    setFormStates((prev) => ({
      ...prev,
      [ticketId]: {
        ...getFormState(ticketId),
        profileImage: file,
        previewImage: URL.createObjectURL(file),
      },
    }));
  };

  const handleSubmit = async (ticketId) => {
    const form = getFormState(ticketId);
    const validationError = validateForm(form);

    if (validationError) {
      showError(validationError);
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("mobileNumber", form.mobileNumber.trim());
    payload.append("email", form.email.trim());
    if (form.profileImage) {
      payload.append("profileImage", form.profileImage);
    }

    setSubmittingTicketId(ticketId);
    const response = await dispatch(
      updateRegisterUser({ ticketId, formData: payload })
    );
    setSubmittingTicketId(null);

    if (updateRegisterUser.fulfilled.match(response)) {
      showSuccess(
        response.payload.message || "User registered successfully."
      );

      // Flip this slot straight to the registered card — no new box is
      // created, the same position just changes state.
      setRegisteredOverrides((prev) => ({
        ...prev,
        [ticketId]: response.payload.data,
      }));

      // This slot no longer needs its pending-form state.
      setFormStates((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });

      // Resync the canonical booking/tickets list in the background so a
      // later refresh of this page reflects the server's own record.
      if (id) dispatch(getBookingById(id));
    } else {
      showError(response.payload || "Failed to register user.");
    }
  };

  const heroTitle = (
    <div className="bookingRegister-hero">
      <h1 className="bookingRegister-title">
        Ticket
        <br />
        Registration <span className="bookingRegister-wave">&#128075;</span>
      </h1>
    </div>
  );

  if (detailsLoading) {
    return (
      <div className="bookingRegister-page">
        {heroTitle}
        <p className="bookingRegister-statusText">Loading...</p>
      </div>
    );
  }

  if (!booking || error) {
    return (
      <div className="bookingRegister-page">
        {heroTitle}
        <p className="bookingRegister-statusText">No Booking Found</p>
      </div>
    );
  }

  const quantity = Math.max(0, Number(booking.quantity) || 0);
  const bookingTickets = booking.tickets || [];
  // One slot per booking quantity. The ticket doc already sitting in that
  // slot (if any) decides whether it renders as a registered card or a
  // pending registration form — nothing here invents extra slots or drops
  // existing registered ones.
  const slots = Array.from({ length: quantity }, (_, i) => bookingTickets[i] || null);

  return (
    <div className="bookingRegister-page">
      {heroTitle}

      {quantity === 0 ? (
        <p className="bookingRegister-statusText">
          This booking has no ticket quantity to register.
        </p>
      ) : (
        <div className="bookingRegister-grid">
          {slots.map((slotTicket, index) => {
            const memberNumber = index + 1;

            if (!slotTicket) {
              return (
                <div className="bookingRegister-card" key={`empty-${memberNumber}`}>
                  <span className="bookingRegister-memberLabel">
                    MEMBER {memberNumber}
                  </span>
                  <div className="bookingRegister-cardBody">
                    <p className="bookingRegister-unavailableText">
                      Ticket data not available.
                    </p>
                  </div>
                </div>
              );
            }

            const ticket = registeredOverrides[slotTicket._id] || slotTicket;

            if (ticket.isRegistered) {
              const attendee = ticket.attendee || {};
              return (
                <div className="bookingRegister-card" key={ticket._id}>
                  <span className="bookingRegister-memberLabel">
                    MEMBER {memberNumber}
                  </span>

                  <div className="bookingRegister-registeredCard">
                    <span className="bookingRegister-registeredAvatar">
                      {attendee.profileImage ? (
                        <img
                          src={attendee.profileImage}
                          alt={attendee.name}
                          className="bookingRegister-registeredAvatarImage"
                        />
                      ) : (
                        <RegisteredAvatarPlaceholder />
                      )}
                    </span>

                    <div className="bookingRegister-registeredInfo">
                      <span className="bookingRegister-registeredName">
                        {attendee.name || "-"}
                      </span>
                      <span className="bookingRegister-registeredMobile">
                        {attendee.mobileNumber || "-"}
                      </span>
                    </div>

                    {ticket.qrImage && (
                      <img
                        src={ticket.qrImage}
                        alt={ticket.ticketNumber || "QR code"}
                        className="bookingRegister-registeredQr"
                      />
                    )}
                  </div>
                </div>
              );
            }

            const form = getFormState(ticket._id);
            const isSubmitting = submittingTicketId === ticket._id;
            const photoInputId = `bookingRegister-photo-${ticket._id}`;

            return (
              <div className="bookingRegister-card" key={ticket._id}>
                <span className="bookingRegister-memberLabel">
                  MEMBER {memberNumber}
                </span>

                <div className="bookingRegister-cardBody">
                  <div className="bookingRegister-photoWrap">
                    <span className="bookingRegister-photoCircle">
                      {form.previewImage ? (
                        <img
                          src={form.previewImage}
                          alt="Preview"
                          className="bookingRegister-photoPreviewImage"
                        />
                      ) : (
                        <UploadPhotoPlaceholder />
                      )}
                    </span>
                    <input
                      id={photoInputId}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleImageChange(ticket._id, e)}
                    />
                    <label htmlFor={photoInputId} className="bookingRegister-editBtn">
                      <EditIcon />
                    </label>
                  </div>

                  <span className="bookingRegister-uploadText">upload photo</span>

                  <div className="bookingRegister-fieldGroup">
                    <input
                      type="text"
                      className="bookingRegister-input"
                      placeholder="Name"
                      value={form.name}
                      onChange={(e) =>
                        updateFormField(ticket._id, "name", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="bookingRegister-input"
                      placeholder="Mobile No."
                      value={form.mobileNumber}
                      onChange={(e) =>
                        updateFormField(ticket._id, "mobileNumber", e.target.value)
                      }
                    />
                    <input
                      type="email"
                      className="bookingRegister-input"
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) =>
                        updateFormField(ticket._id, "email", e.target.value)
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="bookingRegister-submitBtn"
                    onClick={() => handleSubmit(ticket._id)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegisterUsers;