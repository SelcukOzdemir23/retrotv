<script lang="ts">
  import type { Channel } from '../../lib/iptv/types';

  interface Props {
    channels: Channel[];
    selectedId: string | null;
    favorites: string[];
    loading: boolean;
    onSelect: (channel: Channel) => void;
    onOpenSources: () => void;
    onToggleFavorite: (channelId: string) => void;
  }

  let { channels, selectedId, favorites, loading, onSelect, onOpenSources, onToggleFavorite }: Props = $props();
  let query = $state('');
  let selectedGroup = $state('all');

  let groups = $derived(
    Array.from(new Set(channels.flatMap((channel) => channel.group ? [channel.group] : [])))
      .sort((a, b) => a.localeCompare(b, 'tr')),
  );

  let filteredChannels = $derived(channels.filter((channel) => {
    const matchesGroup = selectedGroup === 'all' || channel.group === selectedGroup;
    const searchText = `${channel.name} ${channel.group ?? ''} ${channel.tvgId ?? ''}`.toLocaleLowerCase('tr');
    return matchesGroup && searchText.includes(query.trim().toLocaleLowerCase('tr'));
  }));
</script>

<aside class="channel-rail" aria-label="Kanal listesi">
  <header class="rail-heading">
    <div>
      <p class="rail-kicker">YAYIN MASASI</p>
      <h2>Kanallar</h2>
    </div>
    <span class="channel-count" aria-label={`${channels.length} kanal`}>{channels.length}</span>
  </header>

  {#if channels.length > 0}
    <div class="rail-filters">
      <label class="sr-only" for="channel-search">Kanal ara</label>
      <input
        id="channel-search"
        type="search"
        placeholder="Kanal ara…"
        bind:value={query}
        autocomplete="off"
        class="channel-search"
      />
      {#if groups.length > 0}
        <label class="sr-only" for="channel-group">Kanal grubu</label>
        <select id="channel-group" bind:value={selectedGroup} class="group-select">
          <option value="all">Tüm gruplar</option>
          {#each groups as group (group)}
            <option value={group}>{group}</option>
          {/each}
        </select>
      {/if}
    </div>

    <div class="channel-list" aria-label="Kanallar">
      {#if filteredChannels.length > 0}
        {#each filteredChannels as channel, index (channel.id)}
          <div class="channel-row" class:active={channel.id === selectedId}>
            <button
              class="channel-select"
              class:active={channel.id === selectedId}
              aria-current={channel.id === selectedId ? 'true' : undefined}
              onclick={() => onSelect(channel)}
            >
              <span class="channel-order">{String(index + 1).padStart(2, '0')}</span>
              <span class="channel-logo">
                {#if channel.logoUrl}
                  <img
                    src={channel.logoUrl}
                    alt=""
                    width="36"
                    height="36"
                    loading="lazy"
                    onerror={(event) => ((event.currentTarget as HTMLImageElement).hidden = true)}
                  />
                {:else}
                  <span aria-hidden="true">{channel.name.slice(0, 1).toLocaleUpperCase('tr')}</span>
                {/if}
              </span>
              <span class="channel-copy">
                <span class="channel-name">{channel.name}</span>
                <span class="channel-meta">{channel.group || channel.format.toUpperCase()}</span>
              </span>
              {#if channel.id === selectedId}
                <span class="live-marker" aria-label="Seçili kanal">YAYINDA</span>
              {/if}
            </button>
            <button
              type="button"
              class="favorite-button"
              class:favorite={favorites.includes(channel.id)}
              aria-label={favorites.includes(channel.id) ? `${channel.name} favorilerden çıkar` : `${channel.name} favorilere ekle`}
              aria-pressed={favorites.includes(channel.id)}
              onclick={() => onToggleFavorite(channel.id)}
            >
              <span aria-hidden="true">{favorites.includes(channel.id) ? '★' : '☆'}</span>
            </button>
          </div>
        {/each}
      {:else}
        <p class="empty-list">Bu aramayla eşleşen kanal yok.</p>
      {/if}
    </div>
  {:else if loading}
    <div class="rail-loading" aria-live="polite">Kanal listesi hazırlanıyor…</div>
  {:else}
    <div class="rail-empty">
      <p>Henüz kanal listesi eklenmedi.</p>
      <button type="button" onclick={onOpenSources}>Kaynak ekle</button>
    </div>
  {/if}

  <footer class="rail-footer">
    <span>{favorites.length} favori</span>
    <button type="button" onclick={onOpenSources}>Kaynak değiştir</button>
  </footer>
</aside>

<style>
  .channel-rail {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--c-border);
    border-radius: 10px;
    background: var(--c-surface);
  }
  .rail-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 19px 18px 15px;
    border-bottom: 1px solid var(--c-border);
  }
  .rail-kicker {
    margin: 0 0 7px;
    color: var(--c-accent);
    font: 600 10px/1 var(--ff-mono);
    letter-spacing: .13em;
  }
  .rail-heading h2 {
    margin: 0;
    color: var(--c-text);
    font: 600 20px/1.1 var(--ff-display);
    letter-spacing: -.035em;
  }
  .channel-count {
    min-width: 34px;
    padding: 6px 8px;
    border: 1px solid var(--c-border);
    border-radius: 5px;
    color: var(--c-text-muted);
    font: 11px/1 var(--ff-mono);
    text-align: center;
  }
  .rail-filters {
    display: grid;
    gap: 9px;
    padding: 14px 14px 10px;
  }
  .channel-search,
  .group-select {
    width: 100%;
    min-height: 40px;
    padding: 0 11px;
    border: 1px solid var(--c-border);
    border-radius: 6px;
    background: var(--c-bg);
    color: var(--c-text);
    font: 13px var(--ff-ui);
  }
  .channel-search::placeholder { color: var(--c-text-muted); }
  .channel-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 9px 10px;
    overscroll-behavior: contain;
  }
  .channel-row {
    display: flex;
    align-items: stretch;
    gap: 2px;
    border-bottom: 1px solid rgba(255,255,255,.045);
  }
  .channel-select {
    min-width: 0;
    flex: 1;
    display: grid;
    grid-template-columns: 23px 36px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 9px 7px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .channel-select:hover { background: rgba(255,255,255,.045); }
  .channel-select.active { background: color-mix(in srgb, var(--c-accent) 10%, transparent); }
  .channel-order {
    color: var(--c-text-muted);
    font: 10px var(--ff-mono);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .channel-logo {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 5px;
    background: var(--c-surface-high);
    color: var(--c-text-muted);
    font: 600 15px var(--ff-display);
  }
  .channel-logo img { width: 100%; height: 100%; object-fit: contain; }
  .channel-copy { min-width: 0; display: grid; gap: 4px; }
  .channel-name {
    overflow: hidden;
    color: var(--c-text);
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .channel-meta {
    overflow: hidden;
    color: var(--c-text-muted);
    font: 10px var(--ff-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-marker { color: var(--c-accent); font: 600 9px var(--ff-mono); letter-spacing: .07em; }
  .favorite-button {
    width: 34px;
    flex: 0 0 34px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--c-text-muted);
    font-size: 17px;
    cursor: pointer;
  }
  .favorite-button:hover, .favorite-button.favorite { color: var(--c-accent); }
  .empty-list, .rail-loading, .rail-empty {
    padding: 20px 14px;
    color: var(--c-text-muted);
    font-size: 13px;
    line-height: 1.5;
  }
  .rail-empty p { margin: 0 0 13px; }
  .rail-empty button, .rail-footer button {
    border: 0;
    background: transparent;
    color: var(--c-accent);
    font: 600 12px var(--ff-ui);
    cursor: pointer;
  }
  .rail-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 15px;
    border-top: 1px solid var(--c-border);
    color: var(--c-text-muted);
    font: 10px var(--ff-mono);
  }
  @media (min-width: 761px) and (max-width: 1180px) {
    /* İki sütunlu düzende sayfa kayar; kanal listesi masa yüksekliğini aşmaz
       (68 topbar + 2×20 yerleşim boşluğu + 34 alt bilgi). */
    .channel-rail { max-height: calc(100dvh - 142px); }
  }
  @media (max-width: 760px) {
    .channel-rail { max-height: 58dvh; }
    .channel-list { max-height: 38dvh; }
  }
</style>
