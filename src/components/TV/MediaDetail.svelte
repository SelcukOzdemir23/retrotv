<script lang="ts">
  import { onMount } from 'svelte';
  import {
    appStore,
    setMediaDetail,
    setMediaDetailLoading,
    startPlaying,
    stopPlaying,
  } from '../../stores/appStore';
  import { getMovieDetail, getTVDetail, getTVSeasonDetail } from '../../lib/tmdbApi';
  import type { TMDBMediaItem, TMDBMovieDetail, TMDBTVDetail } from '../../lib/types';
  import {
    posterUrl, backdropUrl, getMediaTitle, getMediaYear, getVidkingUrl,
  } from '../../lib/types';

  $: media = $appStore.selectedMedia;
  $: detail = $appStore.mediaDetail;
  $: isLoading = $appStore.mediaDetailLoading;
  $: isPlaying = $appStore.isPlaying;

  let selectedSeason = 1;
  let selectedEpisode = 1;
  let seasonEpisodes: { id: number; name: string; episode_number: number; overview: string; still_path: string | null; air_date: string; vote_average: number }[] = [];
  let loadingSeason = false;
let error: string | null = null;

  onMount(async () => { if (media) await loadDetail(media); });

  async function loadDetail(m: TMDBMediaItem) {
    setMediaDetailLoading(true);
    try {
      if (m.media_type === 'movie') {
        setMediaDetail({ ...(await getMovieDetail(m.id)), media_type: 'movie' });
      } else {
        const d = await getTVDetail(m.id);
        setMediaDetail({ ...d, media_type: 'tv' });
        if (d.seasons.length > 0) {
          const first = d.seasons.find(s => s.season_number > 0) || d.seasons[0];
          selectedSeason = first.season_number;
          await loadSeasonEpisodes(m.id, selectedSeason);
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Bilinmeyen hata oluştu.';
      console.error(e);
    }
    finally { setMediaDetailLoading(false); }
  }

  async function loadSeasonEpisodes(tvId: number, sn: number) {
    loadingSeason = true; seasonEpisodes = [];
    try { seasonEpisodes = (await getTVSeasonDetail(tvId, sn)).episodes; }
    catch (e) {
    error = e instanceof Error ? e.message : 'Bilinmeyen hata oluştu.';
    console.error(e);
  }
    finally { loadingSeason = false; }
  }

  async function changeSeason(s: number) {
    selectedSeason = s; selectedEpisode = 1;
    if (media?.media_type === 'tv') await loadSeasonEpisodes(media.id, s);
  }

  function playMovie() { if (media) startPlaying(); }
  function playEpisode(ep: number) { if (media) { selectedEpisode = ep; startPlaying(); } }
  function goBack() {
    stopPlaying();
    appStore.setKey('selectedMedia', null);
    appStore.setKey('mediaDetail', null);
    appStore.setKey('view', 'home');
  }

  function isMovie(d: TMDBMediaItem | TMDBMovieDetail | TMDBTVDetail | null): d is TMDBMovieDetail {
    return d !== null && d.media_type === 'movie';
  }
  function isTV(d: TMDBMediaItem | TMDBMovieDetail | TMDBTVDetail | null): d is TMDBTVDetail {
    return d !== null && d.media_type === 'tv';
  }

  function runtime(): string {
    if (!isMovie(detail)) return '';
    const r = detail.runtime;
    if (!r) return '';
    return `${Math.floor(r / 60)}h ${r % 60}m`;
  }
  function seasons() {
    if (!isTV(detail)) return [];
    return detail.seasons.filter(s => s.season_number > 0);
  }
</script>

{#if media}
  <div class="root" class:no-scroll={isPlaying}>

    {#if isPlaying}
      <!-- ═══ PLAYER ═══ -->
      <div class="player-wrap">
        <div class="player-box">
          <iframe
            src={media.media_type === 'movie'
              ? getVidkingUrl(media)
              : getVidkingUrl(media, selectedSeason, selectedEpisode)}
            title={getMediaTitle(media)}
            class="player-iframe"
            allowfullscreen
            allow="autoplay; encrypted-media"
          ></iframe>
          <button on:click={() => stopPlaying()} class="back-pill" aria-label="Back">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
        </div>
      </div>

      {#if media.media_type === 'tv' && seasonEpisodes.length > 0}
        <div class="ep-tray">
          <div class="tray-head"><span class="osd-text">EPISODES</span><div class="tray-line"></div></div>
          <div class="tray-scroll">
            {#each seasonEpisodes as ep}
              <button on:click={() => playEpisode(ep.episode_number)}
                      class="tray-ep" class:cur={selectedEpisode === ep.episode_number}>
                <span class="tray-n">{String(ep.episode_number).padStart(2,'0')}</span>
                <span class="tray-t">{ep.name}</span>
                {#if selectedEpisode === ep.episode_number}<span class="tray-dot"></span>{/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}

    {:else}
      <!-- ═══ DETAIL ═══ -->
      <div class="detail-scroll">
        {#if error}
          <div class="d-error">
            <span class="osd-text">HATA</span>
            <p class="d-error-msg">{error}</p>
            <button on:click={() => { error = null; }} class="d-play">Tekrar Dene</button>
          </div>
        {/if}
        <!-- Hero -->
        <div class="d-hero">
          {#if media.backdrop_path}
            <img src={backdropUrl(media.backdrop_path, 'w1280')} alt="" class="d-hero-bg" loading="lazy"/>
            <div class="d-hero-ov"></div>
          {:else}<div class="d-hero-empty"></div>{/if}

          <button on:click={goBack} class="back-pill" aria-label="Back">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>

          <div class="d-hero-info">
            {#if media.poster_path}
              <div class="d-poster"><img src={posterUrl(media.poster_path,'w300')} alt={getMediaTitle(media)} loading="lazy"/></div>
            {/if}
            <div class="d-hero-txt">
              <h1 class="d-title">{getMediaTitle(media)}</h1>
              <div class="d-meta">
                <span class="m-yr">{getMediaYear(media)}</span>
                {#if media.media_type==='tv'}<span class="m-badge">TV</span>{/if}
                {#if runtime()}<span class="m-dur">{runtime()}</span>{/if}
                {#if media.vote_average>0}<span class="m-rat">★ {media.vote_average.toFixed(1)}</span>{/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="d-body">
          {#if detail?.genres}
            <div class="d-genres">{#each detail.genres as g}<span class="g-pill">{g.name}</span>{/each}</div>
          {/if}

          {#if media.overview}<p class="d-overview">{media.overview}</p>{/if}

          {#if media.media_type === 'movie'}
            <button on:click={playMovie} class="d-play">
              {#if isLoading}<div class="spin"></div>{:else}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>{/if}
              {isLoading ? 'Loading...' : 'Watch Now'}
            </button>
          {/if}

          {#if media.media_type==='tv' && detail?.media_type==='tv'}
            <div class="d-section">
              <div class="d-sec-head"><span class="osd-text">SEASONS</span><div class="d-sec-line"></div></div>
              <div class="d-seasons">
                {#each seasons() as s}
                  <button on:click={() => changeSeason(s.season_number)}
                          class="d-schip" class:active={selectedSeason===s.season_number}>
                    <span class="d-schip-n">S{s.season_number}</span>
                    <span class="d-schip-c">{s.episode_count} ep</span>
                  </button>
                {/each}
              </div>
            </div>

            <div class="d-section">
              <div class="d-sec-head"><span class="osd-text">S{String(selectedSeason).padStart(2,'0')} EPISODES</span><div class="d-sec-line"></div></div>
              {#if loadingSeason}
                <div class="d-skels">{#each Array(5) as _}<div class="d-skel"></div>{/each}</div>
              {:else}
                <div class="d-eps">
                  {#each seasonEpisodes as ep}
                    <button on:click={() => playEpisode(ep.episode_number)} class="d-ep">
                      <span class="d-ep-n">{ep.episode_number}</span>
                      <div class="d-ep-body">
                        <span class="d-ep-name">{ep.name}</span>
                        {#if ep.overview}<span class="d-ep-desc">{ep.overview}</span>{/if}
                      </div>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="d-ep-play"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
.root { width: 100%; height: 100%; }
.no-scroll { overflow: hidden; }

/* ═══ BACK PILL ═══ */
.back-pill {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 20px;
  background: rgba(0,0,0,0.75); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.55); font-family: var(--ff-ui); font-size: 11px; font-weight: 500;
  cursor: pointer; transition: all 0.12s; backdrop-filter: none;
}
.back-pill:hover { background: rgba(0,0,0,0.9); color: #fff; border-color: rgba(255,255,255,0.15); }

/* ═══════════════════════════════════════════════════════════════
   PLAYER
   ═══════════════════════════════════════════════════════════════ */
.player-wrap {
  width: 100%; height: 100%; background: #000;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 12px;
  box-sizing: border-box;
}
.player-box {
  width: 100%;
  max-width: 960px;
  aspect-ratio: 16/9;
  position: relative;
  border-radius: var(--r-md);
  overflow: hidden;
  background: #000;
  box-shadow: 0 0 40px rgba(0,0,0,0.8);
  border: 1px solid rgba(255,255,255,0.04);
}
.player-iframe {
  width: 100%; height: 100%; border: 0; display: block;
}

/* ═══ Episode tray (during playback) ═══ */
.ep-tray { padding: var(--sp-md) var(--sp-lg); }
.tray-head { display: flex; align-items: center; gap: 10px; margin-bottom: var(--sp-sm); }
.tray-line { flex: 1; height: 1px; background: rgba(0,255,51,0.08); }
.tray-scroll { display: flex; flex-direction: column; gap: 2px; max-height: 180px; overflow-y: auto; }
.tray-scroll::-webkit-scrollbar { width: 2px; }
.tray-scroll::-webkit-scrollbar-thumb { background: rgba(0,255,51,0.1); border-radius: 2px; }
.tray-ep {
  display: flex; align-items: center; gap: 10px; padding: 7px 10px;
  border-radius: var(--r-sm); border: 1px solid transparent; background: transparent;
  cursor: pointer; transition: all 0.1s; text-align: left; width: 100%;
}
.tray-ep:hover { background: var(--c-surface); }
.tray-ep.cur { background: var(--c-green-dim); border-color: var(--c-green-border); }
.tray-n { font-family: var(--ff-mono); font-size: 10px; color: rgba(0,255,51,0.35); width: 18px; text-align: right; flex-shrink: 0; }
.tray-t { font-family: var(--ff-ui); font-size: 12px; color: var(--c-text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tray-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--c-green); box-shadow: 0 0 6px var(--c-green); flex-shrink: 0; }

/* ═══════════════════════════════════════════════════════════════
   DETAIL
   ═══════════════════════════════════════════════════════════════ */
.detail-scroll { width: 100%; height: 100%; overflow-y: auto; overflow-x: hidden; }
.detail-scroll::-webkit-scrollbar { width: 3px; }
.detail-scroll::-webkit-scrollbar-thumb { background: rgba(0,255,51,0.1); border-radius: 3px; }

/* ── Hero ─────────────────────────────── */
.d-hero {
  position: relative; width: 100%; aspect-ratio: 2.2/1;
  background: #111; overflow: hidden; flex-shrink: 0;
  min-height: 180px;
}
.d-hero-bg { width: 100%; height: 100%; object-fit: cover; }
.d-hero-ov {
  position: absolute; inset: 0;
  background: linear-gradient(to top, var(--c-bg) 5%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.6) 100%);
}
.d-hero-empty { width: 100%; height: 100%; background: #111; }

.d-hero-info {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: var(--sp-lg) var(--sp-lg); display: flex; align-items: flex-end; gap: var(--sp-md);
}
@media (min-width: 768px) { .d-hero-info { padding: var(--sp-lg) var(--sp-xl); } }

.d-poster {
  width: 64px; aspect-ratio: 2/3; border-radius: var(--r-md); overflow: hidden;
  border: 1px solid var(--c-border); flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6);
}
.d-poster img { width: 100%; height: 100%; object-fit: cover; }
.d-hero-txt { flex: 1; min-width: 0; }
.d-title {
  font-family: var(--ff-ui); font-size: 20px; font-weight: 700;
  color: rgba(255,255,255,0.92); line-height: 1.15; margin: 0 0 5px;
}
@media (min-width: 768px) { .d-title { font-size: 26px; } }
.d-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.m-yr { font-family: var(--ff-mono); font-size: 11px; color: var(--c-text-dim); }
.m-badge { font-family: var(--ff-mono); font-size: 9px; font-weight: 600; color: rgba(0,255,51,0.55); padding: 1px 6px; background: var(--c-green-dim); border: 1px solid var(--c-green-border); border-radius: 3px; }
.m-dur { font-family: var(--ff-mono); font-size: 11px; color: var(--c-text-muted); }
.m-rat { font-family: var(--ff-mono); font-size: 11px; color: var(--c-gold); }

/* ── Body ─────────────────────────────── */
.d-body { padding: var(--sp-lg); }
@media (min-width: 768px) { .d-body { padding: var(--sp-lg) var(--sp-xl) var(--sp-xl); } }

.d-genres { display: flex; gap: 5px; margin-bottom: var(--sp-md); flex-wrap: wrap; }
.g-pill { font-family: var(--ff-mono); font-size: 10px; padding: 2px 8px; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 3px; color: var(--c-text-dim); }

.d-overview {
  font-family: var(--ff-ui); font-size: 13px; line-height: 1.7;
  color: var(--c-text-dim); margin: 0 0 var(--sp-lg); max-width: 520px;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}

.d-play {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 28px; border-radius: var(--r-md);
  background: var(--c-green-dim); border: 1px solid var(--c-green-border);
  color: var(--c-green); font-family: var(--ff-ui); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; margin-bottom: var(--sp-lg);
}
.d-play:hover { background: rgba(0,255,51,0.14); border-color: rgba(0,255,51,0.3); }

.spin { width: 15px; height: 15px; border: 2px solid rgba(0,255,51,0.2); border-top-color: var(--c-green); border-radius: 50%; animation: sp 0.6s linear infinite; }

/* ── Sections ──────────────────────────── */
.d-section { margin-bottom: var(--sp-lg); }
.d-sec-head { display: flex; align-items: center; gap: 10px; margin-bottom: var(--sp-sm); }
.d-sec-line { flex: 1; height: 1px; background: rgba(0,255,51,0.06); }

.d-seasons { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
.d-seasons::-webkit-scrollbar { display: none; }
.d-schip {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 6px 14px; border-radius: var(--r-sm);
  border: 1px solid var(--c-border); background: var(--c-surface);
  color: var(--c-text-dim); font-family: var(--ff-ui); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.12s;
}
.d-schip-n { font-weight: 600; }
.d-schip-c { font-family: var(--ff-mono); font-size: 9px; color: var(--c-text-muted); }
.d-schip:hover { border-color: rgba(255,255,255,0.1); color: var(--c-text); }
.d-schip.active { background: var(--c-green-dim); border-color: var(--c-green-border); color: var(--c-green); }

.d-eps { display: flex; flex-direction: column; gap: 2px; }
.d-ep {
  display: flex; align-items: flex-start; gap: 12px; padding: 12px;
  border-radius: var(--r-md); border: 1px solid transparent; background: transparent;
  cursor: pointer; transition: all 0.1s; text-align: left; width: 100%;
}
.d-ep:hover { background: var(--c-surface); border-color: var(--c-border); }
.d-ep-n { font-family: var(--ff-mono); font-size: 18px; font-weight: 600; color: rgba(0,255,51,0.15); width: 26px; text-align: right; flex-shrink: 0; line-height: 1.2; }
.d-ep-body { flex: 1; min-width: 0; }
.d-ep-name { display: block; font-family: var(--ff-ui); font-size: 13px; font-weight: 500; color: var(--c-text); margin-bottom: 2px; }
.d-ep:hover .d-ep-name { color: rgba(255,255,255,0.9); }
.d-ep-desc {
  display: block; font-family: var(--ff-ui); font-size: 11px;
  color: var(--c-text-muted); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.d-ep-play { flex-shrink: 0; color: rgba(255,255,255,0.08); margin-top: 3px; transition: color 0.1s; }
.d-ep:hover .d-ep-play { color: rgba(0,255,51,0.35); }

.d-skels { display: flex; flex-direction: column; gap: 6px; }
.d-skel { height: 48px; background: var(--c-surface); border-radius: var(--r-md); animation: p 1.5s infinite; }

@keyframes sp { to { transform: rotate(360deg); } }
@keyframes p { 0%,100% { opacity: 0.02; } 50% { opacity: 0.05; } }

/* Error banner */
.d-error {
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-2);
  padding: var(--sp-6); background: var(--c-error-dim);
  border: 1px solid var(--c-error-border); border-radius: var(--r-md);
  color: var(--c-text); text-align: center; margin: var(--sp-4) 0;
}
.d-error .osd-text {
  font-family: var(--ff-mono); font-size: var(--fs-xs); color: var(--c-error);
  letter-spacing: 0.05em; text-transform: uppercase;
}
.d-error-msg {
  font-family: var(--ff-ui); font-size: var(--fs-sm);
  color: var(--c-text-dim); margin: 0; line-height: 1.5;
}
</style>
