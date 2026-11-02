/* ─────────────────────────────────────────────
   Floating hero icons — one per Trellisco module.
   `p` is a prefix so gradient ids stay unique.
───────────────────────────────────────────── */

// Gym — dumbbell (unchanged)
export function GymArt({ p }) {
  return (
    <svg viewBox="0 0 160 90" width="100%">
      <defs>
        <linearGradient id={`${p}Bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3e8f2" />
          <stop offset="1" stopColor="#8b97ad" />
        </linearGradient>
        <linearGradient id={`${p}Plate`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a6a" />
          <stop offset="1" stopColor="#e2461f" />
        </linearGradient>
        <linearGradient id={`${p}PlateDark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f77b4a" />
          <stop offset="1" stopColor="#bf3416" />
        </linearGradient>
      </defs>
      <rect x="28" y="38" width="104" height="14" rx="7" fill={`url(#${p}Bar)`} />
      <rect x="18" y="26" width="16" height="38" rx="7" fill={`url(#${p}PlateDark)`} />
      <rect x="126" y="26" width="16" height="38" rx="7" fill={`url(#${p}PlateDark)`} />
      <rect x="36" y="12" width="24" height="66" rx="10" fill={`url(#${p}Plate)`} />
      <rect x="100" y="12" width="24" height="66" rx="10" fill={`url(#${p}Plate)`} />
      <rect x="41" y="18" width="5" height="54" rx="2.5" fill="#fff" opacity="0.4" />
      <rect x="105" y="18" width="5" height="54" rx="2.5" fill="#fff" opacity="0.4" />
    </svg>
  )
}

// Property management — apartment tower with a location pin
export function PropertyArt({ p }) {
  const cols = [0, 1, 2]
  const rows = [0, 1, 2, 3, 4]
  const lit = new Set(['0-1', '1-3', '2-0', '2-2', '0-4'])
  return (
    <svg viewBox="0 0 120 130" width="100%">
      <defs>
        <linearGradient id={`${p}BldFront`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fd8ab" />
          <stop offset="1" stopColor="#1fa37e" />
        </linearGradient>
        <linearGradient id={`${p}BldSide`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1fa37e" />
          <stop offset="1" stopColor="#0f6e55" />
        </linearGradient>
        <linearGradient id={`${p}BldTop`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9af0d3" />
          <stop offset="1" stopColor="#5fddb4" />
        </linearGradient>
        <linearGradient id={`${p}Pin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb36b" />
          <stop offset="1" stopColor="#f4923b" />
        </linearGradient>
      </defs>
      <polygon points="20,32 42,22 100,22 78,32" fill={`url(#${p}BldTop)`} />
      <polygon points="78,32 100,22 100,112 78,122" fill={`url(#${p}BldSide)`} />
      <rect x="20" y="32" width="58" height="90" fill={`url(#${p}BldFront)`} />
      {rows.map((r) =>
        cols.map((c) => (
          <rect
            key={`${c}-${r}`}
            x={27 + c * 17}
            y={41 + r * 14}
            width="10"
            height="9"
            rx="2"
            fill={lit.has(`${c}-${r}`) ? '#ffe9a8' : '#ffffff'}
            opacity={lit.has(`${c}-${r}`) ? 1 : 0.8}
          />
        )),
      )}
      <rect x="43" y="106" width="12" height="16" rx="2" fill="#0f6e55" />
      <path d="M86 40v76" stroke="#fff" strokeWidth="2" opacity="0.15" />
      {/* location pin */}
      <path
        d="M22 4a11 11 0 0 1 11 11c0 8-11 19-11 19S11 23 11 15A11 11 0 0 1 22 4Z"
        fill={`url(#${p}Pin)`}
      />
      <circle cx="22" cy="15" r="4.2" fill="#fff" />
    </svg>
  )
}

// Hospitality / restaurant — serving cloche on a plate
export function RestaurantArt({ p }) {
  return (
    <svg viewBox="0 0 140 110" width="100%">
      <defs>
        <linearGradient id={`${p}Dome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc58a" />
          <stop offset="1" stopColor="#f4923b" />
        </linearGradient>
        <linearGradient id={`${p}Plate2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f5fb" />
          <stop offset="1" stopColor="#aab4c8" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="86" rx="62" ry="11" fill="#7d889f" opacity="0.35" />
      <ellipse cx="70" cy="82" rx="62" ry="11" fill={`url(#${p}Plate2)`} />
      <path d="M20 80a50 50 0 0 1 100 0Z" fill={`url(#${p}Dome)`} />
      <path d="M32 70a38 38 0 0 1 20-27" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
      <circle cx="70" cy="24" r="7" fill="#f2f5fb" />
      <rect x="18" y="77" width="104" height="6" rx="3" fill="#e07a1f" />
      <path d="M60 10c-4-5 4-7 0-12M80 10c-4-5 4-7 0-12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

// HRMS — team card with an "HR" tag
export function HrmsArt({ p }) {
  return (
    <svg viewBox="0 0 170 118" width="100%">
      <defs>
        <linearGradient id={`${p}HrCard`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9efff" />
        </linearGradient>
        <linearGradient id={`${p}HrMain`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7f9cff" />
          <stop offset="1" stopColor="#1b46f5" />
        </linearGradient>
        <linearGradient id={`${p}HrCheck`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3ddc97" />
          <stop offset="1" stopColor="#0f9d63" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="158" height="102" rx="18" fill={`url(#${p}HrCard)`} stroke="#dfe6fb" />
      {/* side people */}
      <circle cx="46" cy="56" r="12" fill="#ec6f8e" />
      <path d="M24 98c2-13 10-20 22-20s20 7 22 20Z" fill="#f7b6c6" />
      <circle cx="124" cy="56" r="12" fill="#f4923b" />
      <path d="M102 98c2-13 10-20 22-20s20 7 22 20Z" fill="#fbd2a6" />
      {/* centre person */}
      <circle cx="85" cy="48" r="17" fill={`url(#${p}HrMain)`} />
      <path d="M57 98c2-18 13-28 28-28s26 10 28 28Z" fill="#a9bcff" />
      {/* HR tag */}
      <rect x="116" y="14" width="40" height="18" rx="9" fill="#1b46f5" />
      <text x="136" y="27" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="Arial, sans-serif" fill="#fff">
        HR
      </text>
      {/* check badge */}
      <circle cx="146" cy="92" r="15" fill={`url(#${p}HrCheck)`} />
      <path d="M139.5 92.5l4.5 4.5 8-9.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Payroll — gold rupee coins
export function PayrollArt({ p }) {
  return (
    <svg viewBox="0 0 140 124" width="100%">
      <defs>
        <linearGradient id={`${p}Coin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f4a52b" />
        </linearGradient>
        <linearGradient id={`${p}CoinEdge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8921a" />
          <stop offset="1" stopColor="#b8680a" />
        </linearGradient>
      </defs>
      {/* small coin */}
      <ellipse cx="30" cy="104" rx="20" ry="7" fill="#b8680a" opacity="0.25" />
      <circle cx="30" cy="96" r="19" fill={`url(#${p}CoinEdge)`} />
      <circle cx="30" cy="92" r="19" fill={`url(#${p}Coin)`} />
      <circle cx="30" cy="92" r="13" fill="none" stroke="#fff" strokeWidth="1.8" opacity="0.55" />
      {/* big coin */}
      <circle cx="78" cy="66" r="46" fill={`url(#${p}CoinEdge)`} />
      <circle cx="78" cy="58" r="46" fill={`url(#${p}Coin)`} />
      <circle cx="78" cy="58" r="36" fill="none" stroke="#fff" strokeWidth="2.4" opacity="0.55" />
      <text x="78" y="75" textAnchor="middle" fontSize="50" fontWeight="800" fontFamily="Arial, sans-serif" fill="#b8680a">
        ₹
      </text>
      <path d="M44 38a40 40 0 0 1 22-18" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}