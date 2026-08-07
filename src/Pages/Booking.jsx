import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getAllBookings } from "../redux/booking/bookingThunk";
import { getAllEvents } from "../redux/event/eventThunk";
import { FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";

const columns = ["ID", "Name", "Mobile Number", "Event", "Ticket", "Qty", "Amount", "Created By"];
const pageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const Booking = () => {
  const dispatch = useDispatch();
  const {
    bookings,
    listLoading,
    total,
    page,
    event,
    limit,
    totalPages,
  } = useSelector((state) => state.booking);

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
  const { events } = useSelector((state) => state.event);
  const [filters, setFilters] = useState({
    bookingId: "",
    mobileNumber: "",
    name: "",
    eventId: "",
    status: "Success",
    fromDate: "",
    toDate: "",
  });
  const handleFilterChange = (field) => (e) => {
    setFilters((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };
  // Debounce the search term so we don't fire an API call on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset to page 1 whenever the (debounced) search term changes
  useEffect(() => {
    setActivePage(1);
  }, [debouncedSearch]);

  // Guard against firing a duplicate request for the same params
  // (e.g. React StrictMode double-invoke, or dependency reference churn)
  const lastFetchedParamsRef = useRef(null);
  // get all 
  useEffect(() => {
    dispatch(
      getAllBookings({
        page: activePage,
        limit: rowsPerPage,
        ...filters,
      })
    );
  }, [dispatch, activePage, rowsPerPage]);
  // events
  useEffect(() => {
    dispatch(
      getAllEvents({
        page: 1,
        limit: 1000,
        search: "",
      })
    );
  }, [dispatch]);
  const bookingRows = bookings || [];
  const totalQty = bookingRows.reduce(
    (total, booking) => total + Number(booking.quantity || 0),
    0
  );

  const totalAmount = bookingRows.reduce(
    (total, booking) => total + Number(booking.amount || 0),
    0
  );
  const toggleActionMenu = (id) => {
    setOpenActionId((prev) => (prev === id ? null : id));
  };
  // export booking
  const exportBookingToExcel = () => {
    const excelData = bookingRows.map((row, index) => ({
      "Sr No": index + 1,
      "Booking ID": row.id,
      "Customer Name": row.name,
      "Mobile Number": row.mobile,
      "Event": row.event,
      "Ticket Type": row.ticket,
      "Quantity": row.qty,
      "Amount": row.amount,
      "Created By": row.createdBy,
      "Created At": row.createdAt,
    }));

    // Total Row
    excelData.push({
      "Sr No": "",
      "Booking ID": "",
      "Customer Name": "",
      "Mobile Number": "",
      "Event": "",
      "Ticket Type": "Total",
      "Quantity": totalQty,
      "Amount": totalAmount,
      "Created By": "",
      "Created At": "",
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(file, `Bookings_${new Date().toISOString().split("T")[0]}.xlsx`);
  };
  // handel search
  const handleSearch = () => {
    if (activePage !== 1) {
      setActivePage(1);
      return;
    }

    dispatch(
      getAllBookings({
        page: 1,
        limit: rowsPerPage,
        ...filters,
      })
    );
  };
  // handel reset
  const handleReset = () => {
    const resetFilters = {
      bookingId: "",
      mobileNumber: "",
      name: "",
      eventId: "",
      status: "Success",
      fromDate: "",
      toDate: "",
    };

    setFilters(resetFilters);

    setRange([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);

    setActivePage(1);

    dispatch(
      getAllBookings({
        page: 1,
        limit: rowsPerPage,
        ...resetFilters,
      })
    );
  };
  // search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setActivePage(1);
  };
  // fetch bokings
  const fetchBookings = () => {
    dispatch(
      getAllBookings({
        page: activePage,
        limit: rowsPerPage,
        search: searchTerm,
        ...filters,
      })
    );
  };
  // api call
  useEffect(() => {
    dispatch(
      getAllBookings({
        page: activePage,
        limit: rowsPerPage,
        search: searchTerm,
        ...filters,
      })
    );
  }, [
    dispatch,
    activePage,
    rowsPerPage,
    searchTerm,
    filters,
  ]);
  // pagination
  const startIndex =
    total === 0 ? 0 : (activePage - 1) * rowsPerPage;

  const endIndex = Math.min(
    activePage * rowsPerPage,
    total
  );
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  const goToPreviousPage = () => {
    if (activePage > 1) {
      setActivePage((prev) => prev - 1);
    }
  };
  const goToNextPage = () => {
    if (activePage < totalPages) {
      setActivePage((prev) => prev + 1);
    }
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
            {/* booking filter */}
            <div className="bookingPage-filterCard">
              <div className="bookingPage-filterGrid">

                {/* Booking Id */}
                <input
                  type="text"
                  className="bookingPage-filterInput"
                  placeholder="Booking Id"
                  value={filters.bookingId}
                  onChange={handleFilterChange("bookingId")}
                />

                {/* Mobile Number */}
                <input
                  type="text"
                  className="bookingPage-filterInput"
                  placeholder="Mobile Number"
                  value={filters.mobileNumber}
                  onChange={handleFilterChange("mobileNumber")}
                />

                {/* Name */}
                <input
                  type="text"
                  className="bookingPage-filterInput"
                  placeholder="Name"
                  value={filters.name}
                  onChange={handleFilterChange("name")}
                />

                {/* Event */}
                <select
                  className="bookingPage-filterSelect"
                  value={filters.eventId}
                  onChange={handleFilterChange("eventId")}
                >
                  <option value="">All Events</option>

                  {events?.map((event) => (
                    <option
                      key={event._id}
                      value={event._id}
                    >
                      {event.title}
                    </option>
                  ))}
                </select>

                {/* Date Range */}
                <div className="bookingPage-dateWrap">

                  <input
                    type="text"
                    readOnly
                    className="bookingPage-filterInput"
                    value={`${format(
                      range[0].startDate,
                      "yyyy/MM/dd"
                    )} - ${format(
                      range[0].endDate,
                      "yyyy/MM/dd"
                    )}`}
                    onClick={() => setShowDate(true)}
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
                          onChange={(item) =>
                            setRange([item.selection])
                          }
                          months={2}
                          direction="horizontal"
                          showDateDisplay={false}
                          rangeColors={["#2563eb"]}
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
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                fromDate: format(
                                  range[0].startDate,
                                  "yyyy-MM-dd"
                                ),
                                toDate: format(
                                  range[0].endDate,
                                  "yyyy-MM-dd"
                                ),
                              }));

                              setShowDate(false);
                            }}
                          >
                            Apply
                          </button>

                        </div>

                      </div>
                    </>
                  )}

                </div>

                {/* Status */}
                <select
                  className="bookingPage-filterSelect bookingPage-statusSelect"
                  value={filters.status}
                  onChange={handleFilterChange("status")}
                >
                  <option value="Success">Success</option>
                  <option value="Deleted">Deleted</option>
                </select>

              </div>

              <div className="bookingPage-filterActions">

                <button
                  type="button"
                  className="bookingPage-searchBtn"
                  onClick={handleSearch}
                >
                  Search
                </button>

                <button
                  type="button"
                  className="bookingPage-resetBtn"
                  onClick={handleReset}
                >
                  Reset
                </button>

              </div>
            </div>

            <div className="bookingPage-card">
              <div className="eventList__toolbar">
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setActivePage(1);
                  }}
                  className="eventList__pageSizeSelect"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <div className="eventList__searchBox">
                  <span className="eventList__searchIcon">
                    <FaSearch />
                  </span>

                  <input
                    type="search"
                    className="eventList__searchInput"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              {/* // tabal */}
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
                    {!event ? (
                      <tr>
                        <td colSpan={10} className="bookingPageNoData">
                          No Active Event Found
                        </td>
                      </tr>
                    ) : bookingRows.length > 0 ? (
                      bookingRows.map((row) => (
                        <tr key={row._id}>
                          {/* Existing row code */}

                          <td>
                            <div className="bookingPage-actionWrapper">
                              {/* Existing Action Button */}

                              {openActionId === row._id && (
                                <div className="bookingPage-actionMenu">
                                  <button
                                    type="button"
                                    className="bookingPage-actionMenuItem"
                                    onClick={() => navigate(`/view-booking/${row._id}`)}
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
                                        id: row._id,
                                        name: row.name,
                                        mobile: row.mobileNumber,
                                        bookingNumber: row.bookingNumber,
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="bookingPageNoData">
                          No Bookings Found
                        </td>
                      </tr>
                    )}
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
              {/* booking page pagination */}
              <div className="permissionPagePagination">

                <span className="permissionPagePaginationInfo">
                  Show {total === 0 ? 0 : startIndex + 1} - {endIndex} of {total}
                </span>

                {totalPages > 1 && (
                  <div className="permissionPagePaginationControls">

                    <button
                      type="button"
                      className="permissionPagePaginationArrow"
                      onClick={goToPreviousPage}
                      disabled={activePage === 1}
                    >
                      <FaChevronLeft />
                    </button>

                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`permissionPagePaginationBtn ${activePage === page
                          ? "permissionPagePaginationActive"
                          : ""
                          }`}
                        onClick={() => setActivePage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="permissionPagePaginationArrow"
                      onClick={goToNextPage}
                      disabled={activePage === totalPages}
                    >
                      <FaChevronRight />
                    </button>

                  </div>
                )}

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
                <CreateBookingModal onSuccess={fetchBookings} onClose={() => setIsCreateModalOpen(false)} />
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
                  mobileNumber={deleteTarget.mobileNumber}
                  bookingNumber={deleteTarget.bookingNumber}
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
