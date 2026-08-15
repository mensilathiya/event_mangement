import axios from "axios";

// NOTE: Do NOT hardcode "Content-Type": "application/json" here.
// When a request body is a plain JS object, axios's own transformRequest
// already sets Content-Type: application/json automatically. When the
// body is a FormData instance (e.g. profileImage uploads), axios needs
// to set Content-Type: multipart/form-data; boundary=... itself — but it
// will only do that if no Content-Type was already explicitly set on the
// instance/request. A hardcoded application/json default here overrides
// that auto-detection, so FormData requests get sent with the wrong
// Content-Type and the server can never parse req.file.
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

let activeRequests = 0;

const showLoader = () => {
  activeRequests += 1;
  window.dispatchEvent(new Event("api-loading-start"));
};

const hideLoader = () => {
  activeRequests = Math.max(0, activeRequests - 1);

  if (activeRequests === 0) {
    window.dispatchEvent(new Event("api-loading-stop"));
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    showLoader();

    return config;
  },
  (error) => {
    hideLoader();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    hideLoader();
    return response;
  },
  (error) => {
    hideLoader();

    // Do not redirect/reload when login credentials are invalid.
    // Let authSlice handle the login error and show it on the Login page.
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;