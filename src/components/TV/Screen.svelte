<script lang="ts">
  import { onMount } from "svelte";
  import { tvStore } from "../../stores/tvStore";
  import {
    appStore,
    setTrending,
    setTrendingLoading,
    setView,
    selectMedia,
    setBrowserOpen,
  } from "../../stores/appStore";
  import { getTrending } from "../../lib/tmdbApi";
  import StaticNoise from "./StaticNoise.svelte";
  import MediaDetail from "./MediaDetail.svelte";
  import Button from "../ui/Button.svelte";
  import type { TMDBMediaItem } from "../../lib/types";
  import { backdropUrl, getMediaTitle, getMediaYear } from "../../lib/types";

  let turnOnAnim = false;
  let turnOffAnim = false;

  $: isOn = $tvStore.power;
  $: view = $appStore.view;
  $: selectedMedia = $appStore.selectedMedia;
  $: trendingItems = $appStore.trendingItems;
  $: trendingLoading = $appStore.trendingLoading;

  let featuredMedia: TMDBMediaItem | null = null;
  let featuredIndex = 0;

  $: if (trendingItems.length > 0) {
    if (!featuredMedia || trendingItems.indexOf(featuredMedia) === -1) {
      featuredMedia = trendingItems[0];
      featuredIndex = 0;
    }
  }

  function cycleFeatured(d: 1 | -1) {
    if (trendingItems.length === 0) return;
    featuredIndex = (featuredIndex + d + trendingItems.length) % trendingItems.length;
    featuredMedia = trendingItems[featuredIndex];
  }

  let cycleInterval: ReturnType<typeof setInterval>;
  $: if (isOn && view === 'home' && trendingItems.length > 1) {
    clearInterval(cycleInterval);
    cycleInterval = setInterval(() => cycleFeatured(1), 7000);
  } else {
    clearInterval(cycleInterval);
  }

  let prevPower = $tvStore.power;
  $: if ($tvStore.power !== prevPower) {
    if ($tvStore.power) {
      turnOnAnim = true;
      turnOffAnim = false;
      setTimeout(() => (turnOnAnim = false), 400);
      loadContent();
    } else {
      turnOffAnim = true;
      turnOnAnim = false;
      setTimeout(() => (turnOffAnim = false), 400);
    }
    prevPower = $tvStore.power;
  }

  async function loadContent() {
    setTrendingLoading(true);
    try {
      const items = await getTrending('all', 'week');
      setTrending(items);
    } catch (e) {
      console.error('Failed to load trending:', e);
    }
  }

  function selectFeatured() {
    if (featuredMedia) selectMedia(featuredMedia);
  }

  onMount(() => {
    if (!$tvStore.power) tvStore.setKey('power', true);
    loadContent();
  });
</script>

