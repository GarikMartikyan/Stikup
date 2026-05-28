export type ChannelName = 'telegram' | 'whatsapp' | 'email' | 'google';

export interface ChannelEvent {
  channel: ChannelName;
  channelUserId: string;
  profile: {
    displayName?: string;
    username?: string;
  };
}
