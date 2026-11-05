<script lang="ts">
  export let padded = true;
  export let elevated = false;

  $$restProps: Record<string, any>;

  $: baseClasses = [
    'rounded-md border border-[var(--c-border)]',
    'bg-[var(--c-surface)]',
    'transition-all duration-200',
  ].join(' ');

  $: paddingClasses = padded ? 'p-4 md:p-6' : '';
  $: elevationClasses = elevated ? 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : '';
</script>

<div
  class="{baseClasses} {paddingClasses} {elevationClasses}"
  {...$$restProps}
>
  <slot />
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }
</style>