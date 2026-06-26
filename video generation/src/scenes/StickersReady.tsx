import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from '../components/Caption';

const STICKERS = Array.from({length: 12}, (_, i) =>
  staticFile(`disney/disney-styled_${String(i + 1).padStart(2, '0')}.webp`)
);

export const StickersReady: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 16], [0, 1], {extrapolateRight: 'clamp'});
  const titleY = interpolate(frame, [0, 16], [20, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: '#0a0a0a',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '64px 44px 140px',
    }}>
      <div style={{
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        fontSize: 42,
        fontWeight: 800,
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: 44,
        textAlign: 'center',
        letterSpacing: '-1px',
      }}>
        Your stickers are ready!
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        width: '100%',
      }}>
        {STICKERS.map((src, index) => {
          const staggerFrame = Math.max(0, frame - index * 10);
          const sc = spring({frame: staggerFrame, fps, config: {stiffness: 260, damping: 18}});
          const opacity = interpolate(staggerFrame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});

          const fullyIn = staggerFrame > 25;
          const floatY = fullyIn ? Math.sin(frame * 0.055 + index * 0.9) * 5 : 0;

          return (
            <div key={index} style={{
              opacity,
              transform: `scale(${sc}) translateY(${floatY}px)`,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <Img
                src={src}
                style={{width: '100%', aspectRatio: '1 / 1', objectFit: 'contain'}}
              />
            </div>
          );
        })}
      </div>

      <Caption frame={frame} text="12 stickers, ready to send!" startFrame={125} />
    </AbsoluteFill>
  );
};
