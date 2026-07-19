# 📺 RetroTV — Public IPTV Player

> A vintage CRT television experience for browsing and watching public IPTV channels from around the world.

[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?logo=astro)](https://astro.build)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)](https://svelte.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## ✨ Features

- **📺 Retro CRT TV Interface** — Authentic scanlines, flicker, vignette, glass glare, and power on/off animations
- **🌍 Country Selection** — Search and browse TV channels from any country via IPTV-org
- **📡 Live HLS Streaming** — Uses `hls.js` for smooth live TV playback
- **📋 Modern Channel Browser** — Slide-out panel with categories, search, and logo support
- **🎮 Physical-style Remote Control** — Channel up/down, volume, number pad, and power button
- **🔄 Static Noise Transition** — Analog-style channel change effect
- **📱 Responsive Design** — Optimized for desktop with portrait-rotation warning on mobile

---

## 🏗 Architecture

```
src/
├── components/
│   ├── TV/
│   │   ├── TVFrame.astro        # CRT TV casing (HTML/CSS art)
│   │   ├── Screen.svelte        # Video playback, OSD, CRT effects
│   │   ├── StaticNoise.svelte   # Canvas-based analog noise
│   │   ├── ChannelList.svelte   # Modern channel browser panel
│   │   └── CountrySelect.svelte # Country picker with flag grid
│   ├── Remote/
│   │   └── RemoteControl.svelte # Floating remote control UI
│   └── RoomBackground.astro     # Nostalgic room background
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   └── iptvApi.ts               # IPTV-org API client + M3U parser
├── stores/
│   ├── tvStore.ts               # Power, volume, mute state
│   └── channelStore.ts          # Country, channels, search state
├── styles/
│   ├── global.css               # Tailwind imports + reset
│   └── crt-effects.css          # Scanlines, flicker, glow, turn-on/off
├── layouts/Layout.astro         # Base HTML layout
└── pages/index.astro            # Main page assembly
```

### Data Flow

```
User → CountrySelect → IPTV-org API (countries.json)
                     → User picks country
                     → Fetch M3U playlist from iptv-org.github.io
                     → Parse with M3U parser
                     → Populate channelStore
                     → Screen plays selected channel via hls.js
```

---

## 🛠 Tech Stack

| Layer            | Technology         |
| ---------------- | ------------------ |
| Framework        | Astro 5            |
| Interactivity    | Svelte 5           |
| State Management | Nano Stores        |
| Styling          | Tailwind CSS 4     |
| HLS Player       | hls.js             |
| API              | iptv-org.github.io |
| Deployment       | GitHub Pages       |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/retrotv.git
cd retrotv
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Build

```bash
npm run build
```

Static output will be in the `dist/` directory.

---

## 🌐 Deployment

The project is configured for **GitHub Pages** deployment via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions automatically builds and deploys
3. Your site will be live at `https://YOUR_USERNAME.github.io/retrotv`

### Manual Configuration

Before deploying, update `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://YOUR_USERNAME.github.io/retrotv',
  base: '/retrotv',
  // ...
});
```

---

## 📡 Data Source

This project uses [iptv-org](https://github.com/iptv-org/iptv) for public IPTV channel data:
- **Countries**: `https://iptv-org.github.io/api/countries.json`
- **Playlists**: `https://iptv-org.github.io/iptv/countries/{code}.m3u`

> All streams are publicly available. This project does not host or distribute any copyrighted content.

---

## 📄 License

MIT

---

*Built with ❤️ as a portfolio project.*
