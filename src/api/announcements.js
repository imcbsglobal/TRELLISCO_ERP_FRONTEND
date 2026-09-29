// src/api/announcements.js
import { api, publicApi } from "./client"; // shared instances: base URL comes from client.js only

const PATH = "/blog/announcements/"; // client.js baseURL already ends with /api

// Turns an axios error into a readable Error (DRF sends { detail } or { field: ["msg"] }).
function toError(err) {
  const data = err.response?.data;
  const firstFieldError =
    data && typeof data === "object"
      ? Object.values(data).flat().find((v) => typeof v === "string")
      : null;

  return new Error(
    data?.detail || firstFieldError || "Something went wrong. Please try again."
  );
}

// Public — used by the navbar. Uses `publicApi` (no auth header) on purpose:
// DRF answers 401 to an expired token even on public endpoints, and the
// homepage banner must never depend on (or clear) an admin login.
export const fetchActiveAnnouncement = async () => {
  const { data } = await publicApi.get(`${PATH}active/`);
  return data;
};

// Admin — these go through `api` so the token is attached.
export const listAnnouncements = async () => {
  try {
    const { data } = await api.get(PATH);
    return Array.isArray(data) ? data : data?.results ?? [];
  } catch (err) {
    throw toError(err);
  }
};

export const createAnnouncement = async (payload) => {
  try {
    const { data } = await api.post(PATH, payload);
    return data;
  } catch (err) {
    throw toError(err);
  }
};

export const updateAnnouncement = async (id, payload) => {
  try {
    const { data } = await api.patch(`${PATH}${id}/`, payload);
    return data;
  } catch (err) {
    throw toError(err);
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    await api.delete(`${PATH}${id}/`);
  } catch (err) {
    throw toError(err);
  }
};