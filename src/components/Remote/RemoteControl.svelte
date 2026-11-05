<script lang="ts">
  import { tvStore, togglePower } from "../../stores/tvStore";
  import { appStore, setBrowserOpen, goBack, setView, setTrending, setTrendingLoading } from "../../stores/appStore";
  import { getTrending } from "../../lib/tmdbApi";

  $: isOn = $tvStore.power;
  $: view = $appStore.view;
  let flash: string | null = null;

  function tap(id: string, fn: () => void) {
    flash = id; fn();
    setTimeout(() => flash = null, 120);
  }
  async function refresh() { if (!isOn) return; setTrendingLoading(true); try { setTrending(await getTrending('all','week')); } catch {} }
  function browse() { if (isOn) setBrowserOpen(true); }
  function home() { if (isOn) setView('home'); }
  function back() { if (isOn && view !== 'home') goBack(); }
</script>

<aside class="rc">
  <div class="rc-body">
    <!-- Top: Browse -->
    <button on:click={() => tap('b', browse)} class="rc-browse" class:flash={flash==='b'} aria-label="Browse">
      <span>BROWSE</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
    </button>

    <!-- Status bar -->
    <div class="rc-status">
      <span class="rc-led" class:on={isOn}></span>
      <span class="rc-stxt">{isOn ? 'ON' : 'OFF'}</span>
      <span class="rc-view">{view === 'home' ? 'HOME' : view === 'detail' ? 'INFO' : 'SRCH'}</span>
    </div>

    <!-- Power -->
    <button on:click={() => tap('p', togglePower)} class="rc-power" class:flash={flash==='p'} aria-label="Power">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/></svg>
    </button>

    <!-- Nav grid -->
    <div class="rc-grid">
      <div class="rc-col">
        <span class="rc-col-label">NAV</span>
        <button on:click={() => tap('bk', back)} disabled={!isOn||view==='home'} class="rc-btn" class:flash={flash==='bk'} aria-label="Back">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button on:click={() => tap('hm', home)} disabled={!isOn} class="rc-btn" class:flash={flash==='hm'} aria-label="Home">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </button>
      </div>
      <div class="rc-col">
        <span class="rc-col-label">TOOLS</span>
        <button on:click={() => tap('rf', refresh)} disabled={!isOn} class="rc-btn" class:flash={flash==='rf'} aria-label="Refresh">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        </button>
        <button on:click={() => tap('mb', browse)} disabled={!isOn} class="rc-btn" class:flash={flash==='mb'} aria-label="Menu">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>

    <!-- Quick row -->
    <div class="rc-quick">
      <button on:click={() => tap('qh', home)} disabled={!isOn} class="rc-qbtn" class:flash={flash==='qh'} aria-label="Home">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      </button>
      <button on:click={() => tap('qb', browse)} disabled={!isOn} class="rc-qbtn" class:flash={flash==='qb'} aria-label="Browse">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <button on:click={() => tap('qr', refresh)} disabled={!isOn} class="rc-qbtn" class:flash={flash==='qr'} aria-label="Refresh">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/></svg>
      </button>
    </div>
  </div>
</aside>

<style>
  .rc {
    position: fixed; bottom: 16px; right: 16px; z-index: 50;
  }
  @media (min-width: 768px) { .rc { bottom: 28px; right: 28px; } }

  .rc-body {
    width: 128px;
    background: #161616;
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  }

  /* Browse button */
  .rc-browse {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 7px 9px; margin-bottom: 8px;
    background: var(--c-green-dim, rgba(0,255,51,0.06));
    border: 1px solid rgba(0,255,51,0.12);
    border-radius: 7px; cursor: pointer; color: rgba(0,255,51,0.65);
    font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 600;
    letter-spacing: 0.08em; transition: all 0.1s;
  }
  .rc-browse:hover { background: rgba(0,255,51,0.1); }
  .rc-browse.flash { transform: scale(0.97); }

  /* Status */
  .rc-status {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px; padding: 0 2px;
  }
  .rc-led {
    width: 5px; height: 5px; border-radius: 50%; background: #444; transition: all 0.3s;
  }
  .rc-led.on { background: #00ff33; box-shadow: 0 0 6px #00ff33; }
  .rc-stxt { font-family: 'IBM Plex Mono', monospace; font-size: 7px; color: rgba(255,255,255,0.2); letter-spacing: 0.08em; }
  .rc-view {
    font-family: 'IBM Plex Mono', monospace; font-size: 7px; font-weight: 500;
    color: rgba(0,255,51,0.35); background: rgba(0,0,0,0.3);
    padding: 1px 5px; border-radius: 2px;
  }

  /* Power */
  .rc-power {
    display: flex; justify-content: center; margin-bottom: 10px;
  }
  .rc-power button, .rc-power {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(180deg, #b83b3b, #8a2a2a);
    border: none; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.65);
    box-shadow: 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1);
    transition: all 0.08s; margin: 0 auto;
  }
  .rc-power:hover { background: linear-gradient(180deg, #c94545, #993333); }
  .rc-power.flash { transform: translateY(1px); box-shadow: 0 1px 2px rgba(0,0,0,0.3); }

  /* Nav grid */
  .rc-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;
  }
  .rc-col { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .rc-col-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 6px; font-weight: 500;
    color: rgba(255,255,255,0.15); letter-spacing: 0.1em; margin-bottom: 1px;
  }
  .rc-btn {
    width: 100%; height: 24px;
    background: linear-gradient(180deg, #2e2e2e, #252525);
    border: none; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.5);
    box-shadow: 0 2px 0 #0e0e0e; transition: all 0.06s;
  }
  .rc-btn:hover { background: linear-gradient(180deg, #383838, #2e2e2e); color: rgba(255,255,255,0.7); }
  .rc-btn.flash { transform: translateY(2px); box-shadow: none; }
  .rc-btn:disabled { opacity: 0.18; cursor: default; }

  /* Quick row */
  .rc-quick { display: grid; grid-template-columns: repeat(3,1fr); gap: 3px; }
  .rc-qbtn {
    aspect-ratio: 1; background: linear-gradient(180deg, #262626, #1e1e1e);
    border: none; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.35);
    box-shadow: 0 1px 0 #0e0e0e; transition: all 0.06s;
  }
  .rc-qbtn:hover { background: linear-gradient(180deg, #303030, #282828); color: rgba(255,255,255,0.55); }
  .rc-qbtn.flash { transform: translateY(1px); box-shadow: none; }
  .rc-qbtn:disabled { opacity: 0.12; cursor: default; }
</style>
