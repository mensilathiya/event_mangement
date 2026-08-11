import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPlus,
  FaRegCalendarAlt,
  FaUpload,
  FaTimes,
} from "react-icons/fa";
import { createEvent } from "../redux/event/eventThunk";
import { clearEventState } from "../redux/event/eventSlice";
import { showSuccess, showError } from "../utilits/toast";
import RichTextEditor from "../Components/RichTextEditor";
import "../assets/CSS/RichTextEditor.css";
import "../assets/CSS/CreateEvent.css";
import Sidebar from '../Components/Sidebar';
import Header from "../Components/Header";

// Module-level constants — created once, not on every render.
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];

// The app is used by Admins in India, and `datetime-local` inputs produce an
// offset-less string like "2026-08-15T20:00" (the browser's own wall-clock
// value, no timezone info attached). Sent as-is, that string is ambiguous:
// when the server parses it, JS treats an offset-less date-time string as
// *local time of whichever machine is running the code* — not the Admin's
// browser. If the server isn't also running in IST, the stored Date ends up
// shifted by the difference between the two timezones.
//
// Fix: attach the fixed IST offset (+05:30) explicitly before sending, so
// the string is a fully-qualified, unambiguous ISO 8601 value regardless of
// what timezone the server itself runs in. This intentionally hardcodes IST
// rather than pulling in a timezone library, since every Admin using this
// form is in India — if that ever changes, this is the one place to revisit.
const IST_OFFSET = "+05:30";

const toISTISOString = (localDateTimeValue) => {
  if (!localDateTimeValue) return localDateTimeValue;
  // `datetime-local` values are "YYYY-MM-DDTHH:mm" (no seconds). Pad with
  // ":00" seconds, then attach the explicit offset.
  const withSeconds =
    localDateTimeValue.length === 16
      ? `${localDateTimeValue}:00`
      : localDateTimeValue;
  return `${withSeconds}${IST_OFFSET}`;
};

// --- Latitude / Longitude helpers -----------------------------------------
const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

// Strips any character that can't be part of a signed decimal number as the
// user types/pastes, so letters and stray symbols never make it into state.
// Also collapses to at most one leading "-" and one ".".
const sanitizeCoordinateInput = (raw) => {
  let val = raw.replace(/[^0-9.-]/g, "");
  val = val[0] === "-" ? "-" + val.slice(1).replace(/-/g, "") : val.replace(/-/g, "");
  const firstDot = val.indexOf(".");
  if (firstDot !== -1) {
    val = val.slice(0, firstDot + 1) + val.slice(firstDot + 1).replace(/\./g, "");
  }
  return val;
};

// Returns an error message string, or null when the value is valid.
// Empty/incomplete values ("", "-", ".") are treated as "not yet an error"
// here — required-field emptiness is reported separately by the required
// fields check so we don't show two different errors for one empty field.
const validateCoordinate = (value, min, max, label) => {
  if (value === "" || value === "-" || value === ".") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return `${label} must be a valid number.`;
  if (num < min || num > max) return `${label} must be between ${min} and ${max}.`;
  return null;
};

// --- Date helpers -----------------------------------------------------------
// Builds a "YYYY-MM-DDTHH:mm" string (the format <input type="datetime-local">
// uses) from the *current* local time, so it's never hardcoded and always
// reflects "now" whenever it's called.
const getNowLocalDateTimeString = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;
};

// Returns an error message, or null when valid. `getNowLocalDateTimeString()`
// is re-evaluated on every call (never cached), so the check always reflects
// the actual current local time, not a value captured once at page load.
// Required-field emptiness is handled separately by the required-fields
// check, so an empty value is not treated as an error here.
const validateStartDateTime = (value) => {
  if (!value) return null;
  if (value < getNowLocalDateTimeString()) {
    return "Start date and time cannot be in the past.";
  }
  return null;
};

const validateEndDateTime = (value, startValue) => {
  if (!value) return null;
  if (value < getNowLocalDateTimeString()) {
    return "End date and time cannot be in the past.";
  }
  if (startValue && value < startValue) {
    return "End date and time cannot be before the start date and time.";
  }
  return null;
};

