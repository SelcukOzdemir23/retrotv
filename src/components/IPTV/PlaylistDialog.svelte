<script lang="ts">
  import type { DirectoryCountry } from '../../lib/iptv/types';

  type SourceTab = 'directory' | 'file' | 'url';

  interface Props {
    open: boolean;
    countries: DirectoryCountry[];
    countryCode: string;
    loading: boolean;
    directoryLoading: boolean;
    directoryError: string;
    error: string;
    onClose: () => void;
    onCountryChange: (countryCode: string) => void;
    onLoadDirectory: () => void;
    onImportFile: (file: File) => void;
    onImportUrl: (url: string) => void;
  }

  let {
    open,
    countries,
    countryCode,
    loading,
    directoryLoading,
    directoryError,
    error,
    onClose,
    onCountryChange,
    onLoadDirectory,
    onImportFile,
    onImportUrl,
  }: Props = $props();

  let activeTab = $state<SourceTab>('directory');
  let playlistUrl = $state('');

  function countryName(country: DirectoryCountry): string {
    return new Intl.DisplayNames(['tr'], { type: 'region' }).of(country.code) ?? country.name;
  }

  function submitUrl(event: SubmitEvent) {
    event.preventDefault();
    if (playlistUrl.trim()) onImportUrl(playlistUrl.trim());
  }

  function selectFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) onImportFile(file);
    input.value = '';
  }

  function modalDialog(node: HTMLDialogElement) {
    const handleClose = () => onClose();
    node.addEventListener('close', handleClose);
    node.showModal();

    return {
      destroy() {
        node.removeEventListener('close', handleClose);
        if (node.open) node.close();
      },
    };
  }
</script>

