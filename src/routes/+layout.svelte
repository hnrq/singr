<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

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

  <!-- Page Content -->
  <div class="relative z-10 w-full h-full">
    {@render children()}
  </div>
</div>
