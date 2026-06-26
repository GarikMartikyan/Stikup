import React from 'react';
import {interpolate} from 'remotion';

interface AppScreenProps {
  frame: number;
  children: React.ReactNode;
}

export const AppScreen: React.FC<AppScreenProps> = ({frame, children}) => {
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#111111',
      opacity,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 48,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{fontSize: 16, color: '#fff', fontWeight: 600, fontFamily: 'system-ui'}}>9:41</div>
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
            <rect x="0" y="4" width="3" height="8" rx="1"/>
            <rect x="5" y="2" width="3" height="10" rx="1"/>
            <rect x="10" y="0" width="3" height="12" rx="1"/>
            <rect x="15" y="3" width="2" height="6" rx="1" opacity="0.4"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="0.5" y="0.5" width="13" height="11" rx="2.5" stroke="white" strokeOpacity="0.4"/>
            <rect x="2" y="2" width="9" height="8" rx="1.5" fill="white"/>
            <path d="M15 4.5V7.5" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Nav bar */}
      <div style={{
        height: 56,
        padding: '0 44px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #1e1e1e',
        flexShrink: 0,
      }}>
        <div style={{fontSize: 22, fontWeight: 800, color: '#10a37f', fontFamily: 'system-ui', letterSpacing: '-0.5px'}}>
          Stikup
        </div>
      </div>

      {/* Content */}
      <div style={{flex: 1, overflow: 'hidden'}}>
        {children}
      </div>
    </div>
  );
};
