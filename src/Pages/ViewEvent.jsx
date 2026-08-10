import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/CSS/ViewEvent.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getEventById } from "../redux/event/eventThunk";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const ViewEvent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("description");
  const { id } = useParams();
  const dispatch = useDispatch();

  const { event, loading } = useSelector(
    (state) => state.event
  );

  //view api call
  useEffect(() => {
    if (id) {
      dispatch(getEventById(id));
    }
  }, [dispatch, id]);

  return (
    <div className="Event__page">
      <Sidebar />
      <div className="EventPage__mainArea">
        <Header title="View Event" />
        <div className="viewEvent-wrapper">
          <div className="viewEvent-header">
            <h1 className="viewEvent-title">View Event Details</h1>
            <div className="viewEvent-breadcrumb">
              <span>Dashboard</span>
              <span className="viewEvent-breadcrumbSep">-</span>
              <span className="viewEvent-breadcrumbActive">View Event Details</span>
            </div>
          </div>
          <Link to={'/event'}>
            <button
              type="button"
              className="viewEvent-backLink"
              onClick={() => navigate(-1)}
            >
              <span className="viewEvent-backArrow">&#8592;</span> Back Page
            </button>
          </Link>

          {loading ? (
            <div className="viewEvent-card viewEvent-infoCard">
              Loading event details...
            </div>
          ) : (
          <div className="viewEvent-layout">
            {/* Left column */}
            <div className="viewEvent-leftCol">
              <div className="viewEvent-card viewEvent-infoCard">
                <h2 className="viewEvent-eventName">
                  {event?.title}
                </h2>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Created By</span>
                  <span className="viewEvent-detailValue"> {event?.createdBy?.name || "-"}</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Created On</span>
                  <span className="viewEvent-detailValue"> {formatDate(event?.createdAt)}</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Start Date &amp; Time</span>
                  <span className="viewEvent-detailValue"> {event?.startDateTime
                    ? new Date(event.startDateTime).toLocaleString()
                    : "-"}</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">End Date &amp; Time</span>
                  <span className="viewEvent-detailValue">  {event?.endDateTime
                    ? new Date(event.endDateTime).toLocaleString()
                    : "-"}</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Venue Name</span>
                  <span className="viewEvent-detailValue">  {event?.venueName}</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Latitude</span>
                  <span className="viewEvent-detailValue">  {event?.latitude}</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Longitute</span>
                  <span className="viewEvent-detailValue">  {event?.longitude}</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Address</span>
                  <span className="viewEvent-detailValue">
                    {event?.address}
                  </span>
                </div>

                <div className="viewEvent-detailBlock viewEvent-detailBlockLast">
                  <span className="viewEvent-detailLabel">Ticket Type</span>
                  <ul className="viewEvent-ticketList">
                    {
                      event?.ticketTypes && event.ticketTypes.length > 0 ? (
                        event.ticketTypes.map((ticketType, index) => (
                          <li key={index}>
                            {ticketType}
                          </li>
                        ))
                      ) : (
                        <li>No ticket types available</li>
                      )
                    }
                  </ul>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="viewEvent-rightCol">
              <div className="viewEvent-tabs">
                <button
                  type="button"
                  className={
                    "viewEvent-tab" +
                    (activeTab === "description" ? " viewEvent-tabActive" : "")
                  }
                  onClick={() => setActiveTab("description")}
                >
                  Description / Terms &amp; Conditions
                </button>
                <button
                  type="button"
                  className={
                    "viewEvent-tab" +
                    (activeTab === "media" ? " viewEvent-tabActive" : "")
                  }
                  onClick={() => setActiveTab("media")}
                >
                  Photos &amp; Videos
                </button>
              </div>

              {activeTab === "description" && (
                <div className="viewEvent-card viewEvent-contentCard">
                  <div className="viewEvent-detailBlock">
                    <span className="viewEvent-sectionLabel">Description</span>
                    <span
                      className="viewEvent-detailValue"
                      dangerouslySetInnerHTML={{
                        __html: event?.description || "-",
                      }}
                    />
                  </div>

                  <div className="viewEvent-detailBlock">
                    <span className="viewEvent-sectionLabel">
                      Terms &amp; Conditions
                    </span>
                    <span
                      className="viewEvent-detailValue"
                      dangerouslySetInnerHTML={{
                        __html: event?.termsConditions || "-",
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="viewEvent-card viewEvent-contentCard">
                  <p style={{ fontWeight: "600" }}>Photos</p>
                  <p style={{ fontWeight: "600", marginTop: "30px" }}>Videos</p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewEvent;