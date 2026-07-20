<script lang="ts">
  import { onMount } from 'svelte';
  import { channelStore, setCurrentChannelIndex, setSearchQuery, setSelectedGroup, setChannelListOpen } from '../../stores/channelStore';
  import { filterChannels } from '../../lib/iptvApi';
  import type { Channel } from '../../lib/types';

  // ── Reactive data ─────────────────────────────────────────────────
  $: store = $channelStore;
  $: channels = store.channels;
  $: groups = store.channelGroups;
  $: selectedGroup = store.selectedGroup;
  $: currentIndex = store.currentIndex;
  $: open = store.channelListOpen;

  // Initialize local query from store on mount
  let query = $channelStore.searchQuery;

  $: filtered = filterChannels(channels, query, selectedGroup);

  function onSearchInput() {
    setSearchQuery(query);
  }

  function selectChannel(ch: Channel) {
    const idx = channels.indexOf(ch);
    if (idx >= 0) {
      setCurrentChannelIndex(idx);
      setChannelListOpen(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') setChannelListOpen(false);
  }

  function closeOverlay() {
    setChannelListOpen(false);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Overlay backdrop -->
{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
    on:click={closeOverlay}
  ></div>
{/if}

<!-- Slide-in Panel -->
<div
  class="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] md:w-[480px] bg-gradient-to-l from-[#0a0a0a] via-[#0d0d0d] to-[#111]
         border-l border-white/[0.06] shadow-2xl shadow-black/50
         transition-all duration-400 ease-out-expo flex flex-col"
  class:translate-x-0={open}
  class:translate-x-full={!open}
>
  <!-- Header -->
  <div class="flex-shrink-0 px-5 pt-5 pb-3 border-b border-white/[0.06]">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-bold text-white/80 tracking-wide flex items-center gap-2">
        <svg class="w-4 h-4 text-[#00ff33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
        CHANNELS
        <span class="text-gray-600 font-normal text-xs ml-1">({filtered.length})</span>
      </h2>
      <button
        on:click={() => setChannelListOpen(false)}
        class="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 text-gray-500 hover:text-white transition-all"
        aria-label="Close"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <input
        type="text"
        bind:value={query}
        on:input={onSearchInput}
        placeholder="Search channels..."
        class="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 pl-9 text-sm text-white/70
               placeholder:text-gray-600 focus:outline-none focus:border-[#00ff33]/30 focus:ring-1 focus:ring-[#00ff33]/10
               transition-all duration-200"
      />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>

    <!-- Group Filters -->
    {#if groups.length > 0}
      <div class="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
        {#each groups as group}
          <button
            on:click={() => setSelectedGroup(group === 'All' ? null : group)}
            class="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full border transition-all duration-200 whitespace-nowrap
                   {(selectedGroup === null && group === 'All') || selectedGroup === group
                     ? 'bg-[#00ff33]/10 border-[#00ff33]/30 text-[#00ff33]'
                     : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-white/70 hover:border-white/20'}"
          >
            {group}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Channel List -->
  <div class="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
    {#if filtered.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-gray-600 text-sm gap-2">
        <svg class="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        No channels found
      </div>
    {:else}
      {#each filtered as ch (ch.id)}
        <button
          on:click={() => selectChannel(ch)}
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer
                 {channels[currentIndex]?.id === ch.id
                   ? 'bg-[#00ff33]/8 border border-[#00ff33]/20'
                   : 'hover:bg-white/[0.04] border border-transparent'}"
        >
          <!-- Logo -->
          {#if ch.logo}
            <div class="w-8 h-8 flex-shrink-0 rounded-md bg-white/[0.04] overflow-hidden flex items-center justify-center">
              <img
                src={ch.logo}
                alt=""
                class="w-6 h-6 object-contain"
                loading="lazy"
                on:error={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          {:else}
            <div class="w-8 h-8 flex-shrink-0 rounded-md bg-gradient-to-br from-[#00ff33]/10 to-[#00ff33]/5 flex items-center justify-center">
              <span class="text-[#00ff33]/40 text-xs font-bold">TV</span>
            </div>
          {/if}

          <!-- Info -->
          <div class="flex-1 min-w-0 text-left">
            <div class="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">
              {ch.name}
            </div>
            {#if ch.group}
              <div class="text-[10px] text-gray-600 truncate mt-0.5">{ch.group}</div>
            {/if}
          </div>

          <!-- Active indicator -->
          {#if channels[currentIndex]?.id === ch.id}
            <div class="w-1.5 h-1.5 rounded-full bg-[#00ff33] shadow-[0_0_6px_#00ff33] flex-shrink-0"></div>
          {:else}
            <svg class="w-4 h-4 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          {/if}
        </button>
      {/each}
    {/if}
  </div>

  <!-- Footer -->
  <div class="flex-shrink-0 px-5 py-3 border-t border-white/[0.06] text-[10px] text-gray-700 flex items-center justify-between">
    <span>{filtered.length} channels • {groups.length - 1} categories</span>
    <span class="font-mono text-[9px]">ESC to close</span>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 51, 0.15);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 51, 0.3);
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
