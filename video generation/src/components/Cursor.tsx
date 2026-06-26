import React from 'react';
import {interpolate, spring} from 'remotion';

interface CursorProps {
  frame: number;
  fps: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  clickFrame: number;
}

export const Cursor: React.FC<CursorProps> = ({frame, fps, fromX, fromY, toX, toY, clickFrame}) => {
  const progress = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress;

  const clickSp = spring({
    frame: Math.max(0, frame - clickFrame),
    fps,
    config: {stiffness: 500, damping: 25},
  });
  const clickScale = frame >= clickFrame ? 1 - clickSp * 0.25 + 0.25 : 1;

  const rippleOpacity = frame >= clickFrame
    ? interpolate(frame, [clickFrame, clickFrame + 25], [0.6, 0], {extrapolateRight: 'clamp'})
    : 0;
  const rippleScale = frame >= clickFrame
    ? interpolate(frame, [clickFrame, clickFrame + 25], [0.5, 3], {extrapolateRight: 'clamp'})
    : 0;

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      pointerEvents: 'none',
      transform: `scale(${clickScale})`,
    }}>
      <div style={{
        position: 'absolute',
        left: -20,
        top: -20,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)',
        transform: `scale(${rippleScale})`,
        opacity: rippleOpacity,
      }} />
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
        <path
          d="M4 3L4 36L13 27L22 41L27 38.5L18 24.5L32 24.5L4 3Z"
          fill="white"
          stroke="#222"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
