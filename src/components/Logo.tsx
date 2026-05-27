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
          d="M20 3 L34.7 11.5 L34.7 28.5 L20 37 L5.3 28.5 L5.3 11.5 Z"
          fill="url(#logo-grad-a)"
          opacity="0.05"
        />
        <path
          d="M20 3 L34.7 11.5 L34.7 28.5 L20 37 L5.3 28.5 L5.3 11.5 Z"
          fill="none"
          stroke="url(#logo-grad-a)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />

        {/* C — left arc */}
        <path
          d="M23 14 C17 14 14 17 14 20 C14 23 17 26 23 26"
          stroke="url(#logo-grad-a)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />

        {/* S — right curve */}
        <path
          d="M20 17.5 C23.5 17.5 25 18.2 25 19.5 C25 21.2 20.8 21.5 20.2 23 C19.6 24.5 21 26 25 26"
          stroke="url(#logo-grad-b)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
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
