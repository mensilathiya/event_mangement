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