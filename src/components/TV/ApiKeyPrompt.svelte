<script lang="ts">
  import { setApiKey, appStore } from '../../stores/appStore';
  import { getTrending, setApiKey as setTmdbApiKey } from '../../lib/tmdbApi';
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

    // Set the key in the tmdbApi module so getKey() finds it for the test call
    setTmdbApiKey(apiKeyInput.trim());

    try {
      const items = await getTrending('all', 'week');
      setApiKey(apiKeyInput.trim());
      setTrending(items);
    } catch (e) {
      error = 'Anahtar doğrulanamadı. TMDB API anahtarını kontrol edip tekrar dene.';
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

<div class="key-gate">
  <section class="key-story">
    <a class="key-brand" href="/"><span>R</span> RETROTV</a>
    <div class="key-story-copy">
      <p class="key-kicker">İZLEMEYE BAŞLA</p>
      <h1>İyi hikâyeler,<br />tek bir yerde.</h1>
      <p>Filmleri ve dizileri keşfetmek için TMDB bağlantını kur.</p>
    </div>
    <span class="key-foot">RETROTV · FİLM VE DİZİ KEŞFİ</span>
  </section>

  <section class="key-setup" aria-labelledby="setup-title">
    <div class="key-setup-inner">
      <p class="key-kicker">TMDB BAĞLANTISI</p>
      <h2 id="setup-title">{hasExistingKey ? 'Anahtarı yeniden bağla' : 'Önce bağlantını kuralım'}</h2>
      <p class="key-intro">API anahtarın yalnızca bu tarayıcıda saklanır ve TMDB istekleri için kullanılır.</p>
    <!-- API Key Input -->
    <div class="w-full space-y-3">
      <label class="key-label" for="tmdb-api-key">TMDB API anahtarı</label>
      <div class="relative">
        <input
          id="tmdb-api-key"
          type={showKey ? 'text' : 'password'}
          bind:value={apiKeyInput}
          placeholder="API anahtarını gir"
          autocomplete="off"
          on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
          class="key-input w-full bg-[var(--c-surface)] border border-[var(--c-border)] rounded-lg px-4 py-3 pr-12
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
        <p class="text-[var(--c-error)] text-xs font-mono" role="alert">{error}</p>
      {/if}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        variant="primary"
        size="lg"
      >
        {#if loading}
          <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          DOĞRULANIYOR…
        {:else}
          BAĞLAN
        {/if}
      </Button>
    </div>

    <!-- Help Link -->
    <a
      href="https://www.themoviedb.org/settings/api"
      target="_blank"
      rel="noopener noreferrer"
      class="key-help text-[var(--c-text-dim)] text-[var(--fs-xs)] font-mono hover:text-[var(--c-green)]/60 transition-colors flex items-center gap-1"
    >
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      API anahtarını TMDB hesap ayarlarından oluştur.
    </a>
  </div>
</section>
</div>

<style>
  .key-gate {
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(420px, .95fr);
    background: var(--c-bg);
  }
  .key-story {
    min-height: 100dvh;
    padding: 42px clamp(28px, 7vw, 100px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(135deg, #111612, #090a09 72%);
    border-right: 1px solid var(--c-border);
  }
  .key-brand { color: white; text-decoration: none; font-size: 17px; font-weight: 700; letter-spacing: -.06em; }
  .key-brand span {
    display: inline-grid;
    width: 28px;
    height: 28px;
    place-items: center;
    margin-right: 5px;
    border-radius: 8px;
    background: var(--c-green);
    color: #071008;
  }
  .key-story-copy { margin: auto 0; }
  .key-kicker { color: var(--c-green); font-family: var(--ff-mono); font-size: 11px; letter-spacing: .12em; }
  .key-story-copy h1 {
    margin: 18px 0;
    color: white;
    font-size: clamp(42px, 6vw, 78px);
    line-height: .98;
    letter-spacing: -.065em;
  }
  .key-story-copy > p:last-child { max-width: 410px; color: var(--c-text-dim); font-size: 16px; line-height: 1.7; }
  .key-foot { color: var(--c-text-muted); font-family: var(--ff-mono); font-size: 10px; letter-spacing: .08em; }
  .key-setup { min-height: 100dvh; display: grid; place-items: center; padding: 36px; }
  .key-setup-inner { width: min(100%, 420px); }
  .key-setup-inner h2 { margin: 14px 0 10px; color: white; font-size: clamp(26px, 3vw, 36px); letter-spacing: -.045em; line-height: 1.1; }
  .key-intro { margin: 0 0 30px; color: var(--c-text-dim); font-size: 14px; line-height: 1.65; }
  .key-label { display: block; margin-bottom: 8px; color: rgba(255,255,255,.88); font: 600 13px var(--ff-ui); }
  .key-input { box-sizing: border-box; }
  .key-input::placeholder { color: var(--c-text-muted); }
  .key-help { color: var(--c-text-dim); line-height: 1.6; }
  .key-setup-inner :global(button:not(.absolute)) { width: 100%; }
  @media (max-width: 760px) {
    .key-gate { grid-template-columns: 1fr; }
    .key-story { min-height: auto; padding: 24px; border-right: 0; border-bottom: 1px solid var(--c-border); }
    .key-story-copy { margin: 58px 0 22px; }
    .key-story-copy h1 { font-size: clamp(40px, 12vw, 58px); }
    .key-story-copy > p:last-child { margin-bottom: 0; font-size: 14px; }
    .key-foot { display: none; }
    .key-setup { min-height: auto; padding: 34px 24px 52px; }
  }
</style>
