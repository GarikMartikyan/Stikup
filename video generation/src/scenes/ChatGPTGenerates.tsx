import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from '../components/Caption';
import {ChatMock} from '../components/ChatMock';

export const ChatGPTGenerates: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Dots for first 42 frames, then grid
  const showDots = frame < 42;
  const dot = (offset: number) => Math.sin((frame + offset) * 0.4) * 6;

  const gridSp = spring({frame: Math.max(0, frame - 42), fps, config: {stiffness: 150, damping: 16}});
  const gridOpacity = interpolate(frame, [42, 55], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#212121'}}>
      <ChatMock>
        <div style={{padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 16}}>
          {/* User message (small) */}
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <div style={{borderRadius: 12, overflow: 'hidden', width: 90, opacity: 0.5}}>
              <Img src={staticFile('real_image.webp')} style={{width: '100%', height: 90, objectFit: 'cover', display: 'block'}} />
            </div>
          </div>

          {/* ChatGPT response */}
          <div style={{display: 'flex', gap: 12, alignItems: 'flex-start'}}>
            <div style={{
              width: 34, height: 34, background: '#10a37f', borderRadius: '50%', flexShrink: 0,
              marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M9 1.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm0 2.8a4.7 4.7 0 110 9.4 4.7 4.7 0 010-9.4zm0 1.8a2.9 2.9 0 100 5.8 2.9 2.9 0 000-5.8z"
                  fill="white"/>
              </svg>
            </div>

            {showDots ? (
              <div style={{
                background: '#2f2f2f', borderRadius: '4px 18px 18px 18px',
                padding: '16px 22px', display: 'flex', gap: 8, alignItems: 'center', marginTop: 4,
              }}>
                {[0, 6, 12].map((off, i) => (
                  <div key={i} style={{width: 10, height: 10, background: '#888', borderRadius: '50%', transform: `translateY(${dot(off)}px)`}} />
                ))}
              </div>
            ) : (
              <div style={{
                opacity: gridOpacity,
                transform: `scale(${0.84 + gridSp * 0.16})`,
                borderRadius: 16, overflow: 'hidden', width: 440,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <Img src={staticFile('anime/anime-styled.png')} style={{width: '100%', display: 'block'}} />
              </div>
            )}
          </div>
        </div>
      </ChatMock>

      <Caption frame={frame} text="ChatGPT generates your sticker sheet" startFrame={0} />
    </AbsoluteFill>
  );
};
