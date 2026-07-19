<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchCountries } from '../../lib/iptvApi';
  import { channelStore, setCountry, setChannels, setLoading, setError as setStoreError } from '../../stores/channelStore';
  import { fetchChannelsForCountry, extractGroups } from '../../lib/iptvApi';
  import type { Country } from '../../lib/types';

  let countries: Country[] = [];
  let filtered: Country[] = [];
  let query = '';
  let loading = true;
  let errorMsg = '';

  // Only show if no country selected yet
  $: visible = !$channelStore.selectedCountry;

  onMount(async () => {
    try {
      countries = await fetchCountries();
      // Sort alphabetically but put TR at top
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
  });

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
    setCountry(country);
    setLoading(true);

    try {
      const channels = await fetchChannelsForCountry(country.code);
      const groups = extractGroups(channels);
      setChannels(channels, groups);
      setStoreError(null);
    } catch (e) {
      // Reset country selection so user can try again
      setStoreError(`Could not load channels for ${country.name}. Try another country.`);
      channelStore.setKey('selectedCountry', null);
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    errorMsg = '';
    loading = true;
    onMount();
  }
</script>

{#if visible}
<div class="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center overflow-hidden">
  <!-- Background ambient glow -->
  <div class="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-black pointer-events-none"></div>

  <div class="relative z-10 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col items-center max-h-screen overflow-hidden">
    <!-- Title -->
    <div class="text-center mb-6">
      <div class="text-[#00ff33] font-mono text-xs md:text-sm tracking-[0.3em] mb-2 osd-text">SELECT COUNTRY</div>
      <h1 class="text-2xl md:text-4xl font-bold text-white/90 font-serif tracking-wider">
        Where to watch?
      </h1>
      <p class="text-gray-500 text-sm mt-2">Pick a country to browse available TV channels</p>
    </div>

    <!-- Search -->
    <div class="relative w-full max-w-md mb-6">
      <input
        type="text"
        bind:value={query}
        placeholder="Search countries..."
        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white/80 text-sm
               placeholder:text-gray-600 focus:outline-none focus:border-[#00ff33]/50 focus:ring-1 focus:ring-[#00ff33]/20
               transition-all duration-300 backdrop-blur-sm"
      />
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>

    <!-- Loading -->
    {#if loading}
      <div class="flex flex-col items-center gap-3 py-12">
        <div class="w-8 h-8 border-2 border-[#00ff33] border-t-transparent rounded-full animate-spin"></div>
        <span class="text-gray-500 text-sm">Loading channels...</span>
      </div>
    {:else if errorMsg}
      <div class="text-red-400 text-sm text-center py-12 px-4">
        <div class="text-3xl mb-3">⚠️</div>
        {errorMsg}
        <button
          on:click={retry}
          class="block mx-auto mt-4 text-[#00ff33] underline hover:text-[#00ff33]/80 text-xs transition-colors"
        >Retry</button>
      </div>
    {:else}
      <!-- Country Grid -->
      <div class="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
          {#each filtered as country (country.code)}
            <button
              on:click={() => selectCountry(country)}
              class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]
                     hover:bg-white/[0.08] hover:border-white/20 hover:scale-105
                     active:scale-95 transition-all duration-200 group cursor-pointer"
            >
              <span class="text-2xl md:text-3xl leading-none drop-shadow-lg">{country.flag}</span>
              <span class="text-[10px] md:text-xs text-gray-400 group-hover:text-white/80 text-center leading-tight transition-colors">
                {country.name}
              </span>
              <span class="text-[8px] text-gray-600 font-mono">{country.code}</span>
            </button>
          {/each}
        </div>
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
</style>
