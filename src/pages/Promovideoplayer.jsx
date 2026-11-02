import { useEffect, useRef, useState } from "react";
import { getActivePromoVideo } from "../api/promoVideoApi";
import "./Promovideoplayer.scss";

// Ids closed with the × button. Kept in memory only, so the card stays closed
// while browsing the site (Home -> Blog -> Home) but comes back on a refresh.
const dismissedThisLoad = new Set();

// Scroll distance (px) after which the card shrinks.
const COMPACT_AFTER = 80;

export default function PromoVideoPlayer() {
  const [promo, setPromo] = useState(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const videoRef = useRef(null);

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

  // tap the small card -> make it big; tap the big one -> play / pause
  const onVideoClick = () => {
    if (expanded) togglePlay();
    else expand();
  };

  const external = /^https?:\/\//i.test(promo.buttonUrl || "");

  return (
    <>
      {expanded && <div className="promo-video-backdrop" onClick={() => setExpanded(false)} aria-hidden="true" />}

      <aside
        className={`promo-video${compact && !expanded ? " is-compact" : ""}${expanded ? " is-expanded" : ""}${navMenuOpen ? " is-hidden" : ""}`}
        aria-label="Promo video"
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
            onClick={expanded ? togglePlay : expand}
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