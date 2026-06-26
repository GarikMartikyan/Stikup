import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from '../components/Caption';
import {ChatMock} from '../components/ChatMock';

export const ChatGPTGenerates: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const showDots = frame < 68;

  const dot = (offset: number) => Math.sin((frame + offset) * 0.35) * 7;

  const gridSpring = spring({frame: Math.max(0, frame - 68), fps, config: {stiffness: 140, damping: 16}});
  const gridOpacity = interpolate(frame, [68, 84], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#212121'}}>
      <ChatMock>
        <div style={{padding: '0 36px', display: 'flex', flexDirection: 'column', gap: 20}}>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <div style={{borderRadius: 14, overflow: 'hidden', width: 100, opacity: 0.55}}>
              <Img src={staticFile('real_image.webp')} style={{width: '100%', height: 100, objectFit: 'cover', display: 'block'}} />
            </div>
          </div>

          <div style={{display: 'flex', gap: 14, alignItems: 'flex-start'}}>
            <div style={{
              width: 38,
              height: 38,
              background: '#10a37f',
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a5 5 0 110 10A5 5 0 0110 5zm0 2a3 3 0 100 6 3 3 0 000-6z"
                  fill="white"
                />
              </svg>
            </div>

            {showDots ? (
              <div style={{
                background: '#2f2f2f',
                borderRadius: '5px 20px 20px 20px',
                padding: '18px 26px',
                display: 'flex',
                gap: 9,
                alignItems: 'center',
                marginTop: 4,
              }}>
                {[0, 6, 12].map((offset, i) => (
                  <div key={i} style={{
                    width: 11,
                    height: 11,
                    background: '#888',
                    borderRadius: '50%',
                    transform: `translateY(${dot(offset)}px)`,
                  }} />
                ))}
              </div>
            ) : (
              <div style={{
                opacity: gridOpacity,
                transform: `scale(${0.82 + gridSpring * 0.18})`,
                borderRadius: 18,
                overflow: 'hidden',
                width: 460,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <Img
                  src={staticFile('anime/anime-styled.png')}
                  style={{width: '100%', display: 'block'}}
                />
              </div>
            )}
          </div>
        </div>
      </ChatMock>

      <Caption frame={frame} text="ChatGPT generates your sticker sheet" startFrame={0} />
    </AbsoluteFill>
  );
};
