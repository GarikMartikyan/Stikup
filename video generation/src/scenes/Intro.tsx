import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../components/AppScreen';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({frame, fps, config: {stiffness: 160, damping: 14}});
  const logoOpacity = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const barWidth = interpolate(frame, [10, 28], [0, 56], {extrapolateRight: 'clamp'});
  const taglineOpacity = interpolate(frame, [14, 30], [0, 1], {extrapolateRight: 'clamp'});
  const taglineY = interpolate(frame, [14, 30], [20, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 42%, #1c1008 0%, ${COLORS.bg} 100%)`,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: 24,
    }}>
      <div style={{opacity: logoOpacity, transform: `scale(${logoScale})`, textAlign: 'center'}}>
        <Img
          src={staticFile('logo-white.png')}
          style={{height: 72, objectFit: 'contain', marginBottom: 16}}
        />
        <div style={{
          height: 4,
          width: barWidth,
          background: `linear-gradient(90deg, ${COLORS.brand}, ${COLORS.brand2})`,
          borderRadius: 2,
          margin: '0 auto',
        }} />
      </div>

      <div style={{opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, textAlign: 'center', padding: '0 80px'}}>
        <div style={{
          fontSize: 32,
          color: COLORS.fgMuted,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: 1.45,
          fontWeight: 400,
        }}>
          Turn your photos into<br />Telegram stickers
        </div>
      </div>
    </AbsoluteFill>
  );
};
