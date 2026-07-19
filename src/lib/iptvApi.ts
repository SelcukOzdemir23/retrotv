// ─── IPTV-org API Service ──────────────────────────────────────────
// Docs: https://github.com/iptv-org/api

import type { Country, Channel } from './types';

const API_BASE = 'https://iptv-org.github.io/api';
const M3U_BASE = 'https://iptv-org.github.io/iptv';

// ─── Countries ──────────────────────────────────────────────────────

const cachedCountries: Country[] = [];

export async function fetchCountries(): Promise<Country[]> {
  if (cachedCountries.length > 0) return cachedCountries;

  const res = await fetch(`${API_BASE}/countries.json`);
  if (!res.ok) throw new Error(`Failed to fetch countries (${res.status})`);

  const data: Country[] = await res.json();
  cachedCountries.push(...data);
  return data;
}

// ─── M3U Playlist ───────────────────────────────────────────────────

export function parseM3U(text: string): Channel[] {
  const lines = text.split('\n');
  const channels: Channel[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line.startsWith('#EXTINF:')) continue;

    // Parse EXTINF attributes
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    const groupMatch = line.match(/group-title="([^"]*)"/);

    // Extract channel name (after last comma)
    const lastComma = line.lastIndexOf(',');
    const name = lastComma >= 0 ? line.slice(lastComma + 1).trim() : '';
    if (!name) continue;

    // URL is the next non-empty, non-comment line
    const nextLine = lines[i + 1]?.trim() ?? '';
    if (!nextLine || nextLine.startsWith('#')) continue;
    const url = nextLine;

    // Deduplicate by name+url
    const key = `${name}::${url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    channels.push({
      id: `ch-${channels.length}`,
      name,
      url,
      logo: logoMatch?.[1] || undefined,
      group: groupMatch?.[1] || undefined,
    });
  }

  return channels;
}

export async function fetchChannelsForCountry(countryCode: string): Promise<Channel[]> {
  const url = `${M3U_BASE}/countries/${countryCode.toLowerCase()}.m3u`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Failed to fetch playlist for ${countryCode} (${res.status})`);

  const text = await res.text();
  return parseM3U(text);
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
