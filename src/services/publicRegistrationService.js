import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../assets/CSS/PublicRegisterUser.css";
import { showError, showSuccess } from "../utilits/toast";
import {
  getPublicRegistrationDetailsApi,
  submitPublicRegistrationApi,
} from "../services/publicRegistrationService";

// Public, no-login registration page for a booking, opened from a
// WhatsApp link at /r/:token. The token is the ONLY identity used
// anywhere below; a ticketId is never read, stored, or sent from here.
//
// ================= ROOT CAUSE OF THE MULTI-QUANTITY BUG =================
// GET/PUT /api/public/registration/:token already return the correct data
// for this (see services/publicRegistration.service.js on the backend):
// the token resolves to the booking, and the response carries a
// `tickets` array — one entry per booking quantity, each with its own
// persisted `isRegistered`/`attendee` — plus the submit endpoint always
// fills the earliest still-unregistered ticket for that booking.
//
// This component, however, never read that array. It only used
// `quantity` to decide how many *empty* form cards to draw, then tracked
// "submitted" purely in local `submittedByIndex` React state. That local
// state resets on every page load, so a refresh made every slot look
// "available" again regardless of what the backend actually had —
// letting the same slot be resubmitted and disagreeing with the backend
// the moment more than one browser tab/session was involved. It also
// read fields (`ticketDetails.isRegistered`, `.attendee`, `.ticketNumber`)
// that don't exist at the top level of the current response shape, so
// the "already registered" / event-summary UI was silently broken too.
//
// Fix: keep `tickets` (from the API) as the single source of truth for
// which slots are registered, and always re-render from it — on initial
// load AND immediately after a successful submit (using the tickets
// array the submit response already returns). No new state duplicates
// what the backend already knows, and a page refresh re-fetches the same
// truth via the same existing GET endpoint.

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

