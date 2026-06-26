import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AppScreen, COLORS} from '../components/AppScreen';
import {Caption} from '../components/Caption';
import {Cursor} from '../components/Cursor';

export const OpenChatGPT: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Click at frame 28, ripple through frame 48
  const rippleProgress = interpolate(frame, [28, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rippleScale = rippleProgress * 4;
  const rippleOpacity = (1 - rippleProgress) * 0.45;
  const contentOpacity = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <AppScreen frame={frame}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 40px', gap: 24, height: '100%',
        }}>
          {/* Prompt area — dimmed, shows style label */}
          <div style={{
            background: COLORS.bgElev,
            borderRadius: 16,
            padding: '18px 24px',
            border: `1px solid ${COLORS.border}`,
            opacity: contentOpacity * 0.4,
          }}>
            <div style={{fontSize: 11, fontWeight: 700, color: COLORS.brand, fontFamily: 'system-ui', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6}}>
              Your ChatGPT prompt — Disney 3D
            </div>
            <div style={{fontSize: 15, color: COLORS.fgMuted, fontFamily: 'system-ui', lineHeight: 1.5}}>
              Create a high-resolution sticker sheet based on the provided character image. Render the character as a polished 3D animated movie character in the style of modern Disney·Pixar films…
            </div>
          </div>

          {/* Buttons — real Stikup styling */}
          <div style={{opacity: contentOpacity, display: 'flex', flexDirection: 'column', gap: 12}}>
            {/* Copy prompt — outline */}
            <div style={{
              border: `2px solid ${COLORS.borderStrong}`,
              borderRadius: 100,
              padding: '18px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="4" y="4" width="10" height="11" rx="2" stroke={COLORS.fgMuted} strokeWidth="1.6"/>
                <rect x="2" y="2" width="10" height="11" rx="2" stroke={COLORS.fgMuted} strokeWidth="1.6" fill={COLORS.bg}/>
              </svg>
              <div style={{fontSize: 17, color: COLORS.fgMuted, fontWeight: 600, fontFamily: 'system-ui'}}>Copy prompt</div>
            </div>

            {/* Open ChatGPT — green (ChatGPT brand color) */}
            <div style={{
              background: '#10a37f',
              borderRadius: 100,
              padding: '18px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                width: 48, height: 48,
                background: 'rgba(255,255,255,0.35)',
                borderRadius: '50%',
                transform: `scale(${rippleScale})`,
                opacity: rippleOpacity,
              }} />
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M6 2H16M16 2V12M16 2L2 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{fontSize: 17, color: 'white', fontWeight: 700, fontFamily: 'system-ui'}}>Open ChatGPT</div>
            </div>
          </div>
        </div>
      </AppScreen>

      <Cursor frame={frame} fps={fps} fromX={180} fromY={880} toX={540} toY={880} clickFrame={28} />
      <Caption frame={frame} text="Open ChatGPT with one tap" startFrame={8} />
    </AbsoluteFill>
  );
};
