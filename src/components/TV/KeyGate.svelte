<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore, loadApiKey } from '../../stores/appStore';
  import ApiKeyPrompt from './ApiKeyPrompt.svelte';

  onMount(() => {
    loadApiKey();
  });

  $: showPrompt = !$appStore.apiKeyValid;
</script>

{#if showPrompt}
  <ApiKeyPrompt />
{:else}
  <slot />
{/if}