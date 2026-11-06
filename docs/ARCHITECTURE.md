# RetroTV architecture

RetroTV is a static, browser-only IPTV client. Playlist files and stream URLs are supplied by the user or loaded from the optional IPTV-org community directory. The app does not host or proxy video.

## Data flow

```text
Local M3U file ─┐
HTTPS M3U URL ──┼─> playlist parser ─> Channel[] ─> channel rail ─> HTMLVideoElement
IPTV-org country┘                                          └─> hls.js for HLS
```

### Playlist sources

- `src/lib/iptv/playlist.ts` parses M3U data and loads country metadata or a country-specific IPTV-org playlist.
- Local playlist text is read in the browser and held in memory only.
- Remote playlist URLs must use HTTPS and allow browser CORS requests. No proxy is configured.
- IPTV-org feeds are optional third-party data. They can change, be unavailable, or contain streams that are geo-blocked or removed.

### Playback

- `src/components/IPTV/VideoSurface.svelte` owns the HTML video element and the HLS.js instance lifecycle.
- Safari/native-capable browsers use native HLS when appropriate; other supported browsers load hls.js lazily.
- Switching or clearing a channel tears down the old HLS instance and media source.
- Selecting a channel starts playback immediately. When a browser denies automatic playback, the player stays paused and its native controls take over.
- The browser is authoritative for playback controls; RetroTV does not display fake seek or duration controls.
- HLS manifests, segments, encryption keys, and related resources must all meet the source server's CORS policy.
- DRM, forbidden request headers, insecure HTTP from the HTTPS site, and raw MPEG-TS are surfaced as unsupported instead of being proxied or bypassed.

### Navigation

- A channel number is its 1-based position in the loaded playlist, not a stored identifier. Numbers stay stable when the rail is filtered, so typing `024` always means the same channel.
- Typing three digits jumps straight to that channel; `Enter` confirms earlier. `ArrowUp`/`ArrowDown` step through the playlist. Shortcuts are ignored inside inputs, selects, the source dialog, and the video element.
- The rail keeps numbers, names, and groups in separate visual columns so a filtered list is still scannable.

### Motion

- Switching channels plays one short `tune` overlay (channel number plus a sweep) over the video frame. It is decoration for a real state change, never a loading indicator, and it is skipped entirely under `prefers-reduced-motion: reduce`.

### UI responsibilities

- `src/components/IPTV/PlayerShell.svelte` owns the active playlist, channel, source dialog, and user preferences.
- `src/components/IPTV/PlaylistDialog.svelte` handles local file, remote URL, and IPTV-org country selection.
- `src/components/IPTV/ChannelRail.svelte` handles search, group filters, selection, and favorites.
- `src/components/IPTV/VideoSurface.svelte` handles playback status and the video element.
- `src/styles/tokens.css` is the source of truth for the signal-desk palette and typography.

## Data handling and rights

- Playlist URLs can contain signed query strings or credentials; RetroTV does not log or persist the full URL.
- Favorites store channel IDs in the current browser only.
- The IPTV-org repository describes its stream links as user-submitted and does not guarantee availability or rights. RetroTV labels that source and does not bundle a raw stream list.
- Use only sources you are authorized to access. A source that fails is reported; the app does not attempt to bypass CORS, DRM, or regional restrictions.
