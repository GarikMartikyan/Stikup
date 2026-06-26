import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({frame, fps, config: {stiffness: 150, damping: 15}});
  const urlOpacity = interpolate(frame, [20, 38], [0, 1], {extrapolateRight: 'clamp'});
  const ctaOpacity = interpolate(frame, [38, 58], [0, 1], {extrapolateRight: 'clamp'});
  const ctaY = interpolate(frame, [38, 58], [32, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 45%, #1c1c1c 0%, #0a0a0a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: 36,
    }}>
      <div style={{transform: `scale(${logoScale})`, textAlign: 'center'}}>
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-3px',
          lineHeight: 1,
        }}>
          Stikup
        </div>
        <div style={{width: 48, height: 5, background: '#10a37f', borderRadius: 3, margin: '12px auto 0'}} />
      </div>

      <div style={{opacity: urlOpacity, fontSize: 30, color: '#10a37f', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.5px'}}>
        stikup.app
      </div>

      <div style={{opacity: ctaOpacity, transform: `translateY(${ctaY}px)`}}>
        <div style={{
          background: '#10a37f',
          borderRadius: 100,
          padding: '24px 64px',
          fontSize: 30,
          fontWeight: 700,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.3px',
        }}>
          Make yours free →
        </div>
      </div>
    </AbsoluteFill>
  );
};
