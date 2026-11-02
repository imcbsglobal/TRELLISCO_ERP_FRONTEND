import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  listPromoVideos,
  createPromoVideo,
  updatePromoVideo,
  deletePromoVideo,
} from "../../api/promoVideoApi";
import "./Announcement.scss"; // shared admin styles (.ann-shell, .ann__*)
import "./PromoVideo.scss";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  buttonLabel: "",
  buttonUrl: "",
  isActive: true,
  publishAt: "",
  deleteAt: "",
};
const MAX_BYTES = 50 * 1024 * 1024;
const STATUS_LABELS = { live: "Live", scheduled: "Scheduled", expired: "Expired", hidden: "Hidden" };
const FILTER_TABS = [
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "hidden", label: "Hidden" },
  { value: "all", label: "All" },
];

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

export default function PromoVideo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [existingUrl, setExistingUrl] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState("live");
  const previewRef = useRef("");

  const load = useCallback(async () => {
    try {
      setItems(await listPromoVideos());
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Free the blob URL when it changes or the page unmounts.
  useEffect(() => {
    previewRef.current = filePreview;
  }, [filePreview]);
  useEffect(() => () => previewRef.current && URL.revokeObjectURL(previewRef.current), []);

  const setField = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const clearFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview("");
    setFileKey((k) => k + 1);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setExistingUrl("");
    clearFile();
  };

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith("video/")) {
      setStatus({ type: "error", text: "Please choose a video file (mp4, webm, mov)." });
      setFileKey((k) => k + 1);
      return;
    }
    if (picked.size > MAX_BYTES) {
      setStatus({ type: "error", text: "Video is too large (50MB max)." });
      setFileKey((k) => k + 1);
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setStatus(null);
    setFile(picked);
    setFilePreview(URL.createObjectURL(picked));
  };

  const startEdit = (item) => {
    clearFile();
    setEditingId(item.id);
    setExistingUrl(item.video || "");
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      buttonLabel: item.buttonLabel || "",
      buttonUrl: item.buttonUrl || "",
      isActive: item.isActive,
      publishAt: toLocalInput(item.publishAt),
      deleteAt: toLocalInput(item.deleteAt),
    });
    setStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId && !file) {
      setStatus({ type: "error", text: "Choose a video to upload." });
      return;
    }
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
      video: file || undefined,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      buttonLabel: form.buttonLabel.trim(),
      buttonUrl: form.buttonUrl.trim(),
      isActive: form.isActive,
      publishAt: toIsoOrNull(form.publishAt),
      deleteAt: toIsoOrNull(form.deleteAt),
    };
    const willSchedule = payload.publishAt && new Date(payload.publishAt).getTime() > Date.now();

    try {
      const saved = editingId
        ? await updatePromoVideo(editingId, payload)
        : await createPromoVideo(payload);
      if (saved?.status) setFilter(saved.status);
      setStatus({
        type: "success",
        text: !payload.isActive
          ? "Saved as hidden. Turn it on from the list to show it."
          : willSchedule
          ? "Scheduled. The video will appear on the homepage at the set time."
          : "Saved. The video is now showing on the homepage.",
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
      await updatePromoVideo(item.id, { isActive: !item.isActive });
      await load();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this promo video? This can't be undone.")) return;
    setStatus(null);
    try {
      await deletePromoVideo(item.id);
      if (editingId === item.id) resetForm();
      await load();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    }
  };

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

  const previewSrc = filePreview || existingUrl;
  const canSubmit = !saving && (editingId || file);

  return (
    <div className="ann-shell">
      <Sidebar />
      <main className="ann-shell__main">
        <div className="ann">
          <header className="ann__header">
            <div>
              <h1 className="ann__title">Promo video</h1>
              <p className="ann__subtitle">The floating video card shown on the homepage.</p>
            </div>
          </header>

          {status && (
            <div className={`ann__status ann__status--${status.type}`} role="status">
              {status.text}
            </div>
          )}

          <div className="ann__layout">
            <form className="ann__card" onSubmit={handleSubmit}>
              <h2 className="ann__card-title">{editingId ? "Edit promo video" : "New promo video"}</h2>

              <div className="pv__upload">
                <div className="pv__preview">
                  {previewSrc ? (
                    <video key={previewSrc} src={previewSrc} controls muted playsInline preload="metadata" />
                  ) : (
                    <span className="pv__preview-empty">No video chosen</span>
                  )}
                </div>

                <div className="pv__upload-side">
                  <span className="ann__label">Video file</span>
                  <input
                    key={fileKey}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                    className="pv__file"
                    onChange={handleFile}
                    disabled={saving}
                  />
                  <span className="ann__hint">
                    MP4 or WebM, up to 50MB. A vertical (9:16) video fits the card best.
                    {editingId && " Leave empty to keep the current video."}
                  </span>
                  {file && (
                    <span className="pv__filename">
                      {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
                      <button type="button" className="pv__link" onClick={clearFile}>
                        Remove
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="ann__row">
                <label className="ann__field">
                  <span className="ann__label">Title (optional)</span>
                  <input
                    className="ann__input"
                    maxLength={80}
                    value={form.title}
                    onChange={setField("title")}
                    placeholder="Deepa's fee collection story"
                  />
                </label>
                <label className="ann__field">
                  <span className="ann__label">Subtitle (optional)</span>
                  <input
                    className="ann__input"
                    maxLength={80}
                    value={form.subtitle}
                    onChange={setField("subtitle")}
                    placeholder="Trellisco App"
                  />
                </label>
              </div>

              <div className="ann__row">
                <label className="ann__field">
                  <span className="ann__label">Button text (optional)</span>
                  <input
                    className="ann__input"
                    maxLength={40}
                    value={form.buttonLabel}
                    onChange={setField("buttonLabel")}
                    placeholder="Book a Demo"
                  />
                </label>
                <label className="ann__field">
                  <span className="ann__label">Button link (optional)</span>
                  <input
                    className="ann__input"
                    maxLength={500}
                    value={form.buttonUrl}
                    onChange={setField("buttonUrl")}
                    placeholder="https://… or /contact"
                  />
                </label>
              </div>
              <p className="ann__hint ann__hint--flush">
                The button only shows when both the text and the link are filled in.
              </p>

              <label className="ann__switch">
                <input type="checkbox" checked={form.isActive} onChange={setField("isActive")} />
                <span>Show on the website</span>
              </label>
              <p className="ann__hint ann__hint--flush">
                Only one promo video can be live. When a new one goes live it replaces the current one.
              </p>

              <div className="ann__row">
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
                  <span className="ann__hint">Taken down automatically. Leave empty to keep it up.</span>
                </label>
              </div>

              <div className="ann__actions">
                <button type="submit" className="ann__btn ann__btn--primary" disabled={!canSubmit}>
                  {saving ? "Uploading…" : editingId ? "Save changes" : "Publish video"}
                </button>
                {editingId && (
                  <button type="button" className="ann__btn ann__btn--ghost" onClick={resetForm} disabled={saving}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <section className="ann__card ann__list">
            <div className="ann__list-head">
              <h2 className="ann__card-title">Promo videos</h2>
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
              <p className="ann__empty">No promo videos yet. Upload one above and it will appear on the homepage.</p>
            ) : visibleItems.length === 0 ? (
              <p className="ann__empty">
                No {filter === "all" ? "" : (STATUS_LABELS[filter] || filter).toLowerCase() + " "}promo videos.
              </p>
            ) : (
              <div className="ann__table-wrap">
                <table className="ann__table">
                  <thead>
                    <tr>
                      <th>Video</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Show at</th>
                      <th>Hide at</th>
                      <th className="ann__th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr key={item.id} className={item.status === "live" ? "is-live" : ""}>
                        <td>
                          <video className="pv__thumb" src={item.video} muted playsInline preload="metadata" />
                        </td>
                        <td className="ann__td-text">
                          <strong>{item.title || "Untitled"}</strong>
                          {item.subtitle && <div className="pv__sub">{item.subtitle}</div>}
                          {item.buttonLabel && <div className="pv__sub">Button: {item.buttonLabel}</div>}
                        </td>
                        <td>
                          <span
                            className={`ann__pill${
                              item.status === "live"
                                ? ""
                                : item.status === "scheduled"
                                ? " ann__pill--scheduled"
                                : " ann__pill--off"
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