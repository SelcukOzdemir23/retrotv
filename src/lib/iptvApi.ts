// ─── IPTV-org API Service ──────────────────────────────────────────
// Docs: https://github.com/iptv-org/api
//
// Uses channels.json for metadata and streams.json for stream URLs.
// Both files are cached after first fetch to minimize network calls.

import type { Country, ApiChannel, ApiStream, Channel } from './types';

const API_BASE = 'https://iptv-org.github.io/api';

// CORS proxy for HTTP streams on HTTPS pages (GitHub Pages).
// HTTPS streams are used directly without proxy.
const CORS_PROXY = 'https://corsproxy.io/';

function proxyUrl(url: string): string {
  if (url.startsWith('https://')) return url;
  return CORS_PROXY + '?' + encodeURIComponent(url);
}

// ─── Caches ─────────────────────────────────────────────────────────

let cachedCountries: Country[] | null = null;
let cachedChannels: ApiChannel[] | null = null;
let cachedStreams: ApiStream[] | null = null;

// ─── Countries ──────────────────────────────────────────────────────

export async function fetchCountries(): Promise<Country[]> {
  if (cachedCountries) return cachedCountries;

  const res = await fetch(`${API_BASE}/countries.json`);
  if (!res.ok) throw new Error(`Failed to fetch countries (${res.status})`);

  const data: Country[] = await res.json();
  cachedCountries = data;
  return data;
}

// ─── Channels + Streams → Merged Channel List ──────────────────────
// 1. Fetch channels.json, filter by country code
// 2. Fetch streams.json, match by channel id
// 3. Merge into our Channel type

async function fetchChannelsAll(): Promise<ApiChannel[]> {
  if (cachedChannels) return cachedChannels;

  console.log('[iptvApi] Fetching channels.json...');
  const res = await fetch(`${API_BASE}/channels.json`);
  if (!res.ok) throw new Error(`Failed to fetch channels (${res.status})`);

  const data: ApiChannel[] = await res.json();
  console.log(`[iptvApi] channels.json loaded: ${data.length} channels`);
  cachedChannels = data;
  return data;
}

async function fetchStreamsAll(): Promise<ApiStream[]> {
  if (cachedStreams) return cachedStreams;

  console.log('[iptvApi] Fetching streams.json...');
  const res = await fetch(`${API_BASE}/streams.json`);
  if (!res.ok) throw new Error(`Failed to fetch streams (${res.status})`);

  const data: ApiStream[] = await res.json();
  console.log(`[iptvApi] streams.json loaded: ${data.length} streams`);
  cachedStreams = data;
  return data;
}

export async function fetchChannelsForCountry(countryCode: string): Promise<Channel[]> {
  const code = countryCode.toUpperCase();

  console.log(`[iptvApi] Fetching channels for ${code}...`);

  // 1. Get all channels, filter by country
  const allChannels = await fetchChannelsAll();
  const countryChannels = allChannels.filter((ch) => ch.country === code);
  console.log(`[iptvApi] ${countryChannels.length} channels for ${code}`);

  if (countryChannels.length === 0) {
    return [];
  }

  // 2. Get all streams, build a map by channel id → first stream url
  const allStreams = await fetchStreamsAll();
  const streamMap = new Map<string, string>();

  for (const s of allStreams) {
    if (s.channel && s.url && !streamMap.has(s.channel)) {
      // Prefer: higher quality, no label warning
      if (s.label && s.label.includes('Geo')) continue; // Skip geo-blocked if possible
      // Proxy HTTP URLs for CORS; keep HTTPS direct
      const proxied = proxyUrl(s.url);
      streamMap.set(s.channel, proxied);
    }
  }

  console.log(`[iptvApi] ${streamMap.size} unique streams in map`);

  // 3. Merge: for each channel, try to find a stream URL
  const result: Channel[] = [];
  const seen = new Set<string>();

  for (const ch of countryChannels) {
    // Skip NSFW channels
    if (ch.is_nsfw) continue;

    const url = streamMap.get(ch.id);
    if (!url) continue; // Skip channels without working streams

    // Deduplicate by name
    const name = ch.name.trim();
    if (seen.has(name)) continue;
    seen.add(name);

    result.push({
      id: ch.id,
      name,
      url,
      group: ch.categories?.[0] || undefined,
    });
  }

  console.log(`[iptvApi] Final: ${result.length} playable channels for ${code}`);

  return result;
}

// ─── Local M3U Parser ─────────────────────────────────────────────
// Parses M3U playlist files (EXTINF format) into Channel[]
// Handles: tvg-id, tvg-logo, group-title, http-user-agent, http-referrer

interface M3UEntry {
  tvgId?: string;
  tvgLogo?: string;
  groupTitle?: string;
  name: string;
  url: string;
}

function parseM3ULine(line: string): Partial<M3UEntry> {
  const entry: Partial<M3UEntry> = {};

  // Extract tvg-id
  const idMatch = line.match(/tvg-id="([^"]*)"/);
  if (idMatch) entry.tvgId = idMatch[1];

  // Extract tvg-logo
  const logoMatch = line.match(/tvg-logo="([^"]*)"/);
  if (logoMatch) entry.tvgLogo = logoMatch[1];

  // Extract group-title
  const groupMatch = line.match(/group-title="([^"]*)"/);
  if (groupMatch) entry.groupTitle = groupMatch[1];

  // Extract channel name (last comma-separated value)
  const nameMatch = line.match(/,([^,]+)$/);
  if (nameMatch) entry.name = nameMatch[1].trim();

  return entry;
}

export async function fetchChannelsFromM3U(m3uUrl: string): Promise<Channel[]> {
  console.log(`[iptvApi] Fetching M3U from ${m3uUrl}...`);

  const res = await fetch(m3uUrl);
  if (!res.ok) throw new Error(`Failed to fetch M3U (${res.status})`);

  const text = await res.text();
  const lines = text.split(/\r?\n/);

  console.log(`[iptvApi] M3U loaded: ${lines.length} lines`);

  const channels: Channel[] = [];
  const seen = new Set<string>();
  let currentMeta: Partial<M3UEntry> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      currentMeta = parseM3ULine(line);
      continue;
    }

    // Skip comments, empty lines, and EXTVLCOPT lines
    if (line.startsWith('#') || line === '') continue;

    // This line is a URL
    const url = line;
    const name = currentMeta.name || url;

    // Deduplicate by name
    if (!seen.has(name)) {
      seen.add(name);

      // Use first semicolon-separated group as primary group
      const group = currentMeta.groupTitle
        ? currentMeta.groupTitle.split(';')[0].trim()
        : undefined;

      channels.push({
        id: currentMeta.tvgId || `m3u-${channels.length}`,
        name,
        url,
        logo: currentMeta.tvgLogo,
        group: group || undefined,
      });
    }

    currentMeta = {};
  }

  console.log(`[iptvApi] M3U parsed: ${channels.length} channels`);
  return channels;
}

// ─── Groups / Categories ────────────────────────────────────────────

export function extractGroups(channels: Channel[]): string[] {
  const groups = new Set<string>();
  for (const ch of channels) {
    if (ch.group) groups.add(ch.group);
  }
  return ['All', ...Array.from(groups).sort()];
}

export function filterChannels(
  channels: Channel[],
  query: string,
  group: string | null,
): Channel[] {
  return channels.filter((ch) => {
    if (group && group !== 'All' && ch.group !== group) return false;
    if (query) {
      const q = query.toLowerCase();
      return ch.name.toLowerCase().includes(q);
    }
    return true;
  });
}
