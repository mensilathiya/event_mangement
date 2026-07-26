import "../assets/CSS/ResendTicketModal.css";

export default function ResendTicketModal({ mobileNumber, onClose }) {
  return (
    <div className="bookingResendOverlay" onClick={onClose}>
      <div className="bookingResendContainer" onClick={(e) => e.stopPropagation()}>
        <div className="bookingResendIconWrap">
          <svg
            className="bookingResendIcon"
            viewBox="0 0 70 70"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="35"
              cy="35"
              r="31"
              fill="none"
              stroke="#f2c744"
              strokeWidth="4"
            />
            <rect x="32.5" y="18" width="5" height="24" rx="2.5" fill="#f2c744" />
            <circle cx="35" cy="50" r="3" fill="#f2c744" />
          </svg>
        </div>

        <h2 className="bookingResendTitle">Are you sure!</h2>

        <p className="bookingResendMessage">
          You want to resend the message to this mobile number:{" "}
          <span className="bookingResendMobile">{mobileNumber}</span>
        </p>

        <button type="button" className="bookingResendOkayBtn" onClick={onClose}>
          Okay
        </button>
      </div>
    </div>
  );
}
