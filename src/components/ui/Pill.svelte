<script lang="ts">
  export let variant: 'primary' | 'muted' | 'gold' = 'primary';
  export let size: 'sm' | 'md' = 'sm';

  $$restProps: Record<string, any>;

  $: baseClasses = [
    'inline-flex items-center gap-1.5',
    'font-mono font-semibold uppercase tracking-wider',
    'rounded-full',
    'border',
    'transition-colors duration-200',
  ].join(' ');

  $: variantClasses = variant === 'primary'
    ? 'bg-[var(--c-green-dim)] text-[var(--c-green-text)] border-[var(--c-green-border)]'
    : variant === 'gold'
    ? 'bg-[rgba(255,200,50,0.1)] text-[var(--c-gold)] border-[rgba(255,200,50,0.3)]'
    : 'bg-[rgba(255,255,255,0.03)] text-[var(--c-text-muted)] border-[var(--c-border)]';

  $: sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[var(--fs-xs)]'
    : 'px-3 py-1 text-[var(--fs-sm)]';
</script>

<span
  class="{baseClasses} {variantClasses} {sizeClasses}"
  {...$$restProps}
>
  <slot />
</span>