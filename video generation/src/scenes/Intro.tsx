import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({frame, fps, config: {stiffness: 150, damping: 15}});
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const barWidth = interpolate(frame, [15, 40], [0, 60], {extrapolateRight: 'clamp'});
  const taglineOpacity = interpolate(frame, [22, 42], [0, 1], {extrapolateRight: 'clamp'});
  const taglineY = interpolate(frame, [22, 42], [24, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 45%, #1c1c1c 0%, #0a0a0a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: 28,
    }}>
      <div style={{
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 108,
          fontWeight: 900,
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-4px',
          lineHeight: 1,
        }}>
          Stikup
        </div>
        <div style={{
          height: 5,
          width: barWidth,
          background: '#10a37f',
          borderRadius: 3,
          margin: '16px auto 0',
        }} />
      </div>

      <div style={{
        opacity: taglineOpacity,
        transform: `translateY(${taglineY}px)`,
        textAlign: 'center',
        padding: '0 100px',
      }}>
        <div style={{
          fontSize: 34,
          color: '#aaaaaa',
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
