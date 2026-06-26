import React from 'react';

interface ChatMockProps {
  children: React.ReactNode;
}

export const ChatMock: React.FC<ChatMockProps> = ({children}) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#212121',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        height: 64,
        background: '#171717',
        display: 'flex',
        alignItems: 'center',
        padding: '0 36px',
        borderBottom: '1px solid #2e2e2e',
        flexShrink: 0,
        gap: 12,
      }}>
        <div style={{
          width: 36,
          height: 36,
          background: '#10a37f',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
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
        <div style={{fontSize: 20, fontWeight: 600, color: '#fff', fontFamily: 'system-ui'}}>ChatGPT</div>
        <div style={{marginLeft: 'auto', fontSize: 14, color: '#888', fontFamily: 'system-ui'}}>GPT-4o</div>
      </div>

      {/* Messages */}
      <div style={{flex: 1, padding: '28px 0', position: 'relative'}}>
        {children}
      </div>
    </div>
  );
};
