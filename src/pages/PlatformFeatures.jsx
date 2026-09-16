import { useEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────────
   Config — richer, more "designed" blue palette
   instead of a single flat accent. Cards use a
   deep-to-bright blue gradient with a soft glow,
   and a lighter sky-blue is used for eyebrow/
   secondary text so it reads on the dark bg.
───────────────────────────────────────────── */
const ACCENT = '#2954ff'        // primary blue (headline highlight, focal color)
const ACCENT_DEEP = '#0d1b6b'   // deep end of the card gradient
const ACCENT_MID = '#1e40e0'    // mid tone of the card gradient
const ACCENT_LIGHT = '#7fa3ff'  // soft blue for eyebrow / secondary copy on dark bg
const ACCENT_GLOW = 'rgba(41,84,255,0.35)'
const FONT = "'Plus Jakarta Sans', sans-serif"

const AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=160&q=80',
]

const ID_PHOTO = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=220&q=80'

const STYLES = `
  .pf-bento-card {
    opacity: 0;
    transform: perspective(900px) translateY(60px) scale(0.94);
    transition: opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1), transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
    will-change: transform, opacity;
    transform-style: preserve-3d;
  }
  .pf-bento-card.from-left { transform: perspective(900px) translateX(-60px) translateY(30px) scale(0.95); }
  .pf-bento-card.from-right { transform: perspective(900px) translateX(60px) translateY(30px) scale(0.95); }
  .pf-bento-card.is-visible { opacity: 1; transform: perspective(900px) translateX(0) translateY(0) scale(1); }
  .pf-bento-card:hover { box-shadow: 0 30px 60px -18px ${ACCENT_GLOW} !important; }

  .pf-heading-reveal {
    opacity: 0;
    transform: translateY(36px);
    filter: blur(4px);
    transition: opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1), transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), filter 0.85s ease;
  }
  .pf-heading-reveal.is-visible { opacity: 1; transform: translateY(0); filter: blur(0px); }

  .pf-stat {
    opacity: 0;
    transform: translateY(24px) scale(0.92);
    transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pf-stat.is-visible { opacity: 1; transform: translateY(0) scale(1); }

  @media (max-width: 900px) {
    .pf-bento-grid > div { grid-column: 1 / 13 !important; }
  }
`

/* ─────────────────────────────────────────────
   Card 1 — HRMS: Smart Shift Scheduling
───────────────────────────────────────────── */
function ScheduleMock() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const events = {
    1: [{ label: 'Pre-Shift Sync', time: '8:00 – 8:30 AM', tint: '#e8f5ef', dot: '#16a34a' }],
    2: [{ label: 'Morning Shift', time: '9:00 AM – 2:00 PM', tint: '#eaf0ff', dot: ACCENT }],
    4: [
      { label: 'Lunch QBR', time: '1:00 – 1:30 PM', tint: '#fdf2f8', dot: '#db2777' },
      { label: 'Evening Shift', time: '3:00 – 8:00 PM', tint: '#fffbeb', dot: '#d97706' },
    ],
  }
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9ca3af' }}>‹</span>
          <span style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9ca3af' }}>›</span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#111', fontFamily: FONT }}>November 2</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((d) => (
          <div key={d} style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textAlign: 'center', marginBottom: 2 }}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={`col-${d}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 88 }}>
            {(events[i] || []).map((ev) => (
              <div key={ev.label} style={{ background: ev.tint, borderRadius: 8, padding: '5px 6px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: ev.dot, marginBottom: 3 }} />
                <div style={{ fontSize: 8, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>{ev.label}</div>
                <div style={{ fontSize: 7, color: '#9ca3af', marginTop: 1 }}>{ev.time}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card 2 — Property Management: Units & Tenants
───────────────────────────────────────────── */
function PropertyMock() {
  const rows = [
    { unit: 'Unit 4B', tenant: 'Wren Halden', rent: '$1,450', ok: true },
    { unit: 'Unit 2A', tenant: 'Marco Ibsen', rent: '$1,200', ok: false },
    { unit: 'Unit 9C', tenant: 'Priya Nair', rent: '$1,680', ok: true },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Occupancy</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', borderRadius: 8, padding: '3px 8px' }}>92%</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.unit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 8px', borderRadius: 10, background: '#f7f8fb' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>{r.unit}</div>
              <div style={{ fontSize: 9.5, color: '#9ca3af' }}>{r.tenant}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>{r.rent}</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: r.ok ? '#16a34a' : '#d97706' }}>{r.ok ? 'Paid' : 'Due'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card 3 — Gym: Memberships & Check-ins
───────────────────────────────────────────── */
function GymMock() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4, marginBottom: 12 }}>
        {AVATARS.map((src, i) => (
          <div key={src} style={{ position: 'relative' }}>
            <img
              src={src}
              alt=""
              style={{
                display: 'block', width: 56, height: 56, borderRadius: '50%',
                objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)',
              }}
            />
            <span style={{
              position: 'absolute', bottom: -4, left: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', color: ACCENT,
              fontSize: 9.5, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${ACCENT}`,
            }}>✓</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>128 members checked in today</div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card 4 — Restaurant: Orders in Sync