// --- API field-error mapping -------------------------------------------------
// Best-effort: maps a backend field name to the local formData key we use.
// Adjust the right-hand keys/left-hand backend names here if the real API
// error shape (from eventThunk/eventSlice) differs from what's assumed below.
const API_FIELD_MAP = {
  latitude: "latitude",
  longitude: "longitude",
  startDateTime: "startDateTime",
  endDateTime: "endDateTime",
  title: "title",
  name: "title",
  venueName: "venueName",
  address: "address",
  description: "description",
  termsConditions: "termsConditions",
};

// Tries to pull field-level messages out of an API error payload without
// ever handing the raw error object to the UI. Handles a plain
// { field: message } map, and the common { errors: { field: message } } /
// { errors: [{ field, message }] } shapes. Returns null when nothing
// mappable is found, so callers fall back to the existing generic toast.
const extractFieldErrors = (err) => {
  if (!err || typeof err !== "object") return null;

  const source = err.errors && typeof err.errors === "object" ? err.errors : err;
  const mapped = {};

  if (Array.isArray(source)) {
    source.forEach((item) => {
      const key = item?.field && API_FIELD_MAP[item.field];
      if (key && item.message) mapped[key] = item.message;
    });
  } else {
    Object.entries(source).forEach(([field, message]) => {
      const key = API_FIELD_MAP[field];
      if (key && typeof message === "string") mapped[key] = message;
    });
  }

  return Object.keys(mapped).length > 0 ? mapped : null;
};

// Small inline error line, rendered directly under a field.
const FieldError = ({ message, id }) =>
  message ? (
    <p
      id={id}
      className="createEvent__fieldErrorMsg"
      style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "4px", marginBottom: 0 }}
    >
      {message}
    </p>
  ) : null;

const REQUIRED_FIELDS = [
  { key: "title", label: "Title" },
  { key: "startDateTime", label: "Start Date & Time" },
  { key: "endDateTime", label: "End Date & Time" },
  { key: "venueName", label: "Venue Name" },
  { key: "latitude", label: "Latitude" },
  { key: "longitude", label: "Longitude" },
  { key: "address", label: "Address" },
  { key: "description", label: "Description" },
  { key: "termsConditions", label: "Terms & Conditions" },
];

// Tiptap's empty output is "<p></p>", not "", so plain/rich text fields
// need different emptiness checks.
const RICH_TEXT_FIELDS = new Set(["description", "termsConditions"]);

const isRichTextEmpty = (html) =>
  !html || html.replace(/<[^>]*>/g, "").trim() === "";

const isFieldEmpty = (key, value) =>
  RICH_TEXT_FIELDS.has(key)
    ? isRichTextEmpty(value)
    : !value || (typeof value === "string" && value.trim() === "");

const INITIAL_FORM_DATA = {
  title: "",
  startDateTime: "",
  endDateTime: "",
  venueName: "",
  latitude: "",
  longitude: "",
  address: "",
  description: "",
  termsConditions: "",
  videoLink: "",
  videoLinks: [],
};

