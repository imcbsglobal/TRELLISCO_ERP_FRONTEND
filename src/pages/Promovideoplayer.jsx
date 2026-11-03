import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getActivePromoVideo } from "../api/promoVideoApi";
import "./Promovideoplayer.scss";

// Ids closed with the × button. Kept in memory only, so the card stays closed
// while browsing the site (Home -> Blog -> Home) but comes back on a refresh.
const dismissedThisLoad = new Set();

// Scroll distance (px) after which the card shrinks.
const COMPACT_AFTER = 80;

// ---- drag to move ------------------------------------------------------------
// The card is anchored bottom-right in CSS; dragging only changes an offset from that
// anchor (--drag-x / --drag-y -> `translate`). The offset is kept in memory so the card
// stays where you left it while browsing (Home -> Blog -> Home).
const savedOffset = { x: 0, y: 0 };
const DRAG_MARGIN = 8; // px kept between the card and the screen edge
const DRAG_THRESHOLD = 5; // px of movement before a press counts as a drag (below = a normal click)

const clampTo = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));

// how far the card may move from its anchor while staying fully on screen
function dragBounds(el) {
  const root = document.documentElement;
  const vw = root.clientWidth;
  const vh = root.clientHeight;
  const cs = window.getComputedStyle(el);
  const right = parseFloat(cs.right) || 0;
  const bottom = parseFloat(cs.bottom) || 0;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return {
    minX: DRAG_MARGIN - (vw - right - w),
    maxX: right - DRAG_MARGIN,
    minY: DRAG_MARGIN - (vh - bottom - h),
    maxY: bottom - DRAG_MARGIN,
  };
}

function applyOffset(el, x, y) {
  savedOffset.x = x;
  savedOffset.y = y;
  el.style.setProperty("--drag-x", `${x}px`);
  el.style.setProperty("--drag-y", `${y}px`);
}

function clampIntoView(el) {
  const b = dragBounds(el);
  applyOffset(el, clampTo(savedOffset.x, b.minX, b.maxX), clampTo(savedOffset.y, b.minY, b.maxY));
}

