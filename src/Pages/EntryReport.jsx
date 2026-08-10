import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "../assets/CSS/EntryReport.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
// Existing entryReport redux architecture — adjust path if your thunk file
// lives elsewhere; it must resolve to the existing entryReportThunk.js.
import {
  getAllEntryReport,
  exportEntryReport,
} from "../redux/entryReport/entryReportThunk";
import { clearEntryReportState } from "../redux/entryReport/entryReportSlice";
// Reusing the existing dashboard thunk so this page can obtain the active
// event on its own, instead of depending on <DashboardPage /> having
// already dispatched it. Same thunk DashboardPage already uses.
import { getDashboardSummary } from "../redux/dashboard/dashboardThunk";
import useEventExpiryRefetch from "../hooks/useEventExpiryRefetch";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";

// Formats a Date object as "DD-MM-YYYY" — used for all frontend date
// display (date-range filter input, popup footer, export filename). Does
// NOT touch the API date format (see formatDateForApi below).
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy}`;
};

// Formats a Date object as "YYYY-MM-DD" — used for the startDate/endDate
// query params sent to the entry-report API.
const formatDateForApi = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Formats a date-only API value (e.g. passDate) as "DD-MM-YYYY", with no
// time component. Returns "-" for missing or invalid values. Reuses
// formatDate so there's a single date-display helper in the file.
const formatDateOnly = (value) => {
  if (!value) return "-";
  const formatted = formatDate(value);
  return formatted || "-";
};

// Formats any API date/time value as "DD-MM-YYYY, <local time>". Returns
// "-" for missing or invalid values so nothing renders as "Invalid Date".
const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const datePart = formatDate(d);
  const timePart = d.toLocaleTimeString();
  return `${datePart}, ${timePart}`;
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

// Table columns mapped 1:1 to the real Entry Report API response fields.
const COLUMNS = [
  "#",
  "Profile",
  "Booking Id",
  "Ticket Id",
  "QR Code",
  "Name",
  "Mobile Number",
  "Pass Date",
  "Scanned At"
];

export default function EntryReport() {
  const [bookingId, setBookingId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [name, setName] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [apiStartDate, setApiStartDate] = useState("");
  const [apiEndDate, setApiEndDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const dispatch = useDispatch();
  const { dashboardData, loading: dashboardLoading } = useSelector(
    (state) => state.dashboard
  );

  const eventId = dashboardData?.activeEvent?._id;
  // Existing entryReport slice state — no new/duplicate state is created here.
  const { entryReports, pagination, event: entryReportEvent, loading, exportLoading, error } =
    useSelector((state) => state.entryReport);

  const rows = entryReports ?? [];
  // console.log(rows);

  // Event date bounds for the date-range picker. The backend's own
  // entry-report response (event.startDateTime / event.endDateTime) is the
  // source of truth once available; before that first response arrives,
  // fall back to dashboardData.activeEvent — the same source eventId itself
  // is derived from above, so the picker is always scoped to the one active
  // event this page actually queries for. No other event-selection state is
  // consulted, so inactive/unrelated events can never supply these dates.
  const activeEvent = dashboardData?.activeEvent ?? null;

  const eventStartDate = entryReportEvent?.startDateTime
    ? new Date(entryReportEvent.startDateTime)
    : activeEvent?.startDate
      ? new Date(activeEvent.startDate)
      : null;
  const eventEndDate = entryReportEvent?.endDateTime
    ? new Date(entryReportEvent.endDateTime)
    : activeEvent?.endDate
      ? new Date(activeEvent.endDate)
      : null;

  // Builds the API params from the current filter values, matching the
  // entry-report backend's query contract exactly.
 const buildEntryReportParams = (
  targetPage = 1,
  customLimit = pageSize
) => {
  const params = {
    page: targetPage,
    limit: customLimit,
  };

  if (bookingId) params.bookingId = bookingId;
  if (ticketId) params.ticketId = ticketId;
  if (name) params.name = name;
  if (mobileNumber) params.mobileNumber = mobileNumber;
  if (apiStartDate) params.startDate = apiStartDate;
  if (apiEndDate) params.endDate = apiEndDate;
  if (searchTerm) params.search = searchTerm;

  return params;
};

  // Pagination values as returned by the API: { page, limit, total, totalPages }
  const currentPage = pagination?.page ?? page;
  const limit = pagination?.limit ?? pageSize;
  const totalPages = pagination?.totalPages ?? 1;
  const totalRecords = pagination?.total ?? rows.length;

  // Ensure the active event is available regardless of navigation path.
  // Previously this page only ever *read* dashboardData — it never fetched
  // it — so eventId stayed undefined forever on direct navigation/refresh
  // (dashboardData is only populated by DashboardPage's own dispatch).
  // Mirrors the exact same guard DashboardPage uses, so if the user arrived
  // via Dashboard this is a no-op (no duplicate call).
  useEffect(() => {
    if (!dashboardData && !dashboardLoading) {
      dispatch(getDashboardSummary());
    }
  }, [dashboardData, dashboardLoading, dispatch]);

  // Fetch entry report data on first page load using the existing thunk/slice.
  // eventId is a required query param, so wait until it's available. Once
  // the effect above resolves getDashboardSummary(), eventId changes and
  // this effect fires on its own.
  useEffect(() => {
    if (!eventId) return;

    dispatch(getAllEntryReport(buildEntryReportParams(1)));

  }, [eventId, dispatch]);

  // If the active event disappears (goes Inactive/Expired and the API no
  // longer reports an eventId) while the user is already on this page, the
  // fetch effect above simply stops firing — it never clears the old rows.
  // Without this, the previous event's table/pagination would keep showing
  // as if it were still valid. Clear it explicitly the moment eventId drops
  // from a real value to none, so the page reflects "no active event"
  // instead of stale data.
  const prevEventIdRef = useRef(eventId);
  useEffect(() => {
    if (prevEventIdRef.current && !eventId) {
      dispatch(clearEntryReportState());
    }
    prevEventIdRef.current = eventId;
  }, [eventId, dispatch]);

  // Auto-refetch when the active event's own end time is reached, so this
  // page reflects Active -> Inactive/Expired automatically while the user
  // stays on it — no manual browser refresh, no polling. Re-requests the
  // dashboard summary (to pick up the new event/active-event state) and
  // the entry report list for the current page/filters (not a reset),
  // using the exact same thunks/params the rest of this page already uses.
  useEventExpiryRefetch(eventEndDate ? eventEndDate.getTime() : null, () => {
    dispatch(getDashboardSummary());
    if (eventId) {
      dispatch(getAllEntryReport(buildEntryReportParams(currentPage)));
    }
  });

  // Skips the very first run of the toolbar-search effect (mount) and any
  // run caused by handleReset/handleSearch programmatically clearing or
  // resubmitting searchTerm, since those already dispatch their own fetch.
  const skipSearchEffectRef = useRef(true);
  // Lets handleSearch/handleReset cancel a pending debounced search so a
  // stale duplicate call can't fire a few hundred ms after an explicit
  // Search/Reset click.
  const searchDebounceTimerRef = useRef(null);

  // Toolbar "Search..." box — previously kept in React state only and
  // never sent to the backend. Debounced so it doesn't fire on every
  // keystroke, and always resets to page 1 like the main Search button.
  useEffect(() => {
    if (skipSearchEffectRef.current) {
      skipSearchEffectRef.current = false;
      return;
    }
    if (!eventId) return;

    searchDebounceTimerRef.current = setTimeout(() => {
      setPage(1);
      dispatch(getAllEntryReport(buildEntryReportParams(1)));
    }, 400);

    return () => clearTimeout(searchDebounceTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Change page while keeping the currently applied filters intact.
  const handlePageSizeChange = (e) => {
  const newSize = Number(e.target.value);

  setPageSize(newSize);
  setPage(1);

  dispatch(
    getAllEntryReport(
      buildEntryReportParams(1, newSize)
    )
  );
};

  

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
  // Popup position, computed only for desktop widths (matches the existing
  // 992px breakpoint already used for tablet/mobile overrides in
  // EntryReport.css). Null means "let the CSS media rules handle it".
  const [popupPos, setPopupPos] = useState(null);
  const DESKTOP_BREAKPOINT = 992;

  const updatePopupPosition = () => {
    if (typeof window === "undefined") return;
    if (window.innerWidth <= DESKTOP_BREAKPOINT) {
      setPopupPos(null);
      return;
    }
    const inputEl = dateInputRef.current;
    const popupEl = datePickerRef.current;
    if (!inputEl) return;

    const rect = inputEl.getBoundingClientRect();
    const margin = 12;
    const popupWidth = popupEl?.offsetWidth || 700;
    const popupHeight = popupEl?.offsetHeight || 420;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Keep the popup's right edge from running past the viewport.
    let left = rect.left;
    if (left + popupWidth + margin > viewportWidth) {
      left = Math.max(margin, viewportWidth - popupWidth - margin);
    }

    // Prefer opening below the input; flip above it if there isn't enough
    // room below, so the calendar is never clipped by the viewport edge.
    let top = rect.bottom + 8;
    if (top + popupHeight + margin > viewportHeight) {
      const spaceAbove = rect.top - 8 - popupHeight;
      top = spaceAbove >= margin ? spaceAbove : margin;
    }

    setPopupPos({ top, left });
  };

  // Recompute whenever the popup opens, and keep it correctly placed on
  // resize/scroll while it stays open.
  useLayoutEffect(() => {
    if (!showDatePicker) return;
    updatePopupPosition();
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDatePicker]);

  // Once the entry-report API returns event.startDateTime/endDateTime,
  // re-center the calendar on the event's own date range (unless the user
  // has already committed a custom selection).
  useEffect(() => {
    if (committedRange) return;
    if (!eventStartDate || !eventEndDate) return;
    setTempRange([
      {
        startDate: eventStartDate,
        endDate: eventEndDate,
        key: "selection",
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventStartDate?.getTime(), eventEndDate?.getTime()]);

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
  // date picker
  const toggleDatePicker = () => {
    // Never open an unrestricted calendar: only allow opening once the
    // active event's own start/end dates are known, since minDate/maxDate
    // (and therefore which dates are selectable) depend on them.
    if (!eventStartDate || !eventEndDate) return;

    setShowDatePicker((prev) => {
      const next = !prev;
      if (next) {
        // Reopen with the last committed selection, if any
        setTempRange(
          committedRange || [
            {
              startDate: eventStartDate,
              endDate: eventEndDate,
              key: "selection",
            },
          ]
        );
      }
      return next;
    });
  };
  // date range
  const handleDateRangeChange = (item) => {
    setTempRange([item.selection]);
  };
  // apply date changes
  const handleApplyDateRange = () => {
    setCommittedRange(tempRange);
    setDateRange(
      `${formatDate(tempRange[0].startDate)} - ${formatDate(
        tempRange[0].endDate
      )}`
    );
    setApiStartDate(formatDateForApi(tempRange[0].startDate));
    setApiEndDate(formatDateForApi(tempRange[0].endDate));
    setShowDatePicker(false);
  };
  // cancel date changes
  const handleCancelDateRange = () => {
    if (committedRange) {
      setTempRange(committedRange);
    }
    setShowDatePicker(false);
  };
  // search
 const handleSearch = () => {
  if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
  setPage(1);

  dispatch(
    getAllEntryReport(
      buildEntryReportParams(1)
    )
  );
};
  // reset
  const handleReset = () => {
    if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
    // Clearing searchTerm below would otherwise re-trigger the debounced
    // search effect and fire a second, redundant request.
    skipSearchEffectRef.current = true;

    setBookingId("");
    setMobileNumber("");
    setTicketId("");
    setName("");
    setSearchTerm("");
    setDateRange("");
    setApiStartDate("");
    setApiEndDate("");
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
    // Reload default (unfiltered) data for the active event.
    dispatch(
  getAllEntryReport({
    page: 1,
    limit: pageSize,
  })
);
  };
  // export
  const handleExport = async () => {
    if (exportLoading) return;

    const resultAction = await dispatch(
      exportEntryReport({
        eventId,
        bookingId,
        ticketId,
        name,
        mobileNumber,
        search: searchTerm,
        startDate: apiStartDate,
        endDate: apiEndDate,
      })
    );

    if (exportEntryReport.fulfilled.match(resultAction)) {
      const blob = new Blob(
        [resultAction.payload],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.setAttribute(
        "download",
        `entry-report-${formatDate(new Date())}.xlsx`
      );

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
  // Pagination
  const startIndex =
    totalRecords === 0 ? 0 : (currentPage - 1) * limit;

  const endIndex = Math.min(
    currentPage * limit,
    totalRecords
  );

  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Single source of truth for page navigation: updates local page state
  // (used as the fallback for currentPage before the API responds) and
  // requests that page with the currently applied filters intact.
  const handlePageChange = (targetPage) => {
    if (loading || targetPage === currentPage) return;
    if (targetPage < 1 || (totalPages && targetPage > totalPages)) return;

    setPage(targetPage);
    dispatch(getAllEntryReport(buildEntryReportParams(targetPage)));
  };

  const goToPreviousPage = () => {
    if (currentPage > 1 && !loading) {
      handlePageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages && !loading) {
      handlePageChange(currentPage + 1);
    }
  };

  // If filtering/search shrinks the result set so the current page no
  // longer exists, automatically fall back to the last valid page.
  useEffect(() => {
    if (!eventId || loading) return;
    if (totalRecords === 0) return;
    if (currentPage > totalPages) {
      const validPage = Math.max(1, totalPages);
      setPage(validPage);
      dispatch(getAllEntryReport(buildEntryReportParams(validPage)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, totalRecords]);
  return (
    <div className="erPage_wrapper">
      <Sidebar />
      <div className="erPageMainArea">
        <Header title="Entry Report" />
        <div className="erPage__container">
          {/* Title + Breadcrumb */}
          <div className="erPage__titleBlock">
            <h1 className="erPage__title">Entry Report</h1>
            <div className="erPage__breadcrumb">
             <Link to="/dashboard">Dashboard</Link>
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
                placeholder="Ticket Id"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
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
                  disabled={!eventStartDate || !eventEndDate}
                  onClick={toggleDatePicker}
                />
                {showDatePicker && createPortal(
                  <div
                    className="erPage__dateRangePopup"
                    ref={datePickerRef}
                    style={popupPos ? { top: popupPos.top, left: popupPos.left } : undefined}
                  >
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
                      staticRanges={[]}
                      inputRanges={[]}
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
                  </div>,
                  document.body
                )}
              </div>
              <button
                className="erPage__btn erPage__btn--search"
                onClick={handleSearch}
                disabled={loading}
              >
                Search
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
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
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
                  disabled={exportLoading || !eventId}
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

                      // Flat entry-report API row shape.
                      const profileImage = row?.profileImage ?? null;
                      const bookingIdVal = row?.bookingId ?? "-";
                      const ticketIdVal = row?.ticketId ?? "-";
                      const qrImage = row?.qrImage ?? null;
                      const nameVal = row?.name ?? "-";
                      const mobileNumberVal = row?.mobileNumber ?? "-";
                      const passDate = row?.passDate
                        ? formatDateOnly(row.passDate)
                        : "-";
                      const scannedAt = row?.scannedAt
                        ? formatDateTime(row.scannedAt)
                        : "-";

                      return (
                        <tr key={rowKey} className="erPage__tr">
                          <td className="erPage__td">{serial}</td>
                          <td className="erPage__td">
                            <ProfileAvatar src={profileImage} name={nameVal} />
                          </td>
                          <td className="erPage__td">{bookingIdVal}</td>
                          <td className="erPage__td">{ticketIdVal}</td>
                          <td className="erPage__td">
                            {qrImage ? (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(qrImage, "_blank", "noopener,noreferrer")
                                }
                                title="Click to preview QR code"
                                style={{
                                  padding: 0,
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  lineHeight: 0,
                                }}
                              >
                                <img
                                  src={qrImage}
                                  alt="QR Code"
                                  style={{
                                    width: 32,
                                    height: 32,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                  }}
                                />
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="erPage__td">{nameVal}</td>
                          <td className="erPage__td">{mobileNumberVal}</td>
                          <td className="erPage__td">{passDate}</td>
                          <td className="erPage__td">{scannedAt}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {/* paginations */}
            <div className="permissionPagePagination">
              <span className="permissionPagePaginationInfo">
                Show {totalRecords === 0 ? 0 : startIndex + 1} - {endIndex} of {totalRecords}
              </span>

              {totalPages > 1 && (
                <div className="permissionPagePaginationControls">

                  <button
                    type="button"
                    className="permissionPagePaginationArrow"
                    onClick={goToPreviousPage}
                    disabled={loading || currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>

                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`permissionPagePaginationBtn ${currentPage === pageNum
                          ? "permissionPagePaginationBtn--active"
                          : "permissionPagePaginationBtn--reset"
                        }`}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="permissionPagePaginationArrow"
                    onClick={goToNextPage}
                    disabled={loading || currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}