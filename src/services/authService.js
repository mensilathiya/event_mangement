import api from "../api/axios";

export const loginApi = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const getProfileApi = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

export const updateProfileApi = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const resetPasswordApi = async (data) => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};
