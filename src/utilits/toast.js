import { toast } from "react-toastify";
// =============== show success message =====================
export const showSuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
  });
};
// ============== showError message =================
export const showError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 3000,
  });
};
// =============== show warning message =====================
export const showWarning = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 3000,
  });
};
// ====================== show info message ==================
export const showInfo = (message) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
  });
};