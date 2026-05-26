export type ChannelName = 'telegram' | 'whatsapp';

export interface ChannelEvent {
  channel: ChannelName;
  channelUserId: string;
  profile: {
    displayName?: string;
    username?: string;
  };
}
