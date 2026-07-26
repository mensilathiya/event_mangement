import React, { useState } from "react";
import "../assets/CSS/EntryReport.css";
import Sidebar from './../Components/Sidebar';
import Header from "../Components/Header";

const COLUMNS = [
  "#",
  "PROFILE",
  "BOOKING USER ID",
  "BOOKING ID",
  "QR CODE",
  "NAME",
  "MOBILE NUMBER",
  "PASS DATE",
  "SCANNED AT",
];

const SAMPLE_ROWS = [
  {
    id: 1,
    initials: "RP",
    bookingUserId: "USR-1042",
    bookingId: "BK-98213",
    qrCode: "QR-A1B2C3",
    name: "Ravi Patel",
    mobileNumber: "+91 98765 43210",
    passDate: "21 Jul 2026",
    scannedAt: "21 Jul 2026, 6:42 PM",
  },
  {
    id: 2,
    initials: "SM",
    bookingUserId: "USR-1057",
    bookingId: "BK-98244",
    qrCode: "QR-D4E5F6",
    name: "Sneha Mehta",
    mobileNumber: "+91 91234 56789",
    passDate: "21 Jul 2026",
    scannedAt: "21 Jul 2026, 6:58 PM",
  },
];

export default function EntryReport() {
  const [bookingId, setBookingId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [name, setName] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [rows] = useState([]);

  const handleSearch = () => {
    // Search action placeholder — wire up to API as needed
  };

  const handleReset = () => {
    setBookingId("");
    setMobileNumber("");
    setQrCode("");
    setName("");
    setDateRange("");
  };

  const handleExport = () => {
    // Export action placeholder — wire up to API as needed
  };

  return (
        <div className="erPage_wrapper">

    <Sidebar/>
    <div className="erPageMainArea">
            <Header title="Permission" />
    <div className="erPage__container">
      {/* Title + Breadcrumb */}
      <div className="erPage__titleBlock">
        <h1 className="erPage__title">Entry Report</h1>
        <div className="erPage__breadcrumb">
          <span className="erPage__breadcrumbItem">Dashboard</span>
          <span className="erPage__breadcrumbSep">-</span>
          <span className="erPage__breadcrumbItem erPage__breadcrumbItem--active">
            Entry Report
          </span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="erPage__card erPage__filtersCard">
        <div className="erPage__filtersRow erPage__filtersRow--fields">
          <input
            type="text"
            className="erPage__input"
            placeholder="Booking Id"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
          <input
            type="text"
            className="erPage__input"
            placeholder="Mobile Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
          <input
            type="text"
            className="erPage__input"
            placeholder="Qr Code"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
          />
        </div>

        <div className="erPage__filtersRow erPage__filtersRow--actions">
          <input
            type="text"
            className="erPage__input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className="erPage__input"
            placeholder="Pick date rage"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          />
          <button className="erPage__btn erPage__btn--search" onClick={handleSearch}>
            Serch
          </button>
          <button className="erPage__btn erPage__btn--reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="erPage__card erPage__tableCard">
        <div className="erPage__tableToolbar">
          <div className="erPage__toolbarLeft">
            <select
              className="erPage__pageSizeSelect"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="erPage__toolbarCenter">
            <div className="erPage__searchBox">
              <svg
                className="erPage__searchIcon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="erPage__searchInput"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="erPage__toolbarRight">
            <button className="erPage__btn erPage__btn--export" onClick={handleExport}>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="erPage__exportIcon"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Export Booking
            </button>
          </div>
        </div>

        <div className="erPage__tableWrap">
          <table className="erPage__table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col} className="erPage__th">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr className="erPage__emptyRow">
                  <td colSpan={COLUMNS.length} className="erPage__emptyCell">
                    <div className="erPage__emptyState">
                      <svg
                        className="erPage__emptyIcon"
                        viewBox="0 0 120 120"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Viewfinder corners */}
                        <path
                          d="M10 34V16a6 6 0 0 1 6-6h18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M110 34V16a6 6 0 0 0-6-6H86"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10 86v18a6 6 0 0 0 6 6h18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M110 86v18a6 6 0 0 1-6 6H86"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />

                        {/* QR pattern */}
                        <rect x="30" y="30" width="18" height="18" rx="2" fill="currentColor" opacity="0.18" />
                        <rect x="72" y="30" width="18" height="18" rx="2" fill="currentColor" opacity="0.18" />
                        <rect x="30" y="72" width="18" height="18" rx="2" fill="currentColor" opacity="0.18" />
                        <rect x="36" y="36" width="6" height="6" fill="currentColor" opacity="0.5" />
                        <rect x="78" y="36" width="6" height="6" fill="currentColor" opacity="0.5" />
                        <rect x="36" y="78" width="6" height="6" fill="currentColor" opacity="0.5" />
                        <rect x="56" y="56" width="8" height="8" rx="1" fill="currentColor" opacity="0.35" />
                        <rect x="72" y="56" width="6" height="6" fill="currentColor" opacity="0.25" />
                        <rect x="56" y="72" width="6" height="6" fill="currentColor" opacity="0.25" />
                        <rect x="72" y="72" width="18" height="6" fill="currentColor" opacity="0.25" />
                        <rect x="72" y="82" width="6" height="8" fill="currentColor" opacity="0.25" />

                        {/* Scan line */}
                        <line
                          x1="18"
                          y1="60"
                          x2="102"
                          y2="60"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          opacity="0.55"
                        />
                      </svg>
                      <p className="erPage__emptyText">No entry records found</p>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((row, idx) => (
                <tr key={row.id} className="erPage__tr">
                  <td className="erPage__td">{idx + 1}</td>
                  <td className="erPage__td">
                    <span className="erPage__profileAvatar">{row.initials}</span>
                  </td>
                  <td className="erPage__td">{row.bookingUserId}</td>
                  <td className="erPage__td">{row.bookingId}</td>
                  <td className="erPage__td">{row.qrCode}</td>
                  <td className="erPage__td">{row.name}</td>
                  <td className="erPage__td">{row.mobileNumber}</td>
                  <td className="erPage__td">{row.passDate}</td>
                  <td className="erPage__td">{row.scannedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
