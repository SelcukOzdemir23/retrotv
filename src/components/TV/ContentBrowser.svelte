<script lang="ts">
  import { onMount } from 'svelte';
  import {
    appStore, setBrowserOpen, setSearchQuery, setSearchResults, setSearchLoading,
    setGenres, setSelectedGenre, setGenreItems, setGenreLoading,
    setTrending, setTrendingLoading, setBrowserTab, selectMedia,
  } from '../../stores/appStore';
  import { getTrending, searchMedia, getMovieGenres, getTVGenres, discoverMovies, discoverTV } from '../../lib/tmdbApi';
  import type { TMDBMediaItem } from '../../lib/types';
  import { posterUrl, getMediaTitle, getMediaYear } from '../../lib/types';

  $: s = $appStore;
  $: open = s.browserOpen;
  $: tab = s.browserTab;

  let q = '';
  let debounce: ReturnType<typeof setTimeout>;
  let genreType: 'movie' | 'tv' = 'movie';
  let yearFilter = '';
  let ratingFilter = '';
  let searching = false;

  onMount(async () => {
    if (s.trendingItems.length === 0) {
      try { setTrendingLoading(true); setTrending(await getTrending('all','week')); } catch {}
    }
    if (s.genres.length === 0) {
      try {
        const mg = await getMovieGenres(), tg = await getTVGenres();
        const m = new Map<number, {id:number;name:string}>();
        [...mg,...tg].forEach(g => m.set(g.id, g));
        setGenres(Array.from(m.values()));
      } catch {}
    }
  });

  function onSearch() {
    clearTimeout(debounce);
    searching = true;
    debounce = setTimeout(async () => {
      const v = q.trim(); setSearchQuery(v);
      if (!v) { setSearchResults([],1,0); searching = false; setSearchLoading(false); return; }
      setSearchLoading(true);
      try {
        const d = await searchMedia(v);
        setSearchResults(d.results.filter(r => r.media_type==='movie'||r.media_type==='tv'), d.page, d.total_pages);
        setBrowserTab('search');
      } catch {}
      finally { searching = false; setSearchLoading(false); }
    }, 350);
  }

  function clearSearch() {
    q = '';
    setSearchQuery('');
    setSearchResults([],1,0);
    searching = false;
    setSearchLoading(false);
  }

  async function pickGenre(id: number) {
    if (s.selectedGenre === id) { setSelectedGenre(null); setGenreItems([]); return; }
    setSelectedGenre(id); setGenreLoading(true); setBrowserTab('genres');
    try {
      const params: Record<string,string> = {with_genres:String(id)};
      if (yearFilter) params[genreType==='movie' ? 'primary_release_year' : 'first_air_date_year'] = yearFilter;
      if (ratingFilter) params['vote_average.gte'] = ratingFilter;
      const d = genreType==='movie' ? await discoverMovies(params) : await discoverTV(params);
      setGenreItems(d.results);
    } catch {}
  }

  function pick(m: TMDBMediaItem) { selectMedia(m); setBrowserOpen(false); }
  function onKey(e: KeyboardEvent) { if (e.key==='Escape') setBrowserOpen(false); }
</script>

<svelte:window on:keydown={onKey} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="cb-back" on:click={() => setBrowserOpen(false)}></div>
{/if}