// Maps a failed axios call to one clean, customer-facing message — never
// a raw server/stack-trace string.
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
  // The registration token from the URL — the only identity used
  // anywhere in this component. Never changed, never a ticketId.
  const { token } = useParams();

  // Page-load token validation state.
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState("");

  // ================= REGISTRATION DATA (SOURCE OF TRUTH) =================
  // `quantity` and `tickets` come only from the existing Public
  // Registration API response — never hardcoded, never derived from the
  // URL/token. `tickets` is re-set wholesale from the server on load and
  // after every successful submit; nothing here ever flips a slot to
  // "registered" locally without the backend having said so first.
  const [quantity, setQuantity] = useState(1);
  const [tickets, setTickets] = useState([]);

  // Pending-form input state for the one slot currently open for
  // editing, keyed by slot index within `tickets`.
  const [formsByIndex, setFormsByIndex] = useState({});
  const [fieldErrorsByIndex, setFieldErrorsByIndex] = useState({});
  const [submittingIndex, setSubmittingIndex] = useState(null);

  const loadRegistrationDetails = async ({ silent } = {}) => {
    if (!token) {
      setValidationError("This registration link is invalid.");
      setIsValidating(false);
      return;
    }

    if (!silent) setIsValidating(true);
    setValidationError("");

    try {
      const response = await getPublicRegistrationDetailsApi(token);
      const details = response.data;

      const nextQuantity = Math.max(1, Number(details?.quantity) || 1);
      const nextTickets = Array.isArray(details?.tickets)
        ? details.tickets
        : [];

      setQuantity(nextQuantity);
      setTickets(nextTickets);
    } catch (error) {
      setValidationError(
        getFriendlyErrorMessage(
          error,
          "This registration link could not be verified."
        )
      );
    } finally {
      if (!silent) setIsValidating(false);
    }
  };

  useEffect(() => {
    loadRegistrationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getForm = (index) => formsByIndex[index] || emptyForm;
  const getFieldErrorsForIndex = (index) => fieldErrorsByIndex[index] || {};

  const updateField = (index, field, value) => {
    setFormsByIndex((prev) => ({
      ...prev,
      [index]: { ...getForm(index), [field]: value },
    }));

    // Clear this field's visible error the instant it's edited, so a
    // corrected value doesn't keep showing a stale message.
    setFieldErrorsByIndex((prev) => {
      const current = prev[index];
      if (!current || !current[field]) return prev;
      return { ...prev, [index]: { ...current, [field]: undefined } };
    });
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select valid image.");
      return;
    }

    // ================= IMAGE SIZE LIMIT =================
    // Public Registration attendee photo: images up to 100 MB are
    // allowed; only files over 100 MB are rejected. Matches the
    // backend's registration-specific upload limit
    // (middlewares/upload.middleware.js's `registrationPhotoUpload`,
    // used by this route's PUT endpoint). Allowed image types/formats
    // are unchanged (still validated above).
    if (file.size > 100 * 1024 * 1024) {
      showError("Image size should be less than 100MB.");
      return;
    }

    setFormsByIndex((prev) => ({
      ...prev,
      [index]: {
        ...getForm(index),
        profileImage: file,
        previewImage: URL.createObjectURL(file),
      },
    }));
  };

  // ================= SUBMIT =================
  // Uses the SAME existing endpoint/request shape as before
  // (submitPublicRegistrationApi(token, FormData) -> PUT
  // /api/public/registration/:token with name/mobileNumber/email/
  // profileImage) — no new API, no new fields, no ticket identifier ever
  // sent. The backend always applies this to the earliest still-
  // unregistered ticket for the booking the token points to; the
  // response's `tickets` array is then used to repaint every slot from
  // the server's own record, which is what makes the result correct
  // immediately and also correct after a refresh.
  const handleSubmit = async (index, e) => {
    e.preventDefault();

    if (submittingIndex !== null) return;

    const form = getForm(index);
    const errors = getFieldErrors(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrorsByIndex((prev) => ({ ...prev, [index]: errors }));
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("mobileNumber", form.mobileNumber.trim());
    payload.append("email", form.email.trim());
    if (form.profileImage) {
      payload.append("profileImage", form.profileImage);
    }

    setSubmittingIndex(index);

    try {
      const response = await submitPublicRegistrationApi(token, payload);

      showSuccess(response.message || "You have been registered successfully.");

      const updatedTickets = response.data?.tickets;
      if (Array.isArray(updatedTickets)) {
        setTickets(updatedTickets);
      } else {
        // Defensive fallback only — re-fetch so the page still reflects
        // the backend if the response shape ever changes.
        await loadRegistrationDetails({ silent: true });
      }

      setFormsByIndex((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setFieldErrorsByIndex((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    } catch (error) {
      showError(
        getFriendlyErrorMessage(
          error,
          "Failed to submit your registration. Please try again."
        )
      );
      // Someone may have just filled the last open slot from another
      // tab/device; resync so this page doesn't keep offering a slot
      // that no longer exists.
      await loadRegistrationDetails({ silent: true });
    } finally {
      setSubmittingIndex(null);
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

  // Event/ticket-type context is the same across every sibling ticket on
  // this booking, so the first entry is enough for the summary panel.
  const firstTicket = tickets[0] || {};

  // The first (lowest-index) ticket that is NOT yet registered is the
  // only slot that ever gets an editable form. This matches the
  // backend's own "fill the earliest unregistered ticket" rule exactly,
  // so what the customer sees as "next" is always the slot their submit
  // will actually land on — no other slot can be filled out of order.
  let nextOpenAssigned = false;

  return (
    <div className="publicRegister-page">
      {heroTitle}

      <div className="publicRegister-content">
        {tickets.length > 0 && (firstTicket.eventTitle || firstTicket.ticketTypeName) && (
          <div className="publicRegister-summary">
            {firstTicket.eventTitle && (
              <p className="publicRegister-summaryRow">
                <span className="publicRegister-summaryLabel">Event</span>
                <span className="publicRegister-summaryValue">
                  {firstTicket.eventTitle}
                </span>
              </p>
            )}
            {firstTicket.ticketTypeName && (
              <p className="publicRegister-summaryRow">
                <span className="publicRegister-summaryLabel">Ticket Type</span>
                <span className="publicRegister-summaryValue">
                  {firstTicket.ticketTypeName}
                </span>
              </p>
            )}
            {quantity > 1 && (
              <p className="publicRegister-summaryRow">
                <span className="publicRegister-summaryLabel">Registrations</span>
                <span className="publicRegister-summaryValue">
                  {tickets.filter((t) => t.isRegistered).length} of {quantity}{" "}
                  completed
                </span>
              </p>
            )}
          </div>
        )}

        {quantity === 1 ? (
          // ================= SINGLE REGISTRATION (quantity = 1) =================
          // Unchanged visual/behavioural shape from before quantity>1 support:
          // one unlabeled card, either the "already registered" state or the
          // form, driven by tickets[0] straight from the backend.
          <div className="publicRegister-singleWrap">
            {firstTicket.isRegistered ? (
              <div className="publicRegister-card publicRegister-alreadyCard">
                <span className="publicRegister-successIcon">&#10003;</span>
                <p className="publicRegister-successTitle">Already Registered</p>
                <p className="publicRegister-successText">
                  {firstTicket.attendee?.name
                    ? `This ticket is already registered to ${firstTicket.attendee.name}.`
                    : "This ticket has already been registered."}
                </p>
              </div>
            ) : (
              (() => {
                const index = 0;
                const form = getForm(index);
                const fieldErrors = getFieldErrorsForIndex(index);
                const isFormValid =
                  Object.keys(getFieldErrors(form)).length === 0;
                const isSubmitting = submittingIndex === index;
                const photoInputId = `publicRegister-photo-${index}`;

                return (
                  <form
                    className="publicRegister-card"
                    onSubmit={(e) => handleSubmit(index, e)}
                  >
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
                        onChange={(e) => handleImageChange(index, e)}
                      />
                      <label htmlFor={photoInputId} className="publicRegister-editBtn">
                        <EditIcon />
                      </label>
                    </div>

                    <span className="publicRegister-uploadText">upload photo</span>

                    <div className="publicRegister-fieldGroup">
                      <div className="publicRegister-fieldWrap">
                        <input
                          type="text"
                          className="publicRegister-input"
                          placeholder="Name"
                          value={form.name}
                          onChange={(e) => updateField(index, "name", e.target.value)}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.name && (
                          <p className="publicRegister-fieldError">{fieldErrors.name}</p>
                        )}
                      </div>

                      <div className="publicRegister-fieldWrap">
                        <input
                          type="tel"
                          inputMode="numeric"
                          className="publicRegister-input"
                          placeholder="Mobile No."
                          value={form.mobileNumber}
                          maxLength={10}
                          onChange={(e) =>
                            updateField(
                              index,
                              "mobileNumber",
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          disabled={isSubmitting}
                        />
                        {fieldErrors.mobileNumber && (
                          <p className="publicRegister-fieldError">
                            {fieldErrors.mobileNumber}
                          </p>
                        )}
                      </div>

                      <div className="publicRegister-fieldWrap">
                        <input
                          type="email"
                          className="publicRegister-input"
                          placeholder="Email"
                          value={form.email}
                          onChange={(e) => updateField(index, "email", e.target.value)}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.email && (
                          <p className="publicRegister-fieldError">{fieldErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="publicRegister-submitBtn"
                      disabled={isSubmitting || !isFormValid}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </form>
                );
              })()
            )}
          </div>
        ) : (
          // ================= MULTI-SLOT REGISTRATION (quantity > 1) =================
          // One card per booking quantity, each driven entirely by its own
          // `tickets[index]` entry from the backend:
          //   - isRegistered -> permanent "Registered" card (survives refresh,
          //     since it's read straight from the DB every time this page loads)
          //   - the first not-yet-registered slot -> the editable form
          //   - any later not-yet-registered slot -> locked until the ones
          //     before it are completed, keeping slot order == fill order
          <div className="publicRegister-grid">
            {tickets.map((ticket, index) => {
              const memberNumber = index + 1;

              if (ticket.isRegistered) {
                return (
                  <div className="publicRegister-slot" key={ticket.ticketNumber || index}>
                    <span className="publicRegister-slotLabel">
                      Registration {memberNumber}
                    </span>
                    <div className="publicRegister-card publicRegister-successCard">
                      <span className="publicRegister-successIcon">&#10003;</span>
                      <p className="publicRegister-successTitle">Already Registered</p>
                      <p className="publicRegister-successText">
                        {ticket.attendee?.name
                          ? `Registered to ${ticket.attendee.name}.`
                          : "This slot has already been registered."}
                      </p>
                    </div>
                  </div>
                );
              }

              const isNextOpen = !nextOpenAssigned;
              if (isNextOpen) nextOpenAssigned = true;

              if (!isNextOpen) {
                return (
                  <div className="publicRegister-slot" key={ticket.ticketNumber || index}>
                    <span className="publicRegister-slotLabel">
                      Registration {memberNumber}
                    </span>
                    <div className="publicRegister-card publicRegister-lockedCard">
                      <p className="publicRegister-lockedText">
                        Complete Registration {memberNumber - 1} first.
                      </p>
                    </div>
                  </div>
                );
              }

              const form = getForm(index);
              const fieldErrors = getFieldErrorsForIndex(index);
              const isFormValid = Object.keys(getFieldErrors(form)).length === 0;
              const isSubmitting = submittingIndex === index;
              const photoInputId = `publicRegister-photo-${index}`;

              return (
                <div className="publicRegister-slot" key={ticket.ticketNumber || index}>
                  <span className="publicRegister-slotLabel">
                    Registration {memberNumber}
                  </span>

                  <form
                    className="publicRegister-card"
                    onSubmit={(e) => handleSubmit(index, e)}
                  >
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
                        onChange={(e) => handleImageChange(index, e)}
                      />
                      <label htmlFor={photoInputId} className="publicRegister-editBtn">
                        <EditIcon />
                      </label>
                    </div>

                    <span className="publicRegister-uploadText">upload photo</span>

                    <div className="publicRegister-fieldGroup">
                      <div className="publicRegister-fieldWrap">
                        <input
                          type="text"
                          className="publicRegister-input"
                          placeholder="Name"
                          value={form.name}
                          onChange={(e) => updateField(index, "name", e.target.value)}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.name && (
                          <p className="publicRegister-fieldError">{fieldErrors.name}</p>
                        )}
                      </div>

                      <div className="publicRegister-fieldWrap">
                        <input
                          type="tel"
                          inputMode="numeric"
                          className="publicRegister-input"
                          placeholder="Mobile No."
                          value={form.mobileNumber}
                          maxLength={10}
                          onChange={(e) =>
                            updateField(
                              index,
                              "mobileNumber",
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          disabled={isSubmitting}
                        />
                        {fieldErrors.mobileNumber && (
                          <p className="publicRegister-fieldError">
                            {fieldErrors.mobileNumber}
                          </p>
                        )}
                      </div>

                      <div className="publicRegister-fieldWrap">
                        <input
                          type="email"
                          className="publicRegister-input"
                          placeholder="Email"
                          value={form.email}
                          onChange={(e) => updateField(index, "email", e.target.value)}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.email && (
                          <p className="publicRegister-fieldError">{fieldErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="publicRegister-submitBtn"
                      disabled={isSubmitting || !isFormValid}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRegisterUser;