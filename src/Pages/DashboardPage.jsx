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

  const statCards = useMemo(
    () => [
      {
        key: "todayBooking",
        title: "Today Booking",
        amountValue: String(dashboardData?.todayBooking ?? 0),
        amountLabel: "Today Booking",
        columns: ["Date", "QTY"],
        rows: bookingCountRows,
        emptyText: !bookingCountRows?.length ? "No Bookings Available" : undefined,
      },
      {
        key: "todayPassBooking",
        title: "Today Pass Entry",
        amountValue: String(dashboardData?.todayPassBooking ?? 0),
        amountLabel: "Today Pass Entry",
        columns: ["Date", "QTY"],
        rows: undefined,
        emptyText: "No Bookings Available",
      },
      {
        key: "totalBooking",
        title: "Total Booking",
        amountValue: String(dashboardData?.totalBooking ?? 0),
        amountLabel: "Total Booking",
        columns: ["Date", "QTY"],
        rows: totalBookingRows,
        emptyText: !totalBookingRows?.length ? "No Bookings Available" : undefined,
      },
      {
        key: "totalPassBooking",
        title: "Total Pass Entry",
        amountValue: String(dashboardData?.totalPassBooking ?? 0),
        amountLabel: "Total Pass Entry",
        columns: ["Date", "QTY"],
        rows: undefined,
        emptyText: "No Bookings Available",
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
    [dashboardData, bookingCountRows, totalBookingRows]
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
                    columns={card.columns}
                    rows={card.rows}
                    emptyText={card.emptyText}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="footer">
          <span>2026 © Keenthemes</span>
          <div className="footerLinks">
            <span>About</span>
            <span>Support</span>
            <span>Purchase</span>
          </div>
        </div>
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