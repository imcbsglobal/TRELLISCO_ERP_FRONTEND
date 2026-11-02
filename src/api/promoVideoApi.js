// Promo video API. Uses the same token source as the rest of the admin
// (api/client.js), so it always matches what api/auth.js saved at login.
import { getToken } from "./client";

const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE = `${API_ROOT}/api/blog/promo-videos/`;

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Token ${token}` } : {};
};

// Turns a DRF error body into one readable message.
function errorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return String(first[0]);
  if (typeof first === "string") return first;
  return fallback;
}

async function handle(res, fallback) {
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new Error(errorMessage(data, fallback));
  return data;
}

// payload: { video?: File, title, subtitle, buttonLabel, buttonUrl,
//            isActive, publishAt, deleteAt }  (undefined keys are skipped)
function toFormData(payload) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) fd.append(key, "");
    else if (typeof value === "boolean") fd.append(key, value ? "true" : "false");
    else fd.append(key, value);
  });
  return fd;
}

export async function listPromoVideos() {
  const res = await fetch(BASE, { headers: authHeaders() });
  const data = await handle(res, "Could not load promo videos.");
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createPromoVideo(payload) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeaders(),
    body: toFormData(payload),
  });
  return handle(res, "Could not save the promo video.");
}

export async function updatePromoVideo(id, payload) {
  const res = await fetch(`${BASE}${id}/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: toFormData(payload),
  });
  return handle(res, "Could not update the promo video.");
}

export async function deletePromoVideo(id) {
  const res = await fetch(`${BASE}${id}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete the promo video.");
}

// Public: the promo to show on the homepage, or null.
export async function getActivePromoVideo() {
  const res = await fetch(`${BASE}active/`);
  return handle(res, "Could not load the promo video.");
}