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
