<script lang="ts">
  import { tvStore, togglePower, adjustVolume } from "../../stores/tvStore";
  import { nextChannel, prevChannel, setCurrentChannelIndex, toggleChannelList, channelStore } from "../../stores/channelStore";

  $: store = $channelStore;
  $: channels = store.channels;
  $: currentIndex = store.currentIndex;
  $: isOn = $tvStore.power;
  $: isLoading = store.isLoading;

  let displayNum = '--';

  $: if (channels[currentIndex]) {
    displayNum = String(currentIndex + 1).padStart(2, '0');
  }

  // Track button press for visual feedback
  let pressedBtn: string | null = null;

  function handlePress(btnName: string, action: () => void) {
    pressedBtn = btnName;
    action();
    setTimeout(() => { pressedBtn = null; }, 150);
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
    class="bg-gradient-to-b from-[#1c1c1c] via-[#181818] to-[#141414] rounded-[20px] p-4 pt-3
           shadow-[10px_10px_30px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.08)]
           border border-white/[0.06] w-36 md:w-44"
  >
    <!-- ── CHANNELS BROWSE BUTTON ── -->
    <button
      on:click={() => handlePress('browse', toggleChannelList)}
      class="w-full flex items-center justify-between gap-2 px-3 py-2.5 mb-3
             rounded-xl bg-[#00ff33]/8 border border-[#00ff33]/20
             hover:bg-[#00ff33]/15 hover:border-[#00ff33]/35
             active:scale-[0.97] transition-all duration-150 group cursor-pointer
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff33]/30"
      aria-label="Browse Channels"
      class:scale-[0.97]={pressedBtn === 'browse'}
    >
      <div class="flex items-center gap-2">
        <svg class="w-3.5 h-3.5 text-[#00ff33] group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div class="flex items-center gap-1.5">
        <div class="w-2 h-2 rounded-full {isOn ? 'bg-[#00ff33] shadow-[0_0_4px_#00ff33]' : 'bg-gray-700'} transition-all duration-300"></div>
        <span class="text-gray-600 text-[9px] tracking-[0.2em] font-bold">{isOn ? 'ON' : 'OFF'}</span>
      </div>
      <div class="font-mono text-[10px] text-[#00ff33] osd-text bg-black/40 px-2 py-0.5 rounded transition-all duration-300">
        {displayNum}
      </div>
    </div>

    <!-- ── Power Button ── -->
    <div class="flex justify-end items-center mb-4">
      <button
        on:click={() => handlePress('power', togglePower)}
        class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-b from-red-500 to-red-700
               shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),0_3px_6px_rgba(0,0,0,0.5)]
               transition-all duration-100 flex items-center justify-center group
               hover:from-red-400 hover:to-red-600
               active:translate-y-[1px] active:shadow-none"
        class:translate-y-[1px]={pressedBtn === 'power'}
        aria-label="Power"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </button>
    </div>

    <!-- ── Channel / Volume ── -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="flex flex-col items-center space-y-1.5">
        <span class="text-gray-500 text-[9px] font-bold tracking-wider">CH</span>
        <button
          on:click={() => handlePress('ch+', handleNextChannel)}
          disabled={!isOn}
          class="remote-btn rounded-t-lg"
          class:remote-btn-pressed={pressedBtn === 'ch+'}
        >+</button>
        <button
          on:click={() => handlePress('ch-', handlePrevChannel)}
          disabled={!isOn}
          class="remote-btn rounded-b-lg"
          class:remote-btn-pressed={pressedBtn === 'ch-'}
        >-</button>
      </div>

      <div class="flex flex-col items-center space-y-1.5">
        <span class="text-gray-500 text-[9px] font-bold tracking-wider">VOL</span>
        <button
          on:click={() => handlePress('vol+', () => handleAdjustVolume(10))}
          disabled={!isOn}
          class="remote-btn rounded-t-lg"
          class:remote-btn-pressed={pressedBtn === 'vol+'}
        >+</button>
        <button
          on:click={() => handlePress('vol-', () => handleAdjustVolume(-10))}
          disabled={!isOn}
          class="remote-btn rounded-b-lg"
          class:remote-btn-pressed={pressedBtn === 'vol-'}
        >-</button>
      </div>
    </div>

    <!-- ── Number Pad ── -->
    <div class="grid grid-cols-3 gap-1.5 mt-3">
      {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
        <button
          on:click={() => handlePress(`num-${num}`, () => handleSetChannel(num - 1))}
          class="num-btn"
          class:num-btn-pressed={pressedBtn === `num-${num}`}
          disabled={!isOn || num > channels.length}
        >{num}</button>
      {/each}
      <button
        on:click={() => handlePress('num-0', () => handleSetChannel(9))}
        class="num-btn col-start-2"
        class:num-btn-pressed={pressedBtn === 'num-0'}
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
    color: rgba(255, 255, 255, 0.85);
    box-shadow:
      0 3px 0 #111,
      0 4px 6px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.08s ease;
    border: none;
    font-size: 13px;
    cursor: pointer;
    position: relative;
  }
  .remote-btn:hover {
    background: linear-gradient(180deg, #404040 0%, #323232 100%);
    color: white;
  }
  .remote-btn:active, .remote-btn-pressed {
    box-shadow: 0 0 0 #111;
    transform: translateY(3px);
    background: linear-gradient(180deg, #2a2a2a 0%, #222 100%);
  }
  .remote-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    box-shadow: 0 2px 0 #111;
    transform: translateY(1px);
  }
  .remote-btn:disabled:hover {
    background: linear-gradient(180deg, #383838 0%, #2a2a2a 100%);
    color: rgba(255, 255, 255, 0.3);
  }

  .num-btn {
    width: 100%;
    aspect-ratio: 1;
    background: linear-gradient(180deg, #2e2e2e 0%, #252525 100%);
    color: rgba(255, 255, 255, 0.6);
    font-family: ui-monospace, monospace;
    font-size: 10px;
    border-radius: 6px;
    border: none;
    box-shadow:
      0 2px 0 #111,
      0 3px 4px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.08s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .num-btn:hover {
    background: linear-gradient(180deg, #3a3a3a 0%, #303030 100%);
    color: rgba(255, 255, 255, 0.85);
  }
  .num-btn:active, .num-btn-pressed {
    box-shadow: 0 0 0 #111;
    transform: translateY(2px);
    background: linear-gradient(180deg, #222 0%, #1a1a1a 100%);
  }
  .num-btn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
    box-shadow: 0 1px 0 #111;
    transform: translateY(1px);
  }
  .num-btn:disabled:hover {
    background: linear-gradient(180deg, #2e2e2e 0%, #252525 100%);
    color: rgba(255, 255, 255, 0.2);
  }
</style>
