import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTimes, FaPencilAlt, FaUser } from "react-icons/fa";
import { createUser, updateUser } from "../redux/user/userThunk";
import { clearUserState } from "../redux/user/userSlice";
import "../assets/CSS/CreateUserModal.css";
import { showError, showSuccess } from "../utilits/toast";

export default function CreateUserModal({ onClose, isEditMode = false, editUserData = null }) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "checker",
    password: "",
    confirmPassword: "",
  });

  const { loading, error } = useSelector((state) => state.user);

  const fileInputRef = useRef(null);

  const [profileImage, setProfileImage] = useState(
    isEditMode && editUserData
      ? editUserData.profileImage || null
      : null
  );

  const [imageFile, setImageFile] = useState(null);

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    dispatch(clearUserState());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && editUserData) {
      setFormData({
        name: editUserData.name || "",
        mobile: editUserData.mobile || "",
        email:
          editUserData.email === "-"
            ? ""
            : editUserData.email || "",
        role: "checker",
        password: "",
        confirmPassword: "",
      });

      setProfileImage(editUserData.profileImage || null);
      setImageFile(null);
    } else {
      setFormData({
        name: "",
        mobile: "",
        email: "",
        role: "checker",
        password: "",
        confirmPassword: "",
      });

      setProfileImage(null);
      setImageFile(null);
    }
  }, [isEditMode, editUserData]);

  // Upload Image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type)) {
      showError("Only PNG, JPG and JPEG files are allowed.");
      return;
    }

    setImageFile(file);
    setProfileImage(URL.createObjectURL(file));
  };

  // Remove Image
  const handleRemoveImage = () => {
    setProfileImage(null);
    setImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validation
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

    if (
      formData.email &&
      !/^\S+@\S+\.\S+$/.test(formData.email)
    ) {
      errors.email = "Enter a valid email address.";
    }

    if (!isEditMode) {
      if (!formData.password) {
        errors.password = "Password is required.";
      } else if (formData.password.length < 8) {
        errors.password =
          "Password must be at least 8 characters.";
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword =
          "Please confirm your password.";
      }
    }

    if (
      (formData.password || formData.confirmPassword) &&
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Handle Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = new FormData();

    payload.append("name", formData.name);
    payload.append("mobile", formData.mobile);
    if (formData.email.trim()) {
      payload.append("email", formData.email.trim());
    }
    payload.append("role", "checker");

    if (formData.password) {
      payload.append("password", formData.password);
    }

    if (formData.confirmPassword) {
      payload.append(
        "confirmPassword",
        formData.confirmPassword
      );
    }

    if (imageFile) {
      payload.append("profileImage", imageFile);
    }

    try {
      if (isEditMode) {
        await dispatch(
          updateUser({
            id: editUserData._id,
            data: payload,
          })
        ).unwrap();

        showSuccess("User updated successfully");
      } else {
        await dispatch(createUser(payload)).unwrap();

        showSuccess("User created successfully");
      }

      dispatch(clearUserState());

      onClose();
    } catch (err) {
      showError(
        err?.message ||
        err?.response?.data?.message ||
        "Something went wrong"
      );
    }
  };
  return (
    <div className="Useroverlay" onClick={onClose}>
      <div className="createUserModal" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">{isEditMode ? "Edit User" : "Create User"}</h2>
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

        {/* image upload */}
        <div className="photoSection">
          <p className="photoLabel">Profile Photo</p>

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            ref={fileInputRef}
            onChange={handleImageUpload}
            hidden
          />

          <div className="photoCircleWrap">
            <div className="photoCircle">
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
              ) : (
                <FaUser className="photoPlaceholderIcon" />
              )}
            </div>

            <button
              type="button"
              className="editPhotoButton"
              aria-label="Upload photo"
              onClick={() => fileInputRef.current.click()}
            >
              <FaPencilAlt />
            </button>

            <button
              type="button"
              className="removePhotoButton"
              aria-label="Remove photo"
              onClick={handleRemoveImage}
              disabled={!profileImage}
            >
              <FaTimes />
            </button>
          </div>

          <p className="photoHint">
            Allowed file types: png, jpg, jpeg.
          </p>
        </div>

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
              Role <span className="required">*</span>
            </label>
            <select
              className="fieldSelect"
              value={formData.role}
              name="role"
              onChange={handleChange}
            >
              <option value="" disabled>
                select an option
              </option>
              <option value="checker">Checker</option>
            </select>
            {formErrors.role && <p className="fieldError">{formErrors.role}</p>}
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">
              Mobile no <span className="required">*</span>
            </label>
            <input
              type="text"
              className="fieldInput"
              name="mobile"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange}
            />
            {formErrors.mobile && <p className="fieldError">{formErrors.mobile}</p>}
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">Email ( Optional )</label>
            <input
              type="email"
              name="email"
              className="fieldInput"
              autoComplete="off"
              placeholder="email@email.com"
              value={formData.email}
              onChange={handleChange}
            />
            {formErrors.email && <p className="fieldError">{formErrors.email}</p>}
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">
              Password {!isEditMode && <span className="required">*</span>}
            </label>
            <input
              type="password"
              className="fieldInput"
              name="password"
              autoComplete="new-password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            {formErrors.password && <p className="fieldError">{formErrors.password}</p>}
          </div>

          <div className="fieldGroup">
            <label className="fieldLabel">
              Confirm Password {!isEditMode && <span className="required">*</span>}
            </label>
            <input
              type="password"
              className="fieldInput"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {formErrors.confirmPassword && (
              <p className="fieldError">{formErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="modalFooter">
          <button type="button" className="closeButton" onClick={onClose} disabled={loading}>
            Close
          </button>
          <button
            type="button"
            className="createButton"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : isEditMode ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}