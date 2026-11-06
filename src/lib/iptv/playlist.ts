import type { Channel, DirectoryCountry, PlaylistParseResult, StreamFormat } from './types';

const IPTV_DIRECTORY_API = 'https://iptv-org.github.io/api';
const IPTV_DIRECTORY_PLAYLISTS = 'https://iptv-org.github.io/iptv/countries';
export const MAX_PLAYLIST_BYTES = 25 * 1024 * 1024;

interface M3UMetadata {
  tvgId: string | null;
  name: string;
  logoUrl: string | null;
  group: string | null;
  language: string | null;
  requiresCustomHeaders: boolean;
  requiresDrm: boolean;
}

function splitExtinf(line: string): [string, string] | null {
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if ((character === '"' || character === "'") && (!quote || quote === character)) {
      quote = quote ? null : character;
    } else if (character === ',' && !quote) {
      return [line.slice(0, index), line.slice(index + 1).trim()];
    }
  }

  return null;
}

function parseAttributes(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributePattern = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s,]+))/g;

  for (const match of line.matchAll(attributePattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }

  return attributes;
}

function classifyStream(url: URL): StreamFormat {
  const path = url.pathname.toLowerCase();
  if (path.endsWith('.m3u8')) return 'hls';
  if (/\.(mp4|m4v|webm|mov|m4a|mp3|aac|ogg)$/.test(path)) return 'file';
  if (/\.(ts|mts|m2ts)$/.test(path)) return 'mpeg-ts';
  return 'unknown';
}

function safeId(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function resolveStreamUrl(rawUrl: string, baseUrl?: string): URL | null {
  try {
    const url = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function parseM3U(text: string, baseUrl?: string): PlaylistParseResult {
  const channels: Channel[] = [];
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  let metadata: M3UMetadata | null = null;
  let skippedEntries = 0;

  for (const rawLine of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const split = splitExtinf(line);
      if (!split) {
        metadata = null;
        skippedEntries += 1;
        continue;
      }

      const [attributesLine, displayName] = split;
      const attributes = parseAttributes(attributesLine);
      metadata = {
        tvgId: attributes['tvg-id']?.trim() || null,
        name: displayName || attributes['tvg-name']?.trim() || '',
        logoUrl: attributes['tvg-logo']?.trim() || null,
        group: attributes['group-title']?.trim() || null,
        language: attributes['tvg-language']?.trim() || null,
        requiresCustomHeaders: false,
        requiresDrm: false,
      };
      continue;
    }

    if (line.startsWith('#EXTGRP:') && metadata) {
      metadata.group = line.slice('#EXTGRP:'.length).trim() || metadata.group;
      continue;
    }

    if (line.startsWith('#EXTVLCOPT:') && metadata) {
      const directive = line.slice('#EXTVLCOPT:'.length).toLowerCase();
      if (directive.startsWith('http-user-agent=') || directive.startsWith('http-referrer=')) {
        metadata.requiresCustomHeaders = true;
      }
      continue;
    }

    if (line.startsWith('#KODIPROP:') && metadata) {
      const directive = line.toLowerCase();
      if (/license_type|license_key|drm/.test(directive)) {
        metadata.requiresDrm = true;
      } else if (/stream_headers|manifest_headers/.test(directive)) {
        metadata.requiresCustomHeaders = true;
      }
      continue;
    }

    if (line.startsWith('#')) continue;

    const url = resolveStreamUrl(line, baseUrl);
    if (!url || !metadata?.name || seenUrls.has(url.href)) {
      skippedEntries += 1;
      metadata = null;
      continue;
    }

    seenUrls.add(url.href);
    const index = channels.length + 1;
    const baseId = metadata.tvgId || safeId(metadata.name) || 'channel';
    const id = seenIds.has(baseId) ? `${baseId}-${index}` : baseId;
    seenIds.add(id);
    channels.push({
      id,
      name: metadata.name,
      url: url.href,
      logoUrl: metadata.logoUrl,
      group: metadata.group,
      tvgId: metadata.tvgId,
      language: metadata.language,
      format: classifyStream(url),
      requiresCustomHeaders: metadata.requiresCustomHeaders,
      requiresDrm: metadata.requiresDrm,
    });
    metadata = null;
  }

  return { channels, skippedEntries };
}

export async function fetchDirectoryCountries(signal?: AbortSignal): Promise<DirectoryCountry[]> {
  const response = await fetch(`${IPTV_DIRECTORY_API}/countries.json`, { signal });
  if (!response.ok) throw new Error(`Ülke listesi yüklenemedi (${response.status}).`);

  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new Error('Ülke dizini beklenmeyen formatta.');
  return result.filter(
    (item): item is DirectoryCountry =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.name === 'string' &&
      typeof item.code === 'string' &&
      Array.isArray(item.languages) &&
      typeof item.flag === 'string',
  );
}

export function getCountryPlaylistUrl(countryCode: string): string {
  const code = countryCode.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) throw new Error('Geçerli bir ülke seç.');
  return `${IPTV_DIRECTORY_PLAYLISTS}/${code}.m3u`;
}

export async function fetchPlaylist(
  url: string,
  options: { signal?: AbortSignal } = {},
): Promise<PlaylistParseResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('M3U adresi geçerli bir HTTPS adresi olmalı.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error(
      'Uzak playlist adresi HTTPS olmalı. HTTP kaynakları güvenli sayfada engellenir.',
    );
  }

  let response: Response;
  try {
    response = await fetch(parsedUrl, { signal: options.signal });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new Error(
        'Playlist kaynağına erişilemiyor. CORS iznini ve internet bağlantını kontrol et.',
      );
    }
    throw cause;
  }

  if (!response.ok) throw new Error(`Playlist indirilemedi (${response.status}).`);

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_PLAYLIST_BYTES) throw new Error('Playlist 25 MB sınırını aşıyor.');

  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_PLAYLIST_BYTES) {
    throw new Error('Playlist 25 MB sınırını aşıyor.');
  }

  const parsed = parseM3U(text, response.url || parsedUrl.href);
  if (parsed.channels.length === 0)
    throw new Error('M3U dosyasında oynatılabilir kanal bulunamadı.');
  return parsed;
}
