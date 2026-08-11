import React, { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import DashboardCard from "../Components/DashboardCard";
import { getDashboardSummary } from "../redux/dashboard/dashboardThunk";
import { clearDashboardState } from "../redux/dashboard/dashboardSlice";
import '../assets/CSS/DashboardPage.css';

// No existing currency formatter was found in the uploaded files — this
// uses Intl's built-in en-IN grouping (lakhs/crore) rather than hardcoding
// commas, matching the "Rs. 19,00,500" format from the spec.
// If the project already has a shared formatter elsewhere, swap this out.
const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

// DD-MM-YYYY, used only for Today Booking's date line.
const formatDateDDMMYYYY = (date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { dashboardData, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    if (!dashboardData && !loading) {
      dispatch(getDashboardSummary());
    }
    return () => {
      dispatch(clearDashboardState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    dispatch(clearDashboardState());
    dispatch(getDashboardSummary());
  }, [dispatch]);

  const activeEvent = dashboardData?.activeEvent;
  const activeEventEndDateTime = activeEvent?.endDateTime;

  // Auto-refetch once the active event's own endDateTime is reached, so
  // Active -> Inactive/Expired shows up without a manual refresh.
  //
  // Single, self-contained effect — no separate hook file, no
  // ref-wrapped callback. `dispatch` from useDispatch() is already
  // referentially stable, so there's nothing here that needs a ref to
  // stay fresh; the only dependency that matters is the event's own
  // end time.
  useEffect(() => {
    if (!activeEventEndDateTime) return;

    const endTime = new Date(activeEventEndDateTime).getTime();
    if (Number.isNaN(endTime)) return;

    let hasFired = false;
    const refetch = () => {
      if (hasFired) return;
      hasFired = true;
      dispatch(getDashboardSummary());
    };

    const msRemaining = endTime - Date.now();

    if (msRemaining <= 0) {
      // Already past expiry by the time this effect ran (e.g. the tab
      // was backgrounded through the expiry moment) — refetch now.
      refetch();
      return;
    }

    // setTimeout's delay is stored as a 32-bit signed int; anything
    // past ~24.8 days overflows and fires almost immediately. Clamping
    // means a far-future endDateTime schedules a safe recheck instead.
    const MAX_TIMEOUT_MS = 2147483647;
    const timerId = window.setTimeout(
      refetch,
      Math.min(msRemaining, MAX_TIMEOUT_MS)
    );

    // Fallback: if the tab was backgrounded and the timer's actual fire
    // time drifted (browsers throttle timers in inactive tabs), catch
    // up as soon as the tab becomes visible again.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && Date.now() >= endTime) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeEventEndDateTime, dispatch]);

  const eventDateRange = useMemo(() => {
    if (!activeEvent?.startDateTime || !activeEvent?.endDateTime) return "";
    const fmt = (d) =>
      new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    return `${fmt(activeEvent.startDateTime)} - ${fmt(activeEvent.endDateTime)}`;
  }, [activeEvent?.startDateTime, activeEvent?.endDateTime]);

  const activeEventRows = useMemo(() => {
    if (!activeEvent) return [];
    return [
      { label: activeEvent.title, value: activeEvent.venueName || "-" },
      { label: "Duration", value: eventDateRange },
      { label: "Address", value: activeEvent.address || "-" },
    ];
  }, [activeEvent, eventDateRange]);

  const bookingCountRows = useMemo(
    () =>
      dashboardData?.bookingCounts?.map((item) => ({
        label: item.date,
        value: String(item.count),
      })),
    [dashboardData?.bookingCounts]
  );

  const totalBookingRows = useMemo(
    () =>
      dashboardData?.totalBookingDetails?.map((item) => ({
        label: item.date,
        value: String(item.count),
      })),
    [dashboardData?.totalBookingDetails]
  );

  // Total Booking's top-left number must be the SUM of the date-wise
  // rows below it (matches the reference: 69+258+258+258+258 = 1101),
  // not the separate totalBooking document-count field. Computed here,
  // frontend-only — getTotalBooking/getTotalBookingDetails on the
  // backend are completely untouched.
  const totalBookingQty = useMemo(
    () =>
      dashboardData?.totalBookingDetails?.reduce(
        (sum, item) => sum + (item.count || 0),
        0
      ) ?? 0,
    [dashboardData?.totalBookingDetails]
  );

  // Ticket-Type-wise breakdown for the Total Pass Booking card
  const passBookingRows = useMemo(
    () =>
      dashboardData?.passBookingCounts?.map((item) => ({
        label: item.ticketName,
        value: String(item.qty),
        value2: formatCurrency(item.amount),
      })),
    [dashboardData?.passBookingCounts]
  );

  // Ticket-Type-wise breakdown for the Today Pass Booking card
  const todayPassBookingRows = useMemo(
    () =>
      dashboardData?.todayPassBookingCounts?.map((item) => ({
        label: item.ticketName,
        value: String(item.qty),
        value2: formatCurrency(item.amount),
      })),
    [dashboardData?.todayPassBookingCounts]
  );

  const statCards = useMemo(
    () => [
      {
        key: "todayBooking",
        title: "Today Booking",
        amountValue: String(dashboardData?.todayBooking ?? 0),
        amountLabel: "Today Booking",
        // Simplified per spec: no table, just the quantity + today's date.
        noteText: formatDateDDMMYYYY(new Date()),
      },
      {
        key: "todayPassBooking",
        title: "Today Pass Booking",
        amountValue: String(dashboardData?.todayPassBooking ?? 0),
        amountLabel: "Today Pass Booking",
        secondaryAmountValue: formatCurrency(dashboardData?.todayPassAmount ?? 0),
        secondaryAmountLabel: "Total Amount",
        columns: ["Date", "QTY", "Amount"],
        rows: todayPassBookingRows,
        // No table/empty-state text at all when there's no data today —
        // only render the breakdown when it actually has rows.
        hideBody: !todayPassBookingRows?.length,
      },
      {
        key: "totalBooking",
        title: "Total Booking",
        amountValue: String(totalBookingQty),
        amountLabel: "Total Booking",
        columns: ["Date", "QTY"],
        rows: totalBookingRows,
        emptyText: !totalBookingRows?.length ? "No Bookings Available" : undefined,
      },
      {
        key: "totalPassBooking",
        title: "Total Pass Booking",
        amountValue: String(dashboardData?.totalPassBooking ?? 0),
        amountLabel: "Total Pass Booking",
        secondaryAmountValue: formatCurrency(dashboardData?.totalPassAmount ?? 0),
        secondaryAmountLabel: "Total Amount",
        columns: ["Date", "QTY", "Amount"],
        rows: passBookingRows,
        emptyText: !passBookingRows?.length ? "No Bookings Available" : undefined,
      },
      {
        key: "bookingCounts",
        title: "Booking Counts",
        amountValue: undefined,
        amountLabel: undefined,
        columns: ["Date", "Counts"],
        rows: bookingCountRows,
        emptyText: !bookingCountRows?.length ? "No Data Available" : undefined,
      },
    ],
    [dashboardData, bookingCountRows, totalBookingRows, totalBookingQty, passBookingRows, todayPassBookingRows]
  );

  return (
    <div className="dashboardPage">
      <Sidebar />

      <div className="mainArea">
        <Header />

        <div className="content">
          <h1 className="pageDashboardTitle">Dashboard</h1>
          <p className="pageSubtitle">Dashboard</p>

          <div className="banner">{activeEvent?.title}</div>

          {error && (
            <div className="dashboardErrorBar">
              <span className="dashboardError">{error}</span>
              <button type="button" className="dashboardRetryBtn" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}

          <div className="cardGrid">
            {loading && !dashboardData ? (
              <>
                <div className="fullWidth">
                  <DashboardCardSkeleton />
                </div>
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
              </>
            ) : error && !dashboardData ? (
              // Request failed and there's no prior data to fall back on —
              // the error bar above already shows the message and Retry,
              // so render nothing here rather than empty-state cards that
              // would make a failure look like "no data".
              null
            ) : (
              <>
                <div className="fullWidth">
                  <DashboardCard
                    title="Active Event"
                    columns={["Venue", "Dates"]}
                    emptyText={!activeEvent ? "No Active Event" : undefined}
                    rows={activeEventRows}
                  />
                </div>

                {statCards.map((card) => (
                  <DashboardCard
                    key={card.key}
                    title={card.title}
                    amountValue={card.amountValue}
                    amountLabel={card.amountLabel}
                    secondaryAmountValue={card.secondaryAmountValue}
                    secondaryAmountLabel={card.secondaryAmountLabel}
                    columns={card.columns}
                    rows={card.rows}
                    emptyText={card.emptyText}
                    noteText={card.noteText}
                    hideBody={card.hideBody}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* <div className="footer">
          <span>2026 © Keenthemes</span>
          <div className="footerLinks">
            <span>About</span>
            <span>Support</span>
            <span>Purchase</span>
          </div>
        </div> */}
      </div>
    </div>
  );
}

function DashboardCardSkeleton() {
  return (
    <div className="card cardSkeleton">
      <div className="cardHeader">
        <div className="skeletonBlock skeletonAmount" />
      </div>
      <div className="skeletonBlock skeletonRowHeader" />
      <div className="skeletonBlock skeletonRow" />
      <div className="skeletonBlock skeletonRow" />
      <div className="skeletonBlock skeletonRow" />
    </div>
  );
}