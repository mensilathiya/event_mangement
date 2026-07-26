import React from "react";
import "../assets/CSS/CreateTicketTypeModal.css";

const CreateTicketTypeModal = ({
  isOpen = true,
  onClose = () => {},
  eventName = "RANGE SANGE SHUBH NAVRATRI - 2026",
  isEditMode = false,
  selectedTicketType = null,
}) => {
  if (!isOpen) return null;

  const modalTitle = isEditMode ? "Edit Ticket Type" : "Add Ticket Type";
  const submitLabel = isEditMode ? "Save" : "Create";

  return (
    <div className="ticketTypeCreate-overlay">
      <div
        className="ticketTypeCreate-modal"
        key={selectedTicketType ? selectedTicketType.id : "new"}
      >
        <div className="ticketTypeCreate-header">
          <h2 className="ticketTypeCreate-title">
            {modalTitle} <span className="ticketTypeCreate-eventName">({eventName})</span>
          </h2>
          <button
            type="button"
            className="ticketTypeCreate-closeIcon"
            onClick={onClose}
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        <div className="ticketTypeCreate-body">
          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">
              Ticket Name <span className="ticketTypeCreate-required">*</span>
            </label>
            <input
              type="text"
              className="ticketTypeCreate-input"
              placeholder="Ticket Name"
              defaultValue={selectedTicketType?.ticketName || ""}
            />
          </div>

          <div className="ticketTypeCreate-row">
            <div className="ticketTypeCreate-field ticketTypeCreate-fieldHalf">
              <label className="ticketTypeCreate-label">
                Allow Day count <span className="ticketTypeCreate-required">*</span>
              </label>
              <input
                type="text"
                className="ticketTypeCreate-input"
                placeholder="Allow Day count"
                defaultValue={selectedTicketType?.allowDayCount ?? ""}
              />
            </div>

            <div className="ticketTypeCreate-field ticketTypeCreate-fieldHalf">
              <label className="ticketTypeCreate-label">
                Amount <span className="ticketTypeCreate-required">*</span>
              </label>
              <input
                type="text"
                className="ticketTypeCreate-input"
                placeholder="Amount"
                defaultValue={selectedTicketType?.amount ?? ""}
              />
            </div>
          </div>

          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">Allow Date</label>
            <div className="ticketTypeCreate-inputWithIcon">
              <input
                type="text"
                className="ticketTypeCreate-input"
                placeholder="Pick date"
                defaultValue={selectedTicketType?.allowDate || ""}
              />
              <span className="ticketTypeCreate-inputIcon">&#128197;</span>
            </div>
          </div>

          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">
              Available Count <span className="ticketTypeCreate-required">*</span>
            </label>
            <input
              type="text"
              className="ticketTypeCreate-input"
              placeholder="Available Count"
              defaultValue={selectedTicketType?.availableCount ?? ""}
            />
          </div>

          <div className="ticketTypeCreate-field">
            <label className="ticketTypeCreate-label">
              Description <span className="ticketTypeCreate-required">*</span>
            </label>
            <textarea
              className="ticketTypeCreate-textarea"
              placeholder="Description"
              rows="4"
              defaultValue={selectedTicketType?.description || ""}
            />
          </div>
        </div>

        <div className="ticketTypeCreate-footer">
          <button
            type="button"
            className="ticketTypeCreate-closeBtn"
            onClick={onClose}
          >
            Close
          </button>
          <button type="button" className="ticketTypeCreate-createBtn">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketTypeModal;
