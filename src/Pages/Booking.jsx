import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../assets/CSS/Booking.css';
import CreateBookingModal from "../Components/CreateBookingModal";
import ResendTicketModal from "../Components/ResendTicketModal";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import DeleteBookingModal from "../Components/DeleteBookingModal";
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const bookingRows = [
  { id: 148, name: "Harisingh sisodia", mobile: "9825191706", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 3, amount: "Rs. 34500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 09:29 pm" },
  { id: 147, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:53 pm" },
  { id: 146, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:52 pm" },
  { id: 145, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:51 pm" },
  { id: 144, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:50 pm" },
  { id: 143, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:49 pm" },
  { id: 142, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:49 pm" },
  { id: 141, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:48 pm" },
  { id: 140, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:47 pm" },
  { id: 139, name: "Ruchita khunt", mobile: "9687087610", event: "RANGE SANGE SHUBH NAVRATRI - 2026", ticket: "Advance Tier", qty: 1, amount: "Rs. 11500", createdBy: "Jayshree Katariya", createdAt: "16-07-2026 12:45 pm" },
];

const columns = ["ID", "Name", "Mobile Number", "Event", "Ticket", "Qty", "Amount", "Created By"];
const pageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const Booking = () => {
  // date
 const [showDate, setShowDate] = useState(false);

 const [range, setRange] = useState([
  {
    startDate: new Date(2026, 5, 22),
    endDate: new Date(2026, 6, 21),
    key: 'selection',
  },
]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [openActionId, setOpenActionId] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resendTarget, setResendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const filteredRows = bookingRows
    .filter((row) => row.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, Number(rowsPerPage));

  const totalQty = bookingRows.reduce((sum, row) => sum + row.qty, 0);
  const totalAmount = bookingRows.reduce(
    (sum, row) => sum + Number(row.amount.replace(/[^\d]/g, "")),
    0
  );

  const toggleActionMenu = (id) => {
    setOpenActionId((prev) => (prev === id ? null : id));
  };

  return (
    <>

      <div className="bookingPage-wrapper">
        <Sidebar />
        <div className="bookingPageMainArea">
          <Header title="Booking" />
          <div className="bookingPageContent">
            <div className="bookingPage-header">
              <div className="bookingPage-headerLeft">
                <h1 className="bookingPage-title">Booking</h1>
                <div className="bookingPage-breadcrumb">
                  <span>Dashboard</span>
                  <span className="bookingPage-breadcrumbSep">-</span>
                  <span className="bookingPage-breadcrumbActive">Booking</span>
                </div>
              </div>
              <button
                type="button"
                className="bookingPage-createBtn"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <span className="bookingPage-createBtnIcon">+</span> Create Booking
              </button>
            </div>

            <div className="bookingPage-filterCard">
              <div className="bookingPage-filterGrid">
                <input type="text" className="bookingPage-filterInput" placeholder="Booking Id" />
                <input type="text" className="bookingPage-filterInput" placeholder="Mobile Number" />
                <input type="text" className="bookingPage-filterInput" placeholder="Name" />

                <select className="bookingPage-filterSelect" defaultValue="">
                  <option value="" disabled>
                    select an option
                  </option>
                  <option value="event1">RANGE SANGE SHUBH NAVRATRI - 2026</option>
                </select>

                {/* booking page */}
                <div className="bookingPage-dateWrap">
  <input
    type="text"
    readOnly
    className="bookingPage-filterInput"
    value={`${format(range[0].startDate, 'yyyy/MM/dd')} - ${format(
      range[0].endDate,
      'yyyy/MM/dd'
    )}`}
    onClick={() => setShowDate(!showDate)}
  />

  {showDate && (
    <>
      <div
        className="bookingPage-dateOverlay"
        onClick={() => setShowDate(false)}
      />

      <div className="bookingPage-datePopup">
        <DateRange
          ranges={range}
          onChange={(item) => setRange([item.selection])}
          months={2}
          direction="horizontal"
          showDateDisplay={false}
          rangeColors={['#2563eb']}
        />

        <div className="bookingPage-dateFooter">
          <button
            type="button"
            className="cancelBtn"
            onClick={() => setShowDate(false)}
          >
            Cancel
          </button>

          <button
            type="button"
            className="applyBtn"
            onClick={() => setShowDate(false)}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  )}
</div>

                <input type="text" className="bookingPage-filterInput" placeholder="Created by" />

                <select className="bookingPage-filterSelect bookingPage-statusSelect" defaultValue="success">
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="bookingPage-filterActions">
                <button type="button" className="bookingPage-searchBtn">
                  Search
                </button>
                <button type="button" className="bookingPage-resetBtn">
                  Reset
                </button>
              </div>
            </div>

            <div className="bookingPage-card">
              <div className="bookingPage-toolbar">
                <div className="bookingPage-toolbarLeft">
                  <select
                    className="bookingPage-pageSizeSelect"
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(e.target.value)}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>

                  <div className="bookingPage-searchBox">
                    <span className="bookingPage-searchIcon">&#128269;</span>
                    <input
                      type="text"
                      className="bookingPage-searchInput"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <button type="button" className="bookingPage-exportBtn">
                  <span className="bookingPage-exportBtnIcon">&#128196;</span> Export Booking
                </button>
              </div>

              <div className="bookingPage-tableWrap">
                <table className="bookingPage-table">
                  <thead>
                    <tr>
                      <th className="bookingPage-hashCol">#</th>
                      {columns.map((col) => (
                        <th key={col}>
                          <span className="bookingPage-thContent">
                            <span className="bookingPage-sortIcon">&#8645;</span>
                            {col}
                          </span>
                        </th>
                      ))}
                      <th className="bookingPage-actionCol">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => (
                      <tr key={row.id}>
                        <td>{index + 1}</td>
                        <td>{row.id}</td>
                        <td className="bookingPage-nameCell">{row.name}</td>
                        <td>{row.mobile}</td>
                        <td className="bookingPage-eventCell">{row.event}</td>
                        <td>{row.ticket}</td>
                        <td>{row.qty}</td>
                        <td>{row.amount}</td>
                        <td className="bookingPage-createdCell">
                          {row.createdBy}
                          <br />
                          {row.createdAt}
                        </td>
                        <td className="bookingPage-actionCol">
                          <div className="bookingPage-actionDropdownWrap">
                            <button
                              type="button"
                              className="bookingPage-actionBtn"
                              onClick={() => toggleActionMenu(row.id)}
                            >
                              Action <span className="bookingPage-actionCaret">&#9662;</span>
                            </button>

                            {openActionId === row.id && (
                              <div className="bookingPage-actionMenu">
                                <button
                                  type="button"
                                  className="bookingPage-actionMenuItem"
                                  onClick={() => navigate("/view-booking")}
                                >
                                  View Booking
                                </button>
                                <button
                                  type="button"
                                  className="bookingPage-actionMenuItem"
                                  onClick={() => navigate("/register-users")}
                                >
                                  Register Users
                                </button>
                                <button
                                  type="button"
                                  className="bookingPage-actionMenuItem"
                                  onClick={() => {
                                    setResendTarget(row.mobile);
                                    setOpenActionId(null);
                                  }}
                                >
                                  Resend Ticket
                                </button>
                                <button
                                  type="button"
                                  className="bookingPage-actionMenuItem"
                                  onClick={() => {
                                    setDeleteTarget({
                                      id: row.id,
                                      name: row.name,
                                      mobile: row.mobile,
                                    });
                                    setOpenActionId(null);
                                  }}
                                >
                                  Delete Booking
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5}></td>
                      <td className="bookingPage-totalLabel">Total</td>
                      <td className="bookingPage-totalValue">{totalQty}</td>
                      <td className="bookingPage-totalValue">Rs. {totalAmount}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bookingPage-footerRow">
                <span className="bookingPage-pagination">
                  Show 1 - {filteredRows.length} of 105
                </span>

                <div className="bookingPage-paginationNav">
                  <button
                    type="button"
                    className="bookingPage-pageArrow"
                    onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                    aria-label="Previous page"
                  >
                    &#8249;
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`bookingPage-pageNumber ${activePage === page ? "bookingPage-pageNumberActive" : ""
                        }`}
                      onClick={() => setActivePage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="bookingPage-pageArrow"
                    onClick={() => setActivePage((prev) => Math.min(pageNumbers.length, prev + 1))}
                    aria-label="Next page"
                  >
                    &#8250;
                  </button>
                </div>
              </div>
            </div>

            <div className="bookingPage-siteFooter">
              <span>2026 &copy; Keenthemes</span>
              <div className="bookingPage-siteFooterLinks">
                <span>About</span>
                <span>Support</span>
                <span>Purchase</span>
              </div>
            </div>

            {isCreateModalOpen && (
              <div
                tabIndex={-1}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsCreateModalOpen(false);
                  }
                }}
              >
                <CreateBookingModal onClose={() => setIsCreateModalOpen(false)} />
              </div>
            )}

            {resendTarget && (
              <div
                tabIndex={-1}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setResendTarget(null);
                  }
                }}
              >
                <ResendTicketModal
                  mobileNumber={resendTarget}
                  onClose={() => setResendTarget(null)}
                />
              </div>
            )}
            {deleteTarget && (
              <div
                tabIndex={-1}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDeleteTarget(null);
                  }
                }}
              >
                <DeleteBookingModal
                  bookingId={deleteTarget.id}
                  userName={deleteTarget.name}
                  mobileNumber={deleteTarget.mobile}
                  onClose={() => setDeleteTarget(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Booking;
