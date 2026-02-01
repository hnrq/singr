<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { Visualizer } from "$lib/components/ui/visualizer";

  import MicIcon from "@material-symbols/svg-400/sharp/mic-fill.svg?component";
  import StopIcon from "@material-symbols/svg-400/sharp/stop-fill.svg?component";
  import UploadIcon from "@material-symbols/svg-400/sharp/upload_file-fill.svg?component";

  let isRecording = $state(false);
  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = $state(null);
  let audioChunks: Blob[] = [];
  let isDragOver = $state(false);

  async function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream = s;
      mediaRecorder = new MediaRecorder(s);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        console.log("Recording finished", audioBlob);
        goto("/analysis");
      };

      mediaRecorder.start();
      isRecording = true;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(
        "Could not access microphone. Please ensure permissions are granted.",
      );
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("audio/")) {
        console.log("File dropped", file);
        goto("/analysis");
      } else {
        alert("Please upload an audio file.");
      }
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
  }
</script>

<svelte:head>
  <title>Voice Coach</title>
</svelte:head>

<!-- Main Container -->
<div
  class="relative flex min-h-screen flex-col items-center justify-center"
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  role="application"
>
  <!-- Content Wrapper -->
  <div
    class="z-10 flex flex-col items-center gap-12 p-8 transition-all duration-500"
    class:opacity-50={isDragOver}
    class:scale-95={isDragOver}
  >
    <!-- Recording Button Area -->
    <div class="relative flex items-center justify-center">
      <!-- Canvas Visualizer -->
      <Visualizer
        {stream}
        {isRecording}
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />

      <!-- Glow Effect (Static background) -->
      <div
        class="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        class:animate-pulse={isRecording}
        style="width: 100%; height: 100%;"
      ></div>

      <Button
        onclick={toggleRecording}
        variant="outline"
        class="relative z-10 h-32 w-32 rounded-full border-2 border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10 active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-purple-500/30 data-[recording=true]:border-red-500/30 data-[recording=true]:bg-red-500/10 p-0"
        data-recording={isRecording}
        aria-label={isRecording ? "Stop Recording" : "Start Recording"}
      >
        <div
          class="w-12 h-12 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-colors duration-300"
          class:text-red-500={isRecording}
          class:text-white={!isRecording}
        >
          {#if isRecording}
            <StopIcon class="fill-red-500 size-full" />
          {:else}
            <MicIcon class="fill-foreground size-full" />
          {/if}
        </div>
      </Button>
    </div>

    <!-- Drag & Drop Hint -->
    <div
      class="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-8 py-6 backdrop-blur-sm transition-colors hover:bg-white/10"
      class:border-purple-500_50={isDragOver}
      class:bg-purple-500_10={isDragOver}
    >
      <p class="text-sm font-medium text-zinc-300">
        Tap the microphone to record
      </p>
      <div class="flex items-center gap-3 text-xs text-zinc-500">
        <div class="h-px w-12 bg-zinc-800"></div>
        <span>OR</span>
        <div class="h-px w-12 bg-zinc-800"></div>
      </div>
      <p class="text-sm text-zinc-400">Drag & drop audio files here</p>
    </div>
  </div>

  <!-- Drag Overlay -->
  {#if isDragOver}
    <div
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
    >
      <div class="flex flex-col items-center gap-4 animate-bounce">
        <div class="w-16 h-16 text-purple-400">
          <UploadIcon class="fill-foreground" />
        </div>
        <p class="text-2xl font-bold text-white">Drop to Upload</p>
      </div>
    </div>
  {/if}
</div>
