import { FaTimes } from "react-icons/fa";
import "../assets/CSS/CreateBookingModal.css";

export default function CreateBookingModal({ onClose }) {
  return (
    <div className="bookingCreateOverlay" onClick={onClose}>
      <div className="bookingCreateContainer" onClick={(e) => e.stopPropagation()}>
        <div className="bookingCreateHeader">
          <h2 className="bookingCreateTitle">Book Ticket</h2>
          <button
            type="button"
            className="bookingCreateCloseIconButton"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="bookingCreateGrid">
          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Event <span className="bookingCreateRequired">*</span>
            </label>
            <select className="bookingCreateSelect" defaultValue="">
              <option value="" disabled>
                select an option
              </option>
              <option value="event1">RANGE SANGE SHUBH NAVRATRI - 2026</option>
            </select>
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Ticket <span className="bookingCreateRequired">*</span>
            </label>
            <select className="bookingCreateSelect" defaultValue="">
              <option value="" disabled>
                {" "}
              </option>
              <option value="advance">Advance Tier</option>
            </select>
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Qty <span className="bookingCreateRequired">*</span>
            </label>
            <input type="text" className="bookingCreateInput" placeholder="Qty" />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Amount <span className="bookingCreateRequired">*</span>
            </label>
            <input type="text" className="bookingCreateInput" placeholder="Amount" />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Name <span className="bookingCreateRequired">*</span>
            </label>
            <input type="text" className="bookingCreateInput" placeholder="Name" />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Mobile Number <span className="bookingCreateRequired">*</span>
            </label>
            <input type="text" className="bookingCreateInput" placeholder="Mobile Number" />
          </div>

          <div className="bookingCreateFieldGroup bookingCreateFullRow">
            <label className="bookingCreateLabel">Email Id</label>
            <input type="email" className="bookingCreateInput" placeholder="Email Id" />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">Discount</label>
            <input type="text" className="bookingCreateInput" defaultValue="0" />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">Remark</label>
            <input type="text" className="bookingCreateInput" placeholder="Remark" />
          </div>
        </div>

        <div className="bookingCreateFooter">
          <div className="bookingCreateTotals">
            <div className="bookingCreateTotalBlock">
              <span className="bookingCreateTotalLabel">TOTAL</span>
              <span className="bookingCreateTotalValue">( * Rs.):0</span>
              <span className="bookingCreateDiscountNote">Discount: 0</span>
            </div>

            <div className="bookingCreateTotalBlock">
              <span className="bookingCreateTotalLabel">TOTAL PAY</span>
              <span className="bookingCreateTotalPayValue">RS. 0</span>
            </div>
          </div>

          <div className="bookingCreateActions">
            <button type="button" className="bookingCreateCloseButton" onClick={onClose}>
              Close
            </button>
            <button type="button" className="bookingCreateCreateButton">
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
