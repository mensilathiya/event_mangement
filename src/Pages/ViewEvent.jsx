import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/CSS/ViewEvent.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";

const ViewEvent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("description");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newVideos = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setVideos((prev) => [...prev, ...newVideos]);
    e.target.value = "";
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeVideo = (id) => {
    setVideos((prev) => prev.filter((vid) => vid.id !== id));
  };

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
          <div className="viewEvent-layout">
            {/* Left column */}
            <div className="viewEvent-leftCol">
              <div className="viewEvent-card viewEvent-infoCard">
                <h2 className="viewEvent-eventName">
                  RANGE SANGE SHUBH NAVRATRI - 2026
                </h2>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Start Date &amp; Time</span>
                  <span className="viewEvent-detailValue">15 Oct 2026, 8:00 AM</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">End Date &amp; Time</span>
                  <span className="viewEvent-detailValue">18 Oct 2026, 11:00 PM</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Venue Name</span>
                  <span className="viewEvent-detailValue">AVADH UTOPIA</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Latitude</span>
                  <span className="viewEvent-detailValue">21.2271104</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Longitute</span>
                  <span className="viewEvent-detailValue">72.8629248</span>
                </div>

                <div className="viewEvent-detailBlock">
                  <span className="viewEvent-detailLabel">Address</span>
                  <span className="viewEvent-detailValue">
                    Avadh Utopia, Dumas Rd, Opp Airport, Surat, Dumas, Gujarat
                    394550
                  </span>
                </div>

                <div className="viewEvent-detailBlock viewEvent-detailBlockLast">
                  <span className="viewEvent-detailLabel">Ticket Type</span>
                  <ul className="viewEvent-ticketList">
                    <li>Fast 100 SESSON PASS 4 DAYS</li>
                    <li>First SP 4 DAY</li>
                    <li>Advance Tier</li>
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
                    <span className="viewEvent-detailValue">
                      RANGE SANGE NAVRATRI
                    </span>
                  </div>

                  <div className="viewEvent-detailBlock">
                    <span className="viewEvent-sectionLabel">
                      Terms &amp; Conditions
                    </span>
                    <span className="viewEvent-detailValue">
                      RANGE SANGE NAVRATRI
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="viewEvent-card viewEvent-contentCard">
                  <p style={{ fontWeight: "600" }}>Photos</p>
                  {/* <div className="viewEvent-uploadSection">
                <span className="viewEvent-sectionLabel">Upload Images</span>
                <label className="viewEvent-uploadBox">
                  <span className="viewEvent-uploadIcon">&#8613;</span>
                  <span className="viewEvent-uploadText">
                    Click to select images
                  </span>
                  
                </label>

                {images.length > 0 && (
                  <div className="viewEvent-previewGrid">
                    {images.map((img) => (
                      <div className="viewEvent-previewCard" key={img.id}>
                        <img
                          src={img.url}
                          alt={img.name}
                          className="viewEvent-previewImage"
                        />
                        <button
                          type="button"
                          className="viewEvent-removeBtn"
                          onClick={() => removeImage(img.id)}
                          aria-label="Remove image"
                        >
                          &#10005;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div> */}

                  {/* <div className="viewEvent-uploadSection">
                <span className="viewEvent-sectionLabel">Upload Videos</span>
                <label className="viewEvent-uploadBox">
                  <span className="viewEvent-uploadIcon">&#8613;</span>
                  <span className="viewEvent-uploadText">
                    Click to select videos
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="viewEvent-uploadInput"
                    onChange={handleVideoSelect}
                  />
                </label>

                {videos.length > 0 && (
                  <div className="viewEvent-previewGrid">
                    {videos.map((vid) => (
                      <div className="viewEvent-previewCard" key={vid.id}>
                        <video
                          src={vid.url}
                          className="viewEvent-previewVideo"
                          controls
                        />
                        <button
                          type="button"
                          className="viewEvent-removeBtn"
                          onClick={() => removeVideo(vid.id)}
                          aria-label="Remove video"
                        >
                          &#10005;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div> */}
                  <p style={{ fontWeight: "600", marginTop: "30px" }}>Videos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEvent;
