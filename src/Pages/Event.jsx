import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "../assets/CSS/Event.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaSort, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { getAllEvents, changeEventStatus, deleteEvent } from "../redux/event/eventThunk";
import Swal from "sweetalert2";

const columns = [
  { key: "title", label: "Title" },
  { key: "startDateTime", label: "Start Date & Time" },
  { key: "endDateTime", label: "End Date & Time" },
  { key: "venueName", label: "Venue Name" },
  { key: "createdBy", label: "Created By" },
  { key: "isActive", label: "Is Active" },
  { key: "createdOn", label: "Created On" },
];

// DD-MM-YYYY — used for "Created On", and reused below by formatDateTime so
// the date portion of Start/End Date & Time stays in the exact same format
// instead of duplicating the padding/format logic a second time.
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// DD-MM-YYYY hh:mm AM/PM — for Start/End Date & Time. The API returns raw
// ISO strings (e.g. "2026-09-02T08:51:00.000Z"); this renders them in the
// viewer's local time via the standard Date getters, which is correct here
// since events are stored as proper UTC instants (see CreateEvent.jsx's
// IST-offset fix) — it does not touch or reformat the stored value itself,
// only how it's displayed.
const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  const hh = String(hours).padStart(2, "0");
  return `${formatDate(dateStr)} ${hh}:${minutes} ${ampm}`;
};

// Single source of truth for "has this event's window closed" — compares
// endDateTime against the current time. Reuse this wherever expiry needs
// to be checked or displayed, instead of comparing dates inline, so
// Expired is decided consistently everywhere on the frontend.
const isEventExpired = (event) => {
  if (!event?.endDateTime) return false;
  const endTime = new Date(event.endDateTime).getTime();
  if (Number.isNaN(endTime)) return false;
  return Date.now() >= endTime;
};

