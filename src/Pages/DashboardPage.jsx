import React from "react";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import DashboardCard from "../Components/DashboardCard";
import '../assets/CSS/DashboardPage.css';

export default function DashboardPage() {
  return (
    <div className="dashboardPage">
      <Sidebar />

      <div className="mainArea">
        <Header />

        <div className="content">
          <h1 className="pageDashboardTitle">Dashboard</h1>
          <p className="pageSubtitle">Dashboard</p>

          <div className="banner">RANGE SANGE SHUBH NAVRATRI - 2026</div>

          <div className="cardGrid">
            <DashboardCard
              title="Today Booking"
              columns={["Date", "QTY"]}
              emptyText="No Bookings Available"
            />

            <DashboardCard
              title="Today Pass Booking"
              amountValue="Rs. 0"
              amountLabel="Total Amount"
              columns={["Date", "Amount"]}
              emptyText="No Bookings Available"
            />

            <DashboardCard
              title="Total Booking"
              amountValue="970"
              amountLabel=""
              columns={["Date", "QTY"]}
              rows={[
                { label: "No Date Selected", value: "90" },
                { label: "15 Oct 2026", value: "220" },
                { label: "16 Oct 2026", value: "220" },
                { label: "17 Oct 2026", value: "220" },
                { label: "18 Oct 2026", value: "220" },
              ]}
            />

            <DashboardCard
              title="Total Pass Booking"
              amountValue="Rs. 32,08,500"
              amountLabel="Total Amount"
              columns={["Date", "Amount"]}
              rows={[
                { label: "Fast 100 SESSON PASS 4 DAYS", value: "Rs. 11,70,000" },
                { label: "First SP 4 DAY", value: "Rs. 18,79,500" },
                { label: "Advance Tier", value: "Rs. 1,38,000" },
              ]}
            />

            <DashboardCard
              title="Crew Counts"
              columns={["Date", "Counts"]}
              emptyText="No Data Available"
            />

            <DashboardCard
              title="Booking Counts"
              columns={["Date", "Counts"]}
              emptyText="No Data Available"
            />

            <div className="fullWidth">
              <DashboardCard
                title="Balance"
                amountValue="Rs. 32,08,500"
                amountLabel="Balance"
                columns={["Description", "Amount"]}
                rows={[
                  { label: "Income", value: "Rs." },
                  { label: "Booking Income", value: "Rs. 32,08,500" },
                  { label: "Expense", value: "Rs." },
                ]}
              />
            </div>
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
