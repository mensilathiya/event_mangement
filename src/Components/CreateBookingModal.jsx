import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import "../assets/CSS/CreateBookingModal.css";
import { createBooking } from "../redux/booking/bookingThunk";
import { clearBookingState } from "../redux/booking/bookingSlice";
import { getAllEvents } from '../redux/event/eventThunk';
import { getAllTicketTypes } from '../redux/ticketType/ticketTypeThunk'
import { showError, showSuccess } from "../utilits/toast";
const initialFormData = {
  eventId: "",
  ticketType: "",
  qty: "",
  amount: "",
  name: "",
  mobile: "",
  email: "",
  discount: "0",
  remark: "",
};
export default function CreateBookingModal({ onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [ticketTypes, setTicketTypes] = useState([]);
  const { events } = useSelector((state) => state.event);
  const activeEvent = events?.find((event) => event.isActive === true);
  const validateForm = () => {

    if (!formData.eventId)
      return "Please select event.";

    if (!formData.ticketType)
      return "Please select ticket.";

    if (!formData.qty || Number(formData.qty) <= 0)
      return "Please enter valid quantity.";

    if (!formData.name.trim())
      return "Please enter name.";

    if (!/^[A-Za-z ]+$/.test(formData.name))
      return "Name is invalid.";

    if (!/^[6-9]\d{9}$/.test(formData.mobile))
      return "Please enter valid mobile number.";

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    )
      return "Please enter valid email.";

    if (Number(formData.discount) < 0)
      return "Discount cannot be negative.";

    return null;
  };
  // event redux
  useEffect(() => {
    if (!events?.length) return;

    const activeEvent = events.find(
      (event) => event.isActive === true
    );

    if (!activeEvent) {
      setFormData(initialFormData);
      setTicketTypes([]);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      eventId: activeEvent._id,
      ticketType: "",
      qty: "",
      amount: "",
    }));

    dispatch(
      getAllTicketTypes({
        eventId: activeEvent._id,
        page: 1,
        limit: 100,
      })
    ).then((response) => {
      if (getAllTicketTypes.fulfilled.match(response)) {
        setTicketTypes(response.payload.ticketTypes || []);
      } else {
        showError("Unable to load ticket types.");
      }
    });
  }, [events, dispatch]);
  const { createLoading, error, success, message } = useSelector(
    (state) => state.booking
  );
  const [formData, setFormData] = useState(initialFormData);
  // handele event changes
  const handleEventChange = async (e) => {
    const eventId = e.target.value;

    setFormData((prev) => ({
      ...prev,
      eventId,
      ticketType: "",
      qty: "",
      amount: "",
    }));

    setTicketTypes([]);

    if (!eventId) return;

    const response = await dispatch(
      getAllTicketTypes({
        eventId,
        page: 1,
        limit: 100,
      })
    );

    if (getAllTicketTypes.fulfilled.match(response)) {
      setTicketTypes(response.payload.ticketTypes || []);
    } else {
      showError("Unable to load ticket types.");
    }
  };
  // handel qty changes
  const handleQtyChange = (e) => {
    const qty = Number(e.target.value) || 0;

    const selectedTicket = ticketTypes.find(
      (ticket) => ticket._id === formData.ticketType
    );

    const ticketPrice = selectedTicket?.amount || 0;

    setFormData((prev) => ({
      ...prev,
      qty,
      amount: qty * ticketPrice,
    }));
  };
  // handel ticket change
  const handleTicketChange = (e) => {
    const ticketId = e.target.value;

    const selectedTicket = ticketTypes.find(
      (ticket) => ticket._id === ticketId
    );

    const price = selectedTicket?.amount || 0;

    setFormData((prev) => ({
      ...prev,
      ticketType: ticketId,
      amount: (prev.qty || 0) * price,
    }));
  };
  // handel change
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };
  // handel create 
  const handleCreate = async () => {
    const validationError = validateForm();

    if (validationError) {
      showError(validationError);
      return;
    }

    const payload = {
      eventId: formData.eventId,
      ticketTypeId: formData.ticketType,
      quantity: Number(formData.qty),
      amount: Number(totalPay),
      name: formData.name.trim(),
      mobileNumber: formData.mobile.trim(),
      email: formData.email.trim(),
      discount: Number(formData.discount),
      remark: formData.remark.trim(),
    };

    try {
      const response = await dispatch(createBooking(payload)).unwrap();

      showSuccess(response.message || "Booking created successfully.");

      setFormData(initialFormData);
      setTicketTypes([]);
      dispatch(clearBookingState());
      onSuccess();
      onClose();

    } catch (error) {
      console.log("Booking Error:", error);
      showError(error?.message || error || "Failed to create booking.");
    }
  };
  // error
  useEffect(() => {

    if (error) {
      showError(error);
      dispatch(clearBookingState());
    }

  }, [error, dispatch]);
  useEffect(() => {
    // The Booking page already loads the full events list into this same
    // Redux slice before this modal can be opened. Only fetch here if
    // that hasn't happened (e.g. the modal is opened from elsewhere), so
    // opening the modal doesn't always trigger a duplicate request.
    if (events?.length) return;

    dispatch(
      getAllEvents({
        page: 1,
        limit: 1000,
        search: "",
      })
    );
  }, [dispatch, events]);
  // discount
  const subtotal = Number(formData.amount || 0);
  const discount = Number(formData.discount || 0);
  const totalPay = Math.max(subtotal - discount, 0);
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
            <select
              className="bookingCreateSelect"
              value={formData.eventId}
              onChange={handleEventChange}
            >
              <option value="">Select Event</option>
              {events
                ?.filter((event) => event.isActive === true)
                .map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title}
                  </option>
                ))}
            </select>
          </div>
          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Ticket <span className="bookingCreateRequired">*</span>
            </label>
            <select
              className="bookingCreateSelect"
              value={formData.ticketType}
              onChange={handleTicketChange}
            >
              <option value="">
                Select Ticket
              </option>
              {
                ticketTypes.map((ticket) => (
                  <option
                    key={ticket._id}
                    value={ticket._id}
                  >
                    {ticket.ticketName}
                  </option>
                ))
              }
            </select>
          </div>
          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Qty <span className="bookingCreateRequired">*</span>
            </label>
            <input
              type="number"
              min="1"
              className="bookingCreateInput"
              placeholder="Qty"
              value={formData.qty}
              onChange={handleQtyChange}
            />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Amount <span className="bookingCreateRequired">*</span>
            </label>
            <input
              type="text"
              className="bookingCreateInput"
              placeholder="Amount"
              value={formData.amount}
              readOnly
            />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Name <span className="bookingCreateRequired">*</span>
            </label>
            <input
              type="text"
              className="bookingCreateInput"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange("name")}
            />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">
              Mobile Number <span className="bookingCreateRequired">*</span>
            </label>
            <input
              type="text"
              className="bookingCreateInput"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange("mobile")}
            />
          </div>

          <div className="bookingCreateFieldGroup bookingCreateFullRow">
            <label className="bookingCreateLabel">Email Id</label>
            <input
              type="email"
              className="bookingCreateInput"
              placeholder="Email Id"
              value={formData.email}
              onChange={handleChange("email")}
            />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">Discount</label>
            <input
              type="number"
              min="0"
              className="bookingCreateInput"
              value={formData.discount}
              onChange={handleChange("discount")}
            />
          </div>

          <div className="bookingCreateFieldGroup">
            <label className="bookingCreateLabel">Remark</label>
            <input
              type="text"
              className="bookingCreateInput"
              placeholder="Remark"
              value={formData.remark}
              onChange={handleChange("remark")}
            />
          </div>
        </div>

        <div className="bookingCreateFooter">
          <div className="bookingCreateTotals">
            <div className="bookingCreateTotalBlock">
              <span className="bookingCreateTotalLabel">TOTAL</span>
              <span className="bookingCreateTotalValue">( * Rs.):₹ {subtotal} </span>
              <span className="bookingCreateDiscountNote">Discount: ₹ {discount}</span>
            </div>

            <div className="bookingCreateTotalBlock">
              <span className="bookingCreateTotalLabel">TOTAL PAY</span>
              <span className="bookingCreateTotalPayValue">RS.₹ {totalPay}</span>
            </div>
          </div>

          <div className="bookingCreateActions">
            <button
              type="button"
              className="bookingCreateCloseButton"
              onClick={onClose}
              disabled={createLoading}
            >
              Close
            </button>
            <button
              type="button"
              className="bookingCreateCreateButton"
              onClick={handleCreate}
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}