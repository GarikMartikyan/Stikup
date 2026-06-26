import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from '../components/Caption';
import {COLORS} from '../components/AppScreen';

const STICKERS = Array.from({length: 12}, (_, i) =>
  staticFile(`disney/disney-styled_${String(i + 1).padStart(2, '0')}.webp`)
);

export const StickersReady: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const titleY = interpolate(frame, [0, 12], [16, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: COLORS.bg, flexDirection: 'column', alignItems: 'center',
      padding: '56px 40px 130px',
    }}>
      <div style={{
        opacity: titleOpacity, transform: `translateY(${titleY}px)`,
        fontSize: 40, fontWeight: 900, color: COLORS.fg,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: 36, textAlign: 'center', letterSpacing: '-1px',
      }}>
        Your stickers are ready!
      </div>

      {/* 4×3 grid — staggered pop-in with 6-frame stagger */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: '100%'}}>
        {STICKERS.map((src, index) => {
          const sf = Math.max(0, frame - index * 6);
          const sc = spring({frame: sf, fps, config: {stiffness: 280, damping: 18}});
          const opacity = interpolate(sf, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
          const fullyIn = sf > 20;
          const floatY = fullyIn ? Math.sin(frame * 0.06 + index * 0.9) * 4 : 0;

          return (
            <div key={index} style={{opacity, transform: `scale(${sc}) translateY(${floatY}px)`, display: 'flex', justifyContent: 'center'}}>
              <Img src={src} style={{width: '100%', aspectRatio: '1 / 1', objectFit: 'contain'}} />
            </div>
          );
        })}
      </div>

      <Caption frame={frame} text="12 stickers, ready to send!" startFrame={80} />
    </AbsoluteFill>
  );
};
