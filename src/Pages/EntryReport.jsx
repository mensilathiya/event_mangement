import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "../assets/CSS/EntryReport.css";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
// Existing entryReport redux architecture — adjust path if your thunk file
// lives elsewhere; it must resolve to the existing entryReportThunk.js.
import {
  getActiveEvents,
  getAllEntryReport,
  exportEntryReport,
} from "../redux/entryReport/entryReportThunk";
import { clearEntryReportState } from "../redux/entryReport/entryReportSlice";
// Existing qr redux slice — the same selector QRScannerModal already reads
// to know a check-in just succeeded. Reused here purely to trigger a
// refetch; QRScannerModal's own scanning/verification logic is untouched.
import { selectCheckInSuccess } from "../redux/qr/qrSlice";
// Existing event redux slice — selectDeletedEventId/Version are the same
// kind of "something changed elsewhere" signal as selectCheckInSuccess
// above, fed by the Event Management page's existing deleteEvent thunk.
// Reused here purely to trigger a refetch/clear; Event.jsx's own delete
// flow is untouched.
import {
  selectDeletedEventId,
  selectDeletedEventVersion,
} from "../redux/event/eventSlice";
import { showSuccess, showError } from "../utilits/toast";
import useEventExpiryRefetch from "../hooks/useEventExpiryRefetch";
import { FaChevronLeft, FaChevronRight, FaSort } from "react-icons/fa";
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

  // The event the user has picked from the Event dropdown. Starts empty
  // on purpose — the report is never auto-locked to the first/only event
  // returned by the API; the user must actively select one.
  const [selectedEventId, setSelectedEventId] = useState("");
  const eventId = selectedEventId;

  // Tracks whether the user has ever actively made an event selection
  // (including explicitly picking "All Events") via handleEventChange.
  // This is what lets the fetch effect below tell the difference between
  // "page just mounted, eventId happens to be empty" (no fetch — report
  // stays empty until the user picks something, per the original spec)
  // and "user just chose All Events" (eventId is empty, but a fetch for
  // every active event should fire immediately, no Search click needed).
  const [hasSelectedEvent, setHasSelectedEvent] = useState(false);

  // Existing entryReport slice state — no new/duplicate state is created here.
  const {
    entryReports,
    pagination,
    event: entryReportEvent,
    activeEvents,
    activeEventsLoading,
    loading,
    exportLoading,
    error,
  } = useSelector((state) => state.entryReport);

  const rows = entryReports ?? [];
  // console.log(rows);

  // The dropdown option matching the currently selected event, used as a
  // fallback for the date bounds below before the entry-report API's own
  // response (entryReportEvent) has arrived for that event.
  const selectedEventOption = activeEvents.find(
    (evt) => evt?._id === selectedEventId
  ) ?? null;

  // Event date bounds for the date-range picker. The backend's own
  // entry-report response (event.startDateTime / event.endDateTime) is the
  // source of truth once available for the *currently selected* event;
  // before that first response arrives for it, fall back to the matching
  // entry in activeEvents (the same list the dropdown itself is built
  // from), so the picker is always scoped to the one event the user
  // actually selected. No other event-selection state is consulted, so
  // inactive/unrelated events can never supply these dates.
  const eventStartDate =
    entryReportEvent?._id === selectedEventId && entryReportEvent?.startDateTime
      ? new Date(entryReportEvent.startDateTime)
      : selectedEventOption?.startDateTime
        ? new Date(selectedEventOption.startDateTime)
        : null;
  const eventEndDate =
    entryReportEvent?._id === selectedEventId && entryReportEvent?.endDateTime
      ? new Date(entryReportEvent.endDateTime)
      : selectedEventOption?.endDateTime
        ? new Date(selectedEventOption.endDateTime)
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

    // eventId is a required query param for the entry-report API (see the
    // fetch effect below and handleExport, which already sends it). It was
    // never being added here, so every list request — initial load, search,
    // filters, pagination, and rows-per-page — was missing it.
    if (eventId) params.eventId = eventId;

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

  // Populate the Event dropdown on load with every currently active/valid
  // event the logged-in user is allowed to view. This is the only place
  // the event list is fetched from — the dropdown always reflects exactly
  // this list, never a single first/default event.
  //
  // clearEntryReportState() runs first and is the actual fix for stale
  // Entry Report data surviving a deleted event: entryReports/pagination/
  // event live in Redux, not component state, so they don't reset when
  // this page unmounts (e.g. navigating to Event Management) and don't
  // get cleared just because selectedEventId resets to "" on the next
  // mount. Without this, a remount after deleting the currently-viewed
  // event would still render its old rows, because the table only checks
  // rows.length — never selectedEventId — before rendering (see the
  // Empty state / Data rows blocks below). This is a plain synchronous
  // reducer action (no API call), so it adds no extra network request.
  useEffect(() => {
    dispatch(clearEntryReportState());
    dispatch(getActiveEvents());
  }, [dispatch]);

  // Fetch entry report data once the user has made an event selection.
  // Never fires on its own from the first item in activeEvents — only a
  // real user selection (see handleEventChange) sets selectedEventId /
  // hasSelectedEvent. Two cases now trigger a fetch:
  //  - eventId is truthy: fetch that specific event's report (unchanged).
  //  - eventId is empty AND hasSelectedEvent is true: the user explicitly
  //    chose "All Events", so fetch the report for all active events
  //    immediately — buildEntryReportParams already omits eventId from
  //    the params whenever it's falsy, which is the existing "all events"
  //    contract getAllEntryReport/handleReset already rely on, so this
  //    reuses that same thunk/params rather than adding a new one.
  // On initial mount eventId is "" and hasSelectedEvent is still false,
  // so this correctly does nothing until the user actually picks an
  // option from the dropdown.
  useEffect(() => {
    if (!eventId && !hasSelectedEvent) return;

    dispatch(getAllEntryReport(buildEntryReportParams(1)));

  }, [eventId, hasSelectedEvent, dispatch]);

  // If the selected event disappears from the dropdown's own list (goes
  // Inactive/Expired) while the user is already on this page, deselect it
  // and clear the old rows/pagination explicitly — otherwise they'd keep
  // showing as if that event were still valid. Only acts once activeEvents
  // has actually loaded at least once, so it can't fire on the very first
  // render before the list has arrived.
  const prevEventIdRef = useRef(eventId);
  useEffect(() => {
    if (activeEventsLoading) return;

    const stillActive =
      !eventId || activeEvents.some((evt) => evt?._id === eventId);

    if (prevEventIdRef.current && !stillActive) {
      setSelectedEventId("");
      dispatch(clearEntryReportState());
    }
    prevEventIdRef.current = eventId;
  }, [eventId, activeEvents, activeEventsLoading, dispatch]);

  // Auto-refetch when the selected event's own end time is reached, so
  // this page reflects Active -> Inactive/Expired automatically while the
  // user stays on it — no manual browser refresh, no polling. Re-requests
  // the active-events list (so an expired event drops out of the
  // dropdown) and the entry report list for the current page/filters (not
  // a reset), using the exact same thunks/params the rest of this page
  // already uses.
  useEventExpiryRefetch(eventEndDate ? eventEndDate.getTime() : null, () => {
    dispatch(getActiveEvents());
    if (eventId) {
      dispatch(getAllEntryReport(buildEntryReportParams(currentPage)));
    }
  });

  // Auto-refresh when a Checker's QR scan successfully checks a ticket in,
  // so a newly-scanned entry shows up here immediately instead of requiring
  // a manual page refresh. checkInSuccess comes from the existing qr redux
  // slice — the exact same flag QRScannerModal already reads after
  // dispatch(checkInQr(...)).unwrap() succeeds — so this fires whenever a
  // check-in completes anywhere in the app while this page is mounted,
  // without needing any change to the scanner/verification flow itself.
  // Refetches with the currently applied filters/page (not a reset), same
  // as every other refetch on this page.
  const checkInSuccess = useSelector(selectCheckInSuccess);
  const prevCheckInSuccessRef = useRef(false);
  useEffect(() => {
    if (checkInSuccess && !prevCheckInSuccessRef.current && eventId) {
      dispatch(getAllEntryReport(buildEntryReportParams(currentPage)));
    }
    prevCheckInSuccessRef.current = checkInSuccess;
  }, [checkInSuccess, eventId, dispatch, currentPage]);

  // Auto-refresh when an event is deleted from the Event Management page
  // *while this component stays mounted* (e.g. a future in-page delete
  // action that doesn't navigate away). The far more common path — delete
  // on the Event page, then navigate back here — is handled by the
  // clearEntryReportState() in the mount effect above instead, since this
  // component (and this effect) doesn't exist yet at the moment that
  // deletion happens. deletedEventVersion (not just the id) is what's
  // watched, so a second delete of a previously-seen id still triggers
  // this. Two cases:
  //  - The deleted event is the one currently selected here: the old
  //    rows/pagination are no longer valid for anything, so clear them the
  //    same way the "event went Inactive/Expired" effect above already
  //    does, and drop the dropdown selection.
  //  - Some other event was deleted: this page's own rows are unaffected,
  //    but the dropdown list itself is stale, so just refresh it — same
  //    thunk the mount effect and the expiry refetch already use.
  const deletedEventId = useSelector(selectDeletedEventId);
  const deletedEventVersion = useSelector(selectDeletedEventVersion);
  const prevDeletedEventVersionRef = useRef(deletedEventVersion);
  useEffect(() => {
    if (deletedEventVersion === prevDeletedEventVersionRef.current) return;
    prevDeletedEventVersionRef.current = deletedEventVersion;

    if (deletedEventId && deletedEventId === eventId) {
      setSelectedEventId("");
      dispatch(clearEntryReportState());
    }
    dispatch(getActiveEvents());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedEventVersion]);

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
  // event selection
  const handleEventChange = (e) => {
    const newEventId = e.target.value;

    if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
    // Avoid a redundant fetch from the toolbar-search effect below firing
    // on top of the event-selection effect's own fetch.
    skipSearchEffectRef.current = true;

    setSelectedEventId(newEventId);
    // Marks this as a real, explicit user selection (as opposed to the
    // initial mount, where selectedEventId also happens to be ""). This
    // is what allows the fetch effect above to auto-load all events'
    // reports when newEventId is empty, without requiring a Search click.
    setHasSelectedEvent(true);

    // Reset the previously selected date range so a prior event's dates
    // are never carried over and applied against the newly selected
    // event — the date picker re-centers on the new event's own bounds
    // once its start/end dates are known (see the eventStartDate/
    // eventEndDate effect below).
    setDateRange("");
    setApiStartDate("");
    setApiEndDate("");
    setCommittedRange(null);
    setShowDatePicker(false);

    setPage(1);

    if (!newEventId) {
      // All Events selected: clear whatever the previously selected
      // single event's table/pagination were showing immediately, so no
      // stale single-event rows flash on screen while the "All Events"
      // request below is in flight. This is a plain synchronous reducer
      // action (no API call), so it doesn't add an extra network request
      // or race with the fetch that follows.
      dispatch(clearEntryReportState());
    }
    // Either way (a specific event or All Events), the eventId/
    // hasSelectedEvent-driven fetch effect above now picks this change up
    // on its own and dispatches getAllEntryReport — no Search click, and
    // no duplicate dispatch needed here.
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
    // Reload default (unfiltered) data for the active event. Built inline
    // (not via buildEntryReportParams) because the filter state setters
    // above haven't committed yet in this closure — only page/limit/eventId
    // are needed for a reset. eventId must still be included since it's a
    // required query param.
    dispatch(
      getAllEntryReport({
        page: 1,
        limit: pageSize,
        ...(eventId ? { eventId } : {}),
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

      showSuccess("Entry report exported successfully.");
    } else if (exportEntryReport.rejected.match(resultAction)) {
      // resultAction.payload is always a safe string here — the thunk uses
      // rejectWithValue(error?.response?.data?.message || "Failed to export
      // entry report"), never the raw error/response object.
      showError(resultAction.payload || "Failed to export entry report");
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
    if ((!eventId && !hasSelectedEvent) || loading) return;
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
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="erPage__filtersRow erPage__filtersRow--fields">
              {/* Event dropdown — lists every currently active/valid event
                  the logged-in user is allowed to view (see
                  getActiveEvents). Never pre-selected: the report stays
                  empty until the user actively picks one, per spec. */}
              <select
                className="erPage__input erPage__eventSelect"
                value={selectedEventId}
                onChange={handleEventChange}
                disabled={activeEventsLoading}
              >
                <option value="">
                  {activeEventsLoading ? "Loading events..." : "All Events"}
                </option>
                {activeEvents.map((evt) => (
                  <option key={evt._id} value={evt._id}>
                    {(evt.title || evt.name || "Event") +
                      (evt.eventCode ? ` - ${evt.eventCode}` : "")}
                  </option>
                ))}
              </select>

              <div className="erPage__dateRangeWrapper">
                <input
                  type="text"
                  className="erPage__input"
                  placeholder="Pick date rage"
                  value={dateRange}
                  readOnly
                  disabled={!eventStartDate || !eventEndDate}
                  onClick={toggleDatePicker}
                />
                {showDatePicker && (
                  <>
                    {/* Full-viewport click-catcher, same approach as
                        Booking.jsx's date popup: closing on outside-click
                        this way needs no ref/mousedown-listener bookkeeping
                        — anywhere outside the popup itself is this overlay. */}
                    <div
                      className="erPage__dateRangeOverlay"
                      onClick={handleCancelDateRange}
                    />
                    <div className="erPage__dateRangePopup">
                      <DateRange
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
                  </>
                )}
              </div>

              <input
                type="text"
                className="erPage__input"
                placeholder="Ticket Id"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
              />
            </div>

            <div className="erPage__filtersRow erPage__filtersRow--actions">
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
                         <span className="eventList__sortIcon"><FaSort /></span>
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
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 512" width="120" class="bookingPage-stateIcon"><path d="M220.6 130.3l-67.2 28.2V43.2L98.7 233.5l54.7-24.2v130.3l67.2-209.3zm-83.2-96.7l-1.3 4.7-15.2 52.9C80.6 106.7 52 145.8 52 191.5c0 52.3 34.3 95.9 83.4 105.5v53.6C57.5 340.1 0 272.4 0 191.6c0-80.5 59.8-147.2 137.4-158zm311.4 447.2c-11.2 11.2-23.1 12.3-28.6 10.5-5.4-1.8-27.1-19.9-60.4-44.4-33.3-24.6-33.6-35.7-43-56.7-9.4-20.9-30.4-42.6-57.5-52.4l-9.7-14.7c-24.7 16.9-53 26.9-81.3 28.7l2.1-6.6 15.9-49.5c46.5-11.9 80.9-54 80.9-104.2 0-54.5-38.4-102.1-96-107.1V32.3C254.4 37.4 320 106.8 320 191.6c0 33.6-11.2 64.7-29 90.4l14.6 9.6c9.8 27.1 31.5 48 52.4 57.4s32.2 9.7 56.8 43c24.6 33.2 42.7 54.9 44.5 60.3s.7 17.3-10.5 28.5zm-9.9-17.9c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8z"></path></svg>
                          <p className="erPage__emptyText">
                            {selectedEventId || hasSelectedEvent
                              ? "No Entry Reports Found."
                              : "Select an event above to view its entry report."}
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