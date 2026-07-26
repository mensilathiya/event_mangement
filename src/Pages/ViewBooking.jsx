import React, { useState } from "react";
import "../assets/CSS/ViewBooking.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import BookingUserModal from "../Components/BookingUserModal";
import BookingResendModal from "../Components/BookingResendModal";
import { Link } from "react-router-dom";

const bookingDetails = {
  name: "Mukesh bhai",
  mobile: "9879035711",
  email: "-",
  eventName: "RANGE SANGE SHUBH NAVRATRI - 2026",
  ticketType: "Advance Tier",
  qty: 5,
  discount: "-",
  price: "Rs. 11500",
  remark: "Payment baki",
  totalPay: "Rs. 57500",
  discountNote: "No Discount",
};

const members = [1, 2, 3, 4, 5].map((num) => ({
  id: num,
  name: "-",
  mobile: "-",
  email: "-",
}));

function QrPlaceholder() {
  return (
    <svg
      className="bookingView-qrIcon"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="12" height="12" fill="none" stroke="#1b2a4e" strokeWidth="2" />
      <rect x="6" y="6" width="4" height="4" fill="#1b2a4e" />
      <rect x="26" y="2" width="12" height="12" fill="none" stroke="#1b2a4e" strokeWidth="2" />
      <rect x="30" y="6" width="4" height="4" fill="#1b2a4e" />
      <rect x="2" y="26" width="12" height="12" fill="none" stroke="#1b2a4e" strokeWidth="2" />
      <rect x="6" y="30" width="4" height="4" fill="#1b2a4e" />
      <rect x="18" y="2" width="4" height="4" fill="#1b2a4e" />
      <rect x="18" y="10" width="4" height="4" fill="#1b2a4e" />
      <rect x="18" y="18" width="4" height="4" fill="#1b2a4e" />
      <rect x="26" y="18" width="4" height="4" fill="#1b2a4e" />
      <rect x="34" y="18" width="4" height="4" fill="#1b2a4e" />
      <rect x="18" y="26" width="4" height="4" fill="#1b2a4e" />
      <rect x="18" y="34" width="4" height="4" fill="#1b2a4e" />
      <rect x="26" y="34" width="4" height="4" fill="#1b2a4e" />
      <rect x="34" y="26" width="4" height="4" fill="#1b2a4e" />
      <rect x="34" y="34" width="4" height="4" fill="#1b2a4e" />
    </svg>
  );
}

function AvatarPlaceholder() {
  return (
    <svg
      className="bookingView-avatarIcon"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="8" r="4" fill="#ffffff" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="#ffffff" />
    </svg>
  );
}

const ViewBooking = () => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isBookingUserModalOpen, setIsBookingUserModalOpen] = useState(false);
  const [resendMobile, setResendMobile] = useState(null);

  const toggleMenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bookingPage-wrapper">
      <Sidebar />
      <div className="bookingPageMainArea">
        <Header title="View Booking" />
        <div className="bookingView-wrapper">
          <div className="bookingView-header">
            <h1 className="bookingView-title">View Booking</h1>
            <div className="bookingView-breadcrumb">
              <span>Dashboard</span>
              <span className="bookingView-breadcrumbSep">-</span>
              <span className="bookingView-breadcrumbActive">View Booking</span>
            </div>
          </div>

          <Link to={'/booking'} className="bookingView-backLink">
            <span className="bookingView-backArrow">&#8592;</span> Back Page
          </Link>

          <div className="bookingView-content">
            <div className="bookingView-detailsCard">
              <h2 className="bookingView-detailsTitle">Details</h2>

              <div className="bookingView-detailsList">
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Name</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.name}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Mobile No.</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.mobile}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Email</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.email}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Event Name</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.eventName}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Ticket Type</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.ticketType}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">QTY</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.qty}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Discount</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.discount}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Price</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.price}</span>
                </div>
                <div className="bookingView-detailsRow">
                  <span className="bookingView-detailsLabel">Remark</span>
                  <span className="bookingView-detailsColon">:</span>
                  <span className="bookingView-detailsValue">{bookingDetails.remark}</span>
                </div>
              </div>

              <div className="bookingView-totalPayRow">
                <div className="bookingView-totalPayLeft">
                  <span className="bookingView-totalPayLabel">Total Pay</span>
                  <span className="bookingView-totalPaySub">
                    ({bookingDetails.qty} x {bookingDetails.price.replace("Rs. ", "Rs.")})
                  </span>
                  <span className="bookingView-discountNote">
                    Discount: {bookingDetails.discountNote}
                  </span>
                </div>
                <span className="bookingView-totalPayValue">{bookingDetails.totalPay}</span>
              </div>
            </div>

            <div className="bookingView-membersCard">
              {openMenuId !== null && (
                <div
                  onClick={() => setOpenMenuId(null)}
                  style={{ position: "fixed", inset: 0, zIndex: 15 }}
                />
              )}

              <div className="bookingView-tableWrap">
                <table className="bookingView-table">
                  <thead>
                    <tr>
                      <th className="bookingView-hashCol">#</th>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Mobile No.</th>
                      <th>Email Id</th>
                      <th>QR Code</th>
                      <th className="bookingView-actionCol">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.id}</td>
                        <td>
                          <span className="bookingView-avatar">
                            <AvatarPlaceholder />
                          </span>
                        </td>
                        <td>{member.name}</td>
                        <td>{member.mobile}</td>
                        <td>{member.email}</td>
                        <td>
                          <QrPlaceholder />
                        </td>
                        <td className="bookingView-actionCol">
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              type="button"
                              className="bookingView-actionMenuBtn"
                              aria-label="Row actions"
                              onClick={() => toggleMenu(member.id)}
                            >
                              &#8226;&#8226;&#8226;
                            </button>

                            {openMenuId === member.id && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 6px)",
                                  right: 0,
                                  backgroundColor: "#ffffff",
                                  borderRadius: "10px",
                                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                                  padding: "8px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "2px",
                                  minWidth: "150px",
                                  zIndex: 20,
                                }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    padding: "9px 12px",
                                    borderRadius: "8px",
                                    fontSize: "13.5px",
                                    color: "#3a3d4d",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    background: "transparent",
                                    border: "none",
                                  }}
                                  onClick={() => {
                                    setIsBookingUserModalOpen(true);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  Add Details
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    padding: "9px 12px",
                                    borderRadius: "8px",
                                    fontSize: "13.5px",
                                    color: "#3a3d4d",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    background: "transparent",
                                    border: "none",
                                  }}
                                  onClick={() => {
                                    setResendMobile(member.mobile);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  Resend Details
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isBookingUserModalOpen && (
        <div
          tabIndex={-1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsBookingUserModalOpen(false);
            }
          }}
        >
          <BookingUserModal onClose={() => setIsBookingUserModalOpen(false)} />
        </div>
      )}

      {resendMobile && (
        <div
          tabIndex={-1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setResendMobile(null);
            }
          }}
        >
          <BookingResendModal
            mobileNumber={resendMobile}
            onClose={() => setResendMobile(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ViewBooking;
