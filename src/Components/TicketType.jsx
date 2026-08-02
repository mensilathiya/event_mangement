import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../assets/CSS/TicketType.css";
import { deleteTicketType, getAllTicketTypes } from "../redux/ticketType/ticketTypeThunk";
import CreateTicketTypeModal from "./CreateTicketTypeModal";
import DeleteTicketTypeModal from "./DeleteTicketTypeModal";
import { FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import { clearTicketTypeState } from "../redux/ticketType/ticketTypeSlice";

const TicketType = () => {
  const dispatch = useDispatch();
  const { eventId } = useParams();
  const location = useLocation();

const eventName = location.state?.eventName || "";
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  // ================= REDUX STATE (GET) =================
  const {
    ticketTypes,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
  } = useSelector((state) => state.ticketType);

  const [openActionId, setOpenActionId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const isDeleteModalOpen = deleteTarget !== null;

  // ================= FETCH ON PAGE LOAD =================
  useEffect(() => {
    dispatch(
      getAllTicketTypes({
        eventId,
        page: currentPage,
        limit: rowsPerPage,
        search,
      })
    );
  }, [dispatch, eventId, currentPage, rowsPerPage, search]);
  // paginaion logic
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(currentPage * rowsPerPage, total);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const toggleAction = (id) => {
    setOpenActionId((prev) => (prev === id ? null : id));
  };

  const filteredData = (ticketTypes || []).filter((ticket) =>
    (ticket.ticketName || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedTicketType(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ticket) => {
    setIsEditMode(true);
    setSelectedTicketType(ticket);
    setIsModalOpen(true);
    setOpenActionId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicketType(null);
  };

  const openDeleteModal = (ticket) => {
    setDeleteTarget(ticket);
    setOpenActionId(null);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };
  // delete modal
 const handleDelete = async (ticket) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `You want to delete "${ticket.ticketName}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
  });

  if (!result.isConfirmed) return;

  try {
    await dispatch(deleteTicketType(ticket._id)).unwrap();

    dispatch(
      getAllTicketTypes({
        eventId,
        page: currentPage,
        limit: rowsPerPage,
        search,
      })
    );

    dispatch(clearTicketTypeState());
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error || "Failed to delete ticket type.",
    });
  }
};
  return (
    <div className="ticketType__layout">
      <Sidebar />
      <div className="ticketType__main">
        <Header title="Ticket Type" />

        <div className="ticketType__page">
          <div className="ticketType__topRow">
            <div className="ticketType__titleBlock">
              <h1 className="ticketType__title">
               {eventName}
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
              onClick={openCreateModal}
            >
              <span className="ticketType__createBtnIcon">+</span>
              Create Ticket Type
            </button>
          </div>

          <Link to="/event" className="ticketType__backLink">
            <span className="ticketType__backArrow">&#8592;</span> Back Page
          </Link>

          <div className="eventList__card">
            <div className="eventList__toolbar">
              <div>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="eventList__pageSizeSelect"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="eventList__searchBox">
                <span className="eventList__searchIcon"><FaSearch /></span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="eventList__searchInput"
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
                  {loading && (
                    <tr>
                      <td className="ticketType__td ticketType__emptyRow" colSpan={8}>
                        Loading ticket types...
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td className="ticketType__td ticketType__emptyRow" colSpan={8}>
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && filteredData.map((ticket, index) => (
                    <tr key={ticket._id} className="ticketType__tr">
                      <td className="ticketType__td">{index + 1}</td>
                      <td className="ticketType__td ticketType__tdName">
                        {ticket.ticketName}
                      </td>
                      <td className="ticketType__td">
                        {ticket.allowDayCount}
                      </td>
                      <td className="ticketType__td">{ticket.amount}</td>
                      <td className="ticketType__td ticketType__tdDate">
                        {ticket.allowDate
                          ? new Date(ticket.allowDate).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="ticketType__td">
                        {ticket.availableCount}
                      </td>
                      <td className="ticketType__td">
                        {ticket.createdBy?.name || ticket.createdOn || "-"}
                      </td>
                      <td className="ticketType__td ticketType__tdAction">
                        <div className="ticketType__actionDropdown">
                          <button
                            type="button"
                            className="ticketType__actionBtn"
                            onClick={() => toggleAction(ticket._id)}
                          >
                            Action <span className="ticketType__caret">▾</span>
                          </button>

                          {openActionId === ticket._id && (
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
                                onClick={() => handleDelete(ticket)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && !error && filteredData.length === 0 && (
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

            <div className="permissionPagePagination">

              <span className="permissionPagePaginationInfo">
                Show {total === 0 ? 0 : startIndex + 1} - {endIndex} of {total}
              </span>

              {totalPages > 1 && (
                <div className="permissionPagePaginationControls">

                  <button
                    type="button"
                    className="permissionPagePaginationArrow"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`permissionPagePaginationBtn ${currentPage === page
                          ? "permissionPagePaginationActive"
                          : ""
                        }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="permissionPagePaginationArrow"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <CreateTicketTypeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        eventId={eventId}
        eventName={eventName}
        isEditMode={isEditMode}
        selectedTicketType={selectedTicketType}
      />

      {/* <DeleteTicketTypeModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        ticketTypeId={deleteTarget?._id}
        ticketName={deleteTarget?.ticketName}
      /> */}
    </div>
  );
};

export default TicketType;