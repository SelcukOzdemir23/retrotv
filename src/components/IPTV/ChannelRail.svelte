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

  let {
    channels,
    selectedId,
    favorites,
    loading,
    onSelect,
    onOpenSources,
    onToggleFavorite,
  }: Props = $props();
  let query = $state('');
  let selectedGroup = $state('all');
  let listElement = $state<HTMLDivElement>();
  let scrollTop = $state(0);
  let viewportHeight = $state(0);

  // Satır yüksekliği CSS'te sabit; sanal liste bu sabitle hesaplar.
  const ROW_HEIGHT = 55;
  const OVERSCAN = 6;

  let groups = $derived(
    Array.from(new Set(channels.flatMap((channel) => (channel.group ? [channel.group] : [])))).sort(
      (a, b) => a.localeCompare(b, 'tr'),
    ),
  );

  // Kanal numarası playlist sırasıdır; arama veya grup filtresi numaraları değiştirmez.
  let channelNumbers = $derived(new Map(channels.map((channel, index) => [channel.id, index + 1])));

  // Arama metni playlist yüklenirken bir kez hazırlanır; her tuşta yeniden üretilmez.
  let searchIndex = $derived(
    channels.map((channel) =>
      `${channel.name} ${channel.group ?? ''} ${channel.tvgId ?? ''}`.toLocaleLowerCase('tr'),
    ),
  );

  let filteredChannels = $derived.by(() => {
    const needle = query.trim().toLocaleLowerCase('tr');
    const matches: Channel[] = [];

    for (let index = 0; index < channels.length; index += 1) {
      const channel = channels[index];
      if (selectedGroup !== 'all' && channel.group !== selectedGroup) continue;
      if (needle && !searchIndex[index].includes(needle)) continue;
      matches.push(channel);
    }

    return matches;
  });

  // Yalnızca görünen satırlar DOM'a girer: 10.000 kanallı bir playlist 40 düğümle açılır.
  let windowStart = $derived(Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN));
  let windowEnd = $derived(
    Math.min(
      filteredChannels.length,
      windowStart + Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2,
    ),
  );
  let visibleChannels = $derived(filteredChannels.slice(windowStart, windowEnd));

  $effect(() => {
    const element = listElement;
    if (!element) return;

    viewportHeight = element.clientHeight;
    const observer = new ResizeObserver(() => {
      viewportHeight = element.clientHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  });

  $effect(() => {
    // Arama veya grup değişince liste başa döner.
    query;
    selectedGroup;
    if (!listElement) return;
    listElement.scrollTop = 0;
    scrollTop = 0;
  });

  $effect(() => {
    // Klavyeyle veya numarayla seçilen kanal listenin görünen alanına gelir.
    const currentId = selectedId;
    const element = listElement;
    if (!currentId || !element) return;

    const index = filteredChannels.findIndex((channel) => channel.id === currentId);
    if (index < 0) return;

    const rowTop = index * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;
    if (rowTop < element.scrollTop) element.scrollTop = rowTop;
    else if (rowBottom > element.scrollTop + element.clientHeight) {
      element.scrollTop = rowBottom - element.clientHeight;
    }
  });
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

    <div
      class="channel-list"
      aria-label="Kanallar"
      bind:this={listElement}
      onscroll={(event) => (scrollTop = event.currentTarget.scrollTop)}
    >
      {#if visibleChannels.length > 0}
        <div class="virtual-spacer" style={`height: ${windowStart * ROW_HEIGHT}px`}></div>
        {#each visibleChannels as channel (channel.id)}
          <div class="channel-row" class:active={channel.id === selectedId}>
            <button
              class="channel-select"
              class:active={channel.id === selectedId}
              aria-current={channel.id === selectedId ? 'true' : undefined}
              onclick={() => onSelect(channel)}
            >
              <span class="channel-order"
                >{String(channelNumbers.get(channel.id) ?? 0).padStart(3, '0')}</span
              >
              <span class="channel-logo">
                <span class="channel-initial" aria-hidden="true"
                  >{channel.name.slice(0, 1).toLocaleUpperCase('tr')}</span
                >
                {#if channel.logoUrl}
                  <img
                    src={channel.logoUrl}
                    alt=""
                    width="36"
                    height="36"
                    loading="lazy"
                    onerror={(event) => ((event.currentTarget as HTMLImageElement).hidden = true)}
                  />
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
              aria-label={favorites.includes(channel.id)
                ? `${channel.name} favorilerden çıkar`
                : `${channel.name} favorilere ekle`}
              aria-pressed={favorites.includes(channel.id)}
              onclick={() => onToggleFavorite(channel.id)}
            >
              <span aria-hidden="true">{favorites.includes(channel.id) ? '★' : '☆'}</span>
            </button>
          </div>
        {/each}
        <div
          class="virtual-spacer"
          style={`height: ${(filteredChannels.length - windowEnd) * ROW_HEIGHT}px`}
        ></div>
      {:else}
        <p class="empty-list">Bu aramayla eşleşen kanal yok.</p>
      {/if}
    </div>
  {:else if loading}
    <div class="rail-loading" aria-live="polite">Kanal listesi hazırlanıyor…</div>
  {:else}
    <div class="rail-empty">
      <p>Henüz kanal listesi yok.</p>
      <p class="rail-empty-detail">
        Kendi M3U dosyanı aç, HTTPS bir playlist adresi gir ya da IPTV-org ülke dizininden başla.
      </p>
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
    font: 600 11px/1 var(--ff-mono);
    letter-spacing: 0.13em;
  }
  .rail-heading h2 {
    margin: 0;
    color: var(--c-text);
    font: 600 20px/1.1 var(--ff-display);
    letter-spacing: -0.035em;
  }
  .channel-count {
    min-width: 34px;
    padding: 6px 8px;
    border: 1px solid var(--c-border);
    border-radius: 5px;
    color: var(--c-text-muted);
    font: 12px/1 var(--ff-mono);
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
  .channel-search::placeholder {
    color: var(--c-text-muted);
  }
  .channel-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    /* Sanal liste kaydırma konumunu kendi hesaplar; tarayıcı çapa ayarı onu bozar. */
    overflow-anchor: none;
    padding: 4px 9px 10px;
    overscroll-behavior: contain;
  }
  .channel-row {
    height: 55px;
    display: flex;
    align-items: stretch;
    gap: 2px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.045);
  }
  .virtual-spacer {
    width: 1px;
  }
  .channel-select {
    min-width: 0;
    flex: 1;
    display: grid;
    grid-template-columns: 32px 36px minmax(0, 1fr) auto;
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
  .channel-select:hover {
    background: rgba(255, 255, 255, 0.045);
  }
  .channel-select.active {
    background: color-mix(in srgb, var(--c-accent) 10%, transparent);
  }
  .channel-select.active .channel-order {
    color: var(--c-accent);
  }
  .channel-order {
    color: var(--c-text-subtle);
    font: 12px var(--ff-mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    text-align: right;
  }
  .channel-logo {
    position: relative;
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
  .channel-initial {
    text-transform: uppercase;
  }
  .channel-logo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: var(--c-surface-high);
  }
  .channel-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }
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
    font: 11px var(--ff-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-marker {
    color: var(--c-accent);
    font: 600 10px var(--ff-mono);
    letter-spacing: 0.07em;
  }
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
  .favorite-button:hover,
  .favorite-button.favorite {
    color: var(--c-accent);
  }
  .empty-list,
  .rail-loading,
  .rail-empty {
    padding: 20px 14px;
    color: var(--c-text-muted);
    font-size: 13px;
    line-height: 1.5;
  }
  .rail-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 20px 18px 28px;
  }
  .rail-empty p {
    margin: 0 0 13px;
  }
  .rail-empty .rail-empty-detail {
    margin: 6px 0 16px;
    color: var(--c-text-subtle);
    font-size: 12px;
    line-height: 1.6;
  }
  .rail-empty button,
  .rail-footer button {
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
    font: 11px var(--ff-mono);
  }
  @media (min-width: 761px) and (max-width: 1180px) {
    /* İki sütunlu düzende sayfa kayar; kanal listesi masa yüksekliğini aşmaz
       (68 topbar + 2×20 yerleşim boşluğu + 34 alt bilgi). */
    .channel-rail {
      max-height: calc(100dvh - 142px);
    }
  }
  @media (max-width: 760px) {
    .channel-rail {
      max-height: 58dvh;
    }
    .channel-list {
      max-height: 38dvh;
    }
  }
</style>
