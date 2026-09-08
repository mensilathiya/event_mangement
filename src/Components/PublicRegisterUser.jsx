import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../assets/CSS/PublicRegisterUser.css";
import { showError, showSuccess } from "../utilits/toast";
import {
  getPublicRegistrationDetailsApi,
  submitPublicRegistrationApi,
} from "../services/publicRegistrationService";

// Public, no-login registration page for a single BookingTicket, opened
// from a WhatsApp link at /r/:token. Unlike RegisterUsers.jsx (which lists
// every ticket slot on a booking behind an authenticated route), this page
// only ever deals with the one ticket the token identifies — the token is
// the ONLY ticket identity used anywhere below; a ticketId is never read,
// stored, or sent from here.

function UploadPhotoPlaceholder() {
  return (
    <svg
      className="publicRegister-avatarIcon"
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
      className="publicRegister-editIcon"
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

const emptyForm = {
  name: "",
  mobileNumber: "",
  email: "",
  profileImage: null,
  previewImage: "",
};

// Same validation rules as RegisterUsers.jsx / BookingUserModal, kept in
// sync here since this form submits through the equivalent public
// endpoint (PUT /api/public/registration/:token).
const validateForm = (form) => {
  if (!form.name.trim()) return "Please enter name.";
  if (!/^[A-Za-z ]+$/.test(form.name)) return "Name is invalid.";
  if (!/^[6-9]\d{9}$/.test(form.mobileNumber))
    return "Please enter valid mobile number.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return "Please enter valid email.";
  return null;
};

// Maps a failed axios call to one clean, customer-facing message — never
// a raw server/stack-trace string. Falls back to the backend's own
// `message` field first (it already returns customer-safe text — see
// utils/verifyRegistrationToken.js / publicRegistration.service.js on the
// backend), then to a friendly default per status code so the page never
// shows something like a network error object.
const getFriendlyErrorMessage = (error, fallback) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (serverMessage) return serverMessage;

  switch (status) {
    case 400:
      return "This registration link is missing required information.";
    case 401:
      return "This registration link is invalid or has expired.";
    case 404:
      return "We couldn't find a ticket for this registration link.";
    case 409:
      return "This ticket has already been registered.";
    case 500:
      return "Something went wrong on our end. Please try again shortly.";
    default:
      return fallback;
  }
};

const PublicRegisterUser = () => {
  // The registration token from the URL — the only ticket identity used
  // anywhere in this component.
  const { token } = useParams();

  // Page-load token validation state.
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [ticketDetails, setTicketDetails] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const validateToken = async () => {
      setIsValidating(true);
      setValidationError("");

      if (!token) {
        setValidationError("This registration link is invalid.");
        setIsValidating(false);
        return;
      }

      try {
        const response = await getPublicRegistrationDetailsApi(token);

        if (isCancelled) return;

        setTicketDetails(response.data);
      } catch (error) {
        if (isCancelled) return;

        setValidationError(
          getFriendlyErrorMessage(
            error,
            "This registration link could not be verified."
          )
        );
      } finally {
        if (!isCancelled) setIsValidating(false);
      }
    };

    validateToken();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
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

    setForm((prev) => ({
      ...prev,
      profileImage: file,
      previewImage: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guards against duplicate submissions from a double-tap/double-click
    // in addition to the disabled submit button below.
    if (isSubmitting || isSubmitted) return;

    const validationErr = validateForm(form);
    if (validationErr) {
      showError(validationErr);
      return;
    }

    // Only these four fields are ever sent — no ticketId. The token in
    // the URL (already baked into the request URL by
    // submitPublicRegistrationApi) is the sole ticket identity.
    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("mobileNumber", form.mobileNumber.trim());
    payload.append("email", form.email.trim());
    if (form.profileImage) {
      payload.append("profileImage", form.profileImage);
    }

    setIsSubmitting(true);

    try {
      const response = await submitPublicRegistrationApi(token, payload);

      showSuccess(response.message || "You have been registered successfully.");
      setIsSubmitted(true);
    } catch (error) {
      showError(
        getFriendlyErrorMessage(
          error,
          "Failed to submit your registration. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroTitle = (
    <div className="publicRegister-hero">
      <h1 className="publicRegister-title">
        Ticket
        <br />
        Registration <span className="publicRegister-wave">&#128075;</span>
      </h1>
    </div>
  );

  if (isValidating) {
    return (
      <div className="publicRegister-page">
        {heroTitle}
        <div className="publicRegister-content">
          <p className="publicRegister-statusText">Checking your link...</p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="publicRegister-page">
        {heroTitle}
        <div className="publicRegister-content">
          <div className="publicRegister-card publicRegister-errorCard">
            <span className="publicRegister-errorIcon">&#33;</span>
            <p className="publicRegister-errorTitle">Link not valid</p>
            <p className="publicRegister-errorText">{validationError}</p>
          </div>
        </div>
      </div>
    );
  }

  const alreadyRegistered = ticketDetails?.isRegistered && !isSubmitted;
  const photoInputId = "publicRegister-photo";

  return (
    <div className="publicRegister-page">
      {heroTitle}

      <div className="publicRegister-content">
        {ticketDetails && (
          <div className="publicRegister-summary">
            {ticketDetails.eventTitle && (
              <p className="publicRegister-summaryRow">
                <span className="publicRegister-summaryLabel">Event</span>
                <span className="publicRegister-summaryValue">
                  {ticketDetails.eventTitle}
                </span>
              </p>
            )}
            {ticketDetails.ticketTypeName && (
              <p className="publicRegister-summaryRow">
                <span className="publicRegister-summaryLabel">Ticket Type</span>
                <span className="publicRegister-summaryValue">
                  {ticketDetails.ticketTypeName}
                </span>
              </p>
            )}
            {ticketDetails.ticketNumber && (
              <p className="publicRegister-summaryRow">
                <span className="publicRegister-summaryLabel">Ticket No.</span>
                <span className="publicRegister-summaryValue">
                  {ticketDetails.ticketNumber}
                </span>
              </p>
            )}
          </div>
        )}

        {isSubmitted ? (
          <div className="publicRegister-card publicRegister-successCard">
            <span className="publicRegister-successIcon">&#10003;</span>
            <p className="publicRegister-successTitle">You're registered!</p>
            <p className="publicRegister-successText">
              Thanks {form.name.trim()}, your details have been saved for
              this ticket.
            </p>
          </div>
        ) : alreadyRegistered ? (
          <div className="publicRegister-card publicRegister-alreadyCard">
            <span className="publicRegister-successIcon">&#10003;</span>
            <p className="publicRegister-successTitle">Already Registered</p>
            <p className="publicRegister-successText">
              {ticketDetails?.attendee?.name
                ? `This ticket is already registered to ${ticketDetails.attendee.name}.`
                : "This ticket has already been registered."}
            </p>
          </div>
        ) : (
          <form className="publicRegister-card" onSubmit={handleSubmit}>
            <div className="publicRegister-photoWrap">
              <span className="publicRegister-photoCircle">
                {form.previewImage ? (
                  <img
                    src={form.previewImage}
                    alt="Preview"
                    className="publicRegister-photoPreviewImage"
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
                onChange={handleImageChange}
              />
              <label htmlFor={photoInputId} className="publicRegister-editBtn">
                <EditIcon />
              </label>
            </div>

            <span className="publicRegister-uploadText">upload photo</span>

            <div className="publicRegister-fieldGroup">
              <input
                type="text"
                className="publicRegister-input"
                placeholder="Name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={isSubmitting}
              />
              <input
                type="tel"
                inputMode="numeric"
                className="publicRegister-input"
                placeholder="Mobile No."
                value={form.mobileNumber}
                onChange={(e) => updateField("mobileNumber", e.target.value)}
                disabled={isSubmitting}
              />
              <input
                type="email"
                className="publicRegister-input"
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="publicRegister-submitBtn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicRegisterUser;