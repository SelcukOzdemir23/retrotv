# 📺 RetroTV — Movie & TV Streaming Platform

> A vintage CRT television experience for discovering and watching movies & TV shows via TMDB + Vidking Player.

[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?logo=astro)](https://astro.build)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)](https://svelte.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## ✨ Features

- **📺 Retro CRT TV Interface** — Authentic scanlines, flicker, vignette, glass glare, and power on/off animations
- **🎬 TMDB Integration** — Browse trending movies & TV shows, search, and explore by genre
- **🖥️ Vidking Player** — Embedded video player for seamless streaming
- **📋 Content Browser** — Slide-out panel with trending, search, and genre filters
- **🎮 Physical-style Remote Control** — Navigation, browse, refresh, and power buttons
- **🔄 Static Noise Transition** — Analog-style view change effect
- **📱 Responsive Design** — Optimized for desktop with portrait-rotation warning on mobile

---

## 🏗 Architecture

```
src/
├── components/
│   ├── TV/
│   │   ├── TVFrame.astro        # CRT TV casing (HTML/CSS art)
│   │   ├── Screen.svelte        # TMDB content viewer with CRT effects
│   │   ├── StaticNoise.svelte   # Canvas-based analog noise
│   │   ├── MediaGrid.svelte     # Movie/TV show card grid
│   │   ├── MediaDetail.svelte   # Detail view with Vidking player
│   │   ├── ContentBrowser.svelte # Trending/search/genre browser panel
│   │   └── ApiKeyPrompt.svelte  # TMDB API key entry modal
│   ├── Remote/
│   │   └── RemoteControl.svelte # Floating remote control UI
│   └── RoomBackground.astro     # Nostalgic room background
├── lib/
│   ├── types.ts                 # TypeScript interfaces (TMDB types, app types)
│   ├── tmdbApi.ts               # TMDB API client
│   └── iptvApi.ts               # Legacy IPTV parser (deprecated)
├── stores/
│   ├── tvStore.ts               # Power, volume, mute state
│   ├── channelStore.ts          # Legacy channel state (deprecated)
│   └── appStore.ts              # TMDB app state (view, media, search, genres)
├── styles/
│   ├── global.css               # Tailwind imports + reset
│   └── crt-effects.css          # Scanlines, flicker, glow, turn-on/off
├── layouts/Layout.astro         # Base HTML layout
└── pages/index.astro            # Main page assembly
```

---

## 🛠 Tech Stack

| Layer            | Technology         |
| ---------------- | ------------------ |
| Framework        | Astro 5            |
| Interactivity    | Svelte 5           |
| State Management | Nano Stores        |
| Styling          | Tailwind CSS 4     |
| Video Player     | Vidking Player     |
| Data API         | TMDB (v3)          |
| Deployment       | GitHub Pages       |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm
- TMDB API key (free at [themoviedb.org](https://www.themoviedb.org/settings/api))

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

## 📡 Data Sources

- **TMDB API** — Movie & TV show metadata, posters, ratings, genres
- **Vidking Player** — Embedded video streaming via iframe

---

## 📄 License

MIT

---

*Built with ❤️ as a portfolio project.*
