import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AppScreen, COLORS} from '../components/AppScreen';
import {Caption} from '../components/Caption';

export const UploadGrid: React.FC = () => {
  const frame = useCurrentFrame();

  // Grid drops in at frame 18
  const gridY = interpolate(frame, [18, 36], [-220, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gridOpacity = interpolate(frame, [18, 30], [0, 1], {extrapolateRight: 'clamp'});

  // Border glow when grid arrives
  const glow = frame >= 18 && frame <= 55
    ? interpolate(frame, [18, 36, 55], [0, 1, 0.3], {extrapolateRight: 'clamp'})
    : frame > 55 ? 0.3 : 0;

  // Progress bar frame 40 → 70
  const progress = interpolate(frame, [40, 70], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const contentOpacity = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <AppScreen frame={frame}>
        <div style={{padding: '36px 40px 0', display: 'flex', flexDirection: 'column', gap: 18, opacity: contentOpacity}}>
          {/* Header — real copy */}
          <div>
            <div style={{fontSize: 13, fontWeight: 700, color: COLORS.brand, fontFamily: 'system-ui', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6}}>
              Step 02 of 03
            </div>
            <div style={{fontSize: 36, fontWeight: 900, color: COLORS.fg, fontFamily: 'system-ui', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 4}}>
              Upload your ChatGPT grid.
            </div>
            <div style={{fontSize: 16, color: COLORS.fgMuted, fontFamily: 'system-ui', lineHeight: 1.4}}>
              Paste the 4×3 grid image ChatGPT generated — we'll create all 12 stickers automatically.
            </div>
          </div>

          {/* Drop zone */}
          <div style={{
            border: `2px dashed rgba(224,52,154,${0.2 + glow * 0.8})`,
            borderRadius: 22,
            minHeight: 340,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `rgba(224,52,154,${0.015 + glow * 0.05})`,
            overflow: 'hidden', position: 'relative',
            boxShadow: glow > 0.1 ? `0 0 ${glow * 40}px rgba(224,52,154,0.12)` : 'none',
          }}>
            {frame < 18 ? (
              <div style={{textAlign: 'center', padding: '0 36px'}}>
                {/* Upload icon — matches real DropZone */}
                <div style={{
                  width: 72, height: 72,
                  background: `linear-gradient(135deg, ${COLORS.brand}, #ff5e72, ${COLORS.brand2})`,
                  borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: `0 0 32px rgba(224,52,154,0.4)`,
                }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="4" width="24" height="18" rx="3" stroke="white" strokeWidth="2"/>
                    <circle cx="11" cy="11" r="2.5" fill="white"/>
                    <path d="M4 18l6-6 5 5 4-4 9 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{fontSize: 20, fontWeight: 700, color: COLORS.fg, fontFamily: 'system-ui', marginBottom: 4}}>
                  Drop the grid image or tap to pick
                </div>
                <div style={{fontSize: 14, color: COLORS.fgMuted, fontFamily: 'system-ui'}}>JPEG · PNG · up to 8 MB</div>
              </div>
            ) : (
              <div style={{opacity: gridOpacity, transform: `translateY(${gridY}px)`, width: '100%'}}>
                <Img src={staticFile('disney/disney-styled.png')} style={{width: '100%', display: 'block'}} />
              </div>
            )}
          </div>

          {/* Progress bar */}
          {frame >= 40 && (
            <div style={{height: 6, background: COLORS.bgElev, borderRadius: 100, overflow: 'hidden'}}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: `linear-gradient(90deg, ${COLORS.brand}, #ff5e72, ${COLORS.brand2})`,
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
