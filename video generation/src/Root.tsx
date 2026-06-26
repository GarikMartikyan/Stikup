import React from 'react';
import {Composition} from 'remotion';
import {HowToVideo} from './HowToVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HowToVideo"
      component={HowToVideo}
      durationInFrames={630}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
