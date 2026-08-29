import api from "../api/axios";

// =================== Create Event api =================
export const createEventApi = (data) => {
  return api.post("/events/create", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// =================== getEventByIdApi =================
export const getEventByIdApi = (id) => {
  return api.get(`/events/${id}`);
};
// ====================== Get All Events ==================
export const getAllEventsApi = async (params) => {
  const response = await api.get("/events/get-all-events", {
    params,
  });

  return response.data;
};
// ======================= Update Event api ===============
export const updateEventApi = (id, data) => {
  return api.put(`/events/${id}/update`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ================ Delete Event api ====================
export const deleteEventApi = async (id) => {
  const response = await api.delete(`/events/${id}/delete`);
  return response.data;
};

//  ================== Change Event Status api ==================
export const changeEventStatusApi = async (id) => {
  const response = await api.patch(`/events/${id}/status`);
  return response.data;
};