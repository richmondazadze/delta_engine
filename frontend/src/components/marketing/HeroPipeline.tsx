/** Abstract master → CopyMorphic → followers diagram (no stock art). */
export function HeroPipeline() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="pipe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00897B" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#00897B" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#00897B" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Master node */}
      <rect x="24" y="108" width="88" height="64" rx="1" stroke="#09090B" strokeWidth="1.25" fill="#F8F9FA" />
      <text x="68" y="136" textAnchor="middle" fill="#71717A" fontSize="10" fontFamily="var(--font-mono)">
        MASTER
      </text>
      <circle cx="68" cy="152" r="6" fill="#00897B" />

      {/* Engine node */}
      <rect x="156" y="88" width="88" height="104" rx="1" stroke="#00897B" strokeWidth="1.5" fill="#E0F2F0" />
      <text x="200" y="124" textAnchor="middle" fill="#00695C" fontSize="10" fontWeight="600">
        CopyMorphic
      </text>
      <rect x="172" y="136" width="56" height="8" rx="1" fill="#E9FF8C" />
      <rect x="172" y="152" width="40" height="6" rx="1" fill="#00897B" opacity="0.35" />
      <rect x="172" y="164" width="48" height="6" rx="1" fill="#00897B" opacity="0.35" />

      {/* Follower nodes */}
      <rect x="288" y="72" width="88" height="52" rx="1" stroke="#09090B" strokeWidth="1.25" fill="#FFFFFF" />
      <text x="332" y="96" textAnchor="middle" fill="#71717A" fontSize="9" fontFamily="var(--font-mono)">
        FOLLOWER A
      </text>
      <circle cx="332" cy="108" r="5" fill="#15803D" />

      <rect x="288" y="136" width="88" height="52" rx="1" stroke="#09090B" strokeWidth="1.25" fill="#FFFFFF" />
      <text x="332" y="160" textAnchor="middle" fill="#71717A" fontSize="9" fontFamily="var(--font-mono)">
        FOLLOWER B
      </text>
      <circle cx="332" cy="172" r="5" fill="#15803D" />

      <rect x="288" y="200" width="88" height="52" rx="1" stroke="#09090B" strokeWidth="1.25" fill="#FFFFFF" />
      <text x="332" y="224" textAnchor="middle" fill="#71717A" fontSize="9" fontFamily="var(--font-mono)">
        FOLLOWER C
      </text>
      <circle cx="332" cy="236" r="5" fill="#15803D" />

      {/* Pipes */}
      <path d="M112 140 H156" stroke="url(#pipe)" strokeWidth="2" strokeLinecap="round" />
      <path d="M244 120 H288" stroke="url(#pipe)" strokeWidth="2" strokeLinecap="round" />
      <path d="M244 140 H288" stroke="url(#pipe)" strokeWidth="2" strokeLinecap="round" />
      <path d="M244 160 H288" stroke="url(#pipe)" strokeWidth="2" strokeLinecap="round" />

      {/* Pulse telemetry */}
      <circle cx="200" cy="140" r="4" fill="#E9FF8C" stroke="#00897B" strokeWidth="1">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
