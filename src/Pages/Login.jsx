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
} from "@mui/material";


import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import EventIllustration from "../Components/EventIllustration";
import { login } from './../redux/slices/authSlice';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
  login: "",
  password: "",
  rememberMe: false,
});
const dispatch = useDispatch();

const navigate = useNavigate();

const { loading, error } = useSelector(
    (state) => state.auth
);
const [showPassword, setShowPassword] = useState(false);
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
              console.log("Navigating Dashboard");

        navigate("/dashboard");
    }
};
  return (
    <Box className="emsLogin__page">
      <Grid container className="emsLogin__container">

        {/* Left Side */}
        <Grid size={{ xs: 0, md: 6 }} className="emsLogin__left">
          <EventIllustration />
        </Grid>

        {/* Right Side */}
        <Grid size={{ xs: 12, md: 6 }} className="emsLogin__right">

          <Paper elevation={0} className="emsLogin__card">

            <Typography
              variant="h4"
              className="emsLogin__title"
            >
              Welcome Back 👋
            </Typography>

            <Typography
              className="emsLogin__subtitle"
            >
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
      sx={{
        cursor: "pointer",
        fontWeight: 600,
      }}
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