export default function PromoVideoPlayer() {
  const [promo, setPromo] = useState(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef(null);
  const asideRef = useRef(null);
  const stopDragRef = useRef(null);
  const justDragged = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getActivePromoVideo()
      .then((data) => {
        if (!cancelled && data?.video && !dismissedThisLoad.has(data.id)) setPromo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Shrink the card when the page is scrolled, grow it back at the top.
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > COMPACT_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide the card while the navbar mega menu (Products dropdown) is open.
  // The menu is only in the DOM while open, so watch for the .mega element.
  useEffect(() => {
    const check = () => setNavMenuOpen(!!document.querySelector(".mega"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Put the card back where it was left (before paint, so it doesn't flash at the corner).
  useLayoutEffect(() => {
    const el = asideRef.current;
    if (el && (savedOffset.x || savedOffset.y)) applyOffset(el, savedOffset.x, savedOffset.y);
  }, [promo]);

  // Keep the card on screen when the window is resized or the card changes size
  // (small <-> normal when scrolling).
  useEffect(() => {
    if (!promo || expanded) return undefined;
    let t;
    const reclamp = () => {
      const el = asideRef.current;
      if (el) clampIntoView(el);
    };
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(reclamp, 120);
    };
    window.addEventListener("resize", onResize);
    t = setTimeout(reclamp, 350); // after the width transition has finished
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [promo, expanded, compact]);

  // Never leave drag listeners behind if the card unmounts mid-drag.
  useEffect(
    () => () => {
      if (stopDragRef.current) stopDragRef.current();
    },
    []
  );

  // While expanded: lock page scroll and let Esc shrink the video back.
  useEffect(() => {
    if (!expanded) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  if (!promo) return null;

  const close = () => {
    // inside the big view the × only shrinks the video back to the corner card
    if (expanded) {
      setExpanded(false);
      return;
    }
    dismissedThisLoad.add(promo.id);
    setPromo(null);
  };

  const expand = () => {
    setExpanded(true);
    // opening it is a user gesture, so sound is allowed: turn it on
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      setMuted(false);
      if (v.paused) v.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) v.play().catch(() => {});
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  // press and drag anywhere on the small card (except its buttons) to move it
  const onPointerDown = (e) => {
    if (expanded) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest(".promo-video__close, .promo-video__mute, .promo-video__cta")) return;
    const el = asideRef.current;
    if (!el) return;

    const bounds = dragBounds(el);
    const prevUserSelect = document.body.style.userSelect;
    const start = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: savedOffset.x, oy: savedOffset.y, moved: false };

    const onMove = (ev) => {
      if (ev.pointerId !== start.id) return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!start.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        start.moved = true;
        document.body.style.userSelect = "none";
        setDragging(true);
      }
      applyOffset(
        el,
        clampTo(start.ox + dx, bounds.minX, bounds.maxX),
        clampTo(start.oy + dy, bounds.minY, bounds.maxY)
      );
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      document.body.style.userSelect = prevUserSelect;
      stopDragRef.current = null;
    };

    const onEnd = (ev) => {
      if (ev.pointerId !== start.id) return;
      stop();
      setDragging(false);
      if (start.moved) {
        // the click that follows a drag must not enlarge / pause the video
        justDragged.current = true;
        setTimeout(() => {
          justDragged.current = false;
        }, 0);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    stopDragRef.current = stop;
  };

  // tap the small card -> make it big; tap the big one -> play / pause
  const onVideoClick = () => {
    if (justDragged.current) return;
    if (expanded) togglePlay();
    else expand();
  };

  const external = /^https?:\/\//i.test(promo.buttonUrl || "");

  return (
    <>
      {expanded && <div className="promo-video-backdrop" onClick={() => setExpanded(false)} aria-hidden="true" />}

      <aside
        ref={asideRef}
        className={`promo-video${compact && !expanded ? " is-compact" : ""}${expanded ? " is-expanded" : ""}${navMenuOpen ? " is-hidden" : ""}${dragging ? " is-dragging" : ""}`}
        aria-label="Promo video"
        onPointerDown={onPointerDown}
      >
        <div className="promo-video__frame">
          <button
            type="button"
            className="promo-video__close"
            onClick={close}
            aria-label={expanded ? "Minimize video" : "Close video"}
          >
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            className={`promo-video__mute${muted ? " is-muted" : ""}`}
            onClick={toggleMute}
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <path d="M3 8v4h3l4 3V5L6 8H3Z" fill="currentColor" />
              {muted ? (
                <path d="M13 8l4 4M17 8l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M13 7.5a3.5 3.5 0 0 1 0 5M15 5.5a6.5 6.5 0 0 1 0 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
            <span className="promo-video__mute-text">{muted ? "Tap to unmute" : "Mute"}</span>
          </button>
          <video
            ref={videoRef}
            className="promo-video__media"
            src={promo.video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onClick={onVideoClick}
          />
          <button
            type="button"
            className={`promo-video__play${paused ? " is-paused" : ""}`}
            onClick={() => {
              if (justDragged.current) return;
              if (expanded) togglePlay();
              else expand();
            }}
            aria-label={expanded ? (paused ? "Play video" : "Pause video") : "Enlarge video"}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>

        {(promo.title || promo.subtitle || (promo.buttonLabel && promo.buttonUrl)) && (
          <div className="promo-video__overlay">
            {(promo.title || promo.subtitle) && (
              <div className="promo-video__head">
                {promo.title && <h3 className="promo-video__title">{promo.title}</h3>}
                {promo.subtitle && <p className="promo-video__subtitle">{promo.subtitle}</p>}
              </div>
            )}
            {promo.buttonLabel && promo.buttonUrl && (
              <a
                className="promo-video__cta"
                href={promo.buttonUrl}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {promo.buttonLabel}
                <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                  <path d="M4 10h11M10.5 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            )}
          </div>
        )}
      </aside>
    </>
  );
}