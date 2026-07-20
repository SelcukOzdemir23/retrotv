<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchChannelsFromM3U, extractGroups } from '../../lib/iptvApi';
  import { setChannels, setLoading, setError, setChannelListOpen } from '../../stores/channelStore';
  import { tvStore } from '../../stores/tvStore';

  let statusMsg = 'Loading channel list...';
  let errorMsg = '';
  let done = false;

  async function loadM3U() {
    setLoading(true);
    setError(null);
    errorMsg = '';

    try {
      const base = import.meta.env.BASE_URL || '/';
      const m3uUrl = base.endsWith('/') ? base + 'index.m3u' : base + '/index.m3u';
      statusMsg = 'Loading channel list...';
      const channels = await fetchChannelsFromM3U(m3uUrl);

      if (channels.length === 0) {
        errorMsg = 'Channel list is empty. Check public/index.m3u';
        setError(errorMsg);
        return;
      }

      const groups = extractGroups(channels);
      statusMsg = `Loaded ${channels.length} channels`;
      setChannels(channels, groups);

      // Auto power-on
      if (!tvStore.get().power) {
        tvStore.setKey('power', true);
      }

      done = true;

      // Wait a moment, then open channel list and close overlay
      setTimeout(() => {
        setChannelListOpen(true);
      }, 600);
    } catch (e) {
      errorMsg = 'Failed to load channel list. Check public/index.m3u';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  onMount(loadM3U);
</script>

{#if !done}
<div class="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center overflow-hidden">
  <!-- Animated gradient orbs -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <div class="absolute -top-1/2 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-[#00ff33]/5 via-transparent to-transparent blur-3xl animate-pulse-slow"></div>
    <div class="absolute -bottom-1/2 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent blur-3xl animate-pulse-slower"></div>
  </div>

  <div class="relative z-10 flex flex-col items-center gap-6 px-6">
    <!-- TV Icon -->
    <div class="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
      {#if errorMsg}
        <svg class="w-8 h-8 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
      {:else}
        <svg class="w-8 h-8 text-[#00ff33]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
      {/if}
    </div>

    <!-- Title -->
    <div class="text-center">
      <h1 class="text-2xl md:text-3xl font-bold text-white/90 tracking-tight">
        RetroTV
      </h1>
      <p class="text-gray-600 text-xs md:text-sm mt-2 font-mono">
        {errorMsg || statusMsg}
      </p>
    </div>

    <!-- Loading spinner -->
    {#if !errorMsg}
      <div class="w-6 h-6 border-2 border-[#00ff33]/30 border-t-[#00ff33] rounded-full animate-spin"></div>
    {:else}
      <button
        on:click={loadM3U}
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00ff33]/10 border border-[#00ff33]/25
               text-[#00ff33] text-sm hover:bg-[#00ff33]/20 transition-all duration-200 active:scale-95"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Retry
      </button>
    {/if}
  </div>
</div>
{/if}

<style>
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
