import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../components/AppScreen';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({frame, fps, config: {stiffness: 160, damping: 14}});
  const logoOpacity = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const urlOpacity = interpolate(frame, [14, 26], [0, 1], {extrapolateRight: 'clamp'});
  const ctaOpacity = interpolate(frame, [26, 40], [0, 1], {extrapolateRight: 'clamp'});
  const ctaY = interpolate(frame, [26, 40], [24, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 42%, #1c1008 0%, ${COLORS.bg} 100%)`,
      justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 32,
    }}>
      <div style={{opacity: logoOpacity, transform: `scale(${logoScale})`, textAlign: 'center'}}>
        <Img src={staticFile('logo-white.png')} style={{height: 60, objectFit: 'contain', marginBottom: 12}} />
        <div style={{width: 44, height: 4, background: `linear-gradient(90deg, ${COLORS.brand}, ${COLORS.brand2})`, borderRadius: 2, margin: '0 auto'}} />
      </div>

      <div style={{opacity: urlOpacity, fontSize: 28, color: COLORS.brand, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.5px'}}>
        stikup.app
      </div>

      <div style={{opacity: ctaOpacity, transform: `translateY(${ctaY}px)`}}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.brand}, #ff5e72, ${COLORS.brand2})`,
          borderRadius: 100, padding: '22px 60px',
          fontSize: 28, fontWeight: 700, color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: `0 18px 40px -12px rgba(224,52,154,0.55)`,
        }}>
          Make yours free →
        </div>
      </div>
    </AbsoluteFill>
  );
};
