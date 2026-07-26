import React, { useState } from "react";
import "../assets/CSS/Event.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import { Link, Links } from "react-router-dom";
import { FaSearch, FaSort } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getEventById } from "../redux/event/eventThunk";


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
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [openActionId, setOpenActionId] = useState(null);
 const dispatch = useDispatch();

const {
  events,
  total,
  loading,
} = useSelector((state) => state.event);
// get event
useEffect(() => {
  dispatch(getEventById());
}, [dispatch]);
  const filteredEvents = (events || []).filter((event) =>
  event.title?.toLowerCase().includes(searchTerm.toLowerCase())
);
  const toggleActionMenu = (id) => {
    setOpenActionId((prev) => (prev === id ? null : id));
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
                className="eventList__pageSizeSelect"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(e.target.value)}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>

              <div className="eventList__searchBox">
                <span className="eventList__searchIcon"><FaSearch /></span>
                <input
                  type="text"
                  className="eventList__searchInput"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="eventList__tableWrap">
              <table className="eventList__table">
                {/* <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "23%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup> */}
                <thead>
                  <tr>
                    <th className="eventList__hashCol">#</th>
                    {columns.map((col) => (
                      <th key={col.key}>
                        <span className="eventList__thContent">
                          <span className="eventList__sortIcon"><FaSort/></span>
                          {col.label}
                        </span>
                      </th>
                    ))}
                    <th className="eventList__actionCol">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, index) => (
                    <tr key={event._id}>
                      <td>{index + 1}</td>
                      <td className="eventList__titleCell">{event.title}</td>
                      <td>{event.startDateTime}</td>
                      <td>{event.endDateTime}</td>
                      <td>{event.venueName}</td>
                      <td>
                        <span
                          className={`eventList__toggle ${event.isActive ? "Yes" : "No"
                            }`}
                        >
                          <span className="eventList__toggleKnob" />
                        </span>
                      </td>
                        <td>{event.createdBy?.name || "-"}</td>
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
                              <Link to={'/view-event'}>
                              <button type="button" className="eventList__actionItem">
                                View
                              </button>
                              </Link>
                              <Link to={'/ticket-type'}>
                              <button type="button" className="eventList__actionItem">
                                Ticket Type
                              </button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
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
