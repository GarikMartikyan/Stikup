# Remotion "How to Create Stickers" Video — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 9:16 vertical Remotion video (~33s) showing how to create a Telegram sticker pack with Stikup — 8 animated scenes, all mock UI, no screen recordings.

**Architecture:** Single `HowToVideo` Remotion composition (1080×1920, 30fps, 990 frames) sequenced with `<Series>`. Eight scene components in `src/scenes/`, four shared components in `src/components/`. Assets copied from `../frontend/public/assets/` into `public/`.

**Tech Stack:** Remotion 4.0.x, React 18, TypeScript 5

## Global Constraints

- Working directory for all commands: `video generation/` (contains spaces — always quote in shell: `"video generation"`)
- Remotion version: `4.0.484` (already installed globally, pin exact in package.json)
- Composition: id=`HowToVideo`, width=1080, height=1920, fps=30, durationInFrames=990
- Brand green: `#10a37f` — used for buttons, accents, brand
- Dark background: `#0a0a0a`
- Font: `system-ui, -apple-system, sans-serif` (no external fonts)
- All asset paths use `staticFile('...')` from `remotion`
- No audio

---

## File Map

| File                              | Purpose                                         |
| --------------------------------- | ----------------------------------------------- |
| `package.json`                    | deps + scripts                                  |
| `tsconfig.json`                   | TS config                                       |
| `remotion.config.ts`              | Remotion config                                 |
| `src/index.ts`                    | Entry point — `registerRoot`                    |
| `src/Root.tsx`                    | Registers `HowToVideo` composition              |
| `src/HowToVideo.tsx`              | `<Series>` of all 8 scenes                      |
| `src/components/Caption.tsx`      | Animated bottom caption bar                     |
| `src/components/AppScreen.tsx`    | Phone-frame wrapper with status bar             |
| `src/components/ChatMock.tsx`     | Simplified ChatGPT UI chrome                    |
| `src/components/Cursor.tsx`       | Animated SVG cursor with click ripple           |
| `src/scenes/Intro.tsx`            | Scene 1 — logo + tagline                        |
| `src/scenes/PickStyle.tsx`        | Scene 2 — style picker mock                     |
| `src/scenes/OpenChatGPT.tsx`      | Scene 3 — button click                          |
| `src/scenes/AttachPhoto.tsx`      | Scene 4 — ChatGPT photo attach                  |
| `src/scenes/ChatGPTGenerates.tsx` | Scene 5 — ChatGPT response                      |
| `src/scenes/UploadGrid.tsx`       | Scene 6 — Stikup upload                         |
| `src/scenes/StickersReady.tsx`    | Scene 7 — sticker reveal grid                   |
| `src/scenes/Outro.tsx`            | Scene 8 — stikup.app CTA                        |
| `public/`                         | Assets copied from `../frontend/public/assets/` |

---

## Task 1: Project Scaffold + Assets

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `remotion.config.ts`
- Create: `src/index.ts`
- Create: `public/` (asset copy)

- [ ] **Step 1: Create directory structure**

```bash
cd "/Users/garikmartikyan03gmail.com/Desktop/stickup-beta/video generation"
mkdir -p src/scenes src/components public/disney public/anime
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "stikup-video",
  "version": "1.0.0",
  "scripts": {
    "studio": "remotion studio src/index.ts",
    "render": "remotion render HowToVideo out/how-to.mp4 --overwrite",
    "gif": "ffmpeg -i out/how-to.mp4 -vf 'fps=15,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse' -loop 0 out/how-to.gif"
  },
  "dependencies": {
    "@remotion/cli": "4.0.484",
    "@remotion/renderer": "4.0.484",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "4.0.484"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create remotion.config.ts**

```typescript
import { Config } from '@remotion/cli/config';

Config.overwriteOutput(true);
```

- [ ] **Step 5: Copy assets**

```bash
cp ../frontend/public/assets/real_image.webp public/
cp ../frontend/public/assets/anime/anime-styled.png public/anime/
cp ../frontend/public/assets/disney/disney-styled.png public/disney/
cp ../frontend/public/assets/disney/disney-styled_08.webp public/disney/
for i in $(seq -w 01 12); do
  cp "../frontend/public/assets/disney/disney-styled_${i}.webp" public/disney/
