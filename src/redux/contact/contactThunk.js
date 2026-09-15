import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createContactApi,
  getAllContactsApi,
  getContactByIdApi,
  updateContactApi,
  deleteContactApi,
  getUniqueReferencesApi,
  getReferenceSummaryApi,
} from "../../services/contactService";

// ================= CREATE CONTACT =================
export const createContact = createAsyncThunk(
  "contact/createContact",
  async (data, thunkAPI) => {
    try {
      return await createContactApi(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create contact"
      );
    }
  }
);

// ================= GET ALL CONTACTS =================
export const getAllContacts = createAsyncThunk(
  "contact/getAllContacts",
  async (params, thunkAPI) => {
    try {
      return await getAllContactsApi(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch contacts"
      );
    }
  }
);

// ================= GET CONTACT BY ID =================
export const getContactById = createAsyncThunk(
  "contact/getContactById",
  async (id, thunkAPI) => {
    try {
      return await getContactByIdApi(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch contact"
      );
    }
  }
);

// ================= UPDATE CONTACT =================
export const updateContact = createAsyncThunk(
  "contact/updateContact",
  async ({ id, data }, thunkAPI) => {
    try {
      return await updateContactApi(id, data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update contact"
      );
    }
  }
);

// ================= DELETE CONTACT =================
export const deleteContact = createAsyncThunk(
  "contact/deleteContact",
  async (id, thunkAPI) => {
    try {
      return await deleteContactApi(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete contact"
      );
    }
  }
);

// ================= GET UNIQUE REFERENCES =================
export const getUniqueReferences = createAsyncThunk(
  "contact/getUniqueReferences",
  async (params, thunkAPI) => {
    try {
      return await getUniqueReferencesApi(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch unique references"
      );
    }
  }
);

// ================= GET REFERENCE SUMMARY (GROUPED) =================
// Powers the "Reference Summary" section shown below the Contact List
// table — kept as its own thunk (separate from getUniqueReferences,
// which only feeds the filter dropdown's flat value list) since the
// grouped { reference, contactNames } shape is a different concern.
export const getReferenceSummary = createAsyncThunk(
  "contact/getReferenceSummary",
  async (_, thunkAPI) => {
    try {
      return await getReferenceSummaryApi();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch reference summary"
      );
    }
  }
);