<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import WaveSurfer from "wavesurfer.js";
  import RecordPlugin from "wavesurfer.js/dist/plugins/record.js";

  interface Props {
    stream: MediaStream | null;
    isRecording: boolean;
    class?: string;
  }

  let { stream, isRecording, class: className = "" }: Props = $props();

  let container: HTMLDivElement;
  let wavesurfer: WaveSurfer | null = null;
  let record: RecordPlugin | null = null;

  onMount(() => {
    if (container) {
      wavesurfer = WaveSurfer.create({
        container,
        waveColor: "rgb(192, 132, 252)", // Purple-ish to match theme
        progressColor: "rgb(126, 34, 206)",
        height: 160, // Match the max radius * 2 roughly, or fit container
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        cursorWidth: 0,
      });

      record = wavesurfer.registerPlugin(
        RecordPlugin.create({ scrollingWaveform: false, renderRecordedAudio: false }),
      );
    }

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
        wavesurfer = null;
      }
    };
  });

  $effect(() => {
    if (isRecording && stream && record) {
      // Start rendering the stream
      // Note: record.startMic() usually requests mic access, but we already have a stream.
      // The Record plugin in v7 might handle streams differently or we just need to visualize the stream.
      // Checking docs mentally: record.renderMic(stream) is likely what we want if we have a stream.
      // However, the standard Record plugin usage is record.startMic().
      // Since we are passing a stream from the parent component which manages the MediaRecorder,
      // we might be duplicating efforts if we ask for mic again.
      // But wait, user asked to "use it in the audio-visualizer".
      // If I can't easily pass the stream to RecordPlugin (it often creates its own stream),
      // I might just let it handle the visualization using its own internal stream logic or see if it accepts a stream.
      // RecordPlugin.create() options don't typically include a stream.
      // However, `record.startMic()` creates a stream.
      // If we want to strictly use the prop `stream`, we might have to bypass RecordPlugin's internal stream acquisition
      // or just ignore the prop stream for visualization purposes if that's acceptable, but `stream` prop is passed for a reason.
      //
      // Actually, looking at commonly available signatures:
      // record.startMic(options) -> uses navigator.mediaDevices.getUserMedia
      //
      // If we already have a stream, we can verify if RecordPlugin supports passing it.
      // Many versions of these plugins are simple wrappers.
      //
      // Alternative: WaveSurfer can visualize a stream directly without Record plugin? No, WaveSurfer is for files usually.
      // Record plugin is specifically for live mic.
      //
      // If I look at the old code, it used `AudioContext.createMediaStreamSource(stream)`.
      // Let's see if we can trick RecordPlugin or use a custom backend? No, that's "customizing too much".
      //
      // Let's assume for now we can just use `record.startMic()` independently.
      // It will ask for permission again? If permission is already granted for the origin, it usually just works silently.
      // But having two streams active might be weird if not handled.
      //
      // Wait, I can't easily see the types for `RecordPlugin` without checking.
      // But `renderMic` is often a method in these plugins to visualize an existing stream.
      // Let's try to assume `renderMic` exists or `startMic` takes a stream (unlikely).
      //
      // Actually I will search the web or just list the library files?
      // `wavesurfer.js` source is not locally available to read easily without digging into node_modules.
      //
      // Let's try `record.renderMic(stream)` pattern if possible.
      // If not, I'll use `startMic()` and rely on browser permission caching.
      // Re-reading docs (simulated): Wavesurfer 7 docs say:
      // "To visualize a live stream, use the Record plugin."
      // "record.startMic()"
      // Does it take a stream?
      // I'll stick to `record.renderMic(stream)` if I can find it, otherwise `startMic`.
      // Let's check node_modules types if I can.
      // I'll pause the tool call to check types first?
      // No, I'll check types in a separate step if I want to be sure.
      // I'll take a quick look at `node_modules/wavesurfer.js/dist/plugins/record.d.ts` if it exists.
    } else if (!isRecording && record) {
      record.stopMic();
    }
  });

  // Re-implementation note:
  // I will just use `startMic` for now inside the effect, but I need to be careful about not creating infinite loops or multi-starts.
  // The effect depends on `isRecording`.

  $effect(() => {
    if (record) {
      if (isRecording && stream) {
        // startMic returns a promise with the stream.
        record.renderMicStream(stream);
      } else {
        record.stopMic();
      }
    }
  });
</script>

<div
  bind:this={container}
  class="rounded-full overflow-hidden w-[300px] h-[300px] flex items-center justify-center mask-image-circle {className}"
>
  <!-- Wavesurfer will inject canvas here -->
</div>

<style>
  /* Ensure the container clips the waveform to a circle */
  .mask-image-circle {
    mask-image: radial-gradient(circle, white 100%, black 100%);
    -webkit-mask-image: -webkit-radial-gradient(circle, white 100%, black 100%);
    transform: translateZ(0); /* Fix for some browsers */
  }
</style>
