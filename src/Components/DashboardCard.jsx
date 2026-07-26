import React from "react";
import '../assets/CSS/DashboardCard.css';

export default function DashboardCard({
  title = "Card Title",
  amountValue,
  amountLabel,
  columns = ["Date", "QTY"],
  rows = [
    { label: "No Data Selected", value: "0" },
    { label: "Placeholder Row", value: "0" },
  ],
  emptyText,
}) {
  return (
    <div className="card">
      <div className="cardHeader">
        <p className="cardTitle">{title}</p>
        {amountValue && (
          <div className="cardAmount">
            <p className="cardAmountValue">{amountValue}</p>
            <p className="cardAmountLabel">{amountLabel}</p>
          </div>
        )}
      </div>

      <div className="rowHeader">
        <span className="rowHeaderLabel">{columns[0]}</span>
        <span className="rowHeaderLabel">{columns[1]}</span>
      </div>

      <div className="rowList">
        {emptyText ? (
          <p className="emptyState">{emptyText}</p>
        ) : (
          rows.map((row, index) => (
            <div className="row" key={index}>
              <span className="rowLabel">{row.label}</span>
              <span className="rowValue">{row.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
