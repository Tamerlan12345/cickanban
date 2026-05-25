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
        </defs>
        {/* Abstract Kanban/Scrum boards icon */}
        <rect x="2" y="4" width="7" height="14" rx="2" fill="url(#centrasGradient)" />
        <rect x="12.5" y="4" width="7" height="24" rx="2" fill="url(#centrasGradient)" opacity="0.85" />
        <rect x="23" y="4" width="7" height="18" rx="2" fill="url(#centrasGradient)" opacity="0.7" />
        <circle cx="26.5" cy="26" r="3" fill="url(#centrasGradient)" />
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
