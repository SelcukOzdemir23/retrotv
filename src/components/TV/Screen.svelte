<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { tvStore } from "../../stores/tvStore";
  import { channelStore, getCurrentChannel } from "../../stores/channelStore";
  import StaticNoise from "./StaticNoise.svelte";
  import Hls from "hls.js";

  // ── Reactive state ────────────────────────────────────────────────

  let isStatic = false;
  let turnOnAnim = false;
  let turnOffAnim = false;
  let hls: Hls | null = null;
  let videoElement: HTMLVideoElement;
  let staticTimeout: ReturnType<typeof setTimeout>;
  let playbackError = false;

  // ── Channel watching ──────────────────────────────────────────────

  let prevIndex = $channelStore.currentIndex;

  $: if ($tvStore.power && $channelStore.currentIndex !== prevIndex) {
    triggerStatic();
    prevIndex = $channelStore.currentIndex;
  }

  // ── Power watching ────────────────────────────────────────────────

  let prevPower = $tvStore.power;

  $: if ($tvStore.power !== prevPower) {
    if ($tvStore.power) {
      turnOnAnim = true;
      turnOffAnim = false;
      setTimeout(() => (turnOnAnim = false), 400);
      initCurrentChannel();
    } else {
      turnOffAnim = true;
      turnOnAnim = false;
      setTimeout(() => (turnOffAnim = false), 400);
      cleanupHls();
    }
    prevPower = $tvStore.power;
  }

  // ── Volume OSD ────────────────────────────────────────────────────

  let volumeVisible = false;
  let volTimeout: ReturnType<typeof setTimeout>;

  $: if ($tvStore.volume !== undefined) {
    volumeVisible = true;
    clearTimeout(volTimeout);
    volTimeout = setTimeout(() => {
      volumeVisible = false;
    }, 3000);
  }

  // ── Static transition ─────────────────────────────────────────────

  function triggerStatic() {
    isStatic = true;
    playbackError = false;
    cleanupHls();
    clearTimeout(staticTimeout);
    staticTimeout = setTimeout(() => {
      isStatic = false;
      initCurrentChannel();
    }, 500);
  }

  // ── Channel playback ──────────────────────────────────────────────

  function initCurrentChannel() {
    const ch = getCurrentChannel();
    if (!ch || !ch.url) return;
    initHls(ch.url);
  }

  function initHls(url: string) {
    if (!videoElement || !url) return;

    playbackError = false;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          playbackError = true;
        }
      });
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      videoElement.src = url;
      videoElement.addEventListener("loadedmetadata", () => {
        videoElement.play().catch(() => {});
      });
      videoElement.onerror = () => {
        playbackError = true;
      };
    }
  }

  function cleanupHls() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
    if (videoElement) {
      videoElement.onerror = null;
    }
  }

  // ── Fullscreen ────────────────────────────────────────────────────

  function toggleFullscreen() {
    const elem = document.querySelector(".crt-screen");
    if (!document.fullscreenElement) {
      elem?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  onMount(() => {
    if ($tvStore.power) {
      initCurrentChannel();
    }
  });

  onDestroy(() => {
    cleanupHls();
    clearTimeout(staticTimeout);
    clearTimeout(volTimeout);
  });
</script>

<div class="w-full h-full relative font-mono overflow-hidden">
  <!-- Power Off State -->
  {#if !$tvStore.power}
    <div class="absolute inset-0 bg-black z-40 flex items-center justify-center">
      <div class="w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_10px_white]"></div>
    </div>
  {/if}

  <!-- CRT Effects Container -->
  <div
    class="w-full h-full relative crt-screen {$tvStore.power ? 'flicker' : ''}
           {turnOnAnim ? 'turn-on-anim' : ''} {turnOffAnim ? 'turn-off-anim' : ''}"
  >
    {#if $tvStore.power}
      <div class="absolute inset-0 z-0 bg-[#1a1a1a]">
        {#if isStatic || $channelStore.channels.length === 0}
          <StaticNoise />
        {:else}
          <!-- HLS Video Player -->
          <!-- svelte-ignore a11y-media-has-caption -->
          <video
            bind:this={videoElement}
            muted={$tvStore.isMuted}
            autoplay
            playsinline
            class="w-full h-full object-contain opacity-90 sepia-[0.3] contrast-125 saturate-50"
          ></video>
        {/if}
      </div>

      <!-- OSD: Channel Info -->
      <div class="absolute top-8 left-8 right-8 z-30 pointer-events-none flex items-start justify-between">
        <div class="flex flex-col gap-1">
          {#if playbackError}
            <div class="text-red-400 font-bold text-sm tracking-wider osd-text">STREAM UNAVAILABLE</div>
          {:else if $channelStore.channels[$channelStore.currentIndex]}
            <div class="text-[#00ff33] font-bold text-xl md:text-2xl tracking-widest osd-text">
              {$channelStore.currentIndex + 1}
            </div>
            <div class="text-white/60 text-xs md:text-sm truncate max-w-[200px] md:max-w-[300px] drop-shadow-lg">
              {$channelStore.channels[$channelStore.currentIndex].name}
            </div>
          {:else}
            <div class="text-gray-600 text-sm osd-text">NO SIGNAL</div>
          {/if}
        </div>

        <!-- Fullscreen Button -->
        <button
          class="pointer-events-auto text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5"
          on:click={toggleFullscreen}
          title="Fullscreen"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      <!-- OSD Volume Bar -->
      {#if volumeVisible}
        <div class="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center">
          <div class="text-[#00ff33] font-bold text-xs tracking-widest mb-1.5 osd-text">VOLUME</div>
          <div class="flex gap-0.5 bg-black/60 p-2 rounded-lg backdrop-blur-sm">
            {#each Array(10) as _, i}
              <div
                class="w-2.5 h-5 rounded-sm transition-all duration-100
                       {i < $tvStore.volume / 10 ? 'bg-[#00ff33] shadow-[0_0_4px_#00ff33]' : 'bg-white/[0.06]'}"
              ></div>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <!-- Standby -->
      <div class="absolute inset-0 z-0 bg-black flex items-center justify-center">
        <div class="text-gray-800 font-serif text-xs tracking-[0.3em] animate-pulse">
          PRESS POWER
        </div>
      </div>
    {/if}

    <!-- CRT Effects Overlays -->
    <div class="absolute inset-0 scanlines opacity-20 pointer-events-none z-20"></div>
    <div class="absolute inset-0 tube-overlay z-20"></div>
    <div class="absolute inset-0 glass-glare z-30"></div>
  </div>
</div>
