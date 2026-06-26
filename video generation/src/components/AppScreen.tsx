import React from 'react';
import {interpolate} from 'remotion';

// Real Stikup design tokens (dark mode)
export const COLORS = {
  bg: '#100b08',
  bgElev: '#1a1310',
  bgSunk: '#0a0705',
  fg: '#f5efe5',
  fgMuted: '#a8a095',
  fgSubtle: '#6b6359',
  brand: '#e0349a',
  brand2: '#ffb422',
  border: '#2a201a',
  borderStrong: '#3a2820',
};

interface AppScreenProps {
  frame: number;
  children: React.ReactNode;
}

export const AppScreen: React.FC<AppScreenProps> = ({frame, children}) => {
  const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: COLORS.bg,
      opacity,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 44,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{fontSize: 15, color: COLORS.fg, fontWeight: 600, fontFamily: 'system-ui'}}>9:41</div>
        <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
          <svg width="17" height="11" viewBox="0 0 17 11" fill={COLORS.fg}>
            <rect x="0" y="3" width="3" height="8" rx="1"/>
            <rect x="5" y="1.5" width="3" height="9.5" rx="1"/>
            <rect x="10" y="0" width="3" height="11" rx="1"/>
            <rect x="15" y="3" width="2" height="5" rx="1" opacity="0.4"/>
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
            <rect x="0.5" y="0.5" width="12" height="10" rx="2" stroke={COLORS.fg} strokeOpacity="0.35"/>
            <rect x="2" y="2" width="8" height="7" rx="1.5" fill={COLORS.fg}/>
            <path d="M14 4V7" stroke={COLORS.fg} strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Nav bar */}
      <div style={{
        height: 52,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${COLORS.border}`,
        flexShrink: 0,
      }}>
        <div style={{fontSize: 22, fontWeight: 900, color: COLORS.fg, fontFamily: 'system-ui', letterSpacing: '-0.5px'}}>
          Stikup
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: COLORS.brand,
          fontFamily: 'system-ui',
          border: `1px solid ${COLORS.brand}`,
          borderRadius: 100,
          padding: '6px 16px',
          opacity: 0.85,
        }}>
          Log in
        </div>
      </div>

      {/* Content */}
      <div style={{flex: 1, overflow: 'hidden'}}>
        {children}
      </div>
    </div>
  );
};
