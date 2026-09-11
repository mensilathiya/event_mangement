import React, { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import DashboardCard from "../Components/DashboardCard";
import { getDashboardSummary } from "../redux/dashboard/dashboardThunk";
import { clearDashboardState } from "../redux/dashboard/dashboardSlice";
import '../assets/CSS/DashboardPage.css';

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

  // The 4 overall, all-events counts from dashboard.service.js's
  // getDashboardCounts() (Step 2). Each is a single number — the backend
  // doesn't return a date-wise or ticket-wise breakdown for these, so
  // every card here renders as amount-only (hideBody: true), same as
  // the Active Event card's siblings used to before any rows existed.
  const statCards = useMemo(
    () => [
      {
        key: "totalBookings",
        title: "Total Bookings",
        amountValue: String(dashboardData?.totalBookings ?? 0),
        amountLabel: "Total Bookings",
        hideBody: true,
      },
      {
        key: "registeredTickets",
        title: "Registered Tickets",
        amountValue: String(dashboardData?.registeredTickets ?? 0),
        amountLabel: "Registered Tickets",
        hideBody: true,
      },
      {
        key: "pendingRegistrations",
        title: "Pending Registrations",
        amountValue: String(dashboardData?.pendingRegistrations ?? 0),
        amountLabel: "Pending Registrations",
        hideBody: true,
      },
      {
        key: "scannedEntries",
        title: "Scanned Entries",
        amountValue: String(dashboardData?.scannedEntries ?? 0),
        amountLabel: "Scanned Entries",
        hideBody: true,
      },
    ],
    [dashboardData]
  );

  return (
    <div className="dashboardPage">
      <Sidebar />

      <div className="mainArea">
        <Header />

        <div className="content">
          <h1 className="pageDashboardTitle">Dashboard</h1>
          <p className="pageSubtitle">Dashboard</p>

          <div className="banner">
            {activeEvent?.title || "No Active Event"}
          </div>

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