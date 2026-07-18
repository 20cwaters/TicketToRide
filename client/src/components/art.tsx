/**
 * Decorative SVG art for the home/join screen. Everything is self-contained
 * (styles + animations live inside each SVG), with reduced-motion support.
 */
// Explicit import so non-Vite tooling (scripts/home-preview.ts) can render these.
import React from 'react';

export function LocomotiveHero({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 -34 360 200"
      className={className}
      role="img"
      aria-label="Vintage steam locomotive"
    >
      <style>{`
        .lh-puff {
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
          animation: lh-puff 4.2s ease-out infinite;
        }
        .lh-p2 { animation-delay: 1.4s; }
        .lh-p3 { animation-delay: 2.8s; }
        @keyframes lh-puff {
          0%   { opacity: 0; transform: translate(0, 10px) scale(0.55); }
          25%  { opacity: 0.55; }
          100% { opacity: 0; transform: translate(30px, -30px) scale(1.3); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lh-puff { animation: none; opacity: 0.35; }
        }
      `}</style>
      <defs>
        <linearGradient id="lh-boiler" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d4753" />
          <stop offset="55%" stopColor="#2b333f" />
          <stop offset="100%" stopColor="#1f2630" />
        </linearGradient>
        <linearGradient id="lh-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c34a36" />
          <stop offset="100%" stopColor="#9c3423" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <ellipse cx="172" cy="154" rx="152" ry="8" fill="#000" opacity="0.3" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={14 + i * 30} y={148} width="7" height="11" rx="1.5" fill="#2c343f" />
      ))}
      <rect x="0" y="144" width="360" height="4.5" rx="2" fill="#46505c" />

      {/* Smoke */}
      <circle className="lh-puff" cx="96" cy="12" r="9" fill="#c7ccd4" />
      <circle className="lh-puff lh-p2" cx="112" cy="-2" r="12" fill="#c7ccd4" />
      <circle className="lh-puff lh-p3" cx="130" cy="-16" r="15" fill="#c7ccd4" />

      {/* Cowcatcher */}
      <polygon points="18,146 58,146 58,102" fill="#8f6f40" />
      <g stroke="#5c4526" strokeWidth="2.5">
        <line x1="58" y1="112" x2="30" y2="146" />
        <line x1="58" y1="124" x2="40" y2="146" />
        <line x1="58" y1="136" x2="50" y2="146" />
      </g>

      {/* Running board */}
      <rect x="44" y="118" width="238" height="10" rx="3" fill="#1c2129" />

      {/* Boiler + brass bands */}
      <rect x="50" y="68" width="162" height="52" rx="24" fill="url(#lh-boiler)" />
      <rect x="102" y="68" width="6" height="52" rx="3" fill="#c9a86a" opacity="0.9" />
      <rect x="132" y="68" width="6" height="52" rx="3" fill="#c9a86a" opacity="0.9" />

      {/* Smokebox + number plate */}
      <circle cx="62" cy="94" r="28" fill="#38424f" stroke="#1d232c" strokeWidth="2.5" />
      <circle cx="62" cy="94" r="11" fill="#c9a86a" stroke="#6f5527" strokeWidth="1.5" />
      <text
        x="62"
        y="98.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fontFamily="Georgia, serif"
        fill="#26200f"
      >
        45
      </text>

      {/* Headlamp */}
      <rect x="46" y="52" width="17" height="15" rx="2.5" fill="#8f6f40" />
      <circle cx="54.5" cy="59.5" r="4.5" fill="#f3e6c3" />

      {/* Smokestack */}
      <polygon points="84,68 84,46 76,32 108,32 100,46 100,68" fill="#232b36" />
      <rect x="72" y="24" width="40" height="9" rx="4" fill="#c9a86a" />

      {/* Steam dome */}
      <path d="M 148 68 A 17 17 0 0 1 182 68 Z" fill="#c9a86a" />

      {/* Cab */}
      <rect x="210" y="46" width="66" height="74" rx="5" fill="url(#lh-cab)" stroke="#7d2818" strokeWidth="2" />
      <rect x="202" y="38" width="82" height="11" rx="4.5" fill="#232b36" />
      <rect x="224" y="60" width="36" height="27" rx="4" fill="#f3e6c3" stroke="#7d2818" strokeWidth="2" />
      <rect x="218" y="98" width="50" height="4" rx="2" fill="#7d2818" opacity="0.7" />

      {/* Wheels */}
      <g>
        <circle cx="70" cy="133" r="13" fill="#262b33" stroke="#c9a86a" strokeWidth="2.5" />
        <circle cx="70" cy="133" r="3.5" fill="#c9a86a" />
        <circle cx="252" cy="133" r="13" fill="#262b33" stroke="#c9a86a" strokeWidth="2.5" />
        <circle cx="252" cy="133" r="3.5" fill="#c9a86a" />
        {[136, 200].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="120" r="26" fill="#262b33" stroke="#c9a86a" strokeWidth="3" />
            <g stroke="#4a525e" strokeWidth="3">
              <line x1={cx - 17} y1="120" x2={cx + 17} y2="120" />
              <line x1={cx} y1="103" x2={cx} y2="137" />
              <line x1={cx - 12} y1="108" x2={cx + 12} y2="132" />
              <line x1={cx + 12} y1="108" x2={cx - 12} y2="132" />
            </g>
            <circle cx={cx} cy="120" r="5" fill="#c9a86a" />
          </g>
        ))}
        {/* Connecting rod */}
        <line x1="136" y1="128" x2="200" y2="128" stroke="#9aa4b0" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="136" cy="128" r="3" fill="#5c6672" />
        <circle cx="200" cy="128" r="3" fill="#5c6672" />
      </g>
    </svg>
  );
}

