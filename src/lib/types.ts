// ─── IPTV-org API Response Types ────────────────────────────────────
// Docs: https://github.com/iptv-org/api

export interface Country {
  name: string;
  code: string;        // ISO 3166-1 alpha-2
  languages: string[];
  flag: string;         // Emoji flag
}

// From /api/channels.json
export interface ApiChannel {
  id: string;
  name: string;
  alt_names: string[];
  network: string | null;
  owners: string[];
  country: string;       // ISO 3166-1 alpha-2
  categories: string[];
  is_nsfw: boolean;
  launched: string | null;
  closed: string | null;
  replaced_by: string | null;
  website: string | null;
}

// From /api/streams.json
export interface ApiStream {
  channel: string | null;
  feed: string | null;
  title: string;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  quality: string | null;
  label: string | null;
}

// ─── App Types ──────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  url: string;          // Stream URL
  logo?: string;        // Will be fetched from logos.json if needed later
  group?: string;       // Category from channels.json
}

export interface TVState {
  power: boolean;
  volume: number;
  isMuted: boolean;
}

export interface ChannelState {
  selectedCountry: Country | null;
  channels: Channel[];
  channelGroups: string[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedGroup: string | null;
}
