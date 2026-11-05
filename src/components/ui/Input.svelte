<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  export let disabled = false;
  export let error = false;
  export let placeholder = '';

  $$restProps: HTMLInputAttributes;

  $: borderColor = error
    ? 'border-[var(--c-error-border)] focus:border-[var(--c-error)] focus:ring-[var(--c-error)]'
    : 'border-[var(--c-border)] focus:border-[var(--c-border-focus)] focus:ring-[var(--c-green-glow)]';
</script>

<input
  {disabled}
  {placeholder}
  class="w-full bg-[var(--c-bg)] border rounded-md px-4 py-2.5
         text-[var(--c-text)] placeholder-[var(--c-text-muted)]
         font-mono text-[var(--fs-sm)] transition-all duration-200
         focus:outline-none focus:ring-1
         {borderColor}
         disabled:bg-[var(--c-surface)] disabled:text-[var(--c-text-muted)] disabled:cursor-not-allowed"
  {...$$restProps}
/>

{#if error}
  <div class="text-[var(--fs-xs)] text-[var(--c-error)] mt-1 font-mono">
    <slot name="error" />
  </div>
{/if}

<style>
  input {
    appearance: none;
  }
  input::-webkit-calendar-picker-indicator {
    filter: invert(0.5);
  }
</style>