import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "../assets/CSS/EntryReport.css";
import Sidebar from "./../Components/Sidebar";
import Header from "../Components/Header";
// Existing entryReport redux architecture — adjust path if your thunk file
// lives elsewhere; it must resolve to the existing entryReportThunk.js.
import {
  getAllEntryReport,
  exportEntryReport,
} from "../redux/entryReport/entryReportThunk";

// Formats a Date object as "YYYY/MM/DD" — used only for the date-range
// filter input display, matching the original design.
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

// Formats any API date/time value using toLocaleString(). Returns "-" for
// missing or invalid values so nothing renders as "Invalid Date".
const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

// Formats a numeric amount using toLocaleString(). Returns "-" for
// missing/invalid values.
const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString();
};

// Shows the attendee's profile image returned by the API; falls back to a
// default avatar icon when no image is provided or the image fails to load.
function ProfileAvatar({ src, name }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <span className="erPage__profileAvatar erPage__profileAvatar--img">
        <img
          src={src}
          alt={name || "Profile"}
          className="erPage__profileAvatarImg"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  return (
    <span className="erPage__profileAvatar erPage__profileAvatar--default">
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        className="erPage__profileAvatarIcon"
      >
        <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.3 0-9.8 1.6-9.8 4.9v2.7h19.6v-2.7c0-3.3-6.5-4.9-9.8-4.9z" />
      </svg>
    </span>
  );
}

// Table columns mapped to the real Entry Report API response.
const COLUMNS = [
  "#",
  "PROFILE",
  "BOOKING NUMBER",
  "TICKET NUMBER",
  "ATTENDEE NAME",
  "MOBILE NUMBER",
  "EMAIL",
  "EVENT NAME",
  "VENUE",
  "EVENT DATE",
  "TICKET TYPE",
  "TICKET PRICE",
  "BOOKING QTY",
  "BOOKING AMOUNT",
  "BOOKING STATUS",
  "ENTRY STATUS",
  "REGISTERED",
  "REGISTERED DATE",
  "SCANNED AT",
  "BOOKING CREATED",
];

