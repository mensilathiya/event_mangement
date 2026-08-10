import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
      dispatch(clearEventState());
      navigate("/event");
    } else if (error) {
      showError(error);
      dispatch(clearEventState());
    }
  }, [success, error, message, dispatch, navigate]);

  const openDateTimePicker = useCallback((ref) => {
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

  // Generic change handler for plain <input>/<textarea> fields bound to formData.
  const handleFieldChange = useCallback(
    (field) => (e) => {
      const val = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: val }));
    },
    []
  );

  // RichTextEditor passes the HTML string directly (not an event).
  const handleDescriptionChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  }, []);

  const handleTermsConditionsChange = useCallback((value) => {
    setFormData((prev) => ({ ...prev, termsConditions: value }));
  }, []);

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

    for (const field of REQUIRED_FIELDS) {
      const value = formData[field.key];
      if (isFieldEmpty(field.key, value)) {
        showError(`${field.label} is required`);
        return;
      }
    }

    if (Number.isNaN(Number(formData.latitude))) {
      showError("Latitude must be a valid number");
      return;
    }

    if (Number.isNaN(Number(formData.longitude))) {
      showError("Longitude must be a valid number");
      return;
    }

    // Compare using the same wall-clock values the Admin actually selected
    // (browser-local, i.e. IST) rather than any server timezone assumption.
    if (new Date(formData.startDateTime) < new Date()) {
      showError("Start Date & Time cannot be in the past");
      return;
    }

    if (new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
      showError("End Date & Time must be after Start Date & Time");
      return;
    }

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

  return (
    <div className="Event__page">
       <Sidebar/>
         <div className="EventPage__mainArea">
               <Header title="Create Event" />
      <div className="createEvent__container">
        <div className="createEvent__header">
          <h1 className="createEvent__title">Create Event</h1>
          <div className="createEvent__breadcrumb">
            <span>Dashboard</span>
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
                />
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
                      onChange={handleFieldChange("startDateTime")}
                      onClick={() => openDateTimePicker(startDateTimeRef)}
                    />
                    <FaRegCalendarAlt
                      className="createEvent__inputIcon"
                      onClick={() => openDateTimePicker(startDateTimeRef)}
                    />
                  </div>
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
                      onChange={handleFieldChange("endDateTime")}
                      onClick={() => openDateTimePicker(endDateTimeRef)}
                    />
                    <FaRegCalendarAlt
                      className="createEvent__inputIcon"
                      onClick={() => openDateTimePicker(endDateTimeRef)}
                    />
                  </div>
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
                />
              </div>

              <div className="createEvent__fieldRow">
                <div className="createEvent__fieldGroup">
                  <label className="createEvent__label" htmlFor="createEvent-latitude">
                    Latitude <span className="createEvent__required">*</span>
                  </label>
                  <input
                    id="createEvent-latitude"
                    type="text"
                    className="createEvent__input"
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={handleFieldChange("latitude")}
                  />
                </div>

                <div className="createEvent__fieldGroup">
                  <label className="createEvent__label" htmlFor="createEvent-longitude">
                    Longitude <span className="createEvent__required">*</span>
                  </label>
                  <input
                    id="createEvent-longitude"
                    type="text"
                    className="createEvent__input"
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={handleFieldChange("longitude")}
                  />
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
                />
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