───────────────────────────────────────────── */
function RestaurantMock() {
  const rows = [
    { order: '#1042', table: 'T-6', items: '3', status: 'Preparing', ok: false },
    { order: '#1043', table: 'T-2', items: '5', status: 'Served', ok: true },
    { order: '#1044', table: 'T-9', items: '2', status: 'Served', ok: true },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 1fr', gap: 4, fontSize: 8.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '0 4px 6px', borderBottom: '1px solid #f0f0ee' }}>
        <span>Order</span><span>Table</span><span>Items</span><span>Status</span>
      </div>
      {rows.map((r) => (
        <div key={r.order} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 1fr', gap: 4, alignItems: 'center', fontSize: 10, color: '#374151', padding: '7px 4px', borderBottom: '1px solid #f7f7f5' }}>
          <span style={{ fontWeight: 700, color: '#111' }}>{r.order}</span>
          <span>{r.table}</span><span>{r.items}</span>
          <span style={{ fontWeight: 700, color: r.ok ? '#16a34a' : '#d97706' }}>{r.status}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card 5 — Asset Management: One Source of Truth
───────────────────────────────────────────── */
function AssetMock() {
  const rows = [
    { name: 'MacBook Pro 14"', owner: 'Design Team', status: 'Assigned', ok: true },
    { name: 'Site License — Figma', owner: 'Unassigned', status: 'Available', ok: false },
    { name: 'Forklift Unit 03', owner: 'Warehouse', status: 'In Service', ok: true },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 1fr', gap: 4, fontSize: 8.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '0 4px 8px' }}>
        <span>Asset</span><span>Owner</span><span>Status</span>
      </div>
      {rows.map((r) => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 1fr', gap: 4, alignItems: 'center', padding: '8px 4px', borderTop: '1px solid #f7f7f5' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
          <span style={{ fontSize: 9.5, color: '#6b7280' }}>{r.owner}</span>
          <span style={{
            fontSize: 8.5, fontWeight: 700, padding: '3px 7px', borderRadius: 999,
            width: 'fit-content',
            color: r.ok ? '#16a34a' : '#d97706',
            background: r.ok ? '#f0fdf4' : '#fffbeb',
          }}>{r.status}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Card 6 — Storefront: One Dashboard, Every Sale
───────────────────────────────────────────── */
function StorefrontMock() {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 16, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 14 }}>
      <img
        src={ID_PHOTO}
        alt=""
        style={{ width: 74, height: 90, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111', fontFamily: FONT, marginBottom: 1 }}>Woven Table Lamp</div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 10 }}>Home & Living</div>
        {[
          ['Vendor', 'Northlane Co.'],
          ['SKU', 'WTL-2231'],
          ['Stock', '42 units'],
          ['Status', 'Live'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderTop: '1px solid #f7f7f5' }}>
            <span style={{ color: '#9ca3af' }}>{k}</span>
            <span style={{ fontWeight: 700, color: '#111' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Bento card shell — 3D tilt on hover, scroll-reveal
   Now on a layered blue gradient with a subtle
   top-left sheen + bottom glow for a more
   "designed" feel instead of a flat fill.
───────────────────────────────────────────── */
function BentoCard({ eyebrow, title, desc, mock, span, minHeight, delay, dir = 'up' }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`
  }

  const onMouseLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)'
  }

  const dirClass = dir === 'left' ? ' from-left' : dir === 'right' ? ' from-right' : ''

  return (
    <div
      ref={ref}
      className={`pf-bento-card${dirClass}${visible ? ' is-visible' : ''}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        gridColumn: span,
        position: 'relative',
        background: `radial-gradient(120% 140% at 0% 0%, ${ACCENT_MID} 0%, ${ACCENT_DEEP} 62%, #070d3d 100%)`,
        borderRadius: 26,
        padding: 26,
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: `0 18px 40px -20px ${ACCENT_GLOW}`,
        transitionDelay: `${delay}ms`,
        transition: 'opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* soft sheen in the upper-right corner for a more polished, less flat look */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT_LIGHT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, transform: 'translateZ(20px)' }}>
        {eyebrow}
      </div>
      <h3 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: '#fff', margin: '0 0 10px', lineHeight: 1.25, transform: 'translateZ(16px)' }}>
        {title}
      </h3>
      <p style={{ fontSize: 13.5, color: 'rgba(214,224,255,0.78)', lineHeight: 1.65, margin: '0 0 20px', maxWidth: 340, transform: 'translateZ(12px)' }}>
        {desc}
      </p>
      <div style={{ marginTop: 'auto', transform: 'translateZ(24px)' }}>{mock}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Animated stat counter
───────────────────────────────────────────── */
function StatCounter({ value, label, suffix = '', delay = 0 }) {
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) { hasRun.current = false; setCount(0); return }
    if (hasRun.current) return
    hasRun.current = true
    const duration = 1400
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(ease * value))
      if (p < 1) requestAnimationFrame(tick)
    }
    const t = setTimeout(() => requestAnimationFrame(tick), delay)
    return () => clearTimeout(t)
  }, [visible, value, delay])

  return (
    <div ref={ref} className={`pf-stat${visible ? ' is-visible' : ''}`} style={{ transitionDelay: `${delay}ms`, textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', lineHeight: 1, fontFamily: FONT }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: '#7a7870', fontWeight: 500, marginTop: 6, fontFamily: FONT }}>{label}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main section
───────────────────────────────────────────── */
function PlatformFeatures() {
  const [headingVisible, setHeadingVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeadingVisible(entry.isIntersecting),
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{ background: '#f4f1ea', padding: '110px 24px 130px' }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className={`pf-heading-reveal${headingVisible ? ' is-visible' : ''}`} style={{ transitionDelay: '0ms' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 999,
              background: '#eae6da', border: '1px solid #d8d4c9',
              fontSize: 11.5, fontWeight: 700, color: '#3a3830',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              fontFamily: FONT, marginBottom: 18,
            }}>
              One Platform, Every Business
            </div>
          </div>
          <div className={`pf-heading-reveal${headingVisible ? ' is-visible' : ''}`} style={{ transitionDelay: '80ms' }}>
            <h2 style={{
              fontFamily: FONT, fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 800,
              letterSpacing: '-0.02em', color: '#111111', lineHeight: 1.18, margin: '0 0 14px',
            }}>
              A solution for <span style={{ color: ACCENT }}>every part of your business</span>
            </h2>
          </div>
          <div className={`pf-heading-reveal${headingVisible ? ' is-visible' : ''}`} style={{ transitionDelay: '160ms' }}>
            <p style={{ fontSize: 16, color: '#5b5850', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              HR, property, fitness, assets, restaurants, and e-commerce — Trellisco brings every part of how you run your business onto one connected platform.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginBottom: 64 }}>
          <StatCounter value={1200} suffix="+" label="Businesses on Trellisco" delay={0} />
          <StatCounter value={500} suffix="+" label="Companies onboarded" delay={120} />
          <StatCounter value={97} suffix="%" label="Customer satisfaction" delay={240} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }} className="pf-bento-grid">
          <BentoCard eyebrow="HRMS" title="Smart Shift Scheduling" desc="Teams and employees manage entire shift seasons through a centralized calendar — online and on mobile." mock={<ScheduleMock />} span="1 / 8" minHeight={360} delay={0} dir="left" />
          <BentoCard eyebrow="Property Management" title="Every Unit, Tracked in One Place" desc="Track units, tenants, rent, and maintenance requests across your whole portfolio without spreadsheets." mock={<PropertyMock />} span="8 / 13" minHeight={360} delay={80} dir="right" />
          <BentoCard eyebrow="Gym & Fitness" title="Classes, Memberships, Check-ins" desc="Handle class scheduling, memberships, and front-desk check-ins without a whiteboard or a clipboard." mock={<GymMock />} span="1 / 7" minHeight={280} delay={160} dir="left" />
          <BentoCard eyebrow="Restaurant" title="Orders, Kept in Sync" desc="Keep orders, tables, and the kitchen moving in real time — without leaving the floor." mock={<RestaurantMock />} span="7 / 13" minHeight={280} delay={240} dir="right" />
          <BentoCard eyebrow="Asset Management" title="Every Asset, One Source of Truth" desc="Track equipment, licenses, and inventory across every team, with a full assignment history." mock={<AssetMock />} span="1 / 8" minHeight={340} delay={320} dir="left" />
          <BentoCard eyebrow="E-commerce" title="One Storefront, Every Sale" desc="Run a multi-vendor marketplace with products, vendors, and orders in a single dashboard." mock={<StorefrontMock />} span="8 / 13" minHeight={340} delay={400} dir="right" />
        </div>
      </div>
    </section>
  )
}

export default PlatformFeatures