{#if open}
    <dialog class="source-dialog" use:modalDialog aria-labelledby="source-title">
      <header class="dialog-header">
        <div>
          <p class="dialog-kicker">YAYIN KAYNAĞI</p>
          <h2 id="source-title">Kanal listesi ekle</h2>
          <p class="dialog-description">Kendi playlist’ini aç veya topluluk dizininden bir ülke seç.</p>
        </div>
        <button type="button" class="dialog-close" aria-label="Kapat" onclick={onClose}>×</button>
      </header>

      <div class="source-tabs" role="group" aria-label="Kaynak türü">
        <button type="button" aria-pressed={activeTab === 'directory'} class:active={activeTab === 'directory'} onclick={() => activeTab = 'directory'}>Dizin</button>
        <button type="button" aria-pressed={activeTab === 'file'} class:active={activeTab === 'file'} onclick={() => activeTab = 'file'}>Dosya</button>
        <button type="button" aria-pressed={activeTab === 'url'} class:active={activeTab === 'url'} onclick={() => activeTab = 'url'}>URL</button>
      </div>

      {#if activeTab === 'directory'}
        <div class="source-content">
          <label for="directory-country">Ülke</label>
          <select id="directory-country" value={countryCode} disabled={countries.length === 0} onchange={(event) => onCountryChange(event.currentTarget.value)}>
            {#each countries as country (country.code)}
              <option value={country.code}>{countryName(country)}</option>
            {/each}
          </select>
          <p class="source-note">Topluluk dizinindeki yayınlar üçüncü taraf kaynaklardan gelir; her kanal her bölgede çalışmayabilir.</p>
          {#if directoryError}<p class="source-error" role="status">{directoryError}</p>{/if}
          <button type="button" class="source-submit" disabled={loading || directoryLoading || countries.length === 0} onclick={onLoadDirectory}>
            {loading ? 'Playlist yükleniyor…' : directoryLoading ? 'Ülkeler yükleniyor…' : 'Ülke kanallarını yükle'}
          </button>
        </div>
      {:else if activeTab === 'file'}
        <div class="source-content">
          <label for="playlist-file">M3U playlist dosyası</label>
          <input id="playlist-file" type="file" accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl" onchange={selectFile} />
          <p class="source-note">Dosya bu sekmede işlenir, sunucuya yüklenmez. Sayfayı yenileyince yeniden seçmen gerekir.</p>
        </div>
      {:else}
        <form class="source-content" onsubmit={submitUrl}>
          <label for="playlist-url">HTTPS playlist adresi</label>
          <input
            id="playlist-url"
            name="playlist-url"
            type="url"
            inputmode="url"
            autocomplete="off"
            spellcheck="false"
            placeholder="https://ornek.com/kanallar.m3u"
            bind:value={playlistUrl}
          />
          <p class="source-note">Playlist ve yayın istekleri tarayıcıdan doğrudan kaynağa gider. Kaynak CORS izni vermeli; URL saklanmaz ve proxy kullanılmaz.</p>
          <button type="submit" class="source-submit" disabled={loading || !playlistUrl.trim()}>
            {loading ? 'Playlist yükleniyor…' : 'Adresi yükle'}
          </button>
        </form>
      {/if}

      {#if error}
        <p class="source-error" role="alert">{error}</p>
      {/if}
    </dialog>
{/if}

<style>
  .source-dialog {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    width: min(100%, 520px);
    max-height: calc(100dvh - 40px);
    overflow: auto;
    margin: auto;
    padding: clamp(22px, 4vw, 34px);
    border: 1px solid var(--c-border-strong);
    border-radius: 12px;
    background: var(--c-surface);
    box-shadow: 0 30px 90px rgba(0,0,0,.55);
  }
  .source-dialog::backdrop { background: rgba(2, 5, 8, .76); }
  .dialog-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
  .dialog-kicker { margin: 0 0 10px; color: var(--c-accent); font: 600 10px var(--ff-mono); letter-spacing: .15em; }
  .dialog-header h2 { margin: 0; color: var(--c-text); font: 600 clamp(24px, 5vw, 32px)/1.05 var(--ff-display); letter-spacing: -.04em; }
  .dialog-description { margin: 10px 0 0; color: var(--c-text-muted); font-size: 14px; line-height: 1.55; }
  .dialog-close {
    width: 36px; height: 36px; flex: 0 0 36px;
    border: 1px solid var(--c-border); border-radius: 50%;
    background: transparent; color: var(--c-text); font-size: 22px; line-height: 1;
    cursor: pointer;
  }
  .source-tabs {
    display: flex; gap: 5px; margin: 24px 0 20px; padding: 4px;
    border: 1px solid var(--c-border); border-radius: 8px;
  }
  .source-tabs button {
    flex: 1; min-height: 37px; border: 0; border-radius: 5px;
    background: transparent; color: var(--c-text-muted); font: 500 13px var(--ff-ui); cursor: pointer;
  }
  .source-tabs button.active { background: var(--c-surface-high); color: var(--c-text); }
  .source-content { display: grid; gap: 10px; }
  .source-content label { color: var(--c-text); font-size: 13px; font-weight: 600; }
  .source-content input, .source-content select {
    width: 100%; min-height: 44px; box-sizing: border-box;
    border: 1px solid var(--c-border); border-radius: 6px;
    padding: 0 12px; background: var(--c-bg); color: var(--c-text); font: 14px var(--ff-ui);
  }
  .source-content select:disabled { opacity: .55; cursor: wait; }
  .source-content input[type="file"] { padding: 9px 10px; }
  .source-content input::file-selector-button {
    margin-right: 12px; padding: 6px 10px; border: 1px solid var(--c-border);
    border-radius: 4px; background: var(--c-surface-high); color: var(--c-text); cursor: pointer;
  }
  .source-note { margin: 2px 0 8px; color: var(--c-text-muted); font-size: 12px; line-height: 1.55; }
  .source-submit {
    min-height: 46px; padding: 0 16px; border: 0; border-radius: 6px;
    background: var(--c-accent); color: var(--c-accent-ink); font: 700 14px var(--ff-ui); cursor: pointer;
  }
  .source-submit:disabled { opacity: .45; cursor: not-allowed; }
  .source-error {
    margin: 16px 0 0; padding: 11px 12px; border: 1px solid var(--c-danger-border);
    border-radius: 6px; background: var(--c-danger-surface); color: var(--c-danger); font-size: 13px; line-height: 1.45;
  }
  @media (prefers-reduced-motion: reduce) {
    .source-dialog { scroll-behavior: auto; }
  }
</style>
