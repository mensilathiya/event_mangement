import api from "../api/axios";

// Create Event
export const createEventApi = (data) => {
  return api.post("/events/create", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// View Event
export const getEventByIdApi = (id) => {
  return api.get(`/events/${id}`);
};
// get all event
// Get All Events
export const getAllEventsApi = async (params) => {
  const response = await api.get("/events/get-all-events", {
    params,
  });

  return response.data;
};
// Change Event Status
export const changeEventStatusApi = async (id) => {
  const response = await api.patch(`/events/${id}/status`);
  return response.data;
};  