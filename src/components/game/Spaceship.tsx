"use client";

interface SpaceshipProps {
  aimAngle?: number;
  firing?: boolean;
}

export default function Spaceship({ aimAngle = 0, firing = false }: SpaceshipProps) {
  return (
    <div
      className={`spaceship ${firing ? "firing" : ""}`}
      style={{
        transform: `translateX(-50%) rotate(${aimAngle}deg)`,
      }}
    >
      <svg
        viewBox="0 0 80 100"
        width="60"
        height="75"
        className="spaceship-svg"
      >
        {/* Main body */}
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#2979ff" />
            <stop offset="100%" stopColor="#1a237e" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d47a1" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
          <radialGradient id="glowGrad">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow effect behind ship */}
        <ellipse cx="40" cy="55" rx="25" ry="20" fill="url(#glowGrad)" />

        {/* Left wing */}
        <path
          d="M 25 55 L 5 75 L 15 65 L 25 65 Z"
          fill="url(#wingGrad)"
          filter="url(#neonGlow)"
        />
        {/* Right wing */}
        <path
          d="M 55 55 L 75 75 L 65 65 L 55 65 Z"
          fill="url(#wingGrad)"
          filter="url(#neonGlow)"
        />

        {/* Main body */}
        <path
          d="M 40 10 C 30 20, 25 40, 25 60 L 25 65 L 55 65 L 55 60 C 55 40, 50 20, 40 10 Z"
          fill="url(#bodyGrad)"
          stroke="#00e5ff"
          strokeWidth="0.5"
          filter="url(#neonGlow)"
        />

        {/* Cockpit */}
        <ellipse
          cx="40"
          cy="38"
          rx="6"
          ry="12"
          fill="#00e5ff"
          opacity="0.85"
          filter="url(#neonGlow)"
        />
        <ellipse cx="40" cy="36" rx="3" ry="7" fill="#ffffff" opacity="0.6" />

        {/* Nose Cannon Tip */}
        <rect x="38.5" y="6" width="3" height="6" rx="1.5" fill="#00e5ff" />

        {/* Muzzle Flash when firing */}
        {firing && (
          <g className="muzzle-flash-group">
            <circle cx="40" cy="5" r="7" fill="#00e5ff" opacity="0.9" filter="url(#neonGlow)" />
            <circle cx="40" cy="5" r="3.5" fill="#ffffff" />
          </g>
        )}

        {/* Engine flames */}
        <g className="engine-flame">
          <ellipse cx="33" cy="70" rx="3" ry="8" fill="#ffab00" opacity="0.8" />
          <ellipse cx="33" cy="72" rx="2" ry="6" fill="#ff6d00" opacity="0.9" />
          <ellipse cx="33" cy="73" rx="1" ry="4" fill="#ffffff" opacity="0.7" />

          <ellipse cx="47" cy="70" rx="3" ry="8" fill="#ffab00" opacity="0.8" />
          <ellipse cx="47" cy="72" rx="2" ry="6" fill="#ff6d00" opacity="0.9" />
          <ellipse cx="47" cy="73" rx="1" ry="4" fill="#ffffff" opacity="0.7" />
        </g>

        {/* Detail lines */}
        <line
          x1="32"
          y1="50"
          x2="32"
          y2="60"
          stroke="#00e5ff"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <line
          x1="48"
          y1="50"
          x2="48"
          y2="60"
          stroke="#00e5ff"
          strokeWidth="0.5"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
