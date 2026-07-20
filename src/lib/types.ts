// ─── App Types ──────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  url: string;          // Stream URL
  logo?: string;        // Channel logo URL
  group?: string;       // Category / group
}

export interface TVState {
  power: boolean;
  volume: number;
  isMuted: boolean;
}
