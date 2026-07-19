// ─── IPTV-org API Types ────────────────────────────────────────────

export interface Country {
  name: string;
  code: string;        // ISO 3166-1 alpha-2
  languages: string[];
  flag: string;         // Emoji flag
}

export interface Channel {
  id: string;
  name: string;
  url: string;          // Stream URL (from M3U)
  logo?: string;        // tvg-logo from M3U
  group?: string;       // group-title from M3U
}

// ─── App State Types ────────────────────────────────────────────────

export interface TVState {
  power: boolean;
  volume: number;
  isMuted: boolean;
}

export interface ChannelState {
  selectedCountry: Country | null;
  channels: Channel[];
  filteredChannels: Channel[];
  channelGroups: string[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedGroup: string | null;
}
