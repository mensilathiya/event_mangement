import "../assets/CSS/DeleteBookingModal.css";

export default function DeleteBookingModal({ bookingId, userName, mobileNumber, onClose }) {
  return (
    <div className="bookingDeleteOverlay" onClick={onClose}>
      <div className="bookingDeleteContainer" onClick={(e) => e.stopPropagation()}>
        <h2 className="bookingDeleteTitle">Delete Booking</h2>

        <p className="bookingDeleteMessage">
          Are you sure want to delete Booking{" "}
          <span className="bookingDeleteHighlight">#{bookingId}</span> for user{" "}
          <span className="bookingDeleteHighlight">{userName}</span> (
          <span className="bookingDeleteHighlight">{mobileNumber}</span>) ?
        </p>

        <div className="bookingDeleteFieldGroup">
          <label className="bookingDeleteLabel">
            Delete Remark <span className="bookingDeleteRequired">*</span>
          </label>
          <textarea
            className="bookingDeleteTextarea"
            placeholder="Enter Remark"
            rows={2}
          />
        </div>

        <div className="bookingDeleteFooter">
          <button type="button" className="bookingDeleteCloseBtn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="bookingDeleteDeleteBtn">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
