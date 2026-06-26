import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Caption} from '../components/Caption';
import {ChatMock} from '../components/ChatMock';

const PROMPT = "Create 12 Disney 3D style stickers from my photo — 4×3 grid, green #00B140 background, 12 distinct expressions.";

export const AttachPhoto: React.FC = () => {
  const frame = useCurrentFrame();

  // Photo slides up at frame 12
  const photoOpacity = interpolate(frame, [12, 22], [0, 1], {extrapolateRight: 'clamp'});
  const photoY = interpolate(frame, [12, 22], [40, 0], {extrapolateRight: 'clamp'});

  // Prompt types frame 28–72
  const charsShown = Math.floor(
    interpolate(frame, [28, 72], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  const cursor = frame > 28 && charsShown < PROMPT.length && Math.floor(frame / 8) % 2 === 0 ? '|' : '';

  // Send button
  const sendOpacity = interpolate(frame, [74, 82], [0, 1], {extrapolateRight: 'clamp'});
  const inputOpacity = interpolate(frame, [82, 90], [1, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#212121'}}>
      <ChatMock>
        <div style={{padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 18}}>
          {/* Photo attachment bubble */}
          <div style={{opacity: photoOpacity, transform: `translateY(${photoY}px)`, display: 'flex', justifyContent: 'flex-end'}}>
            <div style={{borderRadius: 16, overflow: 'hidden', width: 240, boxShadow: '0 6px 24px rgba(0,0,0,0.5)'}}>
              <Img src={staticFile('real_image.webp')} style={{width: '100%', height: 240, objectFit: 'cover', display: 'block'}} />
            </div>
          </div>

          {/* Prompt bubble */}
          {frame >= 28 && (
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <div style={{
                background: '#10a37f',
                borderRadius: '18px 18px 4px 18px',
                padding: '14px 20px',
                maxWidth: 520,
                fontSize: 18,
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

      {/* Input bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 32px 28px',
        background: 'linear-gradient(to bottom, transparent, #212121 40%)',
        opacity: inputOpacity,
      }}>
        <div style={{
          background: '#2f2f2f', borderRadius: 100, height: 56,
          display: 'flex', alignItems: 'center', padding: '0 10px 0 22px', gap: 10,
        }}>
          <div style={{flex: 1, fontSize: 16, color: '#555', fontFamily: 'system-ui'}}>Message ChatGPT</div>
          <div style={{
            width: 40, height: 40, background: '#10a37f', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sendOpacity,
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10H17M17 10L12 5M17 10L12 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <Caption frame={frame} text="Attach your photo & send" startFrame={0} />
    </AbsoluteFill>
  );
};
