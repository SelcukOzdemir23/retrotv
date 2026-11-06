# RetroTV roadmap

RetroTV is a portfolio-grade, browser-based IPTV player. Its first job is simple: let a person load a playlist they are authorized to use, select a channel, and see a clear result when a browser or stream limitation prevents playback.

## Current baseline

- Astro 7, Svelte 5, Tailwind CSS 4, Vite 8, and hls.js
- Local M3U file import, HTTPS playlist URL import, and optional IPTV-org country playlists
- M3U normalization for names, logos, groups, and common player limitations
- Native HLS where supported and hls.js playback through an HTML video element
- Channel search, group filters, and locally saved favorites
- Static GitHub Pages deployment under `/retrotv`
- `npm run check` and `npm run build` as CI quality gates

## Product limits

- The app does not host, proxy, decrypt, or redistribute streams.
- A remote playlist and every HLS segment must permit browser CORS requests.
- Secure pages block insecure HTTP stream URLs.
- Browser JavaScript cannot set forbidden User-Agent or Referer headers.
- DRM-protected, unsupported raw transport-stream, closed, and geo-blocked sources may not play.
- IPTV-org is a community directory, not a stream availability or rights guarantee.

## Priorities

### 1. Reliable first-play experience

- Improve M3U compatibility for real-world EXTINF metadata and malformed rows.
- Make source loading cancellable and report parse, CORS, HTTP, format, and playback errors distinctly.
- Track HLS and HTML video lifecycle cleanly when channels change or the page closes.
- Keep the playlist in memory; persist only non-sensitive preferences such as favorites.
- Use an explicitly licensed sample stream for manual playback verification.

### 2. Channel discovery and viewing

- Add sort modes and country/language/category filters without loading global stream data up front.
- Add a compact now/next EPG view using XMLTV data, with correct timezone handling.
- Add channel logo fallbacks, recent channels, and keyboard/remote-friendly channel navigation.
- Add optional audio/subtitle/quality selection only where the stream exposes those tracks.

### 3. Distinctive design and accessibility

- Keep the video surface dominant and quiet; put channel navigation in a scannable rail.
- Use the red on-air mark only for actual active/live states.
- Keep CRT texture subtle, optional, and limited to the video frame.
- Preserve keyboard focus, reduced-motion preferences, readable contrast, and explicit mobile layouts.
- Review the whole product after the initial playback flow is stable.

### 4. Repository and documentation

- Keep user playlists, signed links, and credentials out of Git.
- Document IPTV-org's community-sourced data and limitations accurately.
- Keep dependencies, source modules, and component folders aligned to the IPTV product.
- Add screenshots after the interface and sample-source policy are settled.

## Design read

This is a live-channel workspace, not an on-demand movie catalog or physical TV prop. Its signature is the restrained “on-air” tally light and a broadcast-control layout that makes playlist, channel, and playback state obvious.

## Explicitly out of scope for the first release

- Public proxying of arbitrary streams
- DRM circumvention or geo-restriction bypass
- Accounts, cloud-synced playlists, or server-side credential storage
- A promise that every third-party channel will always play
