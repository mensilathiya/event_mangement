import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import { updateOwnAdmin, updateAdminById, getAllAdmins } from "../redux/admin/adminThunk";
import { clearAdminState } from "../redux/admin/adminSlice";
import "../assets/CSS/EditAdminModal.css";
import { showError, showSuccess } from "../utilits/toast";

// Edit-only modal for the Admin Management page. There is no create/delete
// here, and no password field — matches the requirement to only allow
// editing name/email/mobile for now (password reset / email verification
// are a later phase). `admin` is either the current logged-in admin's own
// record, or — when the logged-in admin is the Super Admin — any other
// Admin's record (see Pages/Admin.jsx). `isEditingSelf` tells this modal
// which endpoint to call: PUT /api/admin/me for one's own profile, or
// PUT /api/admin/:id (Super-Admin-only, enforced server-side regardless
// of what the frontend sends) for any other Admin.
export default function EditAdminModal({ admin, onClose, isEditingSelf = true }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.admin);

  const [formData, setFormData] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    mobile: admin?.mobile || "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Fresh open → clear any error/success left over from a previous attempt.
  useEffect(() => {
    dispatch(clearAdminState());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required.";
    }

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      errors.mobile = "Enter a valid 10-digit mobile number.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // guards against double-submit
    if (!validate()) return;

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
      };

      if (isEditingSelf) {
        await dispatch(updateOwnAdmin(payload)).unwrap();
      } else {
        await dispatch(updateAdminById({ id: admin._id, data: payload })).unwrap();
      }

      showSuccess("Admin updated successfully");

      // Refresh the list so every row (not just this one, which the
      // slice already patches in place) reflects the latest data —
      // same belt-and-braces refetch pattern CreateUserModal uses.
      dispatch(getAllAdmins());

      dispatch(clearAdminState());

      onClose();
    } catch (err) {
      showError(err?.message || "Something went wrong");
    }
  };

  return (
    <div className="adminModalOverlay" onClick={onClose}>
      <div className="editAdminModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">Edit Admin</h2>
          <button
            type="button"
            className="closeIconButton"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <p className="fieldError" style={{ textAlign: "center", marginTop: 8 }}>
            {typeof error === "string" ? error : "Something went wrong. Please try again."}
          </p>
        )}

        <div className="formGrid">
          <div className="fieldGroup">
            <label className="fieldLabel">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="fieldInput"
              placeholder="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            {formErrors.name && <p className="fieldError">{formErrors.name}</p>}
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              className="fieldInput"
              placeholder="email@email.com"
              name="email"
              autoComplete="off"
              value={formData.email}
              onChange={handleChange}
            />
            {formErrors.email && <p className="fieldError">{formErrors.email}</p>}
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">
              Mobile no <span className="required">*</span>
            </label>
            <input
              type="text"
              className="fieldInput"
              placeholder="Mobile Number"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
            />
            {formErrors.mobile && <p className="fieldError">{formErrors.mobile}</p>}
          </div>
        </div>

        <div className="modalFooter">
          <button
            type="button"
            className="modalCloseButton"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
          <button
            type="button"
            className="modalCreateButton"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
