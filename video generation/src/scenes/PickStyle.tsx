import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AppScreen} from '../components/AppScreen';
import {Caption} from '../components/Caption';

const STYLES = [
  {id: 'chibi', name: 'Chibi', tagline: 'Cute & soft', img: null},
  {id: 'disney3d', name: 'Disney 3D', tagline: 'Pixar-style 3D', img: staticFile('disney/disney-styled_08.webp')},
  {id: 'anime', name: 'Anime', tagline: 'Crisp cel-shaded', img: null},
  {id: 'pixel', name: 'Pixel', tagline: 'Retro 16-bit', img: null},
] as const;

export const PickStyle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const highlightFrame = Math.max(0, frame - 30);
  const highlightSpring = spring({frame: highlightFrame, fps, config: {stiffness: 220, damping: 18}});
  const isHighlighted = frame >= 30;
  const contentOpacity = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#0a0a0a'}}>
      <AppScreen frame={frame}>
        <div style={{opacity: contentOpacity, padding: '44px 44px 28px', display: 'flex', flexDirection: 'column', gap: 28}}>
          <div>
            <div style={{fontSize: 15, fontWeight: 700, color: '#10a37f', fontFamily: 'system-ui', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8}}>
              Step 1
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#fff', fontFamily: 'system-ui', letterSpacing: '-1px', lineHeight: 1.1}}>
              Pick your style
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
            {STYLES.map((style) => {
              const selected = style.id === 'disney3d' && isHighlighted;
              const sc = selected ? 0.96 + highlightSpring * 0.04 : 1;
              return (
                <div key={style.id} style={{
                  background: selected ? 'rgba(16,163,127,0.1)' : '#1a1a1a',
                  border: `2px solid ${selected ? '#10a37f' : '#2a2a2a'}`,
                  borderRadius: 22,
                  padding: '22px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  transform: `scale(${sc})`,
                  boxShadow: selected
                    ? '0 0 0 4px rgba(16,163,127,0.2), 0 8px 24px -6px rgba(16,163,127,0.35)'
                    : 'none',
                  position: 'relative',
                }}>
                  {selected && (
                    <div style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      width: 24,
                      height: 24,
                      background: '#10a37f',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4.5l3 3L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div style={{width: 130, height: 130, borderRadius: 14, overflow: 'hidden', background: '#2a2a2a', flexShrink: 0}}>
                    {style.img && (
                      <Img src={style.img} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    )}
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: 20, fontWeight: 700, color: selected ? '#10a37f' : '#fff', fontFamily: 'system-ui'}}>
                      {style.name}
                    </div>
                    <div style={{fontSize: 15, color: '#777', fontFamily: 'system-ui', marginTop: 3}}>
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
