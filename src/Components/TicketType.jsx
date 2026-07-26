import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../assets/CSS/TicketType.css";

const INITIAL_TICKET_DATA = [
  {
    id: 1,
    name: "Fast 100 SESSON PASS 4 DAYS",
    allowDayCount: 4,
    amount: 10000,
    allowDate: "15-10-2026, 16-10-2026, 17-10-2026, 18-10-2026",
    availableCount: 100,
    createdOn: "Shailesh Savani",
  },
  {
    id: 2,
    name: "First SP 4 DAY",
    allowDayCount: 4,
    amount: 10500,
    allowDate: "15-10-2026, 16-10-2026, 17-10-2026, 18-10-2026",
    availableCount: 100,
    createdOn: "Shailesh Savani",
  },
  {
    id: 3,
    name: "Advance Tier",
    allowDayCount: 4,
    amount: 11500,
    allowDate: "15-10-2026, 16-10-2026, 17-10-2026, 18-10-2026",
    availableCount: 100,
    createdOn: "Shailesh Savani",
  },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad2 = (value) => String(value).padStart(2, "0");

const formatDate = (date) =>
  `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;

const dateKey = (date) => formatDate(date);

const parseDateStr = (str) => {
  const [day, month, year] = str.split("-").map((n) => parseInt(n, 10));
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

const parseAllowDate = (allowDateStr) => {
  if (!allowDateStr || allowDateStr === "-") return [];
  return allowDateStr
    .split(",")
    .map((s) => s.trim())
    .map(parseDateStr)
    .filter(Boolean)
    .sort((a, b) => a - b);
};

const buildCalendarGrid = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
};

const EMPTY_FORM = {
  ticketName: "",
  allowDayCount: "",
  amount: "",
  availableCount: "",
  description: "",
};

const TicketType = () => {
  const [tickets, setTickets] = useState(INITIAL_TICKET_DATA);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");
  const [openActionId, setOpenActionId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const [deleteTarget, setDeleteTarget] = useState(null);
  const isDeleteModalOpen = deleteTarget !== null;

  const toggleAction = (id) => {
    setOpenActionId((prev) => (prev === id ? null : id));
  };

  const filteredData = tickets.filter((ticket) =>
    ticket.name.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = () => {
    setModalMode("create");
    setEditingTicketId(null);
    setForm(EMPTY_FORM);
    setSelectedDates([]);
    setIsCalendarOpen(false);
    setCalendarViewDate(new Date());
    setIsModalOpen(true);
  };

  const openEditModal = (ticket) => {
    setModalMode("edit");
    setEditingTicketId(ticket.id);
    setForm({
      ticketName: ticket.name,
      allowDayCount: String(ticket.allowDayCount),
      amount: String(ticket.amount),
      availableCount: String(ticket.availableCount),
      description: ticket.description || "",
    });
    const parsedDates = parseAllowDate(ticket.allowDate);
    setSelectedDates(parsedDates);
    setIsCalendarOpen(false);
    setCalendarViewDate(parsedDates.length ? parsedDates[0] : new Date());
    setIsModalOpen(true);
    setOpenActionId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCalendarOpen(false);
  };

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleCalendar = () => {
    setIsCalendarOpen((prev) => !prev);
  };

  const goToPrevMonth = () => {
    setCalendarViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCalendarViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    const key = dateKey(day);
    setSelectedDates((prev) => {
      const exists = prev.some((d) => dateKey(d) === key);
      if (exists) {
        return prev.filter((d) => dateKey(d) !== key);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const removeSelectedDate = (key) => {
    setSelectedDates((prev) => prev.filter((d) => dateKey(d) !== key));
  };

  const handleSubmit = () => {
    if (!form.ticketName || !form.allowDayCount || !form.amount || !form.availableCount || !form.description) {
      return;
    }

    const allowDate = selectedDates.length
      ? selectedDates.map(formatDate).join(", ")
      : "-";

    if (modalMode === "edit") {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === editingTicketId
            ? {
                ...ticket,
                name: form.ticketName,
                allowDayCount: form.allowDayCount,
                amount: form.amount,
                allowDate,
                availableCount: form.availableCount,
                description: form.description,
              }
            : ticket
        )
      );
    } else {
      const newTicket = {
        id: tickets.length ? Math.max(...tickets.map((t) => t.id)) + 1 : 1,
        name: form.ticketName,
        allowDayCount: form.allowDayCount,
        amount: form.amount,
        allowDate,
        availableCount: form.availableCount,
        description: form.description,
        createdOn: "Shailesh Savani",
      };
      setTickets((prev) => [...prev, newTicket]);
    }

    closeModal();
  };

  const openDeleteModal = (ticket) => {
    setDeleteTarget(ticket);
    setOpenActionId(null);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTickets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  useEffect(() => {
    if (!isDeleteModalOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeDeleteModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleteModalOpen]);

  const calendarCells = buildCalendarGrid(calendarViewDate);
  const selectedKeys = selectedDates.map((d) => dateKey(d));

  return (
    <div className="ticketType__layout">
      <Sidebar />
      <div className="ticketType__main">
        <Header title="Ticket Type" />

        <div className="ticketType__page">
          <div className="ticketType__topRow">
            <div className="ticketType__titleBlock">
              <h1 className="ticketType__title">
                Ticket Type (RANGE SANGE SHUBH NAVRATRI - 2026)
              </h1>
              <div className="ticketType__breadcrumb">
                <span>Dashboard</span>
                <span className="ticketType__breadcrumbSep">-</span>
                <span className="ticketType__breadcrumbActive">
                  Ticket Type
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ticketType__createBtn"
              onClick={openModal}
            >
              <span className="ticketType__createBtnIcon">+</span>
              Create Ticket Type
            </button>
          </div>

          <a href="#back" className="ticketType__backLink">
            <span className="ticketType__backArrow">&#8592;</span> Back Page
          </a>

          <div className="ticketType__card">
            <div className="ticketType__toolbar">
              <div className="ticketType__pageSizeWrap">
                <select
                  className="ticketType__pageSizeSelect"
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                >
                  <option value="10">select an option</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              <div className="ticketType__searchWrap">
                <span className="ticketType__searchIcon">&#128269;</span>
                <input
                  type="text"
                  className="ticketType__searchInput"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="ticketType__tableWrapper">
              <table className="ticketType__table">
                <colgroup>
                  <col className="ticketType__colIndex" />
                  <col className="ticketType__colName" />
                  <col className="ticketType__colDayCount" />
                  <col className="ticketType__colAmount" />
                  <col className="ticketType__colDate" />
                  <col className="ticketType__colAvailable" />
                  <col className="ticketType__colCreated" />
                  <col className="ticketType__colAction" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="ticketType__th">#</th>
                    <th className="ticketType__th">Ticket Name</th>
                    <th className="ticketType__th">Allow Day Count</th>
                    <th className="ticketType__th">Amount</th>
                    <th className="ticketType__th">Allow Date</th>
                    <th className="ticketType__th">Available Count</th>
                    <th className="ticketType__th">Created On</th>
                    <th className="ticketType__th ticketType__thAction">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((ticket, index) => (
                    <tr key={ticket.id} className="ticketType__tr">
                      <td className="ticketType__td">{index + 1}</td>
                      <td className="ticketType__td ticketType__tdName">
                        {ticket.name}
                      </td>
                      <td className="ticketType__td">
                        {ticket.allowDayCount}
                      </td>
                      <td className="ticketType__td">{ticket.amount}</td>
                      <td className="ticketType__td ticketType__tdDate">
                        {ticket.allowDate}
                      </td>
                      <td className="ticketType__td">
                        {ticket.availableCount}
                      </td>
                      <td className="ticketType__td">{ticket.createdOn}</td>
                      <td className="ticketType__td ticketType__tdAction">
                        <div className="ticketType__actionDropdown">
                          <button
                            type="button"
                            className="ticketType__actionBtn"
                            onClick={() => toggleAction(ticket.id)}
                          >
                            Action <span className="ticketType__caret">▾</span>
                          </button>

                          {openActionId === ticket.id && (
                            <div className="ticketType__actionMenu">
                              <button
                                type="button"
                                className="ticketType__actionMenuItem"
                                onClick={() => openEditModal(ticket)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ticketType__actionMenuItem ticketType__actionMenuItemDelete"
                                onClick={() => openDeleteModal(ticket)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td
                        className="ticketType__td ticketType__emptyRow"
                        colSpan={8}
                      >
                        No ticket types found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ticketType__footer">
              <span>
                Show {filteredData.length === 0 ? 0 : 1} - {filteredData.length}{" "}
                of {filteredData.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="ticketTypeModal__overlay" onClick={closeModal}>
          <div
            className="ticketTypeModal__container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ticketTypeModal__header">
              <h2 className="ticketTypeModal__title">
                {modalMode === "edit" ? "Edit Ticket Type" : "Add Ticket Type"}{" "}
                (RANGE SANGE SHUBH NAVRATRI - 2026)
              </h2>
              <button
                type="button"
                className="ticketTypeModal__closeIcon"
                onClick={closeModal}
                aria-label="Close"
              >
                &#10005;
              </button>
            </div>

            <div className="ticketTypeModal__body">
              <div className="ticketTypeModal__field">
                <label className="ticketTypeModal__label">
                  Ticket Name <span className="ticketTypeModal__required">*</span>
                </label>
                <input
                  type="text"
                  className="ticketTypeModal__input"
                  placeholder="Ticket Name"
                  value={form.ticketName}
                  onChange={handleFieldChange("ticketName")}
                />
              </div>

              <div className="ticketTypeModal__row">
                <div className="ticketTypeModal__field ticketTypeModal__fieldHalf">
                  <label className="ticketTypeModal__label">
                    Allow Day count <span className="ticketTypeModal__required">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ticketTypeModal__input"
                    placeholder="Allow Day count"
                    value={form.allowDayCount}
                    onChange={handleFieldChange("allowDayCount")}
                  />
                </div>

                <div className="ticketTypeModal__field ticketTypeModal__fieldHalf">
                  <label className="ticketTypeModal__label">
                    Amount <span className="ticketTypeModal__required">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="ticketTypeModal__input"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={handleFieldChange("amount")}
                  />
                </div>
              </div>

              <div className="ticketTypeModal__field ticketTypeModal__datePickerField">
                <label className="ticketTypeModal__label">Allow Date</label>
                <button
                  type="button"
                  className="ticketTypeModal__dateInput"
                  onClick={toggleCalendar}
                >
                  {selectedDates.length ? (
                    <span className="ticketTypeModal__dateChips">
                      {selectedDates.map((d) => {
                        const key = dateKey(d);
                        return (
                          <span key={key} className="ticketTypeModal__dateChip">
                            {formatDate(d)}
                            <span
                              className="ticketTypeModal__dateChipRemove"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSelectedDate(key);
                              }}
                            >
                              &#10005;
                            </span>
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    <span className="ticketTypeModal__datePlaceholder">
                      Pick date
                    </span>
                  )}
                  <span className="ticketTypeModal__calendarIcon">&#128197;</span>
                </button>

                {isCalendarOpen && (
                  <div className="ticketTypeModal__calendarDropdown">
                    <div className="ticketTypeModal__calendarHeader">
                      <button
                        type="button"
                        className="ticketTypeModal__calendarNavBtn"
                        onClick={goToPrevMonth}
                      >
                        &#8249;
                      </button>
                      <span className="ticketTypeModal__calendarMonthLabel">
                        {MONTH_NAMES[calendarViewDate.getMonth()]}{" "}
                        {calendarViewDate.getFullYear()}
                      </span>
                      <button
                        type="button"
                        className="ticketTypeModal__calendarNavBtn"
                        onClick={goToNextMonth}
                      >
                        &#8250;
                      </button>
                    </div>

                    <div className="ticketTypeModal__calendarWeekdays">
                      {WEEKDAY_LABELS.map((label) => (
                        <span key={label} className="ticketTypeModal__calendarWeekday">
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="ticketTypeModal__calendarGrid">
                      {calendarCells.map((day, idx) => {
                        if (!day) {
                          return (
                            <span
                              key={`empty-${idx}`}
                              className="ticketTypeModal__calendarCell ticketTypeModal__calendarCellEmpty"
                            />
                          );
                        }
                        const key = dateKey(day);
                        const isSelected = selectedKeys.includes(key);
                        return (
                          <button
                            type="button"
                            key={key}
                            className={
                              "ticketTypeModal__calendarCell" +
                              (isSelected
                                ? " ticketTypeModal__calendarCellSelected"
                                : "")
                            }
                            onClick={() => handleSelectDay(day)}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="ticketTypeModal__field">
                <label className="ticketTypeModal__label">
                  Available Count <span className="ticketTypeModal__required">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="ticketTypeModal__input"
                  placeholder="Available Count"
                  value={form.availableCount}
                  onChange={handleFieldChange("availableCount")}
                />
              </div>

              <div className="ticketTypeModal__field">
                <label className="ticketTypeModal__label">
                  Description <span className="ticketTypeModal__required">*</span>
                </label>
                <textarea
                  className="ticketTypeModal__textarea"
                  placeholder="Description"
                  rows={4}
                  value={form.description}
                  onChange={handleFieldChange("description")}
                />
              </div>
            </div>

            <div className="ticketTypeModal__footer">
              <button
                type="button"
                className="ticketTypeModal__closeBtn"
                onClick={closeModal}
              >
                Close
              </button>
              <button
                type="button"
                className="ticketTypeModal__createBtn"
                onClick={handleSubmit}
              >
                {modalMode === "edit" ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div
          className="ticketTypeDelete__overlay"
          onClick={closeDeleteModal}
        >
          <div
            className="ticketTypeDelete__container"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ticketTypeDelete__closeIcon"
              onClick={closeDeleteModal}
              aria-label="Close"
            >
              &#10005;
            </button>

            <div className="ticketTypeDelete__iconWrap">
              <span className="ticketTypeDelete__icon">!</span>
            </div>

            <h2 className="ticketTypeDelete__title">Delete Ticket Type</h2>

            <p className="ticketTypeDelete__message">
              Are you sure you want to delete{" "}
              <span className="ticketTypeDelete__ticketName">
                {deleteTarget.name}
              </span>{" "}
              ?
            </p>

            <div className="ticketTypeDelete__footer">
              <button
                type="button"
                className="ticketTypeDelete__closeBtn"
                onClick={closeDeleteModal}
              >
                Close
              </button>
              <button
                type="button"
                className="ticketTypeDelete__deleteBtn"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketType;
