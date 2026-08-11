import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

// Optional `permission` prop gates a route beyond plain authentication —
// e.g. <ProtectedRoute permission="Entry Report" />. Admin always passes
// (matches backend authorize behavior). A Checker/User must have the
// named permission in their `permissions` array.
//
// Current-user source: prefer the live `profile` (fetched via
// getProfile() from the backend on app load — always up to date), and
// fall back to the `user` object cached at login time in localStorage
// (available immediately, before getProfile() resolves, so there's no
// flash of "no access" right after a refresh).
const ProtectedRoute = ({ permission = null }) => {
  const token = localStorage.getItem("token");

  const profile = useSelector((state) => state.auth.profile);
  const authUser = useSelector((state) => state.auth.user);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (permission) {
    const currentUser = profile || authUser;
    const role = currentUser?.role;
    const permissions = Array.isArray(currentUser?.permissions)
      ? currentUser.permissions
      : [];

    const hasAccess = role === "admin" || permissions.includes(permission);

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;