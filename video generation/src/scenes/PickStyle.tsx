import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AppScreen, COLORS} from '../components/AppScreen';
import {Caption} from '../components/Caption';

const STYLES = [
  {id: 'chibi', name: 'Chibi', tagline: 'Cute & soft', img: staticFile('chibi/sticker_8.webp')},
  {id: 'disney3d', name: 'Disney 3D', tagline: 'Pixar-style 3D', img: staticFile('disney/disney-styled_08.webp')},
  {id: 'anime', name: 'Anime', tagline: 'Crisp cel-shaded', img: staticFile('anime/anime-styled_08.webp')},
  {id: 'pixel', name: 'Pixel', tagline: 'Retro 16-bit', img: staticFile('pixel/pixel-styled_08.webp')},
] as const;

export const PickStyle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Disney 3D tile highlights at frame 20
  const highlightSp = spring({frame: Math.max(0, frame - 20), fps, config: {stiffness: 240, damping: 18}});
  const isHighlighted = frame >= 20;
  const contentOpacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <AppScreen frame={frame}>
        <div style={{opacity: contentOpacity, padding: '36px 40px 24px', display: 'flex', flexDirection: 'column', gap: 24}}>
          {/* Header — real copy */}
          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.brand,
              fontFamily: 'system-ui',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              Step 01 of 03
            </div>
            <div style={{
              fontSize: 38,
              fontWeight: 900,
              color: COLORS.fg,
              fontFamily: 'system-ui',
              letterSpacing: '-1.5px',
              lineHeight: 1.05,
              marginBottom: 6,
            }}>
              Pick your style.
            </div>
            <div style={{fontSize: 17, color: COLORS.fgMuted, fontFamily: 'system-ui', lineHeight: 1.4}}>
              Choose an art style and we'll build the ChatGPT prompt for you.
            </div>
          </div>

          {/* 2×2 style grid */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
            {STYLES.map((style) => {
              const sel = style.id === 'disney3d' && isHighlighted;
              const sc = sel ? 0.97 + highlightSp * 0.03 : 1;
              return (
                <div key={style.id} style={{
                  background: sel ? `rgba(224,52,154,0.08)` : COLORS.bgElev,
                  border: `2px solid ${sel ? COLORS.brand : COLORS.borderStrong}`,
                  borderRadius: 20,
                  padding: '18px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  transform: `scale(${sc})`,
                  boxShadow: sel
                    ? `0 0 0 4px rgba(224,52,154,0.18), 0 8px 24px -6px rgba(224,52,154,0.3)`
                    : 'none',
                  position: 'relative',
                }}>
                  {sel && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 22, height: 22, background: COLORS.brand,
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4l2.5 2.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div style={{width: 118, height: 118, borderRadius: 12, overflow: 'hidden', background: COLORS.bgSunk, flexShrink: 0}}>
                    <Img src={style.img} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: 18, fontWeight: 700, color: sel ? COLORS.brand : COLORS.fg, fontFamily: 'system-ui'}}>
                      {style.name}
                    </div>
                    <div style={{fontSize: 13, color: COLORS.fgMuted, fontFamily: 'system-ui', marginTop: 2}}>
                      {style.tagline}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppScreen>
      <Caption frame={frame} text="Pick your art style" startFrame={0} />
    </AbsoluteFill>
  );
};