export default function CreateEvent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success, message } = useSelector((state) => state.event);

  // Single consolidated state object for all plain form fields.
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Image is kept separate from formData: it's a File + derived preview URL,
  // not a plain serializable field, and is appended to FormData independently.
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Field-level validation/API errors, keyed by formData field name, shown
  // directly under their respective inputs instead of via Toastify.
  const [formErrors, setFormErrors] = useState({});

  // Drives the `min` bound on the Start/End datetime-local pickers. Seeded
  // once at mount, then refreshed whenever the user actually interacts with
  // a picker (focus/click) rather than on an interval timer — the value at
  // the moment of interaction is what matters for what's selectable.
  const [nowLocalDateTime, setNowLocalDateTime] = useState(() => getNowLocalDateTimeString());

  const startDateTimeRef = useRef(null);
  const endDateTimeRef = useRef(null);
  const uploadImageInputRef = useRef(null);

  // Generate/revoke the image preview URL whenever the selected file changes.
  useEffect(() => {
    if (!uploadedImage) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(uploadedImage);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadedImage]);

  // Drive success/error feedback, form reset, redirect, and store cleanup
  // from a single source of truth (the slice) rather than duplicating this
  // logic inside handleSubmit's promise chain.
  useEffect(() => {
    if (success) {
      showSuccess(message || "Event created successfully");
      setFormData(INITIAL_FORM_DATA);
      setUploadedImage(null);
      setFormErrors({});
      dispatch(clearEventState());
      navigate("/event");
    } else if (error) {
      // Field-specific API errors go under their field; only a truly
      // generic/unmappable error still falls back to the existing toast.
      const apiFieldErrors = extractFieldErrors(error);
      if (apiFieldErrors) {
        setFormErrors((prev) => ({ ...prev, ...apiFieldErrors }));
      } else {
        showError(typeof error === "string" ? error : "Something went wrong. Please try again.");
      }
      dispatch(clearEventState());
    }
  }, [success, error, message, dispatch, navigate]);

  const openDateTimePicker = useCallback((ref) => {
    setNowLocalDateTime(getNowLocalDateTimeString());
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch (err) {
        el.focus();
      }
    } else {
      el.focus();
    }
  }, []);

  // Also refresh on focus (e.g. Tab key), since focusing doesn't always
  // go through openDateTimePicker's click path.
  const refreshNowLocalDateTime = useCallback(() => {
    setNowLocalDateTime(getNowLocalDateTimeString());
  }, []);

  // Clears a single field's inline error, if any. Used everywhere a field
  // changes so a stale error never lingers once the user starts fixing it.
  const clearFieldError = useCallback((field) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Generic change handler for plain <input>/<textarea> fields bound to formData.
  const handleFieldChange = useCallback(
    (field) => (e) => {
      const val = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: val }));
      clearFieldError(field);
    },
    [clearFieldError]
  );

  // Latitude/Longitude change handler: sanitizes to numeric-only input as the
  // user types or pastes, then clears any existing error for that field.
  const handleCoordinateChange = useCallback(
    (field) => (e) => {
      const sanitized = sanitizeCoordinateInput(e.target.value);
      setFormData((prev) => ({ ...prev, [field]: sanitized }));
      clearFieldError(field);
    },
    [clearFieldError]
  );

  // On blur, surface a format/range error immediately (in addition to the
  // submit-time check) without waiting for the user to hit Create.
  const handleCoordinateBlur = useCallback(
    (field, min, max, label) => (e) => {
      const err = validateCoordinate(e.target.value, min, max, label);
      setFormErrors((prev) => {
        if (!err) {
          if (!prev[field]) return prev;
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return { ...prev, [field]: err };
      });
    },
    []
  );

  // Start Date & Time: validates immediately against the current moment
  // (not just via the picker's `min`, which some browsers/mobile pickers
  // don't fully enforce for the time portion), and re-checks End so an
  // "End before Start" error clears/appears the instant Start changes.
  const handleStartDateTimeChange = useCallback(
    (e) => {
      const val = e.target.value;
      setFormData((prev) => ({ ...prev, startDateTime: val }));
      setFormErrors((prev) => {
        const next = { ...prev };

        const startErr = validateStartDateTime(val);
        if (startErr) next.startDateTime = startErr;
        else delete next.startDateTime;

        const endErr = validateEndDateTime(formData.endDateTime, val);
        if (endErr) next.endDateTime = endErr;
        else delete next.endDateTime;

        return next;
      });
    },
    [formData.endDateTime]
  );

  // End Date & Time: validates immediately against both "now" and Start.
  const handleEndDateTimeChange = useCallback(
    (e) => {
      const val = e.target.value;
      setFormData((prev) => ({ ...prev, endDateTime: val }));
      setFormErrors((prev) => {
        const endErr = validateEndDateTime(val, formData.startDateTime);
        if (!endErr) {
          if (!prev.endDateTime) return prev;
          const next = { ...prev };
          delete next.endDateTime;
          return next;
        }
        return { ...prev, endDateTime: endErr };
      });
    },
    [formData.startDateTime]
  );

  // RichTextEditor passes the HTML string directly (not an event).
  const handleDescriptionChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, description: value }));
    clearFieldError("description");
  }, [clearFieldError]);

  const handleTermsConditionsChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, termsConditions: value }));
    clearFieldError("termsConditions");
  }, [clearFieldError]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      e.target.value = "";
      showError("Please upload a valid image file (PNG, JPG, or JPEG)");
      return;
    }
    setUploadedImage(file);
  }, []);

  const handleChangeImageClick = useCallback(() => {
    uploadImageInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    if (uploadImageInputRef.current) {
      uploadImageInputRef.current.value = "";
    }
  }, []);

  const handleAddVideoLink = useCallback(() => {
    setFormData((prev) => {
      const trimmed = prev.videoLink.trim();
      if (trimmed === "") return prev;
      return {
        ...prev,
        videoLinks: [...prev.videoLinks, trimmed],
        videoLink: "",
      };
    });
  }, []);

  const handleVideoLinkKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddVideoLink();
      }
    },
    [handleAddVideoLink]
  );

  const handleRemoveVideoLink = useCallback((indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      videoLinks: prev.videoLinks.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const handleClose = useCallback(() => {
    navigate("/event");
  }, [navigate]);

  // Builds the multipart payload expected by createEventApi and dispatches
  // the existing Service -> Thunk -> Slice flow. Validation runs first so we
  // never construct FormData (or hit the network) for an invalid submission.
  const handleSubmit = useCallback(async () => {
    if (loading) return; // guards against duplicate submits while a request is in flight

    const errors = {};

    for (const field of REQUIRED_FIELDS) {
      const value = formData[field.key];
      if (isFieldEmpty(field.key, value)) {
        errors[field.key] = `${field.label} is required.`;
      }
    }

    // Latitude / Longitude — skip format/range check if already flagged empty
    // above, so only one error shows per field.
    if (!errors.latitude) {
      const latErr = validateCoordinate(formData.latitude, LAT_MIN, LAT_MAX, "Latitude");
      if (latErr) errors.latitude = latErr;
    }
    if (!errors.longitude) {
      const lonErr = validateCoordinate(formData.longitude, LON_MIN, LON_MAX, "Longitude");
      if (lonErr) errors.longitude = lonErr;
    }

    // Start/End Date & Time — final safety-net check, reusing the exact
    // same validators the live field handlers use (so "now" is evaluated
    // fresh here too, never a stale captured value).
    if (!errors.startDateTime) {
      const startErr = validateStartDateTime(formData.startDateTime);
      if (startErr) errors.startDateTime = startErr;
    }

    if (!errors.endDateTime) {
      const endErr = validateEndDateTime(formData.endDateTime, formData.startDateTime);
      if (endErr) errors.endDateTime = endErr;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const payload = new FormData();
    payload.append("title", formData.title);
    // Attach the explicit IST offset so the stored Date is unambiguous
    // regardless of the server's own timezone (see toISTISOString above).
    payload.append("startDateTime", toISTISOString(formData.startDateTime));
    payload.append("endDateTime", toISTISOString(formData.endDateTime));
    payload.append("venueName", formData.venueName);
    payload.append("latitude", formData.latitude);
    payload.append("longitude", formData.longitude);
    payload.append("address", formData.address);
    payload.append("description", formData.description);
    payload.append("termsConditions", formData.termsConditions);
    payload.append("videoLinks", JSON.stringify(formData.videoLinks));

    if (uploadedImage) {
      payload.append("image", uploadedImage);
    }

    dispatch(createEvent(payload));
  }, [loading, formData, uploadedImage, dispatch]);

  // Derived from the `nowLocalDateTime` state so it stays in sync with
  // whatever the pickers were last refreshed to (see openDateTimePicker /
  // refreshNowLocalDateTime above) — never a separately-stale value.
  const endDateTimeMin =
    formData.startDateTime && formData.startDateTime > nowLocalDateTime
      ? formData.startDateTime
      : nowLocalDateTime;

  return (
    <div className="Event__page">
       <Sidebar/>
         <div className="EventPage__mainArea">
               <Header title="Create Event" />
      <div className="createEvent__container">
        <div className="createEvent__header">
          <h1 className="createEvent__title">Create Event</h1>
          <div className="createEvent__breadcrumb">
           <Link to="/dashboard">Dashboard</Link>
            <span className="createEvent__breadcrumbSep">-</span>
            <span className="createEvent__breadcrumbLink">Event</span>
            <span className="createEvent__breadcrumbLink">Create Event</span>
          </div>
          <button type="button" className="createEvent__backLink" onClick={handleClose}>
            <FaArrowLeft />
            Back Page
          </button>
        </div>

        <div className="createEvent__body">
          <div className="createEvent__grid">
            <div className="createEvent__column">
              <div className="createEvent__fieldGroup">
                <label className="createEvent__label" htmlFor="createEvent-title">
                  Title <span className="createEvent__required">*</span>
                </label>
                <input
                  id="createEvent-title"
                  type="text"
                  className="createEvent__input"
                  placeholder="Enter The Title"
                  value={formData.title}
                  onChange={handleFieldChange("title")}
                  aria-describedby={formErrors.title ? "createEvent-title-error" : undefined}
                />
                <FieldError id="createEvent-title-error" message={formErrors.title} />
              </div>
                     
              <div className="createEvent__fieldRow">
                <div className="createEvent__fieldGroup">
                  <label className="createEvent__label" htmlFor="createEvent-startDateTime">
                    Start Date &amp; Time <span className="createEvent__required">*</span>
                  </label>
                  <div className="createEvent__inputIconWrap">
                    <input
                      id="createEvent-startDateTime"
                      ref={startDateTimeRef}
                      type="datetime-local"
                      className="createEvent__input createEvent__inputWithIcon"
                      value={formData.startDateTime}
                      onChange={handleStartDateTimeChange}
                      onClick={() => openDateTimePicker(startDateTimeRef)}
                      onFocus={refreshNowLocalDateTime}
                      min={nowLocalDateTime}
                      aria-describedby={
                        formErrors.startDateTime ? "createEvent-startDateTime-error" : undefined
                      }
                    />
                    <FaRegCalendarAlt
                      className="createEvent__inputIcon"
                      onClick={() => openDateTimePicker(startDateTimeRef)}
                    />
                  </div>
                  <FieldError
                    id="createEvent-startDateTime-error"
                    message={formErrors.startDateTime}
                  />
                </div>

                <div className="createEvent__fieldGroup">
                  <label className="createEvent__label" htmlFor="createEvent-endDateTime">
                    End Date &amp; Time <span className="createEvent__required">*</span>
                  </label>
                  <div className="createEvent__inputIconWrap">
                    <input
                      id="createEvent-endDateTime"
                      ref={endDateTimeRef}
                      type="datetime-local"
                      className="createEvent__input createEvent__inputWithIcon"
                      value={formData.endDateTime}
                      onChange={handleEndDateTimeChange}
                      onClick={() => openDateTimePicker(endDateTimeRef)}
                      onFocus={refreshNowLocalDateTime}
                      min={endDateTimeMin}
                      aria-describedby={
                        formErrors.endDateTime ? "createEvent-endDateTime-error" : undefined
                      }
                    />
                    <FaRegCalendarAlt
                      className="createEvent__inputIcon"
                      onClick={() => openDateTimePicker(endDateTimeRef)}
                    />
                  </div>
                  <FieldError id="createEvent-endDateTime-error" message={formErrors.endDateTime} />
                </div>
              </div>

              <div className="createEvent__fieldGroup">
                <label className="createEvent__label" htmlFor="createEvent-venueName">
                  venue name <span className="createEvent__required">*</span>
                </label>
                <input
                  id="createEvent-venueName"
                  type="text"
                  className="createEvent__input"
                  placeholder="venue name"
                  value={formData.venueName}
                  onChange={handleFieldChange("venueName")}
                  aria-describedby={formErrors.venueName ? "createEvent-venueName-error" : undefined}
                />
                <FieldError id="createEvent-venueName-error" message={formErrors.venueName} />
              </div>

              <div className="createEvent__fieldRow">
                <div className="createEvent__fieldGroup">
                  <label className="createEvent__label" htmlFor="createEvent-latitude">
                    Latitude <span className="createEvent__required">*</span>
                  </label>
                  <input
                    id="createEvent-latitude"
                    type="text"
                    inputMode="decimal"
                    className="createEvent__input"
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={handleCoordinateChange("latitude")}
                    onBlur={handleCoordinateBlur("latitude", LAT_MIN, LAT_MAX, "Latitude")}
                    aria-describedby={formErrors.latitude ? "createEvent-latitude-error" : undefined}
                  />
                  <FieldError id="createEvent-latitude-error" message={formErrors.latitude} />
                </div>

                <div className="createEvent__fieldGroup">
                  <label className="createEvent__label" htmlFor="createEvent-longitude">
                    Longitude <span className="createEvent__required">*</span>
                  </label>
                  <input
                    id="createEvent-longitude"
                    type="text"
                    inputMode="decimal"
                    className="createEvent__input"
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={handleCoordinateChange("longitude")}
                    onBlur={handleCoordinateBlur("longitude", LON_MIN, LON_MAX, "Longitude")}
                    aria-describedby={
                      formErrors.longitude ? "createEvent-longitude-error" : undefined
                    }
                  />
                  <FieldError id="createEvent-longitude-error" message={formErrors.longitude} />
                </div>
              </div>

              <div className="createEvent__fieldGroup">
                <label className="createEvent__label" htmlFor="createEvent-address">
                  Address <span className="createEvent__required">*</span>
                </label>
                <textarea
                  id="createEvent-address"
                  className="createEvent__input createEvent__addressTextarea"
                  placeholder="Address"
                  rows={1}
                  value={formData.address}
                  onChange={handleFieldChange("address")}
                  aria-describedby={formErrors.address ? "createEvent-address-error" : undefined}
                />
                <FieldError id="createEvent-address-error" message={formErrors.address} />
              </div>

              <div className="createEvent__fieldGroup">
                <label className="createEvent__label" htmlFor="createEvent-uploadImage">Upload Image</label>
                <div className="createEvent__uploadArea">
                  <label className="createEvent__uploadBox" htmlFor="createEvent-uploadImage">
                    <input
                      id="createEvent-uploadImage"
                      ref={uploadImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="createEvent__uploadInput"
                      onChange={handleImageChange}
                    />
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Event preview"
                        className="createEvent__uploadPreviewImg"
                      />
                    ) : (
                      <FaUpload className="createEvent__uploadIcon" />
                    )}
                  </label>

                  {uploadedImage && (
                    <div className="createEvent__uploadInfo">
                      <span className="createEvent__uploadFileName">{uploadedImage.name}</span>
                      <div className="createEvent__uploadActions">
                        <button
                          type="button"
                          className="createEvent__uploadActionBtn createEvent__uploadActionBtn--change"
                          onClick={handleChangeImageClick}
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          className="createEvent__uploadActionBtn createEvent__uploadActionBtn--remove"
                          onClick={handleRemoveImage}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="createEvent__column">
              <div className="createEvent__fieldGroup">
                <label className="createEvent__label" htmlFor="createEvent-description">
                  Description <span className="createEvent__required">*</span>
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Write event description..."
                />
                <FieldError message={formErrors.description} />
              </div>

              <div className="createEvent__fieldGroup">
                <label className="createEvent__label" htmlFor="createEvent-terms">
                  Terms &amp; Condition <span className="createEvent__required">*</span>
                </label>
                <RichTextEditor
                  value={formData.termsConditions}
                  onChange={handleTermsConditionsChange}
                  placeholder="Write terms & conditions..."
                />
                <FieldError message={formErrors.termsConditions} />
              </div>

              <div className="createEvent__fieldGroup">
                <label className="createEvent__label" htmlFor="createEvent-videoLink">
                  Video Link
                </label>
                <div className="createEvent__inlineField">
                  <input
                    id="createEvent-videoLink"
                    type="url"
                    className="createEvent__input"
                    placeholder="Upload Video Link"
                    value={formData.videoLink}
                    onChange={handleFieldChange("videoLink")}
                    onKeyDown={handleVideoLinkKeyDown}
                  />
                  <button
                    type="button"
                    className="createEvent__addVideoButton"
                    onClick={handleAddVideoLink}
                    aria-label="Add video link"
                  >
                    <FaPlus />
                  </button>
                </div>

                {formData.videoLinks.length > 0 && (
                  <ul className="createEvent__videoList">
                    {formData.videoLinks.map((link, index) => (
                      <li key={`${link}-${index}`} className="createEvent__videoListItem">
                        <span className="createEvent__videoListItemText">{link}</span>
                        <button
                          type="button"
                          className="createEvent__videoListItemRemove"
                          onClick={() => handleRemoveVideoLink(index)}
                          aria-label="Remove video link"
                        >
                          <FaTimes />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="createEvent__actions">
            <button type="button" className="createEvent__closeButton" onClick={handleClose}>
              Close
            </button>
            <button
              type="button"
              className="createEvent__createButton"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}