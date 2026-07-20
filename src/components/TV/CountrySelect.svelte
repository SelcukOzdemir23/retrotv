<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fetchCountries } from '../../lib/iptvApi';
  import { channelStore, setCountry, setChannels, setLoading, setError as setStoreError } from '../../stores/channelStore';
  import { fetchChannelsForCountry, extractGroups } from '../../lib/iptvApi';
  import { tvStore } from '../../stores/tvStore';
  import type { Country } from '../../lib/types';

  let countries: Country[] = [];
  let filtered: Country[] = [];
  let query = '';
  let loading = true;
  let errorMsg = '';
  let mounted = false;

  // Only show if no country selected yet
  $: visible = !$channelStore.selectedCountry;

  // Reset animation state when opened
  $: if (visible) {
    mounted = false;
    tick().then(() => { setTimeout(() => { mounted = true; }, 50); });
  }

  async function loadCountries() {
    errorMsg = '';
    loading = true;
    try {
      countries = await fetchCountries();
      countries.sort((a, b) => {
        if (a.code === 'TR') return -1;
        if (b.code === 'TR') return 1;
        return a.name.localeCompare(b.name);
      });
      filtered = countries;
    } catch (e) {
      errorMsg = 'Failed to load countries. Check your connection.';
    } finally {
      loading = false;
    }
  }

  onMount(loadCountries);

  $: if (query) {
    const q = query.toLowerCase();
    filtered = countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  } else {
    filtered = countries;
  }

  async function selectCountry(country: Country) {
    setLoading(true);
    setStoreError(null);

    try {
      const channels = await fetchChannelsForCountry(country.code);
      const groups = extractGroups(channels);
      setCountry(country);
      setChannels(channels, groups);

      if (!tvStore.get().power) {
        tvStore.setKey('power', true);
      }
    } catch (e) {
      setStoreError(`Could not load channels for ${country.name}. Try another country.`);
      channelStore.setKey('selectedCountry', null);
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    loadCountries();
  }

  // Generate highlighted parts for search matching
  // Safe approach: returns parts array instead of innerHTML
  function highlightParts(text: string, query: string): { text: string; highlight: boolean }[] {
    if (!query) return [{ text, highlight: false }];
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return [{ text, highlight: false }];
    return [
      { text: text.slice(0, idx), highlight: false },
      { text: text.slice(idx, idx + query.length), highlight: true },
      { text: text.slice(idx + query.length), highlight: false },
    ].filter(p => p.text.length > 0);
  }
</script>

{#if visible}
<div class="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center overflow-hidden">
  <!-- Animated gradient orbs -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <div class="absolute -top-1/2 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-[#00ff33]/5 via-transparent to-transparent blur-3xl animate-pulse-slow"></div>
    <div class="absolute -bottom-1/2 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent blur-3xl animate-pulse-slower"></div>
  </div>

  <div class="relative z-10 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col items-center max-h-screen overflow-hidden">
    <!-- Title with staggered entrance -->
    <div class="text-center mb-6 transition-all duration-700"
         class:opacity-100={mounted} class:opacity-0={!mounted}
         class:translate-y-0={mounted} class:translate-y-4={!mounted}>
      <div class="text-[#00ff33] font-mono text-xs md:text-sm tracking-[0.3em] mb-2 osd-text">SELECT COUNTRY</div>
      <h1 class="text-2xl md:text-4xl font-bold text-white/90 tracking-tight">
        Where to watch?
      </h1>
      <p class="text-gray-500 text-sm mt-2">Pick a country to browse available TV channels</p>
    </div>

    <!-- Search with stagger -->
    <div class="relative w-full max-w-md mb-6 transition-all duration-700 delay-100"
         class:opacity-100={mounted} class:opacity-0={!mounted}
         class:translate-y-0={mounted} class:translate-y-4={!mounted}>
      <input
        type="text"
        bind:value={query}
        placeholder="Search countries..."
        class="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 pl-11 text-white/80 text-sm
               placeholder:text-gray-600 focus:outline-none focus:border-[#00ff33]/40 focus:ring-1 focus:ring-[#00ff33]/15
               transition-all duration-300 backdrop-blur-sm"
      />
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      {#if query}
        <button
          on:click={() => query = ''}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
          aria-label="Clear search"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Loading skeleton -->
    {#if loading}
      <div class="w-full flex-1 overflow-hidden px-2 transition-all duration-700 delay-200"
           class:opacity-100={mounted} class:opacity-0={!mounted}>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
          {#each Array(15) as _, i}
            <div class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse">
              <div class="w-8 h-6 rounded bg-white/[0.06]"></div>
              <div class="w-16 h-3 rounded bg-white/[0.06] mt-1"></div>
              <div class="w-6 h-2 rounded bg-white/[0.04]"></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if errorMsg}
      <div class="text-red-400 text-sm text-center py-12 px-4 transition-all duration-700 delay-200"
           class:opacity-100={mounted} class:opacity-0={!mounted}>
        <div class="mb-3">
          <svg class="w-8 h-8 mx-auto text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <div class="text-white/70 mb-2">{errorMsg}</div>
        <button
          on:click={retry}
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00ff33]/10 border border-[#00ff33]/20
                 text-[#00ff33] text-xs hover:bg-[#00ff33]/20 transition-all duration-200 active:scale-95"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Retry
        </button>
      </div>
    {:else}
      <!-- Country Grid with stagger -->
      <div class="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        {#if query && filtered.length === 0}
          <div class="flex flex-col items-center justify-center h-32 text-gray-600 text-sm gap-2">
            <svg class="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            No countries match "{query}"
          </div>
        {:else}
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
            {#each filtered as country, i (country.code)}
              <button
                on:click={() => selectCountry(country)}
                class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]
                       hover:bg-white/[0.08] hover:border-white/20 hover:scale-105
                       active:scale-[0.97] transition-all duration-200 group cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff33]/40"
                style={mounted ? `transition-delay: ${Math.min(i * 20, 300)}ms` : ''}
              >
                <span class="text-2xl md:text-3xl leading-none drop-shadow-lg">{country.flag}</span>
                {#if query}
                  <span class="text-[10px] md:text-xs text-gray-400 group-hover:text-white/80 text-center leading-tight transition-colors">
                    {#each highlightParts(country.name, query) as part}
                      {#if part.highlight}
                        <mark class="bg-[#00ff33]/20 text-white rounded-sm px-0.5">{part.text}</mark>
                      {:else}
                        {part.text}
                      {/if}
                    {/each}
                  </span>
                {:else}
                  <span class="text-[10px] md:text-xs text-gray-400 group-hover:text-white/80 text-center leading-tight transition-colors truncate max-w-[80px]">
                    {country.name}
                  </span>
                {/if}
                <span class="text-[8px] text-gray-600 font-mono">{country.code}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 51, 0.2);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 51, 0.4);
  }
  mark {
    background: rgba(0, 255, 51, 0.2);
    color: white;
    border-radius: 2px;
    padding: 0 2px;
  }
  :global(.animate-pulse-slow) {
    animation: pulse-slow 6s ease-in-out infinite;
  }
  :global(.animate-pulse-slower) {
    animation: pulse-slower 8s ease-in-out infinite;
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  @keyframes pulse-slower {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.08); }
  }
</style>
