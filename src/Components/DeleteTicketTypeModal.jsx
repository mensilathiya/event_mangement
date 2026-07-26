import React from "react";
import "../assets/CSS/DeleteTicketTypeModal.css";

const DeleteTicketTypeModal = ({
  isOpen = true,
  onClose = () => {},
  onDelete = () => {},
  ticketName = "Fast 100 SESSON PASS 4 DAYS",
}) => {
  if (!isOpen) return null;

  return (
    <div className="ticketTypeDelete-overlay">
      <div className="ticketTypeDelete-modal">
        <h2 className="ticketTypeDelete-title">Delete Ticket Type</h2>

        <p className="ticketTypeDelete-message">
          Are you sure you want to delete{" "}
          <span className="ticketTypeDelete-ticketName">{ticketName}</span>?
        </p>

        <div className="ticketTypeDelete-footer">
          <button
            type="button"
            className="ticketTypeDelete-closeBtn"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="ticketTypeDelete-deleteBtn"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTicketTypeModal;
