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
      <Series.Sequence durationInFrames={60}><Intro /></Series.Sequence>
      <Series.Sequence durationInFrames={75}><PickStyle /></Series.Sequence>
      <Series.Sequence durationInFrames={60}><OpenChatGPT /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><AttachPhoto /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><ChatGPTGenerates /></Series.Sequence>
      <Series.Sequence durationInFrames={75}><UploadGrid /></Series.Sequence>
      <Series.Sequence durationInFrames={120}><StickersReady /></Series.Sequence>
      <Series.Sequence durationInFrames={60}><Outro /></Series.Sequence>
    </Series>
  );
};
