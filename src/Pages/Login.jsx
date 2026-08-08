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
  Link,
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

// Reusing icons already used elsewhere in the project (Sidebar/Header)
// instead of pulling in a new icon set.
import { BsCalendarEventFill, BsFillTicketFill } from "react-icons/bs";
import { LuScanQrCode } from "react-icons/lu";
import { FaUsers } from "react-icons/fa";

import EventIllustration from "../Components/EventIllustration";
import { login } from "./../redux/slices/authSlice";
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
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      login({
        login: formData.login,
        password: formData.password,
      })
    );

    if (login.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  return (
    <Box className="emsLogin__page">
      <Grid container className="emsLogin__container">
        {/* Left Side — Branding (desktop only) */}
        <Grid size={{ xs: 0, md: 6 }} className="emsLogin__left">
          <div className="emsLogin__illustrationWrapper">
            {/* <div className="emsLogin__illustration"> */}
              {/* <EventIllustration /> */}
            {/* </div> */}
               
                     <Typography variant="h6" className="emsLogin__brandSubTitle">
                       Admin Dashboard
                     </Typography>
         

            {/* <Typography variant="h3" className="emsLogin__brandTagline">
              Manage Every Event.
              <br />
              From Booking to Entry.
            </Typography> */}

            <Typography className="emsLogin__brandDescription">
              Create events, manage bookings, scan QR passes at entry, and
              track everything from one dashboard.
            </Typography>

            <div className="emsLogin__featureGrid">
              {FEATURES.map((feature) => (
                <div className="emsLogin__featureCard" key={feature.label}>
                  <span className="emsLogin__featureIcon">{feature.icon}</span>
                  <Typography variant="body2">{feature.label}</Typography>
                </div>
              ))}
            </div>
          </div>
        </Grid>

        {/* Right Side — Login form */}
        <Grid size={{ xs: 12, md: 6 }} className="emsLogin__right">
          <Paper elevation={0} className="emsLogin__card">
            {/* Compact brand mark, mobile/tablet only */}
            <div className="emsLogin__mobileBrand">
              <span className="emsLogin__mobileBrandDot" />
              <span>Shubh अवसर</span>
            </div>

            <Typography variant="h4" className="emsLogin__title">
              Welcome Back 👋
            </Typography>

            <Typography className="emsLogin__subtitle">
              Sign in to continue to your Event Management Admin Panel.
            </Typography>

            <form className="emsLogin__form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email or Mobile Number"
                name="login"
                value={formData.login}
                onChange={handleChange}
                margin="normal"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                margin="normal"
                size="medium"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

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

                <Link
                  underline="hover"
                  sx={{ cursor: "pointer", fontWeight: 600 }}
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                className="emsLogin__button"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
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
