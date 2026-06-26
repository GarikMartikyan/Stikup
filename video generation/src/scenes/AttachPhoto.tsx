import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Caption} from '../components/Caption';
import {ChatMock} from '../components/ChatMock';

const PROMPT = "Create 12 Disney 3D style stickers from my photo — 4×3 grid, solid #00B140 green background, distinct facial expressions.";

export const AttachPhoto: React.FC = () => {
  const frame = useCurrentFrame();

  const photoOpacity = interpolate(frame, [18, 33], [0, 1], {extrapolateRight: 'clamp'});
  const photoY = interpolate(frame, [18, 33], [44, 0], {extrapolateRight: 'clamp'});

  const charsShown = Math.floor(
    interpolate(frame, [42, 112], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  const cursor = frame > 42 && charsShown < PROMPT.length && Math.floor(frame / 10) % 2 === 0 ? '|' : '';

  const sendOpacity = interpolate(frame, [116, 128], [0, 1], {extrapolateRight: 'clamp'});
  const inputOpacity = interpolate(frame, [128, 140], [1, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#212121'}}>
      <ChatMock>
        <div style={{padding: '0 36px', display: 'flex', flexDirection: 'column', gap: 20}}>
          <div style={{
            opacity: photoOpacity,
            transform: `translateY(${photoY}px)`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <div style={{borderRadius: 18, overflow: 'hidden', width: 260, boxShadow: '0 6px 24px rgba(0,0,0,0.5)'}}>
              <Img src={staticFile('real_image.webp')} style={{width: '100%', height: 260, objectFit: 'cover', display: 'block'}} />
            </div>
          </div>

          {frame >= 42 && (
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <div style={{
                background: '#10a37f',
                borderRadius: '20px 20px 5px 20px',
                padding: '16px 22px',
                maxWidth: 560,
                fontSize: 19,
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: 1.5,
              }}>
                {PROMPT.slice(0, charsShown)}{cursor}
              </div>
            </div>
          )}
        </div>
      </ChatMock>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 36px 32px',
        background: 'linear-gradient(to bottom, transparent, #212121 40%)',
        opacity: inputOpacity,
      }}>
        <div style={{
          background: '#2f2f2f',
          borderRadius: 100,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px 0 24px',
          gap: 12,
        }}>
          <div style={{flex: 1, fontSize: 17, color: '#555', fontFamily: 'system-ui'}}>Message ChatGPT</div>
          <div style={{
            width: 44,
            height: 44,
            background: '#10a37f',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: sendOpacity,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 11H19M19 11L13 5M19 11L13 17" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <Caption frame={frame} text="Attach your photo & send the prompt" startFrame={0} />
    </AbsoluteFill>
  );
};
