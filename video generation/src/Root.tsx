import React from 'react';
import {Composition} from 'remotion';
import './tailwind.css';
import './fonts';
import {HowToVideo} from './HowToVideo';
import {HowToDisney, DISNEY_DURATION} from './disney/HowToDisney';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HowToDisney"
        component={HowToDisney}
        durationInFrames={DISNEY_DURATION}
        fps={30}
        width={432}
        height={960}
      />
      <Composition
        id="HowToVideo"
        component={HowToVideo}
        durationInFrames={630}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
