import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCountryPlaylistUrl, parseM3U } from '../src/lib/iptv/playlist.ts';

const entry = (attributes: string, name: string, url: string) => `#EXTINF:-1 ${attributes},${name}\n${url}\n`;

test('parses name, group, logo, and language attributes', () => {
  const { channels, skippedEntries } = parseM3U(
    entry('tvg-id="trt1.tr" tvg-logo="https://logo.test/trt1.png" group-title="Haber" tvg-language="tr"', 'TRT 1', 'https://cdn.test/trt1/index.m3u8'),
  );

  assert.equal(skippedEntries, 0);
  assert.equal(channels.length, 1);
  assert.deepEqual(
    {
      id: channels[0].id,
      name: channels[0].name,
      group: channels[0].group,
      logoUrl: channels[0].logoUrl,
      language: channels[0].language,
      format: channels[0].format,
    },
    {
      id: 'trt1.tr',
      name: 'TRT 1',
      group: 'Haber',
      logoUrl: 'https://logo.test/trt1.png',
      language: 'tr',
      format: 'hls',
    },
  );
});

test('keeps commas inside a quoted display name', () => {
  const { channels } = parseM3U(entry('group-title="Haber"', '"Haber, Spor ve Ekonomi"', 'https://cdn.test/a/index.m3u8'));
  assert.equal(channels[0].name, '"Haber, Spor ve Ekonomi"');
  assert.equal(channels[0].group, 'Haber');
});

test('treats a comma inside an attribute value as part of the value', () => {
  const { channels } = parseM3U(entry('group-title="Spor, Futbol"', 'Kanal', 'https://cdn.test/a/index.m3u8'));
  assert.equal(channels[0].group, 'Spor, Futbol');
  assert.equal(channels[0].name, 'Kanal');
});

test('classifies stream formats from the URL path', () => {
  const { channels } = parseM3U(
    [
      entry('', 'HLS', 'https://cdn.test/a/index.m3u8'),
      entry('', 'Dosya', 'https://cdn.test/a/movie.mp4'),
      entry('', 'TS', 'https://cdn.test/a/chunk.ts'),
      entry('', 'Bilinmez', 'https://cdn.test/a/stream'),
    ].join(''),
  );

  assert.deepEqual(
    channels.map((channel) => channel.format),
    ['hls', 'file', 'mpeg-ts', 'unknown'],
  );
});

test('ignores a manifest query string when classifying', () => {
  const { channels } = parseM3U(entry('', 'Token', 'https://cdn.test/a/index.m3u8?token=abc'));
  assert.equal(channels[0].format, 'hls');
});

test('marks entries that need custom request headers', () => {
  const playlist = [
    '#EXTINF:-1,Header Kanalı',
    '#EXTVLCOPT:http-user-agent=VLC/3.0',
    'https://cdn.test/a/index.m3u8',
    '',
  ].join('\n');

  const { channels } = parseM3U(playlist);
  assert.equal(channels[0].requiresCustomHeaders, true);
  assert.equal(channels[0].requiresDrm, false);
});

test('marks DRM entries from KODIPROP', () => {
  const playlist = [
    '#EXTINF:-1,DRM Kanalı',
    '#KODIPROP:inputstream.adaptive.license_type=clearkey',
    'https://cdn.test/a/index.m3u8',
    '',
  ].join('\n');

  const { channels } = parseM3U(playlist);
  assert.equal(channels[0].requiresDrm, true);
});

test('uses EXTGRP when the entry has no group attribute', () => {
  const playlist = ['#EXTINF:-1,Kanal', '#EXTGRP:Belgesel', 'https://cdn.test/a/index.m3u8', ''].join('\n');
  const { channels } = parseM3U(playlist);
  assert.equal(channels[0].group, 'Belgesel');
});

test('drops entries without a name or with an unusable URL', () => {
  const playlist = [
    '#EXTINF:-1,',
    'https://cdn.test/a/index.m3u8',
    '#EXTINF:-1,Geçersiz',
    'file:///etc/passwd',
    '#EXTINF:-1,Sağlam',
    'https://cdn.test/b/index.m3u8',
    '',
  ].join('\n');

  const { channels, skippedEntries } = parseM3U(playlist);
  assert.equal(channels.length, 1);
  assert.equal(channels[0].name, 'Sağlam');
  assert.equal(skippedEntries, 2);
});

test('removes duplicate stream URLs', () => {
  const playlist = [
    entry('tvg-id="a"', 'Birinci', 'https://cdn.test/a/index.m3u8'),
    entry('tvg-id="b"', 'İkinci', 'https://cdn.test/a/index.m3u8'),
  ].join('');

  const { channels, skippedEntries } = parseM3U(playlist);
  assert.equal(channels.length, 1);
  assert.equal(channels[0].name, 'Birinci');
  assert.equal(skippedEntries, 1);
});

test('keeps ids unique when two channels share a tvg-id', () => {
  const playlist = [
    entry('tvg-id="trt1.tr"', 'TRT 1', 'https://cdn.test/a/index.m3u8'),
    entry('tvg-id="trt1.tr"', 'TRT 1 Yedek', 'https://cdn.test/b/index.m3u8'),
  ].join('');

  const { channels } = parseM3U(playlist);
  assert.deepEqual(channels.map((channel) => channel.id), ['trt1.tr', 'trt1.tr-2']);
});

test('derives an id from the name when tvg-id is missing', () => {
  const { channels } = parseM3U(entry('', 'A Haber (1080p)', 'https://cdn.test/a/index.m3u8'));
  assert.equal(channels[0].id, 'a-haber-1080p');
});

test('ignores a byte order mark and blank lines', () => {
  const { channels, skippedEntries } = parseM3U('\uFEFF#EXTM3U\n\n#EXTINF:-1,Kanal\n\nhttps://cdn.test/a/index.m3u8\n\n');
  assert.equal(channels.length, 1);
  assert.equal(skippedEntries, 0);
});

test('resolves relative stream URLs against the playlist base', () => {
  const { channels } = parseM3U(entry('', 'Göreli', '/live/index.m3u8'), 'https://cdn.test/list/main.m3u');
  assert.equal(channels[0].url, 'https://cdn.test/live/index.m3u8');
});

test('returns an empty result for a playlist without entries', () => {
  assert.deepEqual(parseM3U('#EXTM3U\n'), { channels: [], skippedEntries: 0 });
});

test('builds a country playlist URL and rejects malformed codes', () => {
  assert.equal(getCountryPlaylistUrl('TR'), 'https://iptv-org.github.io/iptv/countries/tr.m3u');
  assert.throws(() => getCountryPlaylistUrl('turkiye'), /Geçerli bir ülke seç/);
});
