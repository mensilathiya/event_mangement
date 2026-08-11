import "../assets/CSS/Login.css";
import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
} from "@mui/icons-material";

import { BsCalendarEventFill, BsFillTicketFill } from "react-icons/bs";
import { LuScanQrCode } from "react-icons/lu";
import { FaUsers } from "react-icons/fa";

import { login } from "../redux/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: <BsCalendarEventFill />, label: "Events" },
  { icon: <BsFillTicketFill />, label: "Bookings" },
  { icon: <LuScanQrCode />, label: "QR Entry" },
  { icon: <FaUsers />, label: "Attendees" },
];

const Login = () => {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    rememberMe: false,
  });

  // Field-level validation errors (client-side + backend field-specific).
  const [errors, setErrors] = useState({
    login: "",
    password: "",
  });

  // Generic backend error that can't be safely attributed to either
  // field (e.g. "Invalid email/mobile or password"). Kept separate
  // from `errors` so it never gets rendered as if it belongs to one
  // specific TextField.
  const [generalError, setGeneralError] = useState("");

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear only this field's error as the user corrects it — the
    // other field's error (if any) is left untouched.
    if (name === "login" || name === "password") {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));

      // A fresh edit means any previous backend response no longer
      // applies to what's currently in the form.
      if (generalError) {
        setGeneralError("");
      }
    }
  };

  const validate = () => {
    const nextErrors = { login: "", password: "" };
    let isValid = true;

    if (!formData.login.trim()) {
      nextErrors.login = "Email or mobile number is required.";
      isValid = false;
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  // Inspects the backend message and decides, WITHOUT guessing, whether
  // it can be safely attributed to a single field. The backend
  // intentionally returns the same generic message for both a bad
  // username and a bad password ("Invalid email/mobile or password"),
  // so that generic message is always treated as general — never
  // assigned to just one TextField. Only an unambiguous, genuinely
  // field-specific message (mentions one field and not the other) is
  // shown under that field.
  const applyBackendError = (message) => {
    if (!message) {
      setGeneralError("Something went wrong while signing in. Please try again.");
      return;
    }

    const lower = message.toLowerCase();
    const mentionsLogin = lower.includes("email") || lower.includes("mobile");
    const mentionsPassword = lower.includes("password");

    if (mentionsLogin && !mentionsPassword) {
      setErrors((prev) => ({ ...prev, login: message }));
      return;
    }

    if (mentionsPassword && !mentionsLogin) {
      setErrors((prev) => ({ ...prev, password: message }));
      return;
    }

    // Mentions both, mentions neither, or is the known generic
    // "Invalid email/mobile or password" message — can't be safely
    // attributed to one field, so show it generically instead of
    // guessing.
    setGeneralError(message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError("");

    if (!validate()) {
      return;
    }

    const result = await dispatch(
      login({
        login: formData.login,
        password: formData.password,
      })
    );

    if (login.fulfilled.match(result)) {
      navigate("/dashboard");
      return;
    }

    if (login.rejected.match(result)) {
      applyBackendError(result.payload);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box className="emsLogin__page">
      <Grid container className="emsLogin__container">

        {/* Left Side */}
        <Grid size={{ xs: 0, md: 6 }} className="emsLogin__left">
          <div className="emsLogin__illustrationWrapper">

            <Typography
              variant="h6"
              className="emsLogin__brandSubTitle"
            >
              Admin Dashboard
            </Typography>

            <Typography className="emsLogin__brandDescription">
              Create events, manage bookings, scan QR passes at entry, and
              track everything from one dashboard.
            </Typography>

            <div className="emsLogin__featureGrid">
              {FEATURES.map((feature) => (
                <div
                  className="emsLogin__featureCard"
                  key={feature.label}
                >
                  <span className="emsLogin__featureIcon">
                    {feature.icon}
                  </span>

                  <Typography variant="body2">
                    {feature.label}
                  </Typography>
                </div>
              ))}
            </div>

          </div>
        </Grid>

        {/* Right Side */}
        <Grid size={{ xs: 12, md: 6 }} className="emsLogin__right">
          <Paper elevation={0} className="emsLogin__card">

            <div className="emsLogin__mobileBrand">
              <span className="emsLogin__mobileBrandDot" />
              <span>Shubh अवसर</span>
            </div>

            <Typography
              variant="h4"
              className="emsLogin__title"
            >
              Welcome Back 👋
            </Typography>

            <Typography className="emsLogin__subtitle">
              Sign in to continue to your Event Management Admin Panel.
            </Typography>

            <form
              className="emsLogin__form"
              onSubmit={handleSubmit}
              noValidate
            >

              {/* Only for a backend error that can't be safely
                  attributed to one field (e.g. the generic
                  "Invalid email/mobile or password" message). */}
              {generalError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {generalError}
                </Alert>
              )}

              {/* Email / Mobile */}
              <TextField
                fullWidth
                label="Email or Mobile Number"
                name="login"
                value={formData.login}
                onChange={handleChange}
                margin="normal"
                size="medium"
                error={!!errors.login}
                helperText={errors.login}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password */}
              <TextField
                fullWidth
                label="Password"
                name="password"
                margin="normal"
                size="medium"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined />
                    </InputAdornment>
                  ),

                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        type="button"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Remember Me */}
              <div className="emsLogin__optionRow">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.rememberMe}
                      name="rememberMe"
                      onChange={handleChange}
                    />
                  }
                  label="Remember Me"
                />
              </div>

              {/* Sign In */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                className="emsLogin__button"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress
                    size={24}
                    color="inherit"
                  />
                ) : (
                  "Sign In"
                )}
              </Button>

            </form>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Login;