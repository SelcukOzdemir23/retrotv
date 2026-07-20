// ─── Local M3U Parser ─────────────────────────────────────────────
// Parses M3U playlist files (EXTINF format) into Channel[]
// Handles: tvg-id, tvg-logo, group-title, http-user-agent, http-referrer

import type { Channel } from './types';

interface M3UEntry {
  tvgId?: string;
  tvgLogo?: string;
  groupTitle?: string;
  name: string;
  url: string;
}

function parseM3ULine(line: string): Partial<M3UEntry> {
  const entry: Partial<M3UEntry> = {};

  const idMatch = line.match(/tvg-id="([^"]*)"/);
  if (idMatch) entry.tvgId = idMatch[1];

  const logoMatch = line.match(/tvg-logo="([^"]*)"/);
  if (logoMatch) entry.tvgLogo = logoMatch[1];

  const groupMatch = line.match(/group-title="([^"]*)"/);
  if (groupMatch) entry.groupTitle = groupMatch[1];

  const nameMatch = line.match(/,([^,]+)$/);
  if (nameMatch) entry.name = nameMatch[1].trim();

  return entry;
}

export async function fetchChannelsFromM3U(m3uUrl: string): Promise<Channel[]> {
  console.log(`[M3U] Fetching from ${m3uUrl}...`);

  const res = await fetch(m3uUrl);
  if (!res.ok) throw new Error(`Failed to fetch M3U (${res.status})`);

  const text = await res.text();
  const lines = text.split(/\r?\n/);

  console.log(`[M3U] Loaded: ${lines.length} lines`);

  const channels: Channel[] = [];
  const seen = new Set<string>();
  let currentMeta: Partial<M3UEntry> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      currentMeta = parseM3ULine(line);
      continue;
    }

    // Skip comments, EXTVLCOPT, empty lines
    if (line.startsWith('#') || line === '') continue;

    // This line is a URL
    const url = line;
    const name = currentMeta.name || url;

    if (!seen.has(name)) {
      seen.add(name);

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

  console.log(`[M3U] Parsed: ${channels.length} channels`);
  return channels;
}

// ─── Channel Utilities ──────────────────────────────────────────────

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
