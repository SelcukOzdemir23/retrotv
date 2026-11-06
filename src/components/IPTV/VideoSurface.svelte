<script lang="ts">
  import type Hls from 'hls.js';
  import type { Channel, PlaybackStatus } from '../../lib/iptv/types';

  interface Props {
    channel: Channel | null;
    onPlaybackStatus: (status: PlaybackStatus, message: string) => void;
  }

  let { channel, onPlaybackStatus }: Props = $props();
  let videoElement = $state<HTMLVideoElement>();
  let status = $state<PlaybackStatus>('idle');
  let message = $state('');

  function report(nextStatus: PlaybackStatus, nextMessage = '') {
    status = nextStatus;
    message = nextMessage;
    onPlaybackStatus(nextStatus, nextMessage);
  }

  $effect(() => {
    const selectedChannel = channel;
    const video = videoElement;
    if (!video) return;

    if (!selectedChannel) {
      report('idle');
      video.pause();
      video.removeAttribute('src');
      video.load();
      return;
    }

    let hls: Hls | null = null;
    let recoveredMediaError = false;
    let cancelled = false;
    const selectedUrl = new URL(selectedChannel.url);

    if (selectedUrl.protocol === 'http:' && window.location.protocol === 'https:') {
      report('unsupported', 'Tarayıcı, güvenli sayfada HTTP yayınları engeller. HTTPS yayın adresi kullan.');
      return;
    }

    if (selectedChannel.requiresDrm) {
      report('unsupported', 'Bu yayın DRM lisansı istiyor. Tarayıcı oynatıcısı bu lisansı desteklemiyor.');
      return;
    }

    if (selectedChannel.requiresCustomHeaders) {
      report('unsupported', 'Bu yayın özel User-Agent veya Referer header’ı istiyor. Tarayıcı güvenlik nedeniyle bu header’ları ekleyemiyor.');
      return;
    }

    const fail = () => {
      report('error', 'Yayına ulaşılamadı. Adres bozuk olabilir, yayın kapalı olabilir veya kaynak CORS izni vermiyor olabilir.');
    };

    report('loading');

    // Kanal seçimi kullanıcı etkileşimi olduğu için yayın hemen başlatılır. Tarayıcı
    // otomatik oynatmayı engellerse durum "duraklatıldı" olur ve kontrol kullanıcıya kalır.
    const startPlayback = () => {
      video.play().catch(() => {
        if (status === 'loading') report('paused');
      });
    };

    const canPlayNativeHls = Boolean(video.canPlayType('application/vnd.apple.mpegurl'));
    const useManagedNativeHls = canPlayNativeHls && 'ManagedMediaSource' in window;

    const attachHls = async () => {
      try {
        const { default: HlsRuntime } = await import('hls.js');
        if (cancelled) return;

        if (!HlsRuntime.isSupported()) {
          if (canPlayNativeHls) {
            video.src = selectedChannel.url;
            return;
          }
          report('unsupported', 'Bu tarayıcı HLS yayını oynatmayı desteklemiyor.');
          return;
        }

        hls = new HlsRuntime({ enableWorker: true, lowLatencyMode: true });
        hls.on(HlsRuntime.Events.MANIFEST_PARSED, () => {
          if (status === 'loading') startPlayback();
        });
        hls.on(HlsRuntime.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;

          if (data.type === HlsRuntime.ErrorTypes.MEDIA_ERROR && !recoveredMediaError) {
            recoveredMediaError = true;
            hls?.recoverMediaError();
            return;
          }
          fail();
        });
        hls.loadSource(selectedChannel.url);
        hls.attachMedia(video);
      } catch {
        if (!cancelled) report('error', 'HLS oynatıcı yüklenemedi. Sayfayı yenileyip tekrar dene.');
      }
    };

    if (selectedChannel.format === 'mpeg-ts') {
      report('unsupported', 'Bu kaynak tek başına MPEG-TS dosyası. HLS manifesti (.m3u8) veya desteklenen MP4 yayını gerekir.');
    } else if (selectedChannel.format === 'hls' && useManagedNativeHls) {
      video.src = selectedChannel.url;
    } else if (selectedChannel.format === 'hls') {
      void attachHls();
    } else if (selectedChannel.format === 'file') {
      video.src = selectedChannel.url;
    } else {
      report('unsupported', 'Bu yayın türünü tanıyamadım. M3U kaynağında HLS (.m3u8) veya MP4 adresi kullan.');
    }

    const onLoadedMetadata = () => startPlayback();
    const onPlaying = () => report('playing');
    const onWaiting = () => report('loading');
    const onVideoError = () => fail();

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onVideoError);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onVideoError);
      video.pause();
      video.removeAttribute('src');
      video.load();
      hls?.destroy();
      cancelled = true;
    };
  });
</script>

