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
  import { backdropUrl, posterUrl, getMediaTitle, getMediaYear } from "../../lib/types";

  let turnOnAnim = false;
  let turnOffAnim = false;
  let crtEnabled = true;

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

<div class="screen" class:crt-off={!crtEnabled} class:flicker={$tvStore.power} class:turn-on-anim={turnOnAnim} class:turn-off-anim={turnOffAnim}>

  {#if !$tvStore.power}
    <div class="standby">
      <div class="standby-dot"></div>
    </div>
  {/if}

  {#if $tvStore.power}
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="RetroTV ana sayfa"><span class="wordmark-mark">R</span>RETRO<span class="wordmark-tv">TV</span></a>
      <nav class="main-nav" aria-label="Ana menü">
        <button class="nav-link active" on:click={() => setView('home')}>Ana Sayfa</button>
        <button class="nav-link" on:click={() => setBrowserOpen(true)}>Keşfet</button>
        <button class="nav-link" on:click={() => setBrowserOpen(true)}>Filmler ve Diziler</button>
      </nav>
      <button class="crt-toggle" class:enabled={crtEnabled} on:click={() => crtEnabled = !crtEnabled} aria-pressed={crtEnabled} aria-label={crtEnabled ? 'CRT efektlerini kapat' : 'CRT efektlerini aç'}>CRT</button>
      <button class="header-search" on:click={() => setBrowserOpen(true)} aria-label="İçerik ara">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <span>Ara</span>
      </button>
    </header>
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
                  <span class="osd-text">BU HAFTANIN ÖNE ÇIKANI</span>
                </div>

                <h1 class="hero-title">{getMediaTitle(featuredMedia)}</h1>

                <div class="hero-meta">
                  <span class="meta-year">{getMediaYear(featuredMedia)}</span>
                  <span class="meta-type">{featuredMedia.media_type === 'movie' ? 'FİLM' : 'DİZİ'}</span>
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
                    <span>İncele</span>
                  </Button>
                  <Button onClick={() => setBrowserOpen(true)} variant="ghost" size="lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span>Keşfet</span>
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
            {#if trendingItems.length > 1}
              <section class="trending-section" aria-label="Trend içerikler">
                <div class="section-heading">
                  <div>
                    <span class="section-kicker">ŞİMDİ POPÜLER</span>
                    <h2>İzleyicilerin seçtikleri</h2>
                  </div>
                  <button class="see-all" on:click={() => setBrowserOpen(true)}>Tümünü gör <span aria-hidden="true">→</span></button>
                </div>
                <div class="poster-rail">
                  {#each trendingItems.slice(1, 9) as item, i (item.id)}
                    <button class="poster-card" on:click={() => selectMedia(item)} aria-label={`${getMediaTitle(item)} detaylarını aç`}>
                      <span class="poster-image">
                        {#if item.poster_path}
                          <img src={posterUrl(item.poster_path, 'w342')} alt="" loading="lazy" />
                        {:else}
                          <span class="poster-placeholder">{getMediaTitle(item)}</span>
                        {/if}
                        <span class="poster-number">{String(i + 1).padStart(2, '0')}</span>
                      </span>
                      <span class="poster-title">{getMediaTitle(item)}</span>
                      <span class="poster-meta">{getMediaYear(item)} · {item.media_type === 'movie' ? 'Film' : 'Dizi'}</span>
                    </button>
                  {/each}
                </div>
              </section>
            {/if}
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
    min-height: 100dvh;
    position: relative;
    overflow: clip;
    background: var(--c-bg);
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
    position: relative;
    z-index: 1;
  }

  .home-scroll, .detail-scroll {
    width: 100%;
    height: auto;
    min-height: 100dvh;
    overflow: visible;
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
    min-height: min(820px, 92dvh);
    height: min(820px, 92dvh);
    background: #101310;
  }
  .hero-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 35%;
  }
  .hero-gradient {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(9,10,9,.96) 0%, rgba(9,10,9,.78) 34%, rgba(9,10,9,.16) 74%, rgba(9,10,9,.12) 100%),
      linear-gradient(0deg, var(--c-bg) 0%, transparent 25%, rgba(9,10,9,.18) 100%);
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
    justify-content: center;
    min-height: 100%;
    padding: 112px clamp(24px, 8vw, 124px) 76px;
    max-width: 760px;
    box-sizing: border-box;
  }
  @media (max-width: 767px) {
    .hero { height: min(760px, 88dvh); min-height: 590px; }
    .hero-gradient {
      background:
        linear-gradient(0deg, var(--c-bg) 0%, rgba(9,10,9,.75) 34%, rgba(9,10,9,.08) 100%),
        linear-gradient(90deg, rgba(9,10,9,.24), transparent);
    }
    .hero-content { justify-content: flex-end; padding: 100px 24px 74px; }
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
    color: var(--c-green);
    padding: 4px 9px;
    background: rgba(0, 230, 56, 0.10);
    border: 1px solid rgba(0, 230, 56, 0.22);
    border-radius: 999px;
  }
  .meta-rating {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: rgba(255, 200, 50, 0.8);
  }

  .hero-desc {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.72);
    max-width: 500px;
    margin: 0 0 24px 0;
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

  .site-header {
    position: absolute;
    z-index: 30;
    top: 0;
    left: 0;
    right: 0;
    height: 76px;
    padding: 0 clamp(22px, 5vw, 72px);
    display: flex;
    align-items: center;
    gap: 52px;
    background: linear-gradient(180deg, rgba(9,10,9,.82), transparent);
  }
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: white;
    text-decoration: none;
    font-family: var(--ff-ui);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -.07em;
  }
  .wordmark-mark {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    background: var(--c-green);
    color: #071008;
    font-size: 19px;
    line-height: 1;
    border-radius: 8px;
  }
  .wordmark-tv { color: var(--c-green); }
  .main-nav { display: flex; align-items: center; gap: 30px; }
  .nav-link {
    border: 0;
    padding: 8px 0;
    background: none;
    color: rgba(255,255,255,.68);
    font-size: 14px;
    cursor: pointer;
    transition: color 160ms ease;
  }
  .nav-link:hover, .nav-link.active { color: white; }
  .nav-link.active { box-shadow: inset 0 -2px var(--c-green); }
  .header-search {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(255,255,255,.22);
    border-radius: 999px;
    padding: 9px 15px;
    background: rgba(9,10,9,.38);
    color: white;
    cursor: pointer;
  }
  .header-search span { font-size: 13px; }
  .crt-toggle {
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 999px;
    padding: 8px 11px;
    background: transparent;
    color: rgba(255,255,255,.64);
    font: 11px var(--ff-mono);
    cursor: pointer;
  }
  .crt-toggle.enabled { border-color: rgba(0,230,56,.4); color: var(--c-green); }
  .screen.crt-off .crt-layer { display: none; }
  .trending-section {
    padding: 4px clamp(22px, 5vw, 72px) 80px;
    background: var(--c-bg);
  }
  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
  }
  .section-kicker {
    color: var(--c-green);
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: .12em;
  }
  .section-heading h2 {
    margin: 5px 0 0;
    font-size: clamp(22px, 2.4vw, 30px);
    letter-spacing: -.04em;
  }
  .see-all {
    border: 0;
    background: none;
    color: rgba(255,255,255,.68);
    cursor: pointer;
    white-space: nowrap;
    font-size: 13px;
  }
  .see-all span { color: var(--c-green); padding-left: 5px; }
  .poster-rail {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 18px;
  }
  .poster-card {
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .poster-image {
    position: relative;
    display: block;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    background: #171a17;
    border-radius: 10px;
    transition: transform 220ms ease, box-shadow 220ms ease;
  }
  .poster-card:hover .poster-image {
    transform: translateY(-5px);
    box-shadow: 0 12px 32px rgba(0,0,0,.38);
  }
  .poster-image img { width: 100%; height: 100%; object-fit: cover; }
  .poster-number {
    position: absolute;
    bottom: -9px;
    left: 7px;
    color: rgba(255,255,255,.9);
    font-family: var(--ff-mono);
    font-size: 26px;
    font-weight: 600;
    text-shadow: 0 2px 8px #000;
  }
  .poster-placeholder {
    display: grid;
    height: 100%;
    place-items: center;
    padding: 12px;
    color: var(--c-text-dim);
    text-align: center;
  }
  .poster-title {
    display: block;
    overflow: hidden;
    margin-top: 14px;
    color: rgba(255,255,255,.9);
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .poster-meta { display: block; margin-top: 3px; color: var(--c-text-dim); font-size: 11px; }
  @media (max-width: 900px) {
    .poster-rail { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .poster-card:nth-child(n + 5) { display: none; }
    .main-nav { gap: 18px; }
    .site-header { gap: 28px; }
  }
  @media (max-width: 600px) {
    .site-header { height: 66px; padding: 0 18px; }
    .main-nav { display: none; }
    .header-search { padding: 8px; }
    .header-search span { display: none; }
    .hero-title { font-size: clamp(34px, 11vw, 48px); }
    .hero-desc { font-size: 13px; }
    .hero-arrows { display: none; }
    .trending-section { padding: 0 18px 52px; }
    .poster-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .section-heading { align-items: center; }
    .see-all { font-size: 12px; }
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
    z-index: 2;
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
      rgba(0,0,0,0.14) 50%,
      rgba(0,0,0,0.14));
    background-size: 100% 4px;
    opacity: .12;
  }
  :global(.tube-vignette) {
    background: radial-gradient(circle at center,
      rgba(0,0,0,0) 64%,
      rgba(0,0,0,0.12) 100%);
  }
  :global(.glare) {
    display: none;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-live-dot { animation: none; }
    .poster-image, .nav-link { transition: none; }
  }
</style>
