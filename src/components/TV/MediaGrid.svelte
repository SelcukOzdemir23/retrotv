<script lang="ts">
  import type { TMDBMediaItem } from '../../lib/types';
  import { posterUrl, getMediaTitle, getMediaYear } from '../../lib/types';
  import { selectMedia } from '../../stores/appStore';

  export let items: TMDBMediaItem[] = [];
  export let loading: boolean = false;
  export let title: string = '';

  function handleSelect(media: TMDBMediaItem) {
    selectMedia(media);
  }
</script>

<div class="w-full">
  {#if title}
    <div class="flex items-center gap-2 mb-3 px-1">
      <h3 class="text-[#00ff33] text-[10px] font-bold tracking-[0.25em] font-mono osd-text">{title}</h3>
      <div class="flex-1 h-px bg-[#00ff33]/10"></div>
    </div>
  {/if}

  {#if loading}
    <!-- Skeleton loading -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {#each Array(8) as _}
        <div class="animate-pulse">
          <div class="aspect-[2/3] bg-white/[0.04] rounded-lg"></div>
          <div class="h-3 bg-white/[0.04] rounded mt-2 w-3/4"></div>
          <div class="h-2 bg-white/[0.03] rounded mt-1 w-1/2"></div>
        </div>
      {/each}
    </div>
  {:else if items.length === 0}
    <div class="flex flex-col items-center justify-center py-12 text-gray-600">
      <svg class="w-12 h-12 opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
      <span class="text-xs font-mono">No content found</span>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {#each items as media (media.id)}
        <button
          on:click={() => handleSelect(media)}
          class="group cursor-pointer text-left active:scale-[0.97] transition-transform duration-150"
        >
          <!-- Poster -->
          <div class="aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.03] relative border border-white/[0.04]
                      group-hover:border-[#00ff33]/20 transition-all duration-200 shadow-lg shadow-black/20">
            {#if media.poster_path}
              <img
                src={posterUrl(media.poster_path, 'w300')}
                alt={getMediaTitle(media)}
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00ff33]/5 to-transparent">
                <span class="text-[#00ff33]/30 text-3xl font-bold font-mono">?</span>
              </div>
            {/if}

            <!-- Hover overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-[#00ff33]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span class="text-[#00ff33] text-[9px] font-mono font-bold tracking-wider">WATCH</span>
              </div>
            </div>

            <!-- Rating badge -->
            {#if media.vote_average > 0}
              <div class="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5
                          flex items-center gap-1 border border-white/[0.06]">
                <svg class="w-2.5 h-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span class="text-white/80 text-[9px] font-mono font-bold">{media.vote_average.toFixed(1)}</span>
              </div>
            {/if}

            <!-- Type badge -->
            <div class="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5
                        border border-white/[0.06]">
              <span class="text-white/50 text-[8px] font-mono font-bold tracking-wider">
                {media.media_type === 'movie' ? 'MOVIE' : 'TV'}
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="mt-1.5 px-0.5">
            <div class="text-white/70 text-[11px] font-medium truncate group-hover:text-white/90 transition-colors">
              {getMediaTitle(media)}
            </div>
            <div class="text-gray-600 text-[9px] font-mono">{getMediaYear(media)}</div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
