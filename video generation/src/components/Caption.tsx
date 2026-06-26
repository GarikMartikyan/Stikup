import React from 'react';
import {interpolate} from 'remotion';

interface CaptionProps {
  frame: number;
  text: string;
  startFrame?: number;
}

export const Caption: React.FC<CaptionProps> = ({frame, text, startFrame = 0}) => {
  const f = Math.max(0, frame - startFrame);
  const opacity = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const y = interpolate(f, [0, 12], [30, 0], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      opacity,
      transform: `translateY(${y}px)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.75)',
        borderRadius: 100,
        padding: '18px 44px',
        fontSize: 34,
        fontWeight: 600,
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        maxWidth: 900,
        lineHeight: 1.3,
      }}>
        {text}
      </div>
    </div>
  );
};
