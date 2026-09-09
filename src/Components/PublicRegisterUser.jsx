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

// Builds the array of independent, empty form slots to render — one per
// unit of the booking's quantity (quantity = 1 -> exactly one slot, i.e.
// the existing single-registration UI is unchanged). `quantity` always
// comes from the existing Public Registration API response
// (ticketDetails.quantity, itself just the existing Booking.quantity
// value reflected back — see services/publicRegistration.service.js on
// the backend); it is never hardcoded and never derived from the URL.
const buildEmptyForms = (quantity) =>
  Array.from({ length: quantity }, () => ({ ...emptyForm }));

// Same validation rules as RegisterUsers.jsx / BookingUserModal, kept in
// sync here since this form submits through the equivalent public
// endpoint (PUT /api/public/registration/:token).
//
// Returns a { fieldName: message } map instead of a single message so
// each error can render directly below its own field, per the project's
// field-level validation pattern (see CreateBookingModal). Only the
// error-collection shape changed here — the rules themselves are
// unchanged.
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

  // ================= MULTI-SLOT FORM STATE =================
  // One independent form per unit of booking quantity, keyed by index
  // (0-based). For quantity = 1 this is an array of exactly one form —
  // same fields, same validation, same submit call as the previous
  // single-form version, so that flow is unaffected.
  const [forms, setForms] = useState([{ ...emptyForm }]);
  // Per-slot validation messages, keyed the same way as `forms`.
  const [fieldErrorsList, setFieldErrorsList] = useState([{}]);
  // Which slot (index) is currently submitting, so only that slot's
  // button shows a loading state — other pending slots stay usable.
  const [submittingIndex, setSubmittingIndex] = useState(null);
  // Slots that have been successfully submitted, keyed by index, holding
  // the submitted name for the success message.
  const [submittedByIndex, setSubmittedByIndex] = useState({});

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

        const details = response.data;
        setTicketDetails(details);

        // ================= BOOKING QUANTITY =================
        // Comes only from the existing API response
        // (ticketDetails.quantity — the existing Booking.quantity value,
        // reflected back by the existing GET /api/public/registration/:token
        // endpoint). Never hardcoded, never derived from the URL/token.
        // Falls back to 1 (existing single-registration behavior) if a
        // backend response doesn't include it, so this page keeps working
        // exactly as before against that response shape.
        const quantity = Math.max(1, Number(details?.quantity) || 1);

        setForms(buildEmptyForms(quantity));
        setFieldErrorsList(Array.from({ length: quantity }, () => ({})));
        setSubmittedByIndex({});
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

  const getForm = (index) => forms[index] || emptyForm;
  const getFieldErrorsForIndex = (index) => fieldErrorsList[index] || {};

  const updateField = (index, field, value) => {
    setForms((prev) => {
      const next = [...prev];
      next[index] = { ...getForm(index), [field]: value };
      return next;
    });

    // Clear this field's visible error the instant it's edited, so a
    // corrected value doesn't keep showing a stale message.
    setFieldErrorsList((prev) => {
      const current = prev[index];
      if (!current || !current[field]) return prev;
      const next = [...prev];
      next[index] = { ...current, [field]: undefined };
      return next;
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
    // Public Registration attendee photo: images up to 100 MB are now
    // allowed (raised from the previous 20 MB cap); only files over
    // 100 MB are rejected. Matches the backend's registration-specific
    // upload limit (middlewares/upload.middleware.js's
    // `registrationPhotoUpload`, used by this route's PUT endpoint).
    // Allowed image types/formats are unchanged (still validated above).
    if (file.size > 100 * 1024 * 1024) {
      showError("Image size should be less than 100MB.");
      return;
    }

    setForms((prev) => {
      const next = [...prev];
      next[index] = {
        ...getForm(index),
        profileImage: file,
        previewImage: URL.createObjectURL(file),
      };
      return next;
    });
  };

  // ================= SUBMIT =================
  // Uses the SAME existing endpoint/request shape as before
  // (submitPublicRegistrationApi(token, FormData) -> PUT
  // /api/public/registration/:token with name/mobileNumber/email/
  // profileImage) for every slot — no new API, no new fields, no bulk/
  // array payload invented. The token in the URL remains the sole ticket
  // identity, exactly as before.
  const handleSubmit = async (index, e) => {
    e.preventDefault();

    // Guards against duplicate submissions from a double-tap/double-click
    // in addition to the disabled submit button below.
    if (submittingIndex !== null || submittedByIndex[index]) return;

    const form = getForm(index);
    const errors = getFieldErrors(form);
    if (Object.keys(errors).length > 0) {
      // Field-specific messages render below their own inputs (see JSX
      // below) — no common/top-level toast for validation.
      setFieldErrorsList((prev) => {
        const next = [...prev];
        next[index] = errors;
        return next;
      });
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

    setSubmittingIndex(index);

    try {
      const response = await submitPublicRegistrationApi(token, payload);

      showSuccess(response.message || "You have been registered successfully.");
      setSubmittedByIndex((prev) => ({ ...prev, [index]: { name: form.name.trim() } }));
    } catch (error) {
      // Existing friendly-error mapping handles an already-registered
      // ticket (409) the same way it always has — relevant here since
      // only one of these slots can ever be the ticket this token
      // actually points to; any others will surface that same message.
      showError(
        getFriendlyErrorMessage(
          error,
          "Failed to submit your registration. Please try again."
        )
      );
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

  // A signed link whose ticket is already registered stops here for
  // every slot — same as the original single-registration behavior, just
  // also covering quantity > 1 (the token still only ever points at one
  // real ticket).
  const alreadyRegistered = ticketDetails?.isRegistered;

  // quantity comes only from the API response fetched above — never
  // hardcoded, never derived from the URL. `forms.length` already
  // reflects it (see buildEmptyForms in the token-validation effect).
  const quantity = forms.length;

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

        {alreadyRegistered ? (
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
          // ================= REGISTRATION SLOT(S) =================
          // quantity = 1 renders exactly one card here, unlabeled, same as
          // the original markup. quantity > 1 renders one independently
          // submittable card per slot, labeled "Registration 1".."Registration N".
          <div
            className={
              quantity > 1
                ? "publicRegister-grid"
                : "publicRegister-singleWrap"
            }
          >
            {forms.map((form, index) => {
              const fieldErrors = getFieldErrorsForIndex(index);
              const isFormValid = Object.keys(getFieldErrors(form)).length === 0;
              const isSubmitting = submittingIndex === index;
              const submitted = submittedByIndex[index];
              const photoInputId = `publicRegister-photo-${index}`;

              return (
                <div key={index} className="publicRegister-slot">
                  {quantity > 1 && (
                    <span className="publicRegister-slotLabel">
                      Registration {index + 1}
                    </span>
                  )}

                  {submitted ? (
                    <div className="publicRegister-card publicRegister-successCard">
                      <span className="publicRegister-successIcon">&#10003;</span>
                      <p className="publicRegister-successTitle">You're registered!</p>
                      <p className="publicRegister-successText">
                        Thanks {submitted.name}, your details have been saved
                        for this ticket.
                      </p>
                    </div>
                  ) : (
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
                  )}
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