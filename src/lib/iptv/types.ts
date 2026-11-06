export type StreamFormat = 'hls' | 'file' | 'mpeg-ts' | 'unknown';

export interface Channel {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
  group: string | null;
  tvgId: string | null;
  language: string | null;
  format: StreamFormat;
  requiresCustomHeaders: boolean;
  requiresDrm: boolean;
}

export interface PlaylistParseResult {
  channels: Channel[];
  skippedEntries: number;
}

export interface DirectoryCountry {
  name: string;
  code: string;
  languages: string[];
  flag: string;
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'unsupported';