<div class="screen" class:flicker={$tvStore.power} class:turn-on-anim={turnOnAnim} class:turn-off-anim={turnOffAnim}>

  {#if !$tvStore.power}
    <div class="standby">
      <div class="standby-dot"></div>
    </div>
  {/if}

  {#if $tvStore.power}
    <div class="content">
      {#if view === 'home' && !selectedMedia}
        <div class="home-scroll">
          {#if featuredMedia && !trendingLoading}
            <div class="hero">
              <!-- Backdrop -->
              <div class="hero-bg">
                {#if featuredMedia.backdrop_path}
                  <img src={backdropUrl(featuredMedia.backdrop_path, 'w1280')} alt="" class="hero-img" loading="lazy" />
                  <div class="hero-gradient"></div>
                {:else}
                  <div class="hero-no-img"></div>
                {/if}
              </div>

              <!-- Content -->
              <div class="hero-content">
                <div class="hero-badge-row">
                  <div class="hero-live-dot"></div>
                  <span class="osd-text">NOW SHOWING</span>
                </div>

                <h1 class="hero-title">{getMediaTitle(featuredMedia)}</h1>

                <div class="hero-meta">
                  <span class="meta-year">{getMediaYear(featuredMedia)}</span>
                  <span class="meta-type">{featuredMedia.media_type === 'movie' ? 'MOVIE' : 'TV SERIES'}</span>
                  {#if featuredMedia.vote_average > 0}
                    <span class="meta-rating">★ {featuredMedia.vote_average.toFixed(1)}</span>
                  {/if}
                </div>

                {#if featuredMedia.overview}
                  <p class="hero-desc">{featuredMedia.overview}</p>
                {/if}

                <div class="hero-actions">
                  <Button onClick={selectFeatured} variant="primary" size="lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    <span>Watch Now</span>
                  </Button>
                  <Button onClick={() => setBrowserOpen(true)} variant="ghost" size="lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span>Browse</span>
                  </Button>
                </div>
              </div>

              <!-- Nav arrows -->
              {#if trendingItems.length > 1}
                <div class="hero-arrows">
                  <button on:click={() => cycleFeatured(-1)} aria-label="Previous" class="arrow-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 15l-6-6-6 6" /></svg>
                  </button>
                  <button on:click={() => cycleFeatured(1)} aria-label="Next" class="arrow-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                </div>
                <div class="hero-dots">
                  {#each trendingItems.slice(0, Math.min(8, trendingItems.length)) as _, i}
                    <div class="dot" class:active={i === featuredIndex}></div>
                  {/each}
                </div>
              {/if}
            </div>
          {:else if trendingLoading}
            <div class="loading-wrap">
              <div class="loading-ring"></div>
            </div>
          {:else}
            <StaticNoise />
          {/if}
        </div>

      {:else if view === 'detail' && selectedMedia}
        <div class="detail-scroll">
          <MediaDetail />
        </div>

      {:else}
        <StaticNoise />
      {/if}

      {#if view === 'home' && !selectedMedia}
        <div class="brand-mark pointer-events-none">
          <span class="osd-text opacity-40">RETRO TV</span>
        </div>
      {/if}
    </div>

  {:else}
    <div class="standby-text">PRESS POWER</div>
  {/if}

  <!-- CRT Effects -->
  <div class="crt-layer">
    <div class="scanlines opacity-15"></div>
    <div class="tube-vignette"></div>
    <div class="glare"></div>
  </div>
</div>

<style>
  .screen {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: #0a0a0a;
  }
  .standby {
    position: absolute;
    inset: 0;
    background: black;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .standby-dot {
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    opacity: 0.4;
    box-shadow: 0 0 8px white;
  }
  .standby-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.12);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    letter-spacing: 0.3em;
    animation: pulse 3s ease-in-out infinite;
  }

  .content {
    position: absolute;
    inset: 0;
    z-index: 10;
  }

  .home-scroll, .detail-scroll {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .home-scroll::-webkit-scrollbar, .detail-scroll::-webkit-scrollbar { width: 3px; }
  .home-scroll::-webkit-scrollbar-thumb, .detail-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 51, 0.12);
    border-radius: 3px;
  }

  /* ── Hero ──────────────────────────────────────────────────── */
  .hero {
    position: relative;
    width: 100%;
    min-height: 100%;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
  }
  .hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .hero-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      #0a0a0a 0%,
      rgba(10, 10, 10, 0.85) 30%,
      rgba(10, 10, 10, 0.4) 60%,
      rgba(10, 10, 10, 0.6) 100%
    );
  }
  .hero-no-img {
    width: 100%;
    height: 100%;
    background: #111;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 100%;
    padding: 40px 36px 36px;
  }
  @media (min-width: 768px) {
    .hero-content { padding: 48px 48px 40px; }
  }

  .hero-badge-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .hero-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00ff33;
    box-shadow: 0 0 8px #00ff33;
    animation: pulse 2s ease-in-out infinite;
  }

  .hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.1;
    color: rgba(255, 255, 255, 0.92);
    margin: 0 0 12px 0;
    letter-spacing: -0.02em;
  }
  @media (min-width: 768px) {
    .hero-title { font-size: 44px; }
  }

  .hero-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .meta-year {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.35);
  }
  .meta-type {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    color: rgba(0, 255, 51, 0.6);
    padding: 2px 8px;
    background: rgba(0, 255, 51, 0.06);
    border: 1px solid rgba(0, 255, 51, 0.12);
    border-radius: 3px;
  }
  .meta-rating {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: rgba(255, 200, 50, 0.8);
  }

  .hero-desc {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.35);
    max-width: 520px;
    margin: 0 0 20px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hero-arrows {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 20;
  }
  .arrow-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.15s;
  }
  .arrow-btn:hover {
    background: rgba(0, 0, 0, 0.7);
    color: #00ff33;
    border-color: rgba(0, 255, 51, 0.2);
  }

  .hero-dots {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 5px;
    z-index: 20;
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.4s;
  }
  .dot.active {
    width: 18px;
    border-radius: 3px;
    background: #00ff33;
    box-shadow: 0 0 4px #00ff33;
  }

  .brand-mark {
    position: absolute;
    top: 16px;
    left: 20px;
    z-index: 20;
  }

  /* ── Loading ───────────────────────────────────────────────── */
  .loading-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .loading-ring {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0, 255, 51, 0.15);
    border-top-color: #00ff33;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ── CRT Effects ──────────────────────────────────────────── */
  .crt-layer {
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
  }
  .crt-layer > * {
    position: absolute;
    inset: 0;
  }
  :global(.scanlines) {
    background: linear-gradient(to bottom,
      rgba(255,255,255,0),
      rgba(255,255,255,0) 50%,
      rgba(0,0,0,0.5) 50%,
      rgba(0,0,0,0.5));
    background-size: 100% 3px;
  }
  :global(.tube-vignette) {
    background: radial-gradient(circle at center,
      rgba(0,0,0,0) 55%,
      rgba(0,0,0,0.5) 85%,
      rgba(0,0,0,0.85) 100%);
  }
  :global(.glare) {
    background: linear-gradient(135deg,
      rgba(255,255,255,0.06) 0%,
      rgba(255,255,255,0) 45%,
      rgba(255,255,255,0.03) 100%);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
