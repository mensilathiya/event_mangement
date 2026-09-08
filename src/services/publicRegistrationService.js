import publicApi from "../api/publicApi";

// ================= VALIDATE PUBLIC REGISTRATION TOKEN =================
// GET /api/public/registration/:token
// No auth header, no ticketId — the token in the URL is the only thing
// that identifies which BookingTicket this is for.
export const getPublicRegistrationDetailsApi = async (token) => {
  const response = await publicApi.get(`/public/registration/${token}`);

  return response.data;
};

// ================= PUBLIC REGISTER USER =================
// PUT /api/public/registration/:token
// `formData` must only ever contain name / mobileNumber / email /
// profileImage — never a ticketId. The token is the sole ticket identity.
export const submitPublicRegistrationApi = async (token, formData) => {
  const response = await publicApi.put(
    `/public/registration/${token}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};