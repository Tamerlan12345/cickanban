import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', style }) => {
  const dimensions = {
    sm: { width: 140, height: 32, iconSize: 20, fontSize: '16px', subFontSize: '8px' },
    md: { width: 220, height: 48, iconSize: 28, fontSize: '22px', subFontSize: '10px' },
    lg: { width: 280, height: 64, iconSize: 36, fontSize: '28px', subFontSize: '12px' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {/* Centras Brand Icon */}
      <svg
        width={dimensions.iconSize}
        height={dimensions.iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="centrasGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E5001A" />
            <stop offset="50%" stopColor="#7A1B8C" />
            <stop offset="100%" stopColor="#1E3CFF" />
          </linearGradient>
          <linearGradient id="cardGlow" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Board Background grid - 3 Columns */}
        <line x1="10.5" y1="2" x2="10.5" y2="30" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 2" />
        <line x1="21.5" y1="2" x2="21.5" y2="30" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 2" />

        {/* Column 1 (Backlog): 2 Stacked small cards */}
        <rect x="2" y="4" width="6" height="8" rx="1.5" fill="url(#centrasGradient)" opacity="0.55" />
        <rect x="2" y="14" width="6" height="8" rx="1.5" fill="url(#centrasGradient)" opacity="0.35" />

        {/* Column 2 (In Progress): Active glowing card with white gradient highlight */}
        <rect x="13" y="8" width="6" height="14" rx="2" fill="url(#centrasGradient)" />
        <rect x="13" y="8" width="6" height="14" rx="2" fill="url(#cardGlow)" />
        <circle cx="16" cy="15" r="1.5" fill="#FFFFFF" />

        {/* Column 3 (Done): Completed card with checkmark style */}
        <rect x="24" y="4" width="6" height="10" rx="1.5" fill="url(#centrasGradient)" opacity="0.8" />
        {/* Completed check icon styled inside column 3 */}
        <path d="M25.5 9L26.5 10L28.5 8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Workflow flow line (curved arrow showing progress left-to-right) */}
        <path d="M6 8C10 8 12 15 16 15C20 15 22 9 26 9" stroke="url(#centrasGradient)" strokeWidth="1.2" strokeDasharray="1 2" opacity="0.75" />
      </svg>

      {/* Centras ScramBan Text */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span
            className="centras-text-gradient"
            style={{
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: dimensions.fontSize,
              letterSpacing: '-0.5px',
            }}
          >
            centras
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: dimensions.fontSize,
              color: '#FFFFFF',
              marginLeft: '2px',
            }}
          >
            ScramBan
          </span>
        </div>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: dimensions.subFontSize,
            color: '#E5001A',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}
        >
          insurance
        </span>
      </div>
    </div>
  );
};
