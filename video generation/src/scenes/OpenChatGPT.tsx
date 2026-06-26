import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AppScreen} from '../components/AppScreen';
import {Caption} from '../components/Caption';
import {Cursor} from '../components/Cursor';

export const OpenChatGPT: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const rippleProgress = interpolate(frame, [42, 72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rippleScale = rippleProgress * 4;
  const rippleOpacity = (1 - rippleProgress) * 0.5;

  return (
    <AbsoluteFill style={{background: '#0a0a0a'}}>
      <AppScreen frame={frame}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 44px',
          gap: 28,
          height: '100%',
        }}>
          {/* Prompt preview (dimmed) */}
          <div style={{
            background: '#1a1a1a',
            borderRadius: 18,
            padding: '22px 28px',
            border: '1px solid #2a2a2a',
            opacity: 0.35,
          }}>
            <div style={{fontSize: 16, color: '#888', fontFamily: 'system-ui', lineHeight: 1.5}}>
              Create a high-resolution sticker sheet in Disney 3D style — 12 stickers in a 4×3 grid...
            </div>
          </div>

          {/* Button row */}
          <div style={{display: 'flex', gap: 16, position: 'relative'}}>
            <div style={{
              flex: 1,
              border: '2px solid #2a2a2a',
              borderRadius: 100,
              padding: '20px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="5" width="10" height="12" rx="2" stroke="#666" strokeWidth="1.8"/>
                <rect x="3" y="3" width="10" height="12" rx="2" stroke="#666" strokeWidth="1.8" fill="#111"/>
              </svg>
              <div style={{fontSize: 18, color: '#666', fontWeight: 600, fontFamily: 'system-ui'}}>Copy Prompt</div>
            </div>

            <div style={{
              flex: 1,
              background: '#10a37f',
              borderRadius: 100,
              padding: '20px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                width: 48,
                height: 48,
                background: 'rgba(255,255,255,0.4)',
                borderRadius: '50%',
                transform: `scale(${rippleScale})`,
                opacity: rippleOpacity,
              }} />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 3H17M17 3V13M17 3L3 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{fontSize: 18, color: 'white', fontWeight: 600, fontFamily: 'system-ui'}}>Open ChatGPT</div>
            </div>
          </div>
        </div>
      </AppScreen>

      <Cursor
        frame={frame}
        fps={fps}
        fromX={160}
        fromY={820}
        toX={680}
        toY={820}
        clickFrame={42}
      />

      <Caption frame={frame} text="Open ChatGPT with one tap" startFrame={10} />
    </AbsoluteFill>
  );
};