<div class="cb" class:open>
  <!-- Header -->
  <header class="cb-hd">
    <div class="cb-hd-row">
      <span class="cb-title">BROWSE</span>
      <button on:click={() => setBrowserOpen(false)} class="cb-x" aria-label="Close">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="cb-search">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cb-search-ic"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <div class="cb-search-wrap">
        <input type="text" bind:value={q} on:input={onSearch} placeholder="Search movies & TV shows..." class="cb-input"/>
        {#if q.trim()}
          <button on:click={clearSearch} class="cb-clear">✕</button>
        {:else if searching}
          <span class="cb-searching">…</span>
        {/if}
      </div>
    </div>
    <div class="cb-tabs">
      <button on:click={() => setBrowserTab('trending')} class="cb-tab" class:active={tab==='trending'}>Trending</button>
      <button on:click={() => setBrowserTab('search')} class="cb-tab" class:active={tab==='search'}>Search</button>
      <button on:click={() => setBrowserTab('genres')} class="cb-tab" class:active={tab==='genres'}>Genres</button>
    </div>
  </header>

  <!-- Content -->
  <div class="cb-body">
    {#if tab==='trending'}
      {#if s.trendingLoading}
        <div class="cb-skels">{#each Array(8) as _}<div class="cb-skel"><div class="cb-skel-img"></div><div class="cb-skel-txt"></div></div>{/each}</div>
      {:else}
        <div class="cb-list">
          {#each s.trendingItems as m, i (m.id)}
            <button on:click={() => pick(m)} class="cb-row">
              <span class="cb-rank">{String(i+1).padStart(2,'0')}</span>
              <div class="cb-thumb">
                {#if m.poster_path}<img src={posterUrl(m.poster_path,'w200')} alt="" loading="lazy"/>{:else}<span>?</span>{/if}
              </div>
              <div class="cb-info">
                <span class="cb-name">{getMediaTitle(m)}</span>
                <span class="cb-meta">{getMediaYear(m)} · {m.media_type==='movie'?'Movie':'TV'}</span>
              </div>
              {#if m.vote_average>0}<span class="cb-rat">★ {m.vote_average.toFixed(1)}</span>{/if}
            </button>
          {/each}
        </div>
      {/if}

    {:else if tab==='search'}
      {#if s.searchLoading}
        <div class="cb-center"><div class="cb-spin"></div></div>
      {:else if s.searchResults.length===0}
        <div class="cb-empty">{q?`No results for "${q}"`:'Type to search...'}</div>
      {:else}
        <div class="cb-list">
          {#each s.searchResults as m (m.id)}
            <button on:click={() => pick(m)} class="cb-row">
              <div class="cb-thumb">{#if m.poster_path}<img src={posterUrl(m.poster_path,'w200')} alt="" loading="lazy"/>{:else}<span>?</span>{/if}</div>
              <div class="cb-info">
                <span class="cb-name">{getMediaTitle(m)}</span>
                <span class="cb-meta">{getMediaYear(m)} · {m.media_type==='movie'?'Movie':'TV'}</span>
              </div>
              {#if m.vote_average>0}<span class="cb-rat">★ {m.vote_average.toFixed(1)}</span>{/if}
            </button>
          {/each}
        </div>
      {/if}

    {:else if tab==='genres'}
      <div class="cb-gtype">
        <button on:click={() => {genreType='movie';if(s.selectedGenre)pickGenre(s.selectedGenre)}} class="cb-gtbtn" class:active={genreType==='movie'}>Movies</button>
        <button on:click={() => {genreType='tv';if(s.selectedGenre)pickGenre(s.selectedGenre)}} class="cb-gtbtn" class:active={genreType==='tv'}>TV Shows</button>
      </div>
      <div class="cb-filters">
        <input type="text" bind:value={yearFilter} placeholder="Yıl" class="cb-filter-input" maxlength="4"/>
        <input type="text" bind:value={ratingFilter} placeholder="Min puan" class="cb-filter-input" maxlength="3"/>
        <button on:click={() => {yearFilter=''; ratingFilter=''; if(s.selectedGenre) pickGenre(s.selectedGenre)}} class="cb-filter-reset">Sıfırla</button>
      </div>
      <div class="cb-chips">
        {#each s.genres as g}
          <button on:click={() => pickGenre(g.id)} class="cb-chip" class:active={s.selectedGenre===g.id}>{g.name}</button>
        {/each}
      </div>
      {#if s.genreLoading}
        <div class="cb-center"><div class="cb-spin"></div></div>
      {:else if s.genreItems.length>0}
        <div class="cb-list">
          {#each s.genreItems as m (m.id)}
            <button on:click={() => pick(m)} class="cb-row">
              <div class="cb-thumb">{#if m.poster_path}<img src={posterUrl(m.poster_path,'w200')} alt="" loading="lazy"/>{:else}<span>?</span>{/if}</div>
              <div class="cb-info">
                <span class="cb-name">{getMediaTitle(m)}</span>
                <span class="cb-meta">{getMediaYear(m)}</span>
              </div>
              {#if m.vote_average>0}<span class="cb-rat">★ {m.vote_average.toFixed(1)}</span>{/if}
            </button>
          {/each}
        </div>
      {:else if s.selectedGenre}
        <div class="cb-empty">No results</div>
      {/if}
    {/if}
  </div>

  <footer class="cb-ft">
    <span>{tab==='trending'?`${s.trendingItems.length} items`:tab==='search'?`${s.searchResults.length} results`:`${s.genres.length} genres`}</span>
    <span class="cb-ft-esc">ESC</span>
  </footer>
</div>

<style>
  .cb-back { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.5); }
  .cb {
    position: fixed; top: 0; right: 0; z-index: 50; height: 100%; width: 100%; max-width: 400px;
    background: #0e0e0e; border-left: 1px solid rgba(255,255,255,0.05);
    display: flex; flex-direction: column;
    transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  .cb.open { transform: translateX(0); }

  .cb-hd { flex-shrink: 0; padding: 14px 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; }
  .cb-hd-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .cb-title { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); letter-spacing: 0.06em; }
  .cb-x { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 4px; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.1s; }
  .cb-x:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }

  .cb-search { position: relative; margin-bottom: 8px; }
  .cb-search-ic { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.15); }
  .cb-input { width: 100%; padding: 7px 10px 7px 28px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 4px; color: rgba(255,255,255,0.65); font-family: 'Space Grotesk', sans-serif; font-size: 11px; outline: none; transition: border-color 0.12s; }
  .cb-input::placeholder { color: rgba(255,255,255,0.15); }
  .cb-input:focus { border-color: rgba(0,255,51,0.2); }

  .cb-search-wrap { position: relative; }
  .cb-clear {
    position: absolute; right: 7px; top: 50%; transform: translateY(-50%);
    width: 20px; height: 20px; background: transparent; border: none;
    color: rgba(255,255,255,0.3); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;
  }
  .cb-clear:hover { color: #00ff33; }
  .cb-searching {
    position: absolute; right: 7px; top: 50%; transform: translateY(-50%);
    color: #00ff33; font-size: 12px; font-family: var(--ff-mono); animation: sp 0.8s linear infinite;
  }

  .cb-filters { display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap; }
  .cb-filter-input {
    flex: 1; min-width: 70px; padding: 3px 6px; border-radius: 3px;
    border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.015);
    color: rgba(255,255,255,0.65); font-family: 'IBM Plex Mono', monospace; font-size: 9px; outline: none;
  }
  .cb-filter-input::placeholder { color: rgba(255,255,255,0.2); }
  .cb-filter-input:focus { border-color: rgba(0,255,51,0.2); }
  .cb-filter-reset {
    padding: 3px 8px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.015); color: rgba(255,255,255,0.3);
    font-family: 'IBM Plex Mono', monospace; font-size: 8px; cursor: pointer; transition: all 0.1s;
  }
  .cb-filter-reset:hover { color: #00ff33; border-color: rgba(0,255,51,0.15); }

  .cb-tabs { display: flex; gap: 3px; }
  .cb-tab { padding: 4px 10px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.015); color: rgba(255,255,255,0.3); font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 500; cursor: pointer; transition: all 0.1s; }
  .cb-tab:hover { color: rgba(255,255,255,0.45); }
  .cb-tab.active { background: rgba(0,255,51,0.05); border-color: rgba(0,255,51,0.15); color: #00ff33; }

  .cb-body { flex: 1; overflow-y: auto; padding: 6px; }
  .cb-body::-webkit-scrollbar { width: 2px; }
  .cb-body::-webkit-scrollbar-thumb { background: rgba(0,255,51,0.1); border-radius: 2px; }

  .cb-list { display: flex; flex-direction: column; gap: 1px; }
  .cb-row { display: flex; align-items: center; gap: 9px; padding: 5px 6px; border-radius: 4px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: all 0.1s; text-align: left; width: 100%; }
  .cb-row:hover { background: rgba(255,255,255,0.025); border-color: rgba(255,255,255,0.03); }
  .cb-rank { font-family: 'IBM Plex Mono', monospace; font-size: 8px; font-weight: 600; color: rgba(0,255,51,0.18); width: 16px; text-align: right; flex-shrink: 0; }
  .cb-thumb { width: 32px; height: 44px; border-radius: 3px; overflow: hidden; background: rgba(255,255,255,0.02); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .cb-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .cb-thumb span { color: rgba(255,255,255,0.08); font-size: 9px; }
  .cb-info { flex: 1; min-width: 0; }
  .cb-name { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cb-row:hover .cb-name { color: rgba(255,255,255,0.8); }
  .cb-meta { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: rgba(255,255,255,0.2); margin-top: 1px; }
  .cb-rat { font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: rgba(255,200,50,0.5); flex-shrink: 0; }

  .cb-gtype { display: flex; gap: 3px; margin-bottom: 6px; }
  .cb-gtbtn { padding: 3px 7px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.015); color: rgba(255,255,255,0.25); font-family: 'IBM Plex Mono', monospace; font-size: 8px; cursor: pointer; transition: all 0.1s; }
  .cb-gtbtn.active { background: rgba(0,255,51,0.05); border-color: rgba(0,255,51,0.15); color: #00ff33; }
  .cb-chips { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 8px; }
  .cb-chip { padding: 3px 7px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.015); color: rgba(255,255,255,0.3); font-family: 'IBM Plex Mono', monospace; font-size: 8px; cursor: pointer; transition: all 0.1s; }
  .cb-chip:hover { border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); }
  .cb-chip.active { background: rgba(0,255,51,0.05); border-color: rgba(0,255,51,0.15); color: #00ff33; }

  .cb-skels { display: flex; flex-direction: column; gap: 3px; }
  .cb-skel { display: flex; align-items: center; gap: 9px; padding: 5px 6px; }
  .cb-skel-img { width: 32px; height: 44px; background: rgba(255,255,255,0.02); border-radius: 3px; animation: p 1.5s infinite; }
  .cb-skel-txt { flex: 1; height: 10px; background: rgba(255,255,255,0.02); border-radius: 3px; animation: p 1.5s infinite; }

  .cb-center { display: flex; align-items: center; justify-content: center; padding: 28px; }
  .cb-spin { width: 14px; height: 14px; border: 2px solid rgba(0,255,51,0.12); border-top-color: #00ff33; border-radius: 50%; animation: sp 0.6s linear infinite; }
  .cb-empty { text-align: center; padding: 28px 12px; color: rgba(255,255,255,0.2); font-family: 'Space Grotesk', sans-serif; font-size: 11px; }

  .cb-ft { flex-shrink: 0; padding: 8px 14px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; font-family: 'IBM Plex Mono', monospace; font-size: 8px; color: rgba(255,255,255,0.15); }
  .cb-ft-esc { padding: 1px 4px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 2px; }

  @keyframes sp { to { transform: rotate(360deg); } }
  @keyframes p { 0%,100% { opacity: 0.02; } 50% { opacity: 0.04; } }
</style>
