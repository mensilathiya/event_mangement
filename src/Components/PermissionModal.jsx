import { FaTimes } from "react-icons/fa";
import "../assets/CSS/PermissionModal.css";

const allPermissions = [
  "read entryReport",
  "delete expense",
  "update expense",
  "read expense",
  "create expense",
  "delete income",
  "update income",
  "read income",
  "create income",
  "read dashboard",
  "read crew",
  "delete crew",
  "update crew",
  "create crew",
  "read event",
  "create event",
  "delete booking",
  "create booking",
  "update booking",
  "read booking",
  "delete user",
  "update user",
  "read user",
  "create user",
  "delete role",
  "update role",
  "read role",
  "create role",
  "delete permission",
  "update permission",
  "read permission",
  "create permission",
];

function getPermissionList(permissionLabel) {
  if (permissionLabel === "All Permission") {
    return allPermissions;
  }
  const count = parseInt(permissionLabel, 10) || 0;
  return allPermissions.slice(0, count);
}

export default function PermissionModal({ role, onClose }) {
  if (!role) return null;

  const permissionList = getPermissionList(role.permission);

  return (
    <div className="permissionModalOverlay" onClick={onClose}>
      <div className="permissionModalContainer" onClick={(e) => e.stopPropagation()}>
        <div className="permissionModalHeader">
          <h2 className="permissionModalTitle">Permission</h2>
          <button
            type="button"
            className="permissionModalCloseIconButton"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <p className="permissionModalSubtitle">
          {role.permission} Role <span className="permissionModalRole">{role.name}</span>
        </p>

        <div className="permissionModalGrid">
          {permissionList.map((permission, index) => (
            <div className="permissionModalItem" key={permission}>
              <span className="permissionModalItemNumber">{index + 1}.</span>
              <span>{permission}</span>
            </div>
          ))}
        </div>

        <div className="permissionModalFooter">
          <button type="button" className="permissionModalCloseBtn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
