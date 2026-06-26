import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AppScreen} from '../components/AppScreen';
import {Caption} from '../components/Caption';

export const UploadGrid: React.FC = () => {
  const frame = useCurrentFrame();

  const gridY = interpolate(frame, [28, 52], [-240, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gridOpacity = interpolate(frame, [28, 44], [0, 1], {extrapolateRight: 'clamp'});

  const borderGlow = frame >= 28 && frame <= 80
    ? interpolate(frame, [28, 54, 80], [0, 1, 0.3], {extrapolateRight: 'clamp'})
    : frame > 80 ? 0.3 : 0;

  const progressPct = interpolate(frame, [62, 112], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#0a0a0a'}}>
      <AppScreen frame={frame}>
        <div style={{padding: '44px 44px 0', display: 'flex', flexDirection: 'column', gap: 20}}>
          <div>
            <div style={{fontSize: 15, fontWeight: 700, color: '#10a37f', fontFamily: 'system-ui', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8}}>
              Step 2
            </div>
            <div style={{fontSize: 38, fontWeight: 800, color: '#fff', fontFamily: 'system-ui', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 6}}>
              Upload your grid
            </div>
            <div style={{fontSize: 19, color: '#666', fontFamily: 'system-ui'}}>
              Paste the image ChatGPT generated
            </div>
          </div>

          <div style={{
            border: `2px dashed rgba(16,163,127,${0.25 + borderGlow * 0.75})`,
            borderRadius: 24,
            minHeight: 380,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `rgba(16,163,127,${0.02 + borderGlow * 0.06})`,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: `0 0 ${borderGlow * 50}px rgba(16,163,127,0.15)`,
          }}>
            {frame < 28 ? (
              <div style={{textAlign: 'center', padding: '0 40px'}}>
                <div style={{fontSize: 52, marginBottom: 16}}>⬆️</div>
                <div style={{fontSize: 20, color: '#555', fontFamily: 'system-ui'}}>
                  Drop your sticker grid here
                </div>
              </div>
            ) : (
              <div style={{
                opacity: gridOpacity,
                transform: `translateY(${gridY}px)`,
                width: '100%',
              }}>
                <Img src={staticFile('disney/disney-styled.png')} style={{width: '100%', display: 'block'}} />
              </div>
            )}
          </div>

          {frame >= 62 && (
            <div style={{height: 8, background: '#1a1a1a', borderRadius: 100, overflow: 'hidden'}}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #10a37f 0%, #0fcf9f 100%)',
                borderRadius: 100,
              }} />
            </div>
          )}
        </div>
      </AppScreen>

      <Caption frame={frame} text="Upload the grid to Stikup" startFrame={0} />
    </AbsoluteFill>
  );
};
