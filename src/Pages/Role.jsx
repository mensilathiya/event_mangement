import { useState } from "react";
import { FaSort, FaSearch, FaChevronDown, FaPlus } from "react-icons/fa";
import Sidebar from "../Components/Sidebar";
import Header from "../Components/Header";
import CreateRoleModal from "../Components/CreateRoleModal";
import DeleteRoleModal from "../Components/DeleteRoleModal";
import "../assets/CSS/Role.css";
import PermissionModal from "../Components/PermissionModal";

const roles = [
  {
    id: 1,
    name: "admin",
    guard: "web",
    permission: "All Permission",
    created: "26-06-2024 07:20 am",
    updated: "26-06-2024 07:20 am",
  },
  {
    id: 2,
    name: "checker",
    guard: "web",
    permission: "3 Permission",
    created: "26-06-2024 07:20 am",
    updated: "26-06-2024 07:20 am",
  },
  {
    id: 3,
    name: "partner",
    guard: "web",
    permission: "8 Permission",
    created: "29-07-2024 02:19 pm",
    updated: "29-07-2024 02:19 pm",
  },
  {
    id: 4,
    name: "booking",
    guard: "web",
    permission: "8 Permission",
    created: "29-07-2024 03:28 pm",
    updated: "30-07-2024 11:35 am",
  },
  {
    id: 5,
    name: "sub admin",
    guard: "web",
    permission: "16 Permission",
    created: "02-07-2025 05:14 pm",
    updated: "02-07-2025 05:14 pm",
  },
];

const columns = ["Name", "Guard", "Permission", "Created", "Updated"];

export default function Role() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [openActionId, setOpenActionId] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionModalRole, setPermissionModalRole] = useState(null);

  const filteredRoles = roles
    .filter((role) => role.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, Number(rowsPerPage));

  const toggleActionMenu = (id) => {
    setOpenActionId((prev) => (prev === id ? null : id));
  };

  const toggleRowSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allIds = filteredRoles.map((role) => role.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id)) && allIds.length > 0;
    setSelectedIds(allSelected ? [] : allIds);
  };

  const openBulkDeleteModal = () => {
    const count = selectedIds.length;
    setDeleteTarget(`${count} Role${count > 1 ? "s" : ""}`);
  };

  return (
    <div className="rolePage">
      <Sidebar />

      <div className="mainArea">
        <Header title="Role" />

        <div className="content">
          <div className="topRow">
            <div>
              <h1 className="pageRoleTitle">Role</h1>
              <div className="breadcrumb">
                <span>Dashboard</span>
                <span>-</span>
                <span className="active">Role</span>
              </div>
            </div>

            {selectedIds.length === 0 ? (
              <button
                type="button"
                className="createButton"
                onClick={() => {
                  setSelectedRole(null);
                  setIsEditMode(false);
                  setIsRoleModalOpen(true);
                }}
              >
                <FaPlus />
                Create Role
              </button>
            ) : (
              <button type="button" className="createButton" onClick={openBulkDeleteModal}>
                Delete Selected
              </button>
            )}
          </div>

          <div className="tableCard">
            {openActionId !== null && (
              <div
                onClick={() => setOpenActionId(null)}
                style={{ position: "fixed", inset: 0, zIndex: 15 }}
              />
            )}

            <div className="tableControls">
              <select
                className="rowsSelect"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(e.target.value)}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>

              <div className="searchRoleBox">
                <FaSearch />
                <input
                  type="text"
                  className="searchRoleInput"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="tableWrapper">
              <table className="roleTable">
                <thead>
                  <tr>
                    <th className="checkboxCell">
                      <input
                        type="checkbox"
                        className="rowCheckbox"
                        checked={
                          filteredRoles.length > 0 &&
                          filteredRoles.every((role) => selectedIds.includes(role.id))
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    {columns.map((col) => (
                      <th key={col}>
                        <span className="thContent">
                          {col}
                          {col !== "Permission" && <FaSort className="sortIcon" />}
                        </span>
                      </th>
                    ))}
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="rowCheckbox"
                          checked={selectedIds.includes(role.id)}
                          onChange={() => toggleRowSelection(role.id)}
                        />
                      </td>
                      <td className="roleName">{role.name}</td>
                      <td>{role.guard}</td>
                      <td>
                        <span
                          className="permissionLink"
                          onClick={() => setPermissionModalRole(role)}
                        >
                          {role.permission}
                        </span>
                      </td>
                      <td>{role.created}</td>
                      <td>{role.updated}</td>
                      <td className="actionCell">
                        <button
                          type="button"
                          className={`actionButton ${openActionId === role.id ? "open" : ""}`}
                          onClick={() => toggleActionMenu(role.id)}
                        >
                          Action
                          <FaChevronDown />
                        </button>

                        {openActionId === role.id && (
                          <div className="actionMenu">
                            <button
                              type="button"
                              className="actionMenuItem"
                              onClick={() => {
                                setSelectedRole(role);
                                setIsEditMode(true);
                                setIsRoleModalOpen(true);
                                setOpenActionId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="actionMenuItem"
                              onClick={() => {
                                setDeleteTarget(role.name);
                                setOpenActionId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tableFooter">
              Show 1 - {filteredRoles.length} of {roles.length}
            </div>
          </div>
        </div>
      </div>

      {isRoleModalOpen && (
        <div
          tabIndex={-1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsRoleModalOpen(false);
            }
          }}
        >
          <CreateRoleModal
            isEditMode={isEditMode}
            selectedRole={selectedRole}
            onClose={() => setIsRoleModalOpen(false)}
          />
        </div>
      )}

      {deleteTarget && (
        <div
          tabIndex={-1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDeleteTarget(null);
            }
          }}
        >
          <DeleteRoleModal roleName={deleteTarget} onClose={() => setDeleteTarget(null)} />
        </div>
      )}
      {permissionModalRole && (
        <div
          tabIndex={-1}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setPermissionModalRole(null);
            }
          }}
        >
          <PermissionModal
            role={permissionModalRole}
            onClose={() => setPermissionModalRole(null)}
          />
        </div>
      )}
    </div>
  );
}
