import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', style, collapsed = false }) => {
  const dims = {
    sm: { iconSize: 28, fontSize: '15px', subSize: '9px', gap: 8 },
    md: { iconSize: 34, fontSize: '18px', subSize: '10px', gap: 10 },
    lg: { iconSize: 42, fontSize: '22px', subSize: '11px', gap: 12 },
  }[size];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: dims.gap,
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Icon: Hexagon + CS monogram */}
      <svg
        width={dims.iconSize}
        height={dims.iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="logo-grad-a" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#E5001A" />
            <stop offset="48%"  stopColor="#7A1B8C" />
            <stop offset="100%" stopColor="#1E3CFF" />
          </linearGradient>
          <linearGradient id="logo-grad-b" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#ff4560" />
            <stop offset="100%" stopColor="#3d5aff" />
          </linearGradient>
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Hexagon background */}
        <path
          d="M20 2 L35.6 11 L35.6 29 L20 38 L4.4 29 L4.4 11 Z"
          fill="url(#logo-grad-a)"
          opacity="0.12"
        />
        <path
          d="M20 2 L35.6 11 L35.6 29 L20 38 L4.4 29 L4.4 11 Z"
          fill="none"
          stroke="url(#logo-grad-a)"
          strokeWidth="1.5"
          opacity="0.7"
        />

        {/* Inner accent hex */}
        <path
          d="M20 7 L30.4 13 L30.4 27 L20 33 L9.6 27 L9.6 13 Z"
          fill="none"
          stroke="url(#logo-grad-b)"
          strokeWidth="0.75"
          opacity="0.25"
        />

        {/* C — left arc */}
        <path
          d="M22 13.5 C18 13.5 14.5 16.4 14.5 20 C14.5 23.6 18 26.5 22 26.5"
          stroke="url(#logo-grad-a)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          filter="url(#logo-glow)"
        />

        {/* S — right curve */}
        <path
          d="M21 17 C24 17 26 18.2 26 19.5 C26 20.8 24 21.5 21 21.5 C18 21.5 16 22.5 16 24 C16 25.5 18.5 27 22 27"
          stroke="url(#logo-grad-b)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Corner accent dots */}
        <circle cx="20" cy="4"  r="1.2" fill="url(#logo-grad-a)" opacity="0.6" />
        <circle cx="20" cy="36" r="1.2" fill="url(#logo-grad-a)" opacity="0.4" />
      </svg>

      {/* Text — hide when collapsed */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <span
              style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: dims.fontSize,
                background: 'linear-gradient(90deg, #E5001A 0%, #7A1B8C 55%, #1E3CFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.4px',
              }}
            >
              centras
            </span>
            <span
              style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontWeight: 300,
                fontSize: dims.fontSize,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '-0.2px',
              }}
            >
              .scram
            </span>
            <span
              style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: dims.fontSize,
                color: '#ffffff',
                letterSpacing: '-0.2px',
              }}
            >
              ban
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: dims.subSize,
              color: 'rgba(229, 0, 26, 0.75)',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
            }}
          >
            project board
          </span>
        </div>
      )}
    </div>
  );
};
