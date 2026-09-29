import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import AnnouncementText from "../../components/AnnouncementText";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../api/announcements";
import "./Announcement.scss";

const EMPTY_FORM = { message: "", isActive: true, publishAt: "", deleteAt: "" };
const MAX_LENGTH = 300;

const STATUS_LABELS = { live: "Live", scheduled: "Scheduled", expired: "Expired", hidden: "Hidden" };

// API ISO string (UTC) -> value for <input type="datetime-local"> (local time)
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local value -> UTC ISO string, or null when empty
function toIsoOrNull(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Filter tabs for the list. "Live" (currently showing on the site) is the default.
const FILTER_TABS = [
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "hidden", label: "Hidden" },
  { value: "all", label: "All" },
];

export default function Announcement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "error" | "success", text }
  const [filter, setFilter] = useState("live");

  const load = useCallback(async () => {
    try {
      setItems(await listAnnouncements());
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      message: item.message,
      isActive: item.isActive,
      publishAt: toLocalInput(item.publishAt),
      deleteAt: toLocalInput(item.deleteAt),
    });
    setStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const publishTime = form.publishAt ? new Date(form.publishAt).getTime() : null;
    const deleteTime = form.deleteAt ? new Date(form.deleteAt).getTime() : null;
    if (deleteTime && deleteTime <= Date.now()) {
      setStatus({ type: "error", text: "Hide time must be in the future." });
      return;
    }
    if (publishTime && deleteTime && deleteTime <= publishTime) {
      setStatus({ type: "error", text: "Hide time must be after the show time." });
      return;
    }

    setSaving(true);
    setStatus(null);

    const payload = {
      message: form.message.trim(),
      isActive: form.isActive,
      publishAt: toIsoOrNull(form.publishAt),
      deleteAt: toIsoOrNull(form.deleteAt),
    };
    const willSchedule = payload.publishAt && new Date(payload.publishAt).getTime() > Date.now();

    try {
      const saved = editingId
        ? await updateAnnouncement(editingId, payload)
        : await createAnnouncement(payload);
      // Jump to the tab the saved announcement lives in, so it doesn't
      // seem to vanish when it isn't "Live" (e.g. scheduled or hidden).
      if (saved?.status) setFilter(saved.status);
      setStatus({
        type: "success",
        text: !payload.isActive
          ? "Saved as hidden. Turn it on from the list to show it."
          : willSchedule
          ? "Scheduled. It will appear at the top of the site at the set time."
          : "Saved. It's now showing at the top of the site.",
      });
      resetForm();
      await load();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    setStatus(null);
    try {
      await updateAnnouncement(item.id, { isActive: !item.isActive });
      await load();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this announcement? This can't be undone.")) return;
    setStatus(null);
    try {
      await deleteAnnouncement(item.id);
      if (editingId === item.id) resetForm();
      await load();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  };

  const hasText = form.message.trim().length > 0;

  const counts = useMemo(() => {
    const c = { all: items.length, live: 0, scheduled: 0, expired: 0, hidden: 0 };
    items.forEach((item) => {
      if (item.status in c) c[item.status] += 1;
    });
    return c;
  }, [items]);

  const visibleItems = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [items, filter],
  );

  return (
    <div className="ann-shell">
    <Sidebar />
    <main className="ann-shell__main">
    <div className="ann">
      <header className="ann__header">
        <div>
          <h1 className="ann__title">Announcements</h1>
          
        </div>
      </header>

      {status && (
        <div className={`ann__status ann__status--${status.type}`} role="status">
          {status.text}
        </div>
      )}

      <div className="ann__layout">
        {/* ---------- Form ---------- */}
        <form className="ann__card" onSubmit={handleSubmit}>
          <h2 className="ann__card-title">
            {editingId ? "Edit announcement" : "New announcement"}
          </h2>

          <label className="ann__field">
            <span className="ann__label">Announcement text</span>
            <textarea
              className="ann__input ann__input--area"
              rows={3}
              maxLength={MAX_LENGTH}
              value={form.message}
              onChange={setField("message")}
              placeholder="Meet **Trellisco HRMS** — your smarter way to manage employees, attendance, payroll, and more! 🚀"
              required
            />
            <span className="ann__hint">
              Wrap words in **double asterisks** to make them bold. You can paste emojis.
              <span className="ann__count">
                {form.message.length}/{MAX_LENGTH}
              </span>
            </span>
          </label>

          <label className="ann__switch">
            <input type="checkbox" checked={form.isActive} onChange={setField("isActive")} />
            <span>Show on the website</span>
          </label>
          <p className="ann__hint ann__hint--flush">
            Only one announcement can be live. When a new one goes live it replaces the current one.
          </p>

          <label className="ann__field">
            <span className="ann__label">Show at (optional)</span>
            <input
              type="datetime-local"
              className="ann__input"
              value={form.publishAt}
              onChange={setField("publishAt")}
              disabled={saving}
            />
            <span className="ann__hint">Leave empty to show it right away.</span>
          </label>

          <label className="ann__field">
            <span className="ann__label">Hide at (optional)</span>
            <input
              type="datetime-local"
              className="ann__input"
              value={form.deleteAt}
              onChange={setField("deleteAt")}
              disabled={saving}
            />
            <span className="ann__hint">It is taken down automatically at this time. Leave empty to keep it up.</span>
          </label>

          <div className="ann__actions">
            <button type="submit" className="ann__btn ann__btn--primary" disabled={saving || !hasText}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Publish announcement"}
            </button>
            {editingId && (
              <button type="button" className="ann__btn ann__btn--ghost" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

      </div>

      {/* ---------- List ---------- */}
      <section className="ann__card ann__list">
        <div className="ann__list-head">
          <h2 className="ann__card-title">Announcements</h2>
          <div className="ann__filters" role="tablist">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                className={`ann__filter${filter === tab.value ? " is-active" : ""}`}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label} <span className="ann__filter-count">{counts[tab.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="ann__empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="ann__empty">No announcements yet. Create one above and it will appear on the site.</p>
        ) : visibleItems.length === 0 ? (
          <p className="ann__empty">
            No {filter === "all" ? "" : (STATUS_LABELS[filter] || filter).toLowerCase() + " "}announcements.
          </p>
        ) : (
          <div className="ann__table-wrap">
            <table className="ann__table">
              <thead>
                <tr>
                  <th>Announcement</th>
                  <th>Status</th>
                  <th>Show at</th>
                  <th>Hide at</th>
                  <th className="ann__th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} className={item.status === "live" ? "is-live" : ""}>
                    <td className="ann__td-text">
                      <AnnouncementText message={item.message} />
                    </td>
                    <td>
                      <span
                        className={`ann__pill${
                          item.status === "live" ? "" : item.status === "scheduled" ? " ann__pill--scheduled" : " ann__pill--off"
                        }`}
                      >
                        {STATUS_LABELS[item.status] || (item.isActive ? "Live" : "Hidden")}
                      </span>
                    </td>
                    <td className="ann__td-date">{item.publishAt ? formatWhen(item.publishAt) : "Immediately"}</td>
                    <td className="ann__td-date">{item.deleteAt ? formatWhen(item.deleteAt) : "Never"}</td>
                    <td className="ann__td-actions">
                      <button type="button" className="ann__btn ann__btn--small" onClick={() => toggleActive(item)}>
                        {item.isActive ? "Hide" : "Show"}
                      </button>
                      <button type="button" className="ann__btn ann__btn--small" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ann__btn ann__btn--small ann__btn--danger"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
    </main>
    </div>
  );
}