const Event = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPos, setActionMenuPos] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const {
    events,
    loading,
    total,
    totalPages,
  } = useSelector((state) => state.event);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      getAllEvents({
        page: currentPage,
        limit: rowsPerPage,
        search,
      })
    );
  }, [dispatch, currentPage, rowsPerPage, search]);

  // The dropdown is rendered via a portal at a fixed viewport position
  // computed at the moment it's opened (see toggleActionMenu below). If the
  // page or the table's horizontal scroll moves after that, the stored
  // coordinates go stale — closing on scroll/resize is simpler and safer
  // than re-measuring and repositioning a portaled element on every scroll
  // tick. `capture: true` is needed because scroll events don't bubble, so
  // a listener on `window` only sees them for the table's internal
  // horizontal scroll if it's registered on the capture phase.
  useEffect(() => {
    if (openActionId === null) return;

    const closeMenu = () => {
      setOpenActionId(null);
      setActionMenuPos(null);
    };

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openActionId]);

  // pervious page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  // pagination
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(currentPage * rowsPerPage, total);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  // netx page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  const toggleActionMenu = (id, e) => {
    if (openActionId === id) {
      setOpenActionId(null);
      setActionMenuPos(null);
      return;
    }

    // Position the (portaled) menu against the button's own bounding box,
    // right-aligned to it — matching how it used to be anchored via
    // `right: 0` on `.eventList__actionWrapper`, just computed in JS now
    // since the menu no longer lives inside that wrapper's DOM subtree.
    const rect = e.currentTarget.getBoundingClientRect();
    setActionMenuPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
    setOpenActionId(id);
  };

  const closeActionMenu = () => {
    setOpenActionId(null);
    setActionMenuPos(null);
  };

  // status changes
  const handleStatusChange = async (event) => {
    // Expired events can never be (re)activated from the frontend — block
    // before the confirm dialog even opens, and don't call the API.
    if (isEventExpired(event)) {
      Swal.fire({
        icon: "warning",
        title: "Event Expired",
        text: "This event has already expired and cannot be activated.",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "Do you want to change the status?",
      showCancelButton: true,
      confirmButtonText: "Yes, Change it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await dispatch(changeEventStatus(event._id)).unwrap();

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Status updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error || "Failed to update status.",
      });
    }
  };

  // delete event
  const handleDeleteEvent = async (event) => {
    closeActionMenu();

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: `Do you want to delete "${event.title}"? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
    });

    if (!result.isConfirmed) return;

    try {
      await dispatch(deleteEvent(event._id)).unwrap();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Event deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error || "Failed to delete event.",
      });
    }
  };

  return (

    <div className="Event__page">
      <Sidebar />
      <div className="EventPage__mainArea">
        <Header title="Event" />
        <div className="eventList__wrapper">

          <div className="eventList__header">
            <div className="eventList__headerLeft">
              <h1 className="eventList__title">Event</h1>
              <div className="eventList__breadcrumb">
                <Link to="/dashboard">Dashboard</Link>
                <span className="eventList__breadcrumbSep">-</span>
                <span className="eventList__breadcrumbActive">Event</span>
              </div>
            </div>
            <Link to={'/create-event'}>
              <button type="button" className="eventList__createBtn">
                <span className="eventList__createBtnIcon">+</span> Create Event
              </button>
            </Link>
          </div>

          <div className="eventList__card">
            {openActionId !== null && (
              <div
                className="eventList__actionOverlay"
                onClick={closeActionMenu}
              />
            )}

            <div className="eventList__toolbar">
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="eventList__pageSizeSelect"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>

              <div className="eventList__searchBox">
                <span className="eventList__searchIcon"><FaSearch /></span>
                <input
                  type="search"
                  value={searchTerm}
                  className="eventList__searchInput"
                  onChange={handleSearchChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>

            <div className="eventList__tableWrap">
              <table className="eventList__table">
                <colgroup>
                  <col className="eventList__colHash" />
                  <col className="eventList__colTitle" />
                  <col className="eventList__colStart" />
                  <col className="eventList__colEnd" />
                  <col className="eventList__colVenue" />
                  <col className="eventList__colCreatedBy" />
                  <col className="eventList__colActive" />
                  <col className="eventList__colCreatedOn" />
                  <col className="eventList__colAction" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="eventList__hashCol">#</th>
                    {columns.map((col) => (
                      <th key={col.key}>
                        <span className="eventList__thContent">
                          <span className="eventList__sortIcon"><FaSort /></span>
                          {col.label}
                        </span>
                      </th>
                    ))}
                    <th className="eventList__actionCol">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        Loading events...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                         <div className="bookingPage-stateWrap">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 460 512"
                              width="120"
                              className="bookingPage-stateIcon"
                            >
                              <path d="M220.6 130.3l-67.2 28.2V43.2L98.7 233.5l54.7-24.2v130.3l67.2-209.3zm-83.2-96.7l-1.3 4.7-15.2 52.9C80.6 106.7 52 145.8 52 191.5c0 52.3 34.3 95.9 83.4 105.5v53.6C57.5 340.1 0 272.4 0 191.6c0-80.5 59.8-147.2 137.4-158zm311.4 447.2c-11.2 11.2-23.1 12.3-28.6 10.5-5.4-1.8-27.1-19.9-60.4-44.4-33.3-24.6-33.6-35.7-43-56.7-9.4-20.9-30.4-42.6-57.5-52.4l-9.7-14.7c-24.7 16.9-53 26.9-81.3 28.7l2.1-6.6 15.9-49.5c46.5-11.9 80.9-54 80.9-104.2 0-54.5-38.4-102.1-96-107.1V32.3C254.4 37.4 320 106.8 320 191.6c0 33.6-11.2 64.7-29 90.4l14.6 9.6c9.8 27.1 31.5 48 52.4 57.4s32.2 9.7 56.8 43c24.6 33.2 42.7 54.9 44.5 60.3s.7 17.3-10.5 28.5zm-9.9-17.9c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8z" />
                            </svg>
                            <p className="bookingPage-stateText">
                              No Events Found.
                            </p>
                          </div>
                      </td>
                    </tr>
                  ) : events.map((event, index) => (
                    <tr key={event._id}>
                      <td>{index + 1}</td>
                      <td className="eventList__titleCell">{event.title}</td>
                      <td>{formatDateTime(event.startDateTime)}</td>
                      <td>{formatDateTime(event.endDateTime)}</td>
                      <td>{event.venueName}</td>
                      <td>{event.createdBy?.name || "-"}</td>
                      <td>
                        {isEventExpired(event) ? (
                          <span
                            className="eventList__statusExpired"
                            style={{ color: "#dc3545", fontWeight: 600 }}
                          >
                            Expired
                          </span>
                        ) : (
                          <span
                            className={`eventList__toggle ${event.isActive ? "eventList__toggleOn" : ""
                              }`}
                            onClick={() => {
                              handleStatusChange(event);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <span className="eventList__toggleKnob" />
                          </span>
                        )}
                      </td>
                      <td>
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="eventList__actionCol">
                        <div className="eventList__actionWrapper">
                          <button
                            type="button"
                            className="eventList__actionButton"
                            onClick={(e) => toggleActionMenu(event._id, e)}
                          >
                            Action <span className="eventList__actionCaret">&#9662;</span>
                          </button>

                          {openActionId === event._id &&
                            actionMenuPos &&
                            createPortal(
                              <div
                                className="eventList__actionMenu"
                                style={{
                                  top: `${actionMenuPos.top}px`,
                                  right: `${actionMenuPos.right}px`,
                                }}
                              >
                                <Link to={`/view-event/${event._id}`}>
                                  <button
                                    type="button"
                                    className="eventList__actionItem"
                                    onClick={closeActionMenu}
                                  >
                                    View
                                  </button>
                                </Link>
                                <Link
                                  to={`/ticket-type/${event._id}`}
                                  state={{
                                    eventName: event.title,
                                    eventId: event._id,
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="eventList__actionItem"
                                    onClick={closeActionMenu}
                                  >
                                    Ticket Type
                                  </button>
                                </Link>
                                <button
                                  type="button"
                                  className="eventList__actionItem"
                                  onClick={() => {
                                    closeActionMenu();
                                    // Reuse the Create Event page for editing —
                                    // no /edit-event/:id or /create-event/:id
                                    // route. CreateEvent.jsx reads
                                    // location.state.eventId to switch into
                                    // edit mode and fetch/populate the form.
                                    navigate("/create-event", {
                                      state: { eventId: event._id },
                                    });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="eventList__actionItem"
                                  onClick={() => handleDeleteEvent(event)}
                                >
                                  Delete
                                </button>
                              </div>,
                              document.body
                            )}
                        </div>
                      </td>
                    </tr>
                  )
                  )}
                </tbody>
              </table>
            </div>

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
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`permissionPagePaginationBtn ${currentPage === page
                        ? "permissionPagePaginationActive"
                        : ""
                        }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="permissionPagePaginationArrow"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>

                </div>
              )}
            </div>

            {/* <div className="eventList__pagination">
              Show 1 - {filteredEvents.length} of {events.length}
            </div> */}
          </div>

          {/* <div className="eventList__footer">
            <span>2026 &copy; Keenthemes</span>
            <div className="eventList__footerLinks">
              <span>About</span>
              <span>Support</span>
              <span>Purchase</span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Event;