export function RailwayBackdrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <style>{`
        .rb-ride {
          animation: rb-ride 80s linear infinite;
        }
        @keyframes rb-ride {
          from { transform: translateX(-300px); }
          to   { transform: translateX(1740px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rb-ride { animation: none; transform: translateX(880px); }
        }
      `}</style>
      <defs>
        <radialGradient id="rb-sky" cx="50%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#273140" />
          <stop offset="60%" stopColor="#1b232e" />
          <stop offset="100%" stopColor="#121821" />
        </radialGradient>
        <linearGradient id="rb-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1218" stopOpacity="0" />
          <stop offset="100%" stopColor="#0e1218" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#rb-sky)" />

      {/* Stars */}
      <g fill="#f3ead4">
        {[
          [90, 90, 1.6], [240, 50, 1.1], [420, 130, 1.4], [600, 60, 1.1],
          [780, 150, 1.6], [960, 80, 1.1], [1120, 140, 1.4], [1290, 70, 1.6],
          [1390, 180, 1.1], [180, 210, 1.1], [520, 250, 1.1], [880, 230, 1.4],
          [1060, 300, 1.1], [1340, 320, 1.1], [60, 330, 1.4], [700, 330, 1.1],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={i % 3 === 0 ? 0.35 : 0.2} />
        ))}
      </g>

      {/* Ghosted route network */}
      <g stroke="#c9a86a" strokeWidth="2.5" strokeDasharray="1 14" strokeLinecap="round" opacity="0.16" fill="none">
        <path d="M 120 160 L 330 100 L 560 190 L 800 120 L 1010 190 L 1250 130" />
        <path d="M 120 160 L 190 360 L 430 310 L 560 190" />
        <path d="M 430 310 L 690 340 L 950 310 L 1010 190" />
        <path d="M 950 310 L 1190 350 L 1250 130" />
        <path d="M 190 360 L 90 540 L 310 500 L 570 480 L 690 340" />
        <path d="M 570 480 L 830 470 L 1110 480 L 1190 350" />
        <path d="M 1110 480 L 1330 540" />
        <path d="M 1330 540 L 1370 270 L 1250 130" />
      </g>
      <g fill="none" stroke="#c9a86a" opacity="0.22" strokeWidth="2">
        {[
          [120, 160], [330, 100], [560, 190], [800, 120], [1010, 190],
          [1250, 130], [190, 360], [430, 310], [690, 340], [950, 310],
          [1190, 350], [90, 540], [310, 500], [570, 480], [830, 470],
          [1110, 480], [1330, 540], [1370, 270],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#c9a86a" stroke="none" />
            <circle cx={x} cy={y} r="9" />
          </g>
        ))}
      </g>

      {/* Hills */}
      <path
        d="M 0 700 Q 180 648 360 688 Q 540 726 720 682 Q 900 640 1080 696 Q 1260 748 1440 672 L 1440 900 L 0 900 Z"
        fill="#171e28"
      />
      <path
        d="M 0 768 Q 240 726 480 758 Q 720 788 960 750 Q 1200 714 1440 764 L 1440 900 L 0 900 Z"
        fill="#10151c"
      />

      {/* Track */}
      {Array.from({ length: 48 }, (_, i) => (
        <rect key={i} x={i * 30 + 4} y={806} width="8" height="15" rx="2" fill="#232b35" />
      ))}
      <rect x="0" y="810" width="1440" height="5" fill="#39434f" />

      {/* Rolling silhouette train */}
      <g className="rb-ride" fill="#0b0f14">
        <rect x="0" y="762" width="86" height="48" rx="6" />
        <rect x="8" y="738" width="26" height="28" rx="4" />
        <polygon points="86,810 106,810 86,776" />
        <rect x="14" y="770" width="14" height="12" rx="2" fill="#e8c97a" opacity="0.75" />
        {[100, 176, 252].map((x) => (
          <g key={x}>
            <rect x={x} y="774" width="64" height="36" rx="5" />
            <rect x={x + 10} y="782" width="12" height="10" rx="2" fill="#e8c97a" opacity="0.6" />
            <rect x={x + 36} y="782" width="12" height="10" rx="2" fill="#e8c97a" opacity="0.6" />
          </g>
        ))}
      </g>

      {/* Bottom vignette */}
      <rect x="0" y="700" width="1440" height="200" fill="url(#rb-fade)" />
    </svg>
  );
}
