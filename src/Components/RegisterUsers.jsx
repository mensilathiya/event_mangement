import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../assets/CSS/RegisterUsers.css";
import {
  getPublicRegistrationDetailsApi,
  submitPublicRegistrationApi,
} from "../services/publicRegistrationService";
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

// Same validation rules used elsewhere for this attendee form. Only the
// error-collection shape (a { fieldName: message } map, one message per
// field) is specific to this page, so each error can render directly
// below its own input.
const getFieldErrors = (form) => {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Please enter name.";
  } else if (!/^[A-Za-z ]+$/.test(form.name)) {
    errors.name = "Name is invalid.";
  }

  if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
    errors.mobileNumber = "Please enter valid mobile number.";
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Please enter valid email.";
  }

  return errors;
};

// The GET/PUT public registration endpoints may come back either as the
// raw { quantity, tickets } shape or wrapped as { data: { quantity,
// tickets } } depending on how the controller finishes the response.
// Normalizing here means the rest of the component doesn't need to care.
const unwrap = (response) => response?.data ?? response;

const RegisterUsers = () => {
  // The public registration link is /r/:token — this page is reached with
  // NO login, and the token is the only thing that identifies which
  // booking/tickets this is for (see publicRegistration.routes.js). It is
  // never a booking id or ticket id, and it is never sent anywhere except
  // back to this same public API.
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [quantity, setQuantity] = useState(0);
  // Tickets as last read from the backend — the single source of truth
  // for which slots are registered. Never mutated locally except by
  // replacing it wholesale with a fresh server response, so a page
  // refresh (which re-runs the fetch below) always reflects reality.
  const [tickets, setTickets] = useState([]);

  // Pending-form input state for the one slot currently open for editing,
  // keyed by that ticket's ticketNumber (the only stable identifier the
  // public API exposes — see toPublicSafeTicket on the backend).
  const [formStates, setFormStates] = useState({});
  const [fieldErrorsByTicket, setFieldErrorsByTicket] = useState({});
  const [submittingTicketNumber, setSubmittingTicketNumber] = useState(null);

  const loadRegistrationDetails = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setLoadError(null);

    try {
      const result = unwrap(await getPublicRegistrationDetailsApi(token));
      setQuantity(Number(result?.quantity) || 0);
      setTickets(Array.isArray(result?.tickets) ? result.tickets : []);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          "This registration link is invalid or has expired."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRegistrationDetails();
  }, [loadRegistrationDetails]);

  const getFormState = (ticketNumber) => formStates[ticketNumber] || emptyForm;
  const getFieldErrorsState = (ticketNumber) =>
    fieldErrorsByTicket[ticketNumber] || {};

  const updateFormField = (ticketNumber, field, value) => {
    setFormStates((prev) => ({
      ...prev,
      [ticketNumber]: { ...getFormState(ticketNumber), [field]: value },
    }));

    setFieldErrorsByTicket((prev) => {
      const ticketErrors = prev[ticketNumber];
      if (!ticketErrors || !ticketErrors[field]) return prev;
      return {
        ...prev,
        [ticketNumber]: { ...ticketErrors, [field]: undefined },
      };
    });
  };

  const handleImageChange = (ticketNumber, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select valid image.");
      return;
    }

    // Matches the backend's registration-specific upload limit
    // (middlewares/upload.middleware.js's `registrationPhotoUpload`, used
    // by PUT /api/public/registration/:token). Allowed image types are
    // unchanged.
    if (file.size > 100 * 1024 * 1024) {
      showError("Image size should be less than 100MB.");
      return;
    }

    setFormStates((prev) => ({
      ...prev,
      [ticketNumber]: {
        ...getFormState(ticketNumber),
        profileImage: file,
        previewImage: URL.createObjectURL(file),
      },
    }));
  };

  const handleSubmit = async (ticketNumber) => {
    const form = getFormState(ticketNumber);
    const errors = getFieldErrors(form);

    if (Object.keys(errors).length > 0) {
      setFieldErrorsByTicket((prev) => ({ ...prev, [ticketNumber]: errors }));
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("mobileNumber", form.mobileNumber.trim());
    payload.append("email", form.email.trim());
    if (form.profileImage) {
      payload.append("profileImage", form.profileImage);
    }
    // Deliberately no ticket identifier is appended here. The token in
    // the URL is the only thing that identifies the booking, and the
    // backend always fills the earliest still-unregistered slot for it —
    // this page never tells the server which slot to write to.

    setSubmittingTicketNumber(ticketNumber);
    try {
      const result = unwrap(await submitPublicRegistrationApi(token, payload));
      showSuccess(result?.message || "User registered successfully.");

      // Repaint every slot from the server's own post-submit record
      // rather than guessing locally which one just got filled.
      if (Array.isArray(result?.tickets)) {
        setTickets(result.tickets);
      } else {
        await loadRegistrationDetails();
      }

      setFormStates((prev) => {
        const next = { ...prev };
        delete next[ticketNumber];
        return next;
      });
      setFieldErrorsByTicket((prev) => {
        const next = { ...prev };
        delete next[ticketNumber];
        return next;
      });
    } catch (err) {
      showError(
        err.response?.data?.message || "Failed to register user."
      );
      // Someone may have just filled the last open slot from another
      // tab/device; resync so this page doesn't keep offering a slot
      // that no longer exists.
      await loadRegistrationDetails();
    } finally {
      setSubmittingTicketNumber(null);
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

  if (loading) {
    return (
      <div className="bookingRegister-page">
        {heroTitle}
        <p className="bookingRegister-statusText">Loading...</p>
      </div>
    );
  }

  if (loadError || tickets.length === 0) {
    return (
      <div className="bookingRegister-page">
        {heroTitle}
        <p className="bookingRegister-statusText">
          {loadError || "No Booking Found"}
        </p>
      </div>
    );
  }

  // One slot per booking quantity, in the exact order the backend
  // persists them. Registration is always sequential — this page opens an
  // editable form on the FIRST unregistered slot only; any slot after
  // that is shown locked until the ones before it are filled. This keeps
  // the UI's idea of "which slot is next" in sync with the backend's
  // "fill the earliest unregistered ticket" rule, so a submit here can
  // never land on the wrong card.
  let nextOpenAssigned = false;

  return (
    <div className="bookingRegister-page">
      {heroTitle}

      <div className="bookingRegister-grid">
        {tickets.map((ticket, index) => {
          const memberNumber = index + 1;

          if (ticket.isRegistered) {
            const attendee = ticket.attendee || {};
            return (
              <div
                className="bookingRegister-card"
                key={ticket.ticketNumber || memberNumber}
              >
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
                </div>
              </div>
            );
          }

          const isNextOpen = !nextOpenAssigned;
          if (isNextOpen) {
            nextOpenAssigned = true;
          }

          if (!isNextOpen) {
            return (
              <div
                className="bookingRegister-card"
                key={ticket.ticketNumber || memberNumber}
              >
                <span className="bookingRegister-memberLabel">
                  MEMBER {memberNumber}
                </span>
                <div className="bookingRegister-cardBody">
                  <p className="bookingRegister-unavailableText">
                    Complete Member {memberNumber - 1}&apos;s registration
                    first.
                  </p>
                </div>
              </div>
            );
          }

          const ticketNumber = ticket.ticketNumber || `slot-${memberNumber}`;
          const form = getFormState(ticketNumber);
          const fieldErrors = getFieldErrorsState(ticketNumber);
          const isFormValid = Object.keys(getFieldErrors(form)).length === 0;
          const isSubmitting = submittingTicketNumber === ticketNumber;
          const photoInputId = `bookingRegister-photo-${ticketNumber}`;

          return (
            <div className="bookingRegister-card" key={ticketNumber}>
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
                    onChange={(e) => handleImageChange(ticketNumber, e)}
                  />
                  <label htmlFor={photoInputId} className="bookingRegister-editBtn">
                    <EditIcon />
                  </label>
                </div>

                <span className="bookingRegister-uploadText">upload photo</span>

                <div className="bookingRegister-fieldGroup">
                  <div className="bookingRegister-fieldWrap">
                    <input
                      type="text"
                      className="bookingRegister-input"
                      placeholder="Name"
                      value={form.name}
                      onChange={(e) =>
                        updateFormField(ticketNumber, "name", e.target.value)
                      }
                    />
                    {fieldErrors.name && (
                      <p className="bookingRegister-fieldError">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div className="bookingRegister-fieldWrap">
                    <input
                      type="tel"
                      className="bookingRegister-input"
                      placeholder="Mobile No."
                      value={form.mobileNumber}
                      maxLength={10}
                      onChange={(e) =>
                        updateFormField(
                          ticketNumber,
                          "mobileNumber",
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                    />
                    {fieldErrors.mobileNumber && (
                      <p className="bookingRegister-fieldError">
                        {fieldErrors.mobileNumber}
                      </p>
                    )}
                  </div>

                  <div className="bookingRegister-fieldWrap">
                    <input
                      type="email"
                      className="bookingRegister-input"
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) =>
                        updateFormField(ticketNumber, "email", e.target.value)
                      }
                    />
                    {fieldErrors.email && (
                      <p className="bookingRegister-fieldError">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={`bookingRegister-submitBtn${
                    isFormValid ? " bookingRegister-submitBtn--active" : ""
                  }`}
                  onClick={() => handleSubmit(ticketNumber)}
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {quantity > 0 && tickets.every((t) => t.isRegistered) && (
        <p className="bookingRegister-statusText">
          All registrations for this booking are complete.
        </p>
      )}
    </div>
  );
};

export default RegisterUsers;