<script lang="ts">
  export let variant: 'primary' | 'ghost' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let onClick: () => void;

  $$restProps;

  $: baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'font-mono font-semibold transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-none',
    'active:scale-[0.98]',
    'rounded-md',
  ].join(' ');

  $: variantClasses = variant === 'primary'
    ? 'bg-[var(--c-green)] text-[var(--c-text-inverse)] border border-[var(--c-green)] hover:bg-[var(--c-green)]/90 hover:border-[var(--c-green)]'
    : variant === 'danger'
    ? 'bg-[var(--c-error)] text-white border border-[var(--c-error)] hover:bg-[var(--c-error)]/90'
    : 'bg-transparent text-[var(--c-text-dim)] border border-[var(--c-border)] hover:text-white hover:border-[var(--c-border-focus)]';

  $: sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-[var(--fs-xs)]'
    : size === 'lg'
    ? 'px-6 py-3 text-[var(--fs-base)]'
    : 'px-4 py-2 text-[var(--fs-sm)]';
</script>

<button
  {disabled}
  {loading}
  onclick={onClick}
  class="{baseClasses} {variantClasses} {sizeClasses}"
  {...$$restProps}
  aria-busy={loading}
>
  {#if loading}
    <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
  {/if}
  <slot />
</button>

<style>
  button {
    outline: none;
    cursor: pointer;
  }
  button:disabled {
    cursor: not-allowed;
  }
  .animate-spin {
    animation: spin 0.75s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>