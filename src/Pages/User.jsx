import {
  useState, useRef, useEffect
} from "react";
import { FaSort, FaSearch, FaChevronDown, FaPlus, FaPencilAlt, FaTrashAlt, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import CreateUserModal from "../Components/CreateUserModal";
import DeleteUserModal from "../Components/DeleteUserModal";
import "../assets/CSS/User.css";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getUsers } from '../redux/user/userThunk';
import { showError, showSuccess } from "../utilits/toast";
import { clearUserState } from "../redux/user/userSlice";
const LOGO_AVATAR = "https://ui-avatars.com/api/?name=SA&background=e0331e&color=fff&bold=true";


const columns = ["Image", "Name", "Email", "Mobile No", "Role", "Created", "Action"];

export default function User() {
  const dispatch = useDispatch();
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { users, loading, error, pagination } = useSelector(
    (state) => state.user
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tracks which row's Action dropdown is currently open
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Tracks whether the modal is in "create" or "edit" mode
  const [modalMode, setModalMode] = useState("create");

  // Holds the user data selected for editing
  const [selectedUser, setSelectedUser] = useState(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteUserName, setDeleteUserName] = useState("");
  const [deleteUserId, setDeleteUserId] = useState(null);
  const currentPage = activePage;
  const totalPages = pagination?.totalPages || 1;
  const totalEntries = pagination?.total || 0;
  const limit = pagination?.limit || rowsPerPage;

  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * limit;
  const endIndex = Math.min(currentPage * limit, totalEntries);

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );
  // fetch user
  useEffect(() => {
  dispatch(
    getUsers({
      page: activePage,
      limit: rowsPerPage,
      search: searchTerm,
    })
  );
}, [dispatch, activePage, rowsPerPage, searchTerm]);
  // Ref for detecting outside clicks to close the action dropdown
  const actionMenuRef = useRef(null);
  // action drpdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleToggleActionMenu = (userId) => {
    setOpenActionMenuId((prev) => (prev === userId ? null : userId));
  };
  // pagination
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setActivePage(currentPage - 1);
    }
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setActivePage(currentPage + 1);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setModalMode("edit");
    setIsModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleDeleteClick = (user) => {
    setDeleteUserId(user._id);
    setDeleteUserName(user.name);
    setIsDeleteModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleCreateClick = () => {
    setSelectedUser(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setModalMode("create");
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteUserName("");
  };
  // delete user
  const handleDeleteConfirm = async () => {
    try {
      const res = await dispatch(deleteUser(deleteUserId)).unwrap();

      showSuccess(res.message);

      dispatch(clearUserState());

      handleCloseDeleteModal();
    } catch (err) {
      showError(err.message || "Failed to delete user");
    }
  };
  return (
    <div className="userPage__page">
      <Sidebar />

      <div className="userPage__mainArea">
        <Header title="User" />

        <div className="userPage__content">
          <div className="userPage__topRow">
            <div>
              <h1 style={{ textAlign: "start", display: "block" }} className="userPage__pageTitle">
                User
              </h1>
              <div className="userPage__breadcrumb">
                <span>Dashboard</span>
                <span>-</span>
                <span className="userPage__breadcrumbActive">User</span>
              </div>
            </div>

            <button
              type="button"
              className="userPage__createButton"
              onClick={handleCreateClick}
            >
              <FaPlus />
              Create User
            </button>
          </div>

          <div className="userPage__tableCard">
            <div className="userPage__tableControls">
              <select
                className="userPage__rowsSelect"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setActivePage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <div className="userPage__searchBox">
                <FaSearch />
                <input
                  type="text"
                  className="userPage__searchInput"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setActivePage(1);
                  }} />
              </div>
            </div>

            <div className="userPage__tableWrapper">
              {loading && (
                <h3>Loading...</h3>
              )}
              <table className="userPage__table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>
                        <span className="userPage__thContent">
                          {col}
                          {col !== "Action" && <FaSort className="userPage__sortIcon" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <img
                          src={
                            user.image ||
                            `https://ui-avatars.com/api/?name=${user.name}`
                          }
                          alt={user.name}
                          className="userPage__avatar"
                        />
                      </td>
                      <td className="userPage__userName">{user.name}</td>
                      <td>{user.email || "-"}</td>
                      <td>{user.mobile}</td>
                      <td>{user.role}</td>
                      <td>
                        {new Date(user.createdAt)
                          .toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                          .replace(",", "")
                          .replace(/\//g, "-")}
                      </td>
                      <td style={{ position: "relative" }}>
                        <div
                          className="userAction__wrapper"
                          ref={openActionMenuId === user._id ? actionMenuRef : null}
                        >
                          <button
                            type="button"
                            className="userAction__button"
                            onClick={() => handleToggleActionMenu(user._id)}
                          >
                            Action
                            <FaChevronDown className="userAction__icon" />
                          </button>

                          <div
                            className={`userAction__menu ${openActionMenuId === user._id ? "userAction__menuOpen" : ""
                              }`}
                          >
                            <button
                              type="button"
                              className="userAction__item userAction__itemEdit"
                              onClick={() => handleEditClick(user)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="userAction__item userAction__itemDelete"
                              onClick={() => handleDeleteClick(user)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* pagination */}
            <div className="permissionPagePagination">

              <span className="permissionPagePaginationInfo">
                Show {totalEntries === 0 ? 0 : startIndex + 1} - {endIndex} of {totalEntries}
              </span>
              {totalEntries > rowsPerPage && (

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
                      onClick={() => setActivePage(page)}
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

      {isModalOpen && (
        <div
          tabIndex={-1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCloseModal();
            }
          }}
        >
          <CreateUserModal
            onClose={handleCloseModal}
            isEditMode={modalMode === "edit"}
            editUserData={selectedUser}
          />
        </div>
      )}

      {isDeleteModalOpen && (
        <div
          tabIndex={-1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCloseDeleteModal();
            }
          }}
        >
          <DeleteUserModal
            onClose={handleCloseDeleteModal}
            userName={deleteUserName}
            onDelete={handleDeleteConfirm}
          />
        </div>
      )}
    </div>
  );
}
