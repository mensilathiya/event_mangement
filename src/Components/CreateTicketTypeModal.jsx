import React, { useState, useEffect } from "react";
import "../assets/CSS/CreateTicketTypeModal.css";
import { useDispatch, useSelector } from "react-redux";
import { createTicketType, updateTicketType, getAllTicketTypes } from "../redux/ticketType/ticketTypeThunk";
import { clearTicketTypeState } from "../redux/ticketType/ticketTypeSlice";
import dayjs from "dayjs";
import MultipleDatePicker from "../Components/MultipleDatePicker";

const CreateTicketTypeModal = ({
  isOpen = true,
  onClose = () => { },
  eventId = null,
  eventName,
  isEditMode = false,
  selectedTicketType = null,
  currentPage = 1,
  rowsPerPage = 10,
  search = "",
}) => {
  const dispatch = useDispatch();

  const { loading, success, error } = useSelector((state) => state.ticketType);

  const [formData, setFormData] = useState({
    ticketName: "",
    allowDayCount: "",
    amount: "",
    allowDates: [],
    availableCount: "",
    description: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // ================= PREFILL ON EDIT =================
  useEffect(() => {
    if (isEditMode && selectedTicketType) {
      setFormData({
        ticketName: selectedTicketType.ticketName || "",
        allowDayCount: selectedTicketType.allowDayCount || "",
        amount: selectedTicketType.amount || "",
        allowDates: selectedTicketType.allowDates || [],
        availableCount: selectedTicketType.availableCount || "",
        description: selectedTicketType.description || "",
      });
    } else {
      setFormData({
        ticketName: "",
        allowDayCount: "",
        amount: "",
        allowDates: [],
        availableCount: "",
        description: "",
      });
    }
  }, [isEditMode, selectedTicketType]);

  // ================= HANDLE FIELD CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ================= VALIDATION =================
  const validate = () => {
    const errors = {};

    if (!formData.ticketName.trim())
      errors.ticketName = "Ticket name is required";

    if (!formData.allowDayCount)
      errors.allowDayCount = "Allow day count is required";

    if (formData.allowDates.length === 0)
      errors.allowDates = "Please select at least one date";

    if (
      Number(formData.allowDayCount) !== formData.allowDates.length
    ) {
      errors.allowDates =
        "Allow Day Count must match selected dates";
    }

    // Mirrors the backend's past-date rejection so the user gets
    // immediate feedback instead of a failed submit round-trip.
    const today = dayjs().startOf("day");
    const hasPastDate = formData.allowDates.some((date) =>
      dayjs(date).isBefore(today)
    );

    if (hasPastDate) {
      errors.allowDates =
        "Allow Dates cannot include a date that has already passed";
    }

    if (!formData.amount)
      errors.amount = "Amount is required";

    if (!formData.availableCount)
      errors.availableCount = "Available count is required";

    if (!formData.description.trim())
      errors.description = "Description is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ================= HANDLE SUBMIT (CREATE / UPDATE) =================
  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      eventId: selectedTicketType?.eventId || eventId,
      ticketName: formData.ticketName,
      allowDayCount: Number(formData.allowDayCount),
      amount: Number(formData.amount),
      // allowDates are already normalized "YYYY-MM-DD" strings from
      // MultipleDatePicker — previously this ran them through
      // `new Date(date).toISOString()`, which risked shifting the date
      // by a day for users in timezones ahead of UTC.
      allowDates: formData.allowDates,
      availableCount: Number(formData.availableCount),
      description: formData.description,
    };

    if (isEditMode && selectedTicketType?._id) {
      dispatch(updateTicketType({ id: selectedTicketType._id, data: payload }));
    } else {
      dispatch(createTicketType(payload));
    }
  };

  // ================= SUCCESS HANDLING =================
  useEffect(() => {
    if (success) {
      // Refetch using the list's actual current page/limit/search instead
      // of hardcoded defaults, so create/edit no longer silently resets
      // the user's pagination and search.
      dispatch(
        getAllTicketTypes({
          eventId,
          page: currentPage,
          limit: rowsPerPage,
          search,
        })
      );

      onClose();

      dispatch(clearTicketTypeState());
    }
  }, [success, dispatch, eventId, currentPage, rowsPerPage, search, onClose]);

  // ================= RESET STATE ON CLOSE =================
  const handleClose = () => {
    dispatch(clearTicketTypeState());
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = isEditMode ? "Edit Ticket Type" : "Add Ticket Type";
  const submitLabel = isEditMode ? "Save" : "Create";

  return (
    <div className="ticketTypeCreate-overlay">
      <div
        className="ticketTypeCreate-modal"
        key={selectedTicketType ? selectedTicketType._id : "new"}
      >
        <div className="ticketTypeCreate-header">
          <h2 className="ticketTypeCreate-title">
            {modalTitle} <span className="ticketTypeCreate-eventName">({eventName})</span>
          </h2>
          <button
            type="button"
            className="ticketTypeCreate-closeIcon"
            onClick={handleClose}
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        <div className="ticketTypeCreate-body">
          {error && <p className="ticketTypeCreate-error">{error}</p>}

          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">
              Ticket Name <span className="ticketTypeCreate-required">*</span>
            </label>
            <input
              type="text"
              name="ticketName"
              value={formData.ticketName}
              onChange={handleChange}
              className="ticketTypeCreate-input"
              placeholder="Ticket Name"
            />
            {formErrors.ticketName && (
              <span className="ticketTypeCreate-fieldError">{formErrors.ticketName}</span>
            )}
          </div>

          <div className="ticketTypeCreate-row">
            <div className="ticketTypeCreate-field ticketTypeCreate-fieldHalf">
              <label className="ticketTypeCreate-label">
                Allow Day count <span className="ticketTypeCreate-required">*</span>
              </label>
              <input
                type="number"
                name="allowDayCount"
                value={formData.allowDayCount}
                onChange={handleChange}
                className="ticketTypeCreate-input"
                placeholder="Allow Day Count"
              />
              {formErrors.allowDayCount && (
                <span className="ticketTypeCreate-fieldError">{formErrors.allowDayCount}</span>
              )}
            </div>

            <div className="ticketTypeCreate-field ticketTypeCreate-fieldHalf">
              <label className="ticketTypeCreate-label">
                Amount <span className="ticketTypeCreate-required">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="ticketTypeCreate-input"
                placeholder="Amount"
              />
              {formErrors.amount && (
                <span className="ticketTypeCreate-fieldError">{formErrors.amount}</span>
              )}
            </div>
          </div>
          {/* date */}
          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">
              Allow Dates <span className="ticketTypeCreate-required">*</span>
            </label>

            <MultipleDatePicker
              value={formData.allowDates}
              onChange={(dates) =>
                setFormData((prev) => ({
                  ...prev,
                  allowDates: dates,
                }))
              }
            />

            {formErrors.allowDates && (
              <span className="ticketTypeCreate-fieldError">
                {formErrors.allowDates}
              </span>
            )}
          </div>

          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">
              Available Count <span className="ticketTypeCreate-required">*</span>
            </label>
            <input
              type="number"
              name="availableCount"
              value={formData.availableCount}
              onChange={handleChange}
              className="ticketTypeCreate-input"
              placeholder="Available Count"
            />
            {formErrors.availableCount && (
              <span className="ticketTypeCreate-fieldError">{formErrors.availableCount}</span>
            )}
          </div>

          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">
              Description <span className="ticketTypeCreate-required">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="ticketTypeCreate-textarea"
              rows={4}
              placeholder="Description"
            />
            {formErrors.description && (
              <span className="ticketTypeCreate-fieldError">{formErrors.description}</span>
            )}
          </div>
        </div>

        <div className="ticketTypeCreate-footer">
          <button
            type="button"
            className="ticketTypeCreate-closeBtn"
            onClick={handleClose}
          >
            Close
          </button>
          <button
            type="button"
            className="ticketTypeCreate-createBtn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (isEditMode ? "Saving..." : "Creating...") : submitLabel}
          </button>
        </div>
      </div>
    </div >
  );
};

export default CreateTicketTypeModal;