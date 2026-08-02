import React, { useState, useEffect } from "react";
import "../assets/CSS/Event.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import { Link, Links } from "react-router-dom";
import { FaSearch, FaSort } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { getAllEvents, changeEventStatus } from "../redux/event/eventThunk";
import Swal from "sweetalert2";

const columns = [
  { key: "title", label: "Title" },
  { key: "startDateTime", label: "Start Date & Time" },
  { key: "endDateTime", label: "End Date & Time" },
  { key: "venueName", label: "Venue Name" },
  { key: "isActive", label: "Is Active" },
  { key: "createdOn", label: "Created On" },
];

const Event = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionId, setOpenActionId] = useState(null);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const {
    events,
    loading,
    total,
    totalPages,
  } = useSelector((state) => state.event);
  // get all event


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
  const toggleActionMenu = (id) => {
    setOpenActionId((prev) => (prev === id ? null : id));
  };
  if (loading) {
    return <h3>Loading...</h3>;
  }
  // status changes
  const handleStatusChange = async (id) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "Do you want to change the status?",
      showCancelButton: true,
      confirmButtonText: "Yes, Change it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      dispatch(changeEventStatus(id));

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Status updated successfully.",
        timer: 1500,
        showConfirmButton: false,
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
                <span>Dashboard</span>
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
                onClick={() => setOpenActionId(null)}
              />
            )}

            <div className="eventList__toolbar">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        No Events Found
                      </td>
                    </tr>
                  ) : events.map((event, index) => (
                    <tr key={event._id}>
                      <td>{index + 1}</td>
                      <td className="eventList__titleCell">{event.title}</td>
                      <td>{event.startDateTime}</td>
                      <td>{event.endDateTime}</td>
                      <td>{event.venueName}</td>
                      <td>
                        <span
                          className={`eventList__toggle ${event.isActive ? "eventList__toggleOn" : ""
                            }`}
                          onClick={() => {
                            console.log("Toggle Clicked");
                            handleStatusChange(event._id);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <span className="eventList__toggleKnob" />
                        </span>
                      </td>
                      <td>
                        {new Date(event.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="eventList__actionCol">
                        <div className="eventList__actionWrapper">
                          <button
                            type="button"
                            className="eventList__actionButton"
                            onClick={() => toggleActionMenu(event._id)}
                          >
                            Action <span className="eventList__actionCaret">&#9662;</span>
                          </button>

                          {openActionId === event._id && (
                            <div className="eventList__actionMenu">
                              <Link to={`/view-event/${event._id}`}>
                                <button
                                  type="button"
                                  className="eventList__actionItem"
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
                                <button type="button" className="eventList__actionItem">
                                  Ticket Type
                                </button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  )}

                </tbody>

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

              </table>
            </div>

            {/* <div className="eventList__pagination">
              Show 1 - {filteredEvents.length} of {events.length}
            </div> */}
          </div>

          <div className="eventList__footer">
            <span>2026 &copy; Keenthemes</span>
            <div className="eventList__footerLinks">
              <span>About</span>
              <span>Support</span>
              <span>Purchase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Event;