<section class="video-surface" aria-label="Kanal oynatıcısı">
  {#if channel}
    <header class="surface-header">
      <div class="surface-title">
        <span class="on-air" class:active={status === 'playing'} aria-hidden="true"></span>
        <div>
          <p class="surface-kicker">{status === 'playing' ? 'YAYINDA' : status === 'loading' ? 'BAĞLANIYOR' : 'KANAL'}</p>
          <h1>{channel.name}</h1>
        </div>
      </div>
      <span class="format-tag">{channel.format === 'hls' ? 'HLS' : channel.format === 'file' ? 'VİDEO' : 'YAYIN'}</span>
    </header>

    <div class="video-frame">
      <video
        bind:this={videoElement}
        controls
        playsinline
        crossorigin="anonymous"
        aria-label={`${channel.name} canlı yayını`}
        onpause={() => status === 'playing' && report('paused')}
      ></video>

      {#if status === 'loading'}
        <div class="status-overlay" aria-live="polite">
          <span class="status-mark" aria-hidden="true"></span>
          <span>Yayın hazırlanıyor…</span>
        </div>
      {:else if status === 'error' || status === 'unsupported'}
        <div class="status-overlay error" role="status">
          <span class="status-symbol" aria-hidden="true">!</span>
          <strong>Bu kanal açılamadı</strong>
          <p>{message}</p>
        </div>
      {/if}
    </div>

    <footer class="surface-footer">
      <span>{channel.group || 'Kanal grubu yok'}</span>
      <span>Yayın kaynağı playlist sağlayıcısından gelir.</span>
    </footer>
  {:else}
    <div class="empty-surface">
      <div class="empty-signal" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
      <p class="surface-kicker">SİNYAL BEKLENİYOR</p>
      <h1>Bir kanal seç.</h1>
      <p>Yayın, kaynağın erişilebilirliğine ve tarayıcı desteğine bağlıdır.</p>
    </div>
  {/if}
</section>

<style>
  .video-surface {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: var(--c-text);
  }
  .surface-header {
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
  .surface-title { display: flex; align-items: center; gap: 13px; min-width: 0; }
  .surface-kicker {
    margin: 0 0 4px;
    color: var(--c-accent);
    font: 600 10px/1 var(--ff-mono);
    letter-spacing: .14em;
  }
  .surface-header h1 {
    overflow: hidden;
    max-width: 100%;
    margin: 0;
    color: var(--c-text);
    font: 600 clamp(20px, 2vw, 28px)/1.1 var(--ff-display);
    letter-spacing: -.035em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .on-air {
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--c-border-strong);
  }
  .on-air.active {
    background: var(--c-accent);
    box-shadow: 0 0 14px color-mix(in srgb, var(--c-accent) 55%, transparent);
  }
  .format-tag {
    flex: 0 0 auto;
    padding: 6px 9px;
    border: 1px solid var(--c-border);
    border-radius: 5px;
    color: var(--c-text-muted);
    font: 500 10px/1 var(--ff-mono);
  }
  .video-frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--c-border);
    border-radius: 9px;
    background: #05080a;
    aspect-ratio: 16 / 9;
  }
  video {
    display: block;
    width: 100%;
    height: 100%;
    background: #05080a;
    object-fit: contain;
  }
  .status-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    background: rgba(5, 8, 10, .84);
    color: var(--c-text);
    text-align: center;
    pointer-events: none;
  }
  .status-mark {
    width: 24px;
    height: 24px;
    border: 2px solid var(--c-border-strong);
    border-top-color: var(--c-accent);
    border-radius: 50%;
    animation: spin 900ms linear infinite;
  }
  .status-overlay.error { pointer-events: auto; }
  .status-symbol {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid var(--c-accent);
    border-radius: 50%;
    color: var(--c-accent);
    font: 600 18px/1 var(--ff-mono);
  }
  .status-overlay strong { font: 600 17px/1.2 var(--ff-display); }
  .status-overlay p { max-width: 460px; margin: 0; color: var(--c-text-muted); font-size: 13px; line-height: 1.55; }
  .surface-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--c-text-muted);
    font: 11px/1.4 var(--ff-mono);
  }
  .empty-surface {
    min-height: 360px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    border: 1px dashed var(--c-border-strong);
    border-radius: 9px;
    background: var(--c-surface);
    text-align: center;
  }
  .empty-signal { height: 40px; display: flex; align-items: center; gap: 5px; margin-bottom: 26px; }
  .empty-signal span { width: 3px; border-radius: 3px; background: var(--c-accent); opacity: .6; }
  .empty-signal span:nth-child(1), .empty-signal span:nth-child(5) { height: 14px; }
  .empty-signal span:nth-child(2), .empty-signal span:nth-child(4) { height: 27px; }
  .empty-signal span:nth-child(3) { height: 40px; }
  .empty-surface h1 { margin: 0; color: var(--c-text); font: 600 clamp(28px, 4vw, 42px)/1.1 var(--ff-display); letter-spacing: -.04em; }
  .empty-surface > p:last-child { max-width: 390px; margin: 12px 0 0; color: var(--c-text-muted); font-size: 14px; line-height: 1.6; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .status-mark { animation: none; } }
  @media (max-width: 640px) {
    .video-surface { gap: 10px; }
    .video-frame { margin-inline: -12px; width: calc(100% + 24px); border-radius: 0; }
    .surface-footer { flex-direction: column; }
  }
</style>
