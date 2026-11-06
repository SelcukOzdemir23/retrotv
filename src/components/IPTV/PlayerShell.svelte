<script lang="ts">
  import { onMount } from 'svelte';
  import ChannelRail from './ChannelRail.svelte';
  import PlaylistDialog from './PlaylistDialog.svelte';
  import VideoSurface from './VideoSurface.svelte';
  import {
    fetchDirectoryCountries,
    fetchPlaylist,
    getCountryPlaylistUrl,
    MAX_PLAYLIST_BYTES,
    parseM3U,
  } from '../../lib/iptv/playlist';
  import type { Channel, DirectoryCountry, PlaybackStatus } from '../../lib/iptv/types';

  const FAVORITES_KEY = 'retrotv.iptv-favorites';
  const COUNTRY_KEY = 'retrotv.iptv-country';

  let countries = $state<DirectoryCountry[]>([]);
  let channels = $state<Channel[]>([]);
  let activeChannel = $state<Channel | null>(null);
  let favorites = $state<string[]>([]);
  let selectedCountry = $state('TR');
  let sourceDialogOpen = $state(false);
  let sourceLoading = $state(false);
  let sourceError = $state('');
  let countryListLoading = $state(false);
  let countryListError = $state('');
  let playlistName = $state('');
  let playlistKind = $state<'directory' | 'file' | 'url' | null>(null);
  let playbackStatus = $state<PlaybackStatus>('idle');
  let playbackMessage = $state('');
  let hasLoadedCountries = false;

  let favoriteSet = $derived(new Set(favorites));
  let sourceOrigin = $derived.by(() => {
    if (!activeChannel) return '';
    try {
      return new URL(activeChannel.url).host;
    } catch {
      return '';
    }
  });

  onMount(() => {
    try {
      const savedFavorites: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      if (Array.isArray(savedFavorites)) favorites = savedFavorites.filter((id): id is string => typeof id === 'string');
      selectedCountry = localStorage.getItem(COUNTRY_KEY) || 'TR';
    } catch {
      favorites = [];
    }
  });

  async function openSourceDialog() {
    sourceDialogOpen = true;
    sourceError = '';
    if (hasLoadedCountries || countryListLoading) return;

    countryListLoading = true;
    countryListError = '';
    try {
      countries = await fetchDirectoryCountries();
      hasLoadedCountries = true;
      if (!countries.some((item) => item.code === selectedCountry)) {
        selectedCountry = countries.find((item) => item.code === 'TR')?.code ?? countries[0]?.code ?? 'TR';
      }
    } catch {
      countryListError = 'Topluluk ülke dizini şu an yüklenemiyor.';
    } finally {
      countryListLoading = false;
    }
  }

  function setPlaybackStatus(status: PlaybackStatus, message: string) {
    playbackStatus = status;
    playbackMessage = message;
  }

  function commitPlaylist(
    parsed: ReturnType<typeof parseM3U>,
    name: string,
    kind: 'directory' | 'file' | 'url',
  ) {
    if (parsed.channels.length === 0) {
      throw new Error('Playlist içinde geçerli kanal bulunamadı.');
    }

    channels = parsed.channels;
    activeChannel = null;
    playlistName = name;
    playlistKind = kind;
    playbackStatus = 'idle';
    playbackMessage = '';
    sourceError = parsed.skippedEntries
      ? `${parsed.skippedEntries} geçersiz veya tekrarlanan satır atlandı.`
      : '';
    sourceDialogOpen = false;
  }

  async function loadDirectoryCountry() {
    sourceLoading = true;
    sourceError = '';
    try {
      const country = countries.find((item) => item.code === selectedCountry);
      const result = await fetchPlaylist(getCountryPlaylistUrl(selectedCountry));
      commitPlaylist(result, `IPTV-org · ${country?.name ?? selectedCountry}`, 'directory');
      localStorage.setItem(COUNTRY_KEY, selectedCountry);
    } catch (cause) {
      sourceError = cause instanceof Error ? cause.message : 'Ülke playlist’i yüklenemedi.';
    } finally {
      sourceLoading = false;
    }
  }

  async function importFile(file: File) {
    sourceLoading = true;
    sourceError = '';
    try {
      if (file.size > MAX_PLAYLIST_BYTES) throw new Error('Playlist dosyası 25 MB sınırını aşıyor.');
      const result = parseM3U(await file.text());
      commitPlaylist(result, file.name, 'file');
    } catch (cause) {
      sourceError = cause instanceof Error ? cause.message : 'Playlist dosyası okunamadı.';
    } finally {
      sourceLoading = false;
    }
  }

  async function importUrl(url: string) {
    sourceLoading = true;
    sourceError = '';
    try {
      const result = await fetchPlaylist(url);
      const origin = new URL(url).host;
      commitPlaylist(result, origin, 'url');
    } catch (cause) {
      sourceError = cause instanceof Error ? cause.message : 'Playlist adresi yüklenemedi.';
    } finally {
      sourceLoading = false;
    }
  }

  function selectChannel(channel: Channel) {
    activeChannel = channel;
    playbackStatus = 'loading';
    playbackMessage = '';
  }

  function toggleFavorite(channelId: string) {
    favorites = favorites.includes(channelId)
      ? favorites.filter((id) => id !== channelId)
      : [...favorites, channelId];

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Favorites remain available for this session if storage is disabled.
    }
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && sourceDialogOpen) {
      sourceDialogOpen = false;
      return;
    }

    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, select, textarea, video, button, [role="dialog"]')) return;
    if (!channels.length || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;

    const currentIndex = activeChannel ? channels.findIndex((item) => item.id === activeChannel.id) : -1;
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = currentIndex < 0
      ? (direction === 1 ? 0 : channels.length - 1)
      : (currentIndex + direction + channels.length) % channels.length;
    event.preventDefault();
    selectChannel(channels[nextIndex]);
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="player-app">
  <header class="topbar">
    <a class="brand" href={import.meta.env.BASE_URL} aria-label="RetroTV ana sayfa">
      <span class="brand-mark" aria-hidden="true">R</span>
      <span>RETRO<span class="brand-tv">TV</span></span>
    </a>
    <div class="brand-divider"></div>
    <span class="product-label">SİNYAL MASASI</span>
    <div class="topbar-right">
      {#if playlistName}
        <span class="source-label" title={playlistName}>
          <span class="source-dot"></span>
          {playlistName}
        </span>
      {/if}
      <button class="source-button" type="button" onclick={openSourceDialog}>
        <span aria-hidden="true">＋</span> Kaynak ekle
      </button>
    </div>
  </header>

  <main class="broadcast-layout">
    <ChannelRail
      {channels}
      selectedId={activeChannel?.id ?? null}
      {favorites}
      loading={sourceLoading}
      onSelect={selectChannel}
      onOpenSources={openSourceDialog}
      onToggleFavorite={toggleFavorite}
    />

    <section class="main-stage" aria-label="Canlı yayın alanı">
      <VideoSurface channel={activeChannel} onPlaybackStatus={setPlaybackStatus} />
    </section>

    <aside class="signal-panel" aria-label="Yayın bilgisi">
      <div class="signal-panel-head">
        <p class="panel-kicker">SİNYAL DURUMU</p>
        <span class="signal-state" class:active={playbackStatus === 'playing'}>
          <span aria-hidden="true"></span>
          {playbackStatus === 'playing' ? 'YAYINDA' : playbackStatus === 'loading' ? 'BAĞLANIYOR' : 'BEKLEMEDE'}
        </span>
      </div>

      {#if activeChannel}
        <div class="current-channel">
          <p class="detail-label">ŞİMDİ SEÇİLİ</p>
          <h2>{activeChannel.name}</h2>
          {#if activeChannel.group}<p class="channel-group">{activeChannel.group}</p>{/if}
        </div>
        <dl class="signal-details">
          <div><dt>Format</dt><dd>{activeChannel.format === 'hls' ? 'HLS adaptif yayın' : activeChannel.format === 'file' ? 'Doğrudan video' : activeChannel.format === 'mpeg-ts' ? 'MPEG-TS' : 'Bilinmiyor'}</dd></div>
          <div><dt>Kaynak</dt><dd class="source-host">{sourceOrigin || 'Yerel playlist'}</dd></div>
          {#if playlistKind}<div><dt>Liste türü</dt><dd>{playlistKind === 'directory' ? 'Topluluk dizini' : playlistKind === 'file' ? 'Yerel dosya' : 'Uzak URL'}</dd></div>{/if}
          {#if activeChannel.language}<div><dt>Dil</dt><dd>{activeChannel.language}</dd></div>{/if}
        </dl>
      {:else}
        <div class="signal-empty">
          <span class="signal-ring" aria-hidden="true"></span>
          <p>Henüz yayın seçilmedi.</p>
          <span>Bir kanal seçtiğinde bağlantı durumu burada görünür.</span>
        </div>
      {/if}

      {#if countryListError}
        <p class="directory-warning" role="status">{countryListError} Kendi M3U dosyanı yine de yükleyebilirsin.</p>
      {/if}
      {#if playbackMessage}
        <p class="directory-warning" role="status">{playbackMessage}</p>
      {/if}
    </aside>
  </main>

  <footer class="app-footer">
    <span>RETROTV · IPTV OYNATICI</span>
    <span>Yalnızca kullanma hakkına sahip olduğun yayınları aç.</span>
  </footer>
</div>

<PlaylistDialog
  open={sourceDialogOpen}
  {countries}
  countryCode={selectedCountry}
  loading={sourceLoading}
  directoryLoading={countryListLoading}
  directoryError={countryListError}
  error={sourceError}
  onClose={() => sourceDialogOpen = false}
  onCountryChange={(code) => selectedCountry = code}
  onLoadDirectory={loadDirectoryCountry}
  onImportFile={importFile}
  onImportUrl={importUrl}
/>

<style>
  .player-app {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background:
      linear-gradient(115deg, rgba(255,96,75,.035), transparent 35%),
      var(--c-bg);
    color: var(--c-text);
  }
  .topbar {
    min-height: 68px;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 0 clamp(16px, 3vw, 38px);
    border-bottom: 1px solid var(--c-border);
    background: rgba(11,16,20,.92);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: var(--c-text);
    font: 700 16px var(--ff-display);
    letter-spacing: -.055em;
    text-decoration: none;
    white-space: nowrap;
  }
  .brand-mark {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: var(--c-accent);
    color: var(--c-accent-ink);
    font-size: 18px;
  }
  .brand-tv { color: var(--c-accent); }
  .brand-divider { width: 1px; height: 23px; background: var(--c-border); }
  .product-label { color: var(--c-text-muted); font: 500 10px var(--ff-mono); letter-spacing: .13em; }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 18px; }
  .source-label {
    max-width: 260px;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--c-text-muted);
    font: 11px var(--ff-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .source-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c-border-strong); }
  .source-button {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 13px;
    border: 1px solid var(--c-border-strong);
    border-radius: 6px;
    background: var(--c-surface-high);
    color: var(--c-text);
    font: 600 12px var(--ff-ui);
    cursor: pointer;
    transition: border-color 140ms ease, background-color 140ms ease;
  }
  .source-button:hover { border-color: var(--c-accent); background: color-mix(in srgb, var(--c-accent) 9%, var(--c-surface-high)); }
  .source-button span { color: var(--c-accent); font-size: 17px; line-height: 1; }
  .broadcast-layout {
    flex: 1;
    width: 100%;
    max-width: 1800px;
    min-height: 0;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(250px, 292px) minmax(0, 1fr) minmax(220px, 270px);
    gap: 18px;
    margin: 0 auto;
    padding: 20px clamp(16px, 2.2vw, 32px);
  }
  .main-stage { min-width: 0; }
  .signal-panel {
    min-width: 0;
    align-self: start;
    padding: 18px 17px;
    border: 1px solid var(--c-border);
    border-radius: 10px;
    background: var(--c-surface);
  }
  .signal-panel-head { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--c-border); }
  .panel-kicker, .detail-label { margin: 0; color: var(--c-text-subtle); font: 600 10px var(--ff-mono); letter-spacing: .12em; }
  .signal-state { display: inline-flex; align-items: center; gap: 7px; color: var(--c-text-muted); font: 600 10px var(--ff-mono); letter-spacing: .08em; }
  .signal-state > span { width: 7px; height: 7px; border-radius: 50%; background: var(--c-border-strong); }
  .signal-state.active { color: var(--c-accent); }
  .signal-state.active > span { background: var(--c-accent); box-shadow: 0 0 12px color-mix(in srgb, var(--c-accent) 50%, transparent); }
  .current-channel { padding: 18px 0 16px; }
  .current-channel h2 { overflow-wrap: anywhere; margin: 9px 0 4px; color: var(--c-text); font: 600 20px/1.15 var(--ff-display); letter-spacing: -.035em; }
  .channel-group { margin: 0; color: var(--c-text-muted); font-size: 12px; }
  .signal-details { display: grid; gap: 13px; margin: 0; padding: 15px 0; border-top: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border); }
  .signal-details > div { display: grid; gap: 4px; }
  .signal-details dt { color: var(--c-text-subtle); font: 10px var(--ff-mono); text-transform: uppercase; }
  .signal-details dd { overflow-wrap: anywhere; margin: 0; color: var(--c-text); font-size: 12px; line-height: 1.4; }
  .source-host { font-family: var(--ff-mono); }
  .signal-empty { display: grid; justify-items: start; gap: 8px; padding: 20px 0; }
  .signal-ring { width: 13px; height: 13px; border: 1px solid var(--c-accent); border-radius: 50%; }
  .signal-empty p { margin: 0; color: var(--c-text); font-size: 14px; font-weight: 600; }
  .signal-empty span:last-child { color: var(--c-text-muted); font-size: 12px; line-height: 1.5; }
  .directory-warning { margin: 14px 0 0; padding-top: 12px; border-top: 1px solid var(--c-border); color: var(--c-text-muted); font-size: 11px; line-height: 1.55; }
  .app-footer {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 12px clamp(16px, 3vw, 38px);
    border-top: 1px solid var(--c-border);
    color: var(--c-text-subtle);
    font: 9px var(--ff-mono);
    letter-spacing: .04em;
  }
  /* Geniş masaüstü: yayın masası tek ekrana sığar, kanal listesi kendi içinde kayar. */
  @media (min-width: 1181px) {
    .player-app { height: 100dvh; overflow: hidden; }
    .broadcast-layout { grid-template-rows: minmax(0, 1fr); }
    .main-stage { min-height: 0; overflow-y: auto; }
  }
  @media (max-width: 1180px) {
    .broadcast-layout { grid-template-columns: minmax(235px, 280px) minmax(0, 1fr); }
    .signal-panel { grid-column: 2; }
    .channel-rail { max-height: calc(100dvh - 142px); }
  }
  @media (max-width: 760px) {
    .topbar { min-height: 60px; gap: 10px; padding-inline: 13px; }
    .brand-divider, .product-label, .source-label { display: none; }
    .source-button { min-height: 38px; padding-inline: 10px; }
    .broadcast-layout { grid-template-columns: minmax(0,1fr); gap: 13px; padding: 12px; }
    .main-stage { grid-row: 1; }
    .signal-panel { grid-column: auto; grid-row: 2; }
    .channel-rail { grid-row: 3; }
    .app-footer { flex-direction: column; gap: 4px; }
  }
</style>