done
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Commit**

```bash
git add "video generation/package.json" "video generation/tsconfig.json" "video generation/remotion.config.ts" "video generation/public"
git commit -m "feat(video): scaffold Remotion project + copy assets"
```

---

## Task 2: Root, Entry Point, HowToVideo, Scene Stubs

**Files:**

- Create: `src/index.ts`
- Create: `src/Root.tsx`
- Create: `src/HowToVideo.tsx`
- Create: all 8 `src/scenes/*.tsx` (stubs)

**Interfaces:**

- Produces: `HowToVideo` composition renderable in Remotion Studio

- [ ] **Step 1: Create src/index.ts**

```typescript
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

- [ ] **Step 2: Create src/Root.tsx**

```typescript
import React from 'react';
import {Composition} from 'remotion';
import {HowToVideo} from './HowToVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HowToVideo"
      component={HowToVideo}
      durationInFrames={990}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
```

- [ ] **Step 3: Create scene stubs** — each scene is a colored placeholder; replace in later tasks.

Create `src/scenes/Intro.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const Intro: React.FC = () => (
  <AbsoluteFill style={{background: '#1a1a2e', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 1: Intro</div>
  </AbsoluteFill>
);
```

Create `src/scenes/PickStyle.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const PickStyle: React.FC = () => (
  <AbsoluteFill style={{background: '#2a1a2e', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 2: Pick Style</div>
  </AbsoluteFill>
);
```

Create `src/scenes/OpenChatGPT.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const OpenChatGPT: React.FC = () => (
  <AbsoluteFill style={{background: '#1a2a1e', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 3: Open ChatGPT</div>
  </AbsoluteFill>
);
```

Create `src/scenes/AttachPhoto.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const AttachPhoto: React.FC = () => (
  <AbsoluteFill style={{background: '#1a2a2e', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 4: Attach Photo</div>
  </AbsoluteFill>
);
```

Create `src/scenes/ChatGPTGenerates.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const ChatGPTGenerates: React.FC = () => (
  <AbsoluteFill style={{background: '#2e2a1a', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 5: ChatGPT Generates</div>
  </AbsoluteFill>
);
```

Create `src/scenes/UploadGrid.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const UploadGrid: React.FC = () => (
  <AbsoluteFill style={{background: '#1a2e2a', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 6: Upload Grid</div>
  </AbsoluteFill>
);
```

Create `src/scenes/StickersReady.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const StickersReady: React.FC = () => (
  <AbsoluteFill style={{background: '#2e1a1a', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 7: Stickers Ready</div>
  </AbsoluteFill>
);
```

Create `src/scenes/Outro.tsx`:

```typescript
import React from 'react';
import {AbsoluteFill} from 'remotion';
export const Outro: React.FC = () => (
  <AbsoluteFill style={{background: '#2e2e1a', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{color: '#fff', fontSize: 48, fontFamily: 'system-ui'}}>Scene 8: Outro</div>
  </AbsoluteFill>
);
```

- [ ] **Step 4: Create src/HowToVideo.tsx**

```typescript
import React from 'react';
import {Series} from 'remotion';
import {Intro} from './scenes/Intro';
import {PickStyle} from './scenes/PickStyle';
import {OpenChatGPT} from './scenes/OpenChatGPT';
import {AttachPhoto} from './scenes/AttachPhoto';
import {ChatGPTGenerates} from './scenes/ChatGPTGenerates';
import {UploadGrid} from './scenes/UploadGrid';
import {StickersReady} from './scenes/StickersReady';
import {Outro} from './scenes/Outro';

export const HowToVideo: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={90}><Intro /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><PickStyle /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><OpenChatGPT /></Series.Sequence>
      <Series.Sequence durationInFrames={150}><AttachPhoto /></Series.Sequence>
      <Series.Sequence durationInFrames={150}><ChatGPTGenerates /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><UploadGrid /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><StickersReady /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><Outro /></Series.Sequence>
    </Series>
  );
};
```

- [ ] **Step 5: Verify studio opens**

```bash
cd "/Users/garikmartikyan03gmail.com/Desktop/stickup-beta/video generation"
npx remotion studio src/index.ts
```

Expected: browser opens at `http://localhost:3000`, composition `HowToVideo` visible, all 8 colored stubs visible in timeline.

- [ ] **Step 6: Commit**

```bash
git add "video generation/src"
git commit -m "feat(video): add HowToVideo composition with scene stubs"
```

---

## Task 3: Shared Components

**Files:**

- Create: `src/components/Caption.tsx`
- Create: `src/components/AppScreen.tsx`
- Create: `src/components/ChatMock.tsx`
- Create: `src/components/Cursor.tsx`

**Interfaces:**

- `Caption`: `({ frame, text, startFrame? }: { frame: number; text: string; startFrame?: number }) => JSX.Element`
- `AppScreen`: `({ frame, children }: { frame: number; children: React.ReactNode }) => JSX.Element`
- `ChatMock`: `({ children }: { children: React.ReactNode }) => JSX.Element`
- `Cursor`: `({ frame, fps, fromX, fromY, toX, toY, clickFrame }: CursorProps) => JSX.Element`

- [ ] **Step 1: Create src/components/Caption.tsx**

```typescript
import React from 'react';
import {interpolate} from 'remotion';

interface CaptionProps {
  frame: number;
  text: string;
  startFrame?: number;
}

export const Caption: React.FC<CaptionProps> = ({frame, text, startFrame = 0}) => {
  const f = Math.max(0, frame - startFrame);
  const opacity = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const y = interpolate(f, [0, 12], [30, 0], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      opacity,
      transform: `translateY(${y}px)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.75)',
        borderRadius: 100,
        padding: '18px 44px',
        fontSize: 34,
        fontWeight: 600,
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        maxWidth: 900,
        lineHeight: 1.3,
      }}>
        {text}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create src/components/AppScreen.tsx**

```typescript
import React from 'react';
import {interpolate} from 'remotion';

interface AppScreenProps {
  frame: number;
  children: React.ReactNode;
}

export const AppScreen: React.FC<AppScreenProps> = ({frame, children}) => {
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#111111',
      opacity,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 48,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{fontSize: 16, color: '#fff', fontWeight: 600, fontFamily: 'system-ui'}}>9:41</div>
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
            <rect x="0" y="4" width="3" height="8" rx="1"/>
            <rect x="5" y="2" width="3" height="10" rx="1"/>
            <rect x="10" y="0" width="3" height="12" rx="1"/>
            <rect x="15" y="3" width="2" height="6" rx="1" opacity="0.4"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="0.5" y="0.5" width="13" height="11" rx="2.5" stroke="white" strokeOpacity="0.4"/>
            <rect x="2" y="2" width="9" height="8" rx="1.5" fill="white"/>
            <path d="M15 4.5V7.5" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Nav bar */}
      <div style={{
        height: 56,
        padding: '0 44px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #1e1e1e',
        flexShrink: 0,
      }}>
        <div style={{fontSize: 22, fontWeight: 800, color: '#10a37f', fontFamily: 'system-ui', letterSpacing: '-0.5px'}}>
          Stikup
        </div>
      </div>

      {/* Content */}
      <div style={{flex: 1, overflow: 'hidden'}}>
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create src/components/ChatMock.tsx**

```typescript
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
            <path fillRule="evenodd" clipRule="evenodd"
              d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a5 5 0 110 10A5 5 0 0110 5zm0 2a3 3 0 100 6 3 3 0 000-6z"
              fill="white"/>
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
```

- [ ] **Step 4: Create src/components/Cursor.tsx**

```typescript
import React from 'react';
import {interpolate, spring} from 'remotion';

interface CursorProps {
  frame: number;
  fps: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  clickFrame: number;
}

export const Cursor: React.FC<CursorProps> = ({frame, fps, fromX, fromY, toX, toY, clickFrame}) => {
  const progress = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress;

  const clickSp = spring({
    frame: Math.max(0, frame - clickFrame),
    fps,
    config: {stiffness: 500, damping: 25},
  });
  const clickScale = frame >= clickFrame ? 1 - clickSp * 0.25 + 0.25 : 1;

  const rippleOpacity = frame >= clickFrame
    ? interpolate(frame, [clickFrame, clickFrame + 25], [0.6, 0], {extrapolateRight: 'clamp'})
    : 0;
  const rippleScale = frame >= clickFrame
    ? interpolate(frame, [clickFrame, clickFrame + 25], [0.5, 3], {extrapolateRight: 'clamp'})
    : 0;

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      pointerEvents: 'none',
      transform: `scale(${clickScale})`,
    }}>
      {/* Click ripple */}
      <div style={{
        position: 'absolute',
        left: -20,
        top: -20,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)',
        transform: `scale(${rippleScale})`,
        opacity: rippleOpacity,
      }} />
      {/* Cursor SVG */}
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 3L4 36L13 27L22 41L27 38.5L18 24.5L32 24.5L4 3Z"
          fill="white"
          stroke="#222"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
```

- [ ] **Step 5: Verify studio still opens cleanly** (no import needed yet, just check no TS errors)

```bash
cd "/Users/garikmartikyan03gmail.com/Desktop/stickup-beta/video generation"
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add "video generation/src/components"
git commit -m "feat(video): add shared Caption, AppScreen, ChatMock, Cursor components"
```

---

## Task 4: Scene 1 (Intro) + Scene 8 (Outro)

**Files:**

- Modify: `src/scenes/Intro.tsx`
- Modify: `src/scenes/Outro.tsx`

**Interfaces:**

- Consumes: `Caption` from `../components/Caption`

- [ ] **Step 1: Replace src/scenes/Intro.tsx**

```typescript
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({frame, fps, config: {stiffness: 150, damping: 15}});
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const barWidth = interpolate(frame, [15, 40], [0, 60], {extrapolateRight: 'clamp'});
  const taglineOpacity = interpolate(frame, [22, 42], [0, 1], {extrapolateRight: 'clamp'});
  const taglineY = interpolate(frame, [22, 42], [24, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 45%, #1c1c1c 0%, #0a0a0a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: 28,
    }}>
      <div style={{
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 108,
          fontWeight: 900,
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-4px',
          lineHeight: 1,
        }}>
          Stikup
        </div>
        <div style={{
          height: 5,
          width: barWidth,
          background: '#10a37f',
          borderRadius: 3,
          margin: '16px auto 0',
        }} />
      </div>

      <div style={{
        opacity: taglineOpacity,
        transform: `translateY(${taglineY}px)`,
        textAlign: 'center',
        padding: '0 100px',
      }}>
        <div style={{
          fontSize: 34,
          color: '#aaaaaa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: 1.45,
          fontWeight: 400,
        }}>
          Turn your photos into<br />Telegram stickers
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Replace src/scenes/Outro.tsx**

```typescript
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({frame, fps, config: {stiffness: 150, damping: 15}});
  const urlOpacity = interpolate(frame, [20, 38], [0, 1], {extrapolateRight: 'clamp'});
  const ctaOpacity = interpolate(frame, [38, 58], [0, 1], {extrapolateRight: 'clamp'});
  const ctaY = interpolate(frame, [38, 58], [32, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at 50% 45%, #1c1c1c 0%, #0a0a0a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: 36,
    }}>
      <div style={{transform: `scale(${logoScale})`, textAlign: 'center'}}>
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-3px',
          lineHeight: 1,
        }}>
          Stikup
        </div>
        <div style={{width: 48, height: 5, background: '#10a37f', borderRadius: 3, margin: '12px auto 0'}} />
      </div>

      <div style={{opacity: urlOpacity, fontSize: 30, color: '#10a37f', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.5px'}}>
        stikup.app
      </div>

      <div style={{opacity: ctaOpacity, transform: `translateY(${ctaY}px)`}}>
        <div style={{
          background: '#10a37f',
          borderRadius: 100,
          padding: '24px 64px',
          fontSize: 30,
          fontWeight: 700,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.3px',
        }}>
          Make yours free →
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Preview scenes 1 and 8 in studio — verify animations play smoothly**

Open Remotion Studio, scrub through frames 0–89 (Intro) and frames 900–989 (Outro).

- [ ] **Step 4: Commit**

```bash
git add "video generation/src/scenes/Intro.tsx" "video generation/src/scenes/Outro.tsx"
git commit -m "feat(video): implement Intro and Outro scenes"
```

---

## Task 5: Scene 2 (PickStyle) + Scene 3 (OpenChatGPT)

**Files:**

- Modify: `src/scenes/PickStyle.tsx`
- Modify: `src/scenes/OpenChatGPT.tsx`

**Interfaces:**

- Consumes: `AppScreen` from `../components/AppScreen`, `Caption` from `../components/Caption`, `Cursor` from `../components/Cursor`
- Consumes asset: `staticFile('disney/disney-styled_08.webp')` for Disney tile preview

- [ ] **Step 1: Replace src/scenes/PickStyle.tsx**

```typescript
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
          {/* Header */}
          <div>
            <div style={{fontSize: 15, fontWeight: 700, color: '#10a37f', fontFamily: 'system-ui', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8}}>
              Step 1
            </div>
            <div style={{fontSize: 40, fontWeight: 800, color: '#fff', fontFamily: 'system-ui', letterSpacing: '-1px', lineHeight: 1.1}}>
              Pick your style
            </div>
          </div>

          {/* 2×2 grid */}
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
```

- [ ] **Step 2: Replace src/scenes/OpenChatGPT.tsx**

```typescript
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AppScreen} from '../components/AppScreen';
import {Caption} from '../components/Caption';
import {Cursor} from '../components/Cursor';

export const OpenChatGPT: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Ripple after click at frame 42
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
              Create a high-resolution sticker sheet in Disney 3D style...
            </div>
          </div>

          {/* Button row */}
          <div style={{display: 'flex', gap: 16, position: 'relative'}}>
            {/* Copy Prompt */}
            <div style={{
              flex: 1,
              border: '2px solid #2a2a2a',
              borderRadius: 100,
              padding: '20px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'transparent',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="5" width="10" height="12" rx="2" stroke="#666" strokeWidth="1.8"/>
                <rect x="3" y="3" width="10" height="12" rx="2" stroke="#666" strokeWidth="1.8" fill="#111"/>
              </svg>
              <div style={{fontSize: 18, color: '#666', fontWeight: 600, fontFamily: 'system-ui'}}>Copy Prompt</div>
            </div>

            {/* Open ChatGPT */}
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

      {/* Cursor positioned over "Open ChatGPT" button */}
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
```

- [ ] **Step 3: Preview scenes 2 (frames 90–209) and 3 (frames 210–299) in Remotion Studio**

Verify: Disney 3D tile highlights, cursor moves and clicks with ripple.

- [ ] **Step 4: Commit**

```bash
git add "video generation/src/scenes/PickStyle.tsx" "video generation/src/scenes/OpenChatGPT.tsx"
git commit -m "feat(video): implement PickStyle and OpenChatGPT scenes"
```

---

## Task 6: Scene 4 (AttachPhoto) + Scene 5 (ChatGPTGenerates)

**Files:**

- Modify: `src/scenes/AttachPhoto.tsx`
- Modify: `src/scenes/ChatGPTGenerates.tsx`

**Interfaces:**

- Consumes: `ChatMock` from `../components/ChatMock`, `Caption` from `../components/Caption`
- Consumes assets: `staticFile('real_image.webp')`, `staticFile('anime/anime-styled.png')`

- [ ] **Step 1: Replace src/scenes/AttachPhoto.tsx**

```typescript
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Caption} from '../components/Caption';
import {ChatMock} from '../components/ChatMock';

const PROMPT = "Create 12 Disney 3D style stickers from my photo — 4×3 grid, solid #00B140 green background, distinct facial expressions.";

export const AttachPhoto: React.FC = () => {
  const frame = useCurrentFrame();

  // Photo slides up at frame 18
  const photoOpacity = interpolate(frame, [18, 33], [0, 1], {extrapolateRight: 'clamp'});
  const photoY = interpolate(frame, [18, 33], [44, 0], {extrapolateRight: 'clamp'});

  // Prompt types in frame 42–112
  const charsShown = Math.floor(
    interpolate(frame, [42, 112], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  const cursor = frame > 42 && charsShown < PROMPT.length && Math.floor(frame / 10) % 2 === 0 ? '|' : '';

  // Send button appears at frame 116
  const sendOpacity = interpolate(frame, [116, 128], [0, 1], {extrapolateRight: 'clamp'});

  // Input fades out after send at frame 128
  const inputOpacity = interpolate(frame, [128, 140], [1, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#212121'}}>
      <ChatMock>
        <div style={{padding: '0 36px', display: 'flex', flexDirection: 'column', gap: 20}}>
          {/* Photo attachment bubble */}
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

          {/* Prompt text bubble */}
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

      {/* Input bar */}
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
```

- [ ] **Step 2: Replace src/scenes/ChatGPTGenerates.tsx**

```typescript
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from '../components/Caption';
import {ChatMock} from '../components/ChatMock';

export const ChatGPTGenerates: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const showDots = frame < 68;

  // Dot bounce
  const dot = (offset: number) => Math.sin((frame + offset) * 0.35) * 7;

  // Grid appears at frame 68
  const gridSpring = spring({frame: Math.max(0, frame - 68), fps, config: {stiffness: 140, damping: 16}});
  const gridOpacity = interpolate(frame, [68, 84], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#212121'}}>
      <ChatMock>
        <div style={{padding: '0 36px', display: 'flex', flexDirection: 'column', gap: 20}}>
          {/* User message (sent photo — small) */}
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <div style={{borderRadius: 14, overflow: 'hidden', width: 100, opacity: 0.55}}>
              <Img src={staticFile('real_image.webp')} style={{width: '100%', height: 100, objectFit: 'cover', display: 'block'}} />
            </div>
          </div>

          {/* ChatGPT response */}
          <div style={{display: 'flex', gap: 14, alignItems: 'flex-start'}}>
            {/* Avatar */}
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
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a5 5 0 110 10A5 5 0 0110 5zm0 2a3 3 0 100 6 3 3 0 000-6z"
                  fill="white"/>
              </svg>
            </div>

            {showDots ? (
              /* Typing indicator */
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
              /* Sticker grid response */
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
```

- [ ] **Step 3: Preview scenes 4 (frames 300–449) and 5 (frames 450–599) in Remotion Studio**

Verify: photo slides in, prompt types, typing dots bounce, grid appears with spring.

- [ ] **Step 4: Commit**

```bash
git add "video generation/src/scenes/AttachPhoto.tsx" "video generation/src/scenes/ChatGPTGenerates.tsx"
git commit -m "feat(video): implement AttachPhoto and ChatGPTGenerates scenes"
```

---

## Task 7: Scene 6 (UploadGrid) + Scene 7 (StickersReady)

**Files:**

- Modify: `src/scenes/UploadGrid.tsx`
- Modify: `src/scenes/StickersReady.tsx`

**Interfaces:**

- Consumes: `AppScreen`, `Caption`
- Consumes assets: `staticFile('disney/disney-styled.png')`, `staticFile('disney/disney-styled_01.webp')` … `staticFile('disney/disney-styled_12.webp')`

- [ ] **Step 1: Replace src/scenes/UploadGrid.tsx**

```typescript
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AppScreen} from '../components/AppScreen';
import {Caption} from '../components/Caption';

export const UploadGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps: _fps} = useVideoConfig();

  // Grid slides down into drop zone at frame 28
  const gridY = interpolate(frame, [28, 52], [-240, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gridOpacity = interpolate(frame, [28, 44], [0, 1], {extrapolateRight: 'clamp'});

  // Border glow pulse when grid arrives
  const borderGlow = frame >= 28 && frame <= 80
    ? interpolate(frame, [28, 54, 80], [0, 1, 0.3], {extrapolateRight: 'clamp'})
    : frame > 80 ? 0.3 : 0;

  // Progress bar frame 62 → 112
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

          {/* Drop zone */}
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

          {/* Progress bar */}
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
```

- [ ] **Step 2: Replace src/scenes/StickersReady.tsx**

```typescript
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Caption} from '../components/Caption';

const STICKERS = Array.from({length: 12}, (_, i) =>
  staticFile(`disney/disney-styled_${String(i + 1).padStart(2, '0')}.webp`)
);

export const StickersReady: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 16], [0, 1], {extrapolateRight: 'clamp'});
  const titleY = interpolate(frame, [0, 16], [20, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: '#0a0a0a',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '64px 44px 140px',
    }}>
      <div style={{
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        fontSize: 42,
        fontWeight: 800,
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: 44,
        textAlign: 'center',
        letterSpacing: '-1px',
      }}>
        Your stickers are ready!
      </div>

      {/* 4×3 grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        width: '100%',
      }}>
        {STICKERS.map((src, index) => {
          const staggerFrame = Math.max(0, frame - index * 10);
          const sc = spring({frame: staggerFrame, fps, config: {stiffness: 260, damping: 18}});
          const opacity = interpolate(staggerFrame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});

          // Idle float once fully appeared
          const fullyIn = staggerFrame > 25;
          const floatY = fullyIn ? Math.sin(frame * 0.055 + index * 0.9) * 5 : 0;

          return (
            <div key={index} style={{
              opacity,
              transform: `scale(${sc}) translateY(${floatY}px)`,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <Img
                src={src}
                style={{width: '100%', aspectRatio: '1 / 1', objectFit: 'contain'}}
              />
            </div>
          );
        })}
      </div>

      <Caption frame={frame} text="12 stickers, ready to send!" startFrame={125} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Preview scenes 6 (frames 600–719) and 7 (frames 720–899) in Remotion Studio**

Verify: grid slides into drop zone, progress bar fills, then stickers pop in one by one and float.

- [ ] **Step 4: Commit**

```bash
git add "video generation/src/scenes/UploadGrid.tsx" "video generation/src/scenes/StickersReady.tsx"
git commit -m "feat(video): implement UploadGrid and StickersReady scenes"
```

---

## Task 8: Full Preview + Render

**Files:**

- Create: `out/` directory (git-ignored)

- [ ] **Step 1: Add out/ to .gitignore**

```bash
echo "out/" >> "/Users/garikmartikyan03gmail.com/Desktop/stickup-beta/video generation/.gitignore"
```

- [ ] **Step 2: Do a full studio preview — scrub the entire timeline**

```bash
cd "/Users/garikmartikyan03gmail.com/Desktop/stickup-beta/video generation"
npx remotion studio src/index.ts
```

Play through all 990 frames. Check: no blank frames, no white flashes between scenes, captions visible, all assets load.

- [ ] **Step 3: Render MP4**

```bash
cd "/Users/garikmartikyan03gmail.com/Desktop/stickup-beta/video generation"
mkdir -p out
npx remotion render HowToVideo out/how-to.mp4 --overwrite
```

Expected: `out/how-to.mp4` created, ~33s at 1080×1920.

- [ ] **Step 4: Convert to GIF (requires ffmpeg)**

```bash
ffmpeg -i out/how-to.mp4 \
  -vf "fps=15,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 out/how-to.gif
```

Expected: `out/how-to.gif` created at 540px wide.

- [ ] **Step 5: Final commit**

```bash
git add "video generation/src" "video generation/.gitignore"
git commit -m "feat(video): complete Remotion how-to video — all 8 scenes"
```
