<script lang="ts">
  import { setApiKey, appStore } from '../../stores/appStore';
  import { getTrending } from '../../lib/tmdbApi';
  import { setTrending, setTrendingLoading } from '../../stores/appStore';
  import Button from '../ui/Button.svelte';

  let apiKeyInput = '';
  let error = '';
  let loading = false;
  let showKey = false;

  $: hasExistingKey = $appStore.apiKeyValid;

  async function handleSubmit() {
    if (!apiKeyInput.trim()) {
      error = 'Please enter your TMDB API key';
      return;
    }

    loading = true;
    error = '';

    // Temporarily set the key to test it
    if (typeof window !== 'undefined') {
      localStorage.setItem('tmdb_api_key', apiKeyInput.trim());
    }

    try {
      const items = await getTrending('all', 'week');
      setApiKey(apiKeyInput.trim());
      setTrending(items);
    } catch (e) {
      error = 'Invalid API key. Please check and try again.';
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tmdb_api_key');
      }
    } finally {
      loading = false;
    }
  }

  function skipToKey() {
    apiKeyInput = $appStore.apiKey;
  }
</script>

<div class="fixed inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden">
  <!-- Animated gradient orbs -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <div class="absolute -top-1/2 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-[#00ff33]/5 via-transparent to-transparent blur-3xl animate-pulse-slow"></div>
    <div class="absolute -bottom-1/2 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-blue-500/5 via-transparent to-transparent blur-3xl animate-pulse-slower"></div>
  </div>

  <div class="relative z-10 flex flex-col items-center gap-6 px-6 max-w-md w-full">
    <!-- TV Icon -->
    <div class="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
      <svg class="w-8 h-8 text-[var(--c-green)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>

    <!-- Title -->
    <div class="text-center">
      <h1 class="text-2xl md:text-3xl font-bold text-white/90 tracking-tight font-mono">
        RETRO TV
      </h1>
      <p class="text-gray-500 text-xs md:text-sm mt-2 font-mono tracking-wide">
        {hasExistingKey ? 'ENTER YOUR TMDB API KEY TO CONTINUE' : 'SETUP REQUIRED — TMDB API KEY'}
      </p>
    </div>

    <!-- API Key Input -->
    <div class="w-full space-y-3">
      <div class="relative">
        <input
          type={showKey ? 'text' : 'password'}
          bind:value={apiKeyInput}
          placeholder="Enter your TMDB API key"
          on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
          class="w-full bg-[var(--c-surface)] border border-[var(--c-border)] rounded-lg px-4 py-3 pr-12
                 text-sm text-[var(--c-text)] placeholder-[var(--c-text-muted)] font-mono tracking-wider
                 focus:outline-none focus:border-[var(--c-border-focus)] focus:ring-1 focus:ring-[var(--c-green-glow)]
                 transition-all duration-200"
        />
        <button
          on:click={() => showKey = !showKey}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white/50 transition-colors"
        >
          {#if showKey}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          {/if}
        </button>
      </div>

      {#if error}
        <p class="text-[var(--c-error)] text-xs font-mono">{error}</p>
      {/if}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        variant="primary"
        size="lg"
      >
        {#if loading}
          <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          VALIDATING...
        {:else}
          CONNECT
        {/if}
      </Button>
    </div>

    <!-- Help Link -->
    <a
      href="https://www.themoviedb.org/settings/api"
      target="_blank"
      rel="noopener noreferrer"
      class="text-[var(--c-text-dim)] text-[var(--fs-xs)] font-mono hover:text-[var(--c-green)]/60 transition-colors flex items-center gap-1"
    >
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      Get your free API key at themoviedb.org
    </a>
  </div>
</div>

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
