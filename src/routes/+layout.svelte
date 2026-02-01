<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";
  import ApiKeyDialog from "$lib/components/api-key-dialog.svelte";
  import SettingsIcon from "@material-symbols/svg-400/sharp/settings.svg?component";
  import { Button } from "$lib/components/ui/button";
  import * as Tooltip from "$lib/components/ui/tooltip";

  let { children } = $props();
  let showApiKeyDialog = $state(false);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Tooltip.Provider delayDuration={0}>
  <!-- Global Background Container -->
  <div
    class="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-white selection:bg-purple-500/30 font-sans"
  >
    <!-- Background Gradients -->
    <div
      class="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[100px] z-0"
    ></div>
    <div
      class="pointer-events-none absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[100px] z-0"
    ></div>

    <ApiKeyDialog bind:open={showApiKeyDialog} />

    <!-- Page Content -->
    <div class="relative z-10 max-w-[1000px] m-auto h-full">
      <!-- Settings Button -->
      <div class="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          class="text-white/50 hover:text-white hover:bg-white/10"
          onclick={() => (showApiKeyDialog = true)}
        >
          <SettingsIcon class="size-6 fill-foreground" />
        </Button>
      </div>
      {@render children()}
    </div>
  </div>
</Tooltip.Provider>
