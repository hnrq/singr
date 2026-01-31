<script lang="ts">
  import { onMount } from "svelte";
  import WaveSurfer from "wavesurfer.js";
  import PlayIcon from "@material-symbols/svg-400/rounded/play_arrow-fill.svg?component";
  import PauseIcon from "@material-symbols/svg-400/rounded/pause-fill.svg?component";
  import Button from "$lib/components/ui/button/button.svelte";

  let waveformContainer: HTMLElement;
  let wavesurfer: WaveSurfer;
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);

  const formatTime = (seconds: number) =>
    new Intl.DateTimeFormat("en-US", {
      minute: "numeric",
      second: "2-digit",
      timeZone: "UTC",
    }).format(new Date(seconds * 1000));

  onMount(() => {
    wavesurfer = WaveSurfer.create({
      container: waveformContainer,
      url: "/demo.wav",
      cursorWidth: 0,
      progressColor: "oklch(0.541 0.281 293.009)",
      waveColor: "white",
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 64,
      barAlign: "bottom",
      normalize: true,
    });

    wavesurfer.on("ready", () => {
      duration = wavesurfer.getDuration();
    });

    wavesurfer.on("audioprocess", () => {
      currentTime = wavesurfer.getCurrentTime();
    });

    wavesurfer.on("seeking", () => {
      currentTime = wavesurfer.getCurrentTime();
    });

    wavesurfer.on("play", () => (isPlaying = true));
    wavesurfer.on("pause", () => (isPlaying = false));

    return () => {
      wavesurfer.destroy();
    };
  });

  const togglePlay = () => {
    wavesurfer.playPause();
  };
</script>

<div class="flex flex-col items-center w-full min-h-screen p-4">
  <div class="w-full max-w-[800px] flex flex-col gap-8">
    <div class="w-full flex items-center gap-4">
      <Button size="icon-lg" onclick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
        {#if isPlaying}
          <PauseIcon class="w-5 h-5 fill-current" />
        {:else}
          <PlayIcon class="w-5 h-5 fill-current ml-0.5" />
        {/if}
      </Button>

      <div class="flex-1 relative flex flex-col justify-end mt-4">
        <div bind:this={waveformContainer} class="w-full h-16 cursor-pointer relative z-10"></div>

        <div
          class="flex justify-between text-xs text-muted-foreground mt-1 pointer-events-none select-none"
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  </div>
</div>
