# RetroTV

RetroTV is a Turkish-language IPTV player for playlists you are authorized to use. Add an M3U file, a CORS-enabled HTTPS playlist, or choose a country playlist from the optional IPTV-org community directory.

## What it does

- Parses M3U channel names, groups, logos, and stream addresses in the browser
- Plays HLS with hls.js where supported and native HLS where the browser provides it
- Supports browser-playable direct video sources
- Filters channels by name and group; saves favorites locally
- Reports common playback limitations such as CORS, HTTP mixed content, unsupported formats, and DRM

> IPTV-org entries are community-submitted stream links, not streams hosted by RetroTV. Availability, regional access, and rights vary by channel. Only open broadcasts you are authorized to watch. RetroTV does not bypass DRM, geo restrictions, or CORS.

## Technology

- Astro 7 static output
- Svelte 5
- Tailwind CSS 4
- Vite 8
- hls.js

## Requirements

- Node.js 22.23.4 or newer
- npm
- A local M3U playlist, a CORS-enabled HTTPS playlist URL, or the optional IPTV-org directory

## Development

```sh
npm ci
npm run dev
```

The app never uploads a local playlist to a server. Remote playlist and video requests go directly from the browser to their respective sources. Remote servers must allow browser CORS requests; secure deployments also require HTTPS streams. Do not share playlist URLs containing credentials or signed query parameters.

## Quality checks

```sh
npm run check
npm run build
```

GitHub Actions runs both checks before publishing to GitHub Pages.

## Project structure

```text
src/
├── components/IPTV/  # Channel rail, source dialog, player, and app shell
├── layouts/          # Astro document shell
├── lib/iptv/         # M3U parsing, source loading, and IPTV types
├── pages/            # Astro routes
└── styles/           # Global styles and signal-desk design tokens
docs/
├── ARCHITECTURE.md   # Data flow, playback lifecycle, and source limits
└── ROADMAP.md        # Current priorities and follow-up work
```

## IPTV-org directory

RetroTV fetches the country index and a selected country playlist from the public [iptv-org API](https://github.com/iptv-org/api) and [iptv-org playlists](https://github.com/iptv-org/iptv). The directory is optional and its community-submitted streams are not guaranteed to work. RetroTV does not mirror or bundle the directory's stream list.

See [the architecture notes](docs/ARCHITECTURE.md) for playback support and browser limitations.

## Deployment

The repository is configured for GitHub Pages under `/retrotv`. The deployment uses Node.js 22.23.4.

## License and attribution

RetroTV source code is licensed under MIT. IPTV-org data and stream links have their own source and legal notes; see the linked repositories before redistributing any data. RetroTV is not affiliated with IPTV-org or any broadcaster.
