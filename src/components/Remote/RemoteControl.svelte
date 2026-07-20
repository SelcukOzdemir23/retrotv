<script lang="ts">
  import { tvStore, togglePower, adjustVolume } from "../../stores/tvStore";
  import { nextChannel, prevChannel, setCurrentChannelIndex, toggleChannelList, channelStore } from "../../stores/channelStore";

  $: store = $channelStore;
  $: channels = store.channels;
  $: currentIndex = store.currentIndex;
  $: isOn = $tvStore.power;

  let displayNum = '--';

  $: if (channels[currentIndex]) {
    displayNum = String(currentIndex + 1).padStart(2, '0');
  }

  function handleNextChannel() {
    if (!isOn) return;
    nextChannel();
  }

  function handlePrevChannel() {
    if (!isOn) return;
    prevChannel();
  }

  function handleAdjustVolume(change: number) {
    if (!isOn) return;
    adjustVolume(change);
  }

  function handleSetChannel(idx: number) {
    if (!isOn) return;
    if (idx >= 0 && idx < channels.length) setCurrentChannelIndex(idx);
  }
</script>

<div class="fixed bottom-5 right-5 md:bottom-10 md:right-10 z-50 select-none">
  <div
    class="bg-gradient-to-b from-[#1c1c1c] to-[#141414] rounded-[20px] p-4 pt-3
           shadow-[10px_10px_30px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.08)]
           border border-white/[0.06] w-36 md:w-44"
  >
    <!-- ── CHANNELS BROWSE BUTTON (top full-width row) ── -->
    <button
      on:click={toggleChannelList}
      class="w-full flex items-center justify-between gap-2 px-3 py-2.5 mb-3
             rounded-xl bg-[#00ff33]/8 border border-[#00ff33]/20
             hover:bg-[#00ff33]/15 hover:border-[#00ff33]/35
             active:scale-[0.98] transition-all duration-200 group cursor-pointer"
      aria-label="Browse Channels"
    >
      <div class="flex items-center gap-2">
        <svg class="w-3.5 h-3.5 text-[#00ff33] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
        <span class="text-[11px] font-bold text-[#00ff33]/80 group-hover:text-[#00ff33] tracking-wider transition-colors">
          BROWSE
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[9px] font-mono text-gray-500">{channels.length || '--'}</span>
        <svg class="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
    </button>

    <!-- ── Brand / Display ── -->
    <div class="flex items-center justify-between mb-3 px-1">
      <div class="text-gray-600 text-[9px] tracking-[0.2em] font-bold">TV</div>
      <div class="font-mono text-[10px] text-[#00ff33] osd-text bg-black/40 px-2 py-0.5 rounded">
        {displayNum}
      </div>
    </div>

    <!-- ── Power Button (right-aligned) ── -->
    <div class="flex justify-end items-center mb-4">
      <button
        on:click={togglePower}
        class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-b from-red-600 to-red-800
               shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),0_3px_6px_rgba(0,0,0,0.5)]
               active:translate-y-[1px] active:shadow-none
               transition-all duration-150 flex items-center justify-center group"
        aria-label="Power"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </button>
    </div>

    <!-- ── Channel / Volume Grid ── -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="flex flex-col items-center space-y-1.5">
        <span class="text-gray-500 text-[9px] font-bold tracking-wider">CH</span>
        <button
          on:click={handleNextChannel}
          class="remote-btn rounded-t-lg">+</button>
        <button
          on:click={handlePrevChannel}
          class="remote-btn rounded-b-lg">-</button>
      </div>

      <div class="flex flex-col items-center space-y-1.5">
        <span class="text-gray-500 text-[9px] font-bold tracking-wider">VOL</span>
        <button
          on:click={() => handleAdjustVolume(10)}
          class="remote-btn rounded-t-lg">+</button>
        <button
          on:click={() => handleAdjustVolume(-10)}
          class="remote-btn rounded-b-lg">-</button>
      </div>
    </div>

    <!-- ── Number Pad ── -->
    <div class="grid grid-cols-3 gap-1.5 mt-3">
      {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
        <button
          on:click={() => handleSetChannel(num - 1)}
          class="w-full aspect-square bg-gray-800/50 rounded-md text-gray-400 text-[10px] font-mono
                 border-b border-black/40 hover:bg-gray-700/50 hover:text-white/80
                 active:translate-y-[1px] active:border-b-0 transition-all duration-100"
          disabled={!isOn || num > channels.length}
        >{num}</button>
      {/each}
      <button
        on:click={() => handleSetChannel(9)}
        class="w-full aspect-square bg-gray-800/50 rounded-md text-gray-400 text-[10px] font-mono
               border-b border-black/40 hover:bg-gray-700/50 hover:text-white/80
               active:translate-y-[1px] active:border-b-0 transition-all duration-100 col-start-2"
        disabled={!isOn || 10 > channels.length}
      >0</button>
    </div>
  </div>
</div>

<style>
  .remote-btn {
    width: 100%;
    height: 28px;
    background: linear-gradient(180deg, #383838 0%, #2a2a2a 100%);
    color: white;
    box-shadow:
      0 3px 0 #111,
      0 4px 6px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.1s ease;
    border: none;
    font-size: 13px;
  }
  .remote-btn:active {
    box-shadow: 0 0 0 #111;
    transform: translateY(3px);
  }
  .remote-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