export default function EntryReport() {
  const [bookingId, setBookingId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [name, setName] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const dispatch = useDispatch();

  // Existing entryReport slice state — no new/duplicate state is created here.
  const { entryReports, pagination, loading, exportLoading, error } =
    useSelector((state) => state.entryReport);

  const rows = entryReports ?? [];

  // Builds the API params from the current filter values.
  const buildEntryReportParams = (
    targetPage,
    filters = {},
    perPageOverride
  ) => ({
    page: targetPage,
    perPage: perPageOverride ?? pageSize,
    "form[id]": filters.bookingId ?? bookingId,
    "form[mobile_number]": filters.mobileNumber ?? mobileNumber,
    "form[qr_code]": filters.qrCode ?? qrCode,
    "form[name]": filters.name ?? name,
    "form[date]": filters.dateRange ?? dateRange,
  });

  // Pagination values as returned by the API: { page, limit, total, totalPages }
  const currentPage = pagination?.page ?? page;
  const limit = pagination?.limit ?? pageSize;
  const totalPages = pagination?.totalPages ?? 1;
  const totalRecords = pagination?.total ?? rows.length;

  // Fetch entry report data on first page load using the existing thunk/slice.
  useEffect(() => {
    dispatch(getAllEntryReport({ page: 1, perPage: pageSize }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Change page while keeping the currently applied filters intact.
  const handlePageChange = (newPage) => {
    if (loading) return;
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setPage(newPage);
    dispatch(getAllEntryReport(buildEntryReportParams(newPage)));
  };

  // Changing rows-per-page resets to page 1, keeps filters intact.
  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setPage(1);
    dispatch(getAllEntryReport(buildEntryReportParams(1, {}, newSize)));
  };

  // The currently selected event — adjust this selector path to match your
  // store's actual slice name if different (expects event.startDate / event.endDate).
  const selectedEvent = useSelector(
    (state) => state?.event?.selectedEvent ?? state?.event?.currentEvent ?? null
  );
  const eventStartDate = selectedEvent?.startDate
    ? new Date(selectedEvent.startDate)
    : null;
  const eventEndDate = selectedEvent?.endDate
    ? new Date(selectedEvent.endDate)
    : null;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [committedRange, setCommittedRange] = useState(null);
  const [tempRange, setTempRange] = useState([
    {
      startDate: eventStartDate || new Date(),
      endDate: eventEndDate || new Date(),
      key: "selection",
    },
  ]);

  const dateInputRef = useRef(null);
  const datePickerRef = useRef(null);

  // Close the date range popup when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target) &&
        dateInputRef.current &&
        !dateInputRef.current.contains(e.target)
      ) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDatePicker = () => {
    setShowDatePicker((prev) => {
      const next = !prev;
      if (next) {
        // Reopen with the last committed selection, if any
        setTempRange(
          committedRange || [
            {
              startDate: eventStartDate || new Date(),
              endDate: eventEndDate || new Date(),
              key: "selection",
            },
          ]
        );
      }
      return next;
    });
  };

  const handleDateRangeChange = (item) => {
    setTempRange([item.selection]);
  };

  const handleApplyDateRange = () => {
    setCommittedRange(tempRange);
    setDateRange(
      `${formatDate(tempRange[0].startDate)} - ${formatDate(
        tempRange[0].endDate
      )}`
    );
    setShowDatePicker(false);
  };

  const handleCancelDateRange = () => {
    if (committedRange) {
      setTempRange(committedRange);
    }
    setShowDatePicker(false);
  };

  const handleSearch = () => {
    setPage(1);
    dispatch(getAllEntryReport(buildEntryReportParams(1)));
  };

  const handleReset = () => {
    setBookingId("");
    setMobileNumber("");
    setQrCode("");
    setName("");
    setDateRange("");
    setCommittedRange(null);
    setTempRange([
      {
        startDate: eventStartDate || new Date(),
        endDate: eventEndDate || new Date(),
        key: "selection",
      },
    ]);
    setShowDatePicker(false);
    setPage(1);
    // Reload default (unfiltered) data
    dispatch(getAllEntryReport({ page: 1, perPage: pageSize }));
  };

  const handleExport = async () => {
    if (exportLoading) return;

    const resultAction = await dispatch(
      exportEntryReport(buildEntryReportParams(currentPage))
    );

    if (exportEntryReport.fulfilled.match(resultAction)) {
      const blob = new Blob([resultAction.payload], { type: "text/csv" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `entry-report-${formatDate(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }
  };

  // Human-readable error message — never render the raw error value directly
  // in JSX since it could be an object depending on how the API/thunk fails.
  const errorMessage =
    typeof error === "string"
      ? error
      : error
      ? "Failed to load entry reports. Please try again."
      : "";

  return (
    <div className="erPage_wrapper">
      <Sidebar />
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
              <div className="erPage__dateRangeWrapper" ref={dateInputRef}>
                <input
                  type="text"
                  className="erPage__input"
                  placeholder="Pick date rage"
                  value={dateRange}
                  readOnly
                  onClick={toggleDatePicker}
                />
                {showDatePicker && (
                  <div className="erPage__dateRangePopup" ref={datePickerRef}>
                    <DateRangePicker
                      ranges={tempRange}
                      onChange={handleDateRangeChange}
                      months={2}
                      direction="horizontal"
                      showMonthAndYearPickers={true}
                      showDateDisplay={false}
                      moveRangeOnFirstSelection={false}
                      minDate={eventStartDate || undefined}
                      maxDate={eventEndDate || undefined}
                      rangeColors={["#4f7bff"]}
                    />
                    <div className="erPage__dateRangeFooter">
                      <div className="erPage__dateRangeDisplay">
                        {formatDate(tempRange[0].startDate)} -{" "}
                        {formatDate(tempRange[0].endDate)}
                      </div>
                      <div className="erPage__dateRangeActions">
                        <button
                          type="button"
                          className="erPage__btn erPage__btn--reset"
                          onClick={handleCancelDateRange}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="erPage__btn erPage__btn--apply"
                          onClick={handleApplyDateRange}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="erPage__btn erPage__btn--search"
                onClick={handleSearch}
                disabled={loading}
              >
                Serch
              </button>
              <button
                className="erPage__btn erPage__btn--reset"
                onClick={handleReset}
                disabled={loading}
              >
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
                  onChange={handlePageSizeChange}
                  disabled={loading}
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
                <button
                  className="erPage__btn erPage__btn--export"
                  onClick={handleExport}
                  disabled={exportLoading}
                  aria-busy={exportLoading}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={
                      exportLoading
                        ? "erPage__exportIcon erPage__exportIcon--spinning"
                        : "erPage__exportIcon"
                    }
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {exportLoading ? "Exporting..." : "Export Booking"}
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
                  {/* Loading state */}
                  {loading && (
                    <tr className="erPage__emptyRow">
                      <td colSpan={COLUMNS.length} className="erPage__emptyCell">
                        <div className="erPage__emptyState">
                          <p className="erPage__emptyText">
                            Loading entry reports...
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Error state */}
                  {!loading && errorMessage && (
                    <tr className="erPage__emptyRow">
                      <td colSpan={COLUMNS.length} className="erPage__emptyCell">
                        <div className="erPage__emptyState">
                          <p className="erPage__emptyText">{errorMessage}</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Empty state */}
                  {!loading && !errorMessage && rows.length === 0 && (
                    <tr className="erPage__emptyRow">
                      <td colSpan={COLUMNS.length} className="erPage__emptyCell">
                        <div className="erPage__emptyState">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 460 512"
                            width="200"
                            className="mb-3"
                          >
                            <path d="M220.6 130.3l-67.2 28.2V43.2L98.7 233.5l54.7-24.2v130.3l67.2-209.3zm-83.2-96.7l-1.3 4.7-15.2 52.9C80.6 106.7 52 145.8 52 191.5c0 52.3 34.3 95.9 83.4 105.5v53.6C57.5 340.1 0 272.4 0 191.6c0-80.5 59.8-147.2 137.4-158zm311.4 447.2c-11.2 11.2-23.1 12.3-28.6 10.5-5.4-1.8-27.1-19.9-60.4-44.4-33.3-24.6-33.6-35.7-43-56.7-9.4-20.9-30.4-42.6-57.5-52.4l-9.7-14.7c-24.7 16.9-53 26.9-81.3 28.7l2.1-6.6 15.9-49.5c46.5-11.9 80.9-54 80.9-104.2 0-54.5-38.4-102.1-96-107.1V32.3C254.4 37.4 320 106.8 320 191.6c0 33.6-11.2 64.7-29 90.4l14.6 9.6c9.8 27.1 31.5 48 52.4 57.4s32.2 9.7 56.8 43c24.6 33.2 42.7 54.9 44.5 60.3s.7 17.3-10.5 28.5zm-9.9-17.9c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8z" />
                          </svg>
                          <p className="erPage__emptyText">
                            No Entry Reports Found.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Data rows */}
                  {!loading &&
                    !errorMessage &&
                    rows.map((row, idx) => {
                      const rowKey = row?._id ?? idx;
                      const serial = (currentPage - 1) * limit + idx + 1;

                      // Nested populated objects — every one may be null.
                      const attendee = row?.attendee ?? null;
                      const eventInfo = row?.eventId ?? null;
                      const ticketType = row?.ticketTypeId ?? null;
                      const booking = row?.bookingId ?? null;

                      const profileImage = attendee?.profileImage ?? null;
                      const attendeeName = attendee?.name ?? "-";
                      const mobileNumberVal = attendee?.mobileNumber ?? "-";
                      const email = attendee?.email ?? "-";
                      const registeredDate = attendee?.registeredAt
                        ? formatDateTime(attendee.registeredAt)
                        : "-";

                      const bookingNumber = row?.bookingNumber ?? "-";
                      const ticketNumber = row?.ticketNumber ?? "-";

                      const eventName = eventInfo?.title ?? "-";
                      const venue = eventInfo?.venueName ?? "-";
                      const eventDate = eventInfo?.startDateTime
                        ? formatDateTime(eventInfo.startDateTime)
                        : "-";

                      const ticketTypeName = ticketType?.ticketName ?? "-";
                      const ticketPrice = formatMoney(ticketType?.amount);

                      const bookingQty = booking?.quantity ?? "-";
                      const bookingAmount = formatMoney(booking?.amount);
                      const bookingStatus = booking?.bookingStatus ?? "-";
                      const bookingCreatedDate = booking?.createdAt
                        ? formatDateTime(booking.createdAt)
                        : "-";

                      const entryStatus = row?.status ?? "-";
                      const registered = row?.isRegistered ? "Yes" : "No";
                      const scannedAt = row?.scannedAt
                        ? formatDateTime(row.scannedAt)
                        : "-";

                      return (
                        <tr key={rowKey} className="erPage__tr">
                          <td className="erPage__td">{serial}</td>
                          <td className="erPage__td">
                            <ProfileAvatar
                              src={profileImage}
                              name={attendeeName}
                            />
                          </td>
                          <td className="erPage__td">{bookingNumber}</td>
                          <td className="erPage__td">{ticketNumber}</td>
                          <td className="erPage__td">{attendeeName}</td>
                          <td className="erPage__td">{mobileNumberVal}</td>
                          <td className="erPage__td">{email}</td>
                          <td className="erPage__td">{eventName}</td>
                          <td className="erPage__td">{venue}</td>
                          <td className="erPage__td">{eventDate}</td>
                          <td className="erPage__td">{ticketTypeName}</td>
                          <td className="erPage__td">{ticketPrice}</td>
                          <td className="erPage__td">{bookingQty}</td>
                          <td className="erPage__td">{bookingAmount}</td>
                          <td className="erPage__td">{bookingStatus}</td>
                          <td className="erPage__td">{entryStatus}</td>
                          <td className="erPage__td">{registered}</td>
                          <td className="erPage__td">{registeredDate}</td>
                          <td className="erPage__td">{scannedAt}</td>
                          <td className="erPage__td">{bookingCreatedDate}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="erPage__paginationBar">
              <div className="erPage__paginationInfo">
                Page {currentPage} of {totalPages}
                {totalRecords ? ` • ${totalRecords} records` : ""}
              </div>
              <div className="erPage__paginationControls">
                <button
                  type="button"
                  className="erPage__btn erPage__btn--reset"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={loading || currentPage <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="erPage__btn erPage__btn--search"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={loading || currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
