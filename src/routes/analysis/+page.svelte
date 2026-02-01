<script lang="ts">
  import "./waveform.css";

  import { onMount } from "svelte";
  import WaveSurfer from "wavesurfer.js";
  import PlayIcon from "@material-symbols/svg-400/rounded/play_arrow-fill.svg?component";
  import PauseIcon from "@material-symbols/svg-400/rounded/pause-fill.svg?component";
  import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import sampleData from "$lib/data/sample-analysis.json";
  import Loading from "$lib/components/loading.svelte";
  import AnalysisTooltip from "$lib/components/analysis-tooltip.svelte";
  import { mount, getAllContexts } from "svelte";

  let waveformContainer: HTMLElement;
  let wavesurfer: WaveSurfer;
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let isAnalyzing = $state(false);

  interface VocalEvent {
    time_offset: number;
    feedback_note: string;
    category: "strength" | "adjustment";
    sub_category: "pitch" | "diction" | "register" | "dynamics" | "phrasing";
  }

  interface AnalysisResult {
    summary_analysis: {
      overall_rating: string;
      primary_register: string;
      technical_summary: string;
    };
    vocal_timeline: VocalEvent[];
    technical_drill_down: {
      pitch_stability: string;
      breath_management: string;
      diction_score: string;
    };
  }

  const appMap = getAllContexts();

  const addRegions = (analysisResult: AnalysisResult) => {
    regions.clearRegions();

    analysisResult.vocal_timeline.forEach((event) => {
      regions.addRegion({
        start: event.time_offset,
        end: event.time_offset,
        content: (() => {
          const el = document.createElement("div");
          mount(AnalysisTooltip, {
            target: el,
            props: { text: event.feedback_note, category: event.category },
            context: appMap,
          });
          return el;
        })(),
        drag: false,
        resize: false,
      });
    });
  };

  let analysisResult = $state<AnalysisResult | null>(null);
  let regions: any;

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

    regions = wavesurfer.registerPlugin(RegionsPlugin.create());

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

  const loadSampleData = () => {
    analysisResult = sampleData as AnalysisResult;
    if (analysisResult?.vocal_timeline) addRegions(analysisResult);
  };

  const analyzeAudio = async () => {
    if (isAnalyzing) return;
    isAnalyzing = true;
    try {
      const response = await fetch("/demo.wav");
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("audio", blob, "recording.wav");

      const activeProvider =
        localStorage.getItem("active_provider") || "gemini";
      const apiKey =
        activeProvider === "openai"
          ? localStorage.getItem("openai_api_key")
          : localStorage.getItem("gemini_api_key");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        headers: {
          "x-ai-provider": activeProvider,
          "x-api-key": apiKey || "",
        },
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      analysisResult = data;
      if (analysisResult?.vocal_timeline) addRegions(analysisResult);
    } catch (e: any) {
      console.error("Analysis failed:", e);
      alert("Analysis failed: " + e.message);
    } finally {
      isAnalyzing = false;
    }
  };
</script>

<div class="flex flex-col items-center w-full min-h-screen p-4">
  <div class="w-full flex flex-col gap-8">
    <div class="w-full flex items-center gap-4">
      <Button
        size="icon-lg"
        onclick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {#if isPlaying}
          <PauseIcon class="w-5 h-5 fill-foreground" />
        {:else}
          <PlayIcon class="w-5 h-5 fill-foreground ml-0.5" />
        {/if}
      </Button>

      <div class="flex-1 relative flex flex-col justify-end">
        <div
          bind:this={waveformContainer}
          id="waveform"
          class="w-full cursor-pointer z-10"
        ></div>

        <div
          class="flex justify-between text-xs text-muted-foreground mt-1 pointer-events-none select-none"
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Gemini Analysis</h2>
        <div class="flex gap-2">
          <Button variant="outline" onclick={loadSampleData}>
            Load Sample
          </Button>
          <Button
            variant="secondary"
            onclick={analyzeAudio}
            disabled={isAnalyzing}
            class="gap-2"
          >
            {#if isAnalyzing}
              <Loading />
              Analyzing...
            {:else}
              Analyze with Gemini
            {/if}
          </Button>
        </div>
      </div>

      {#if analysisResult}
        <div class="flex flex-col gap-4">
          <!-- Summary Card -->
          <div
            class="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col gap-4"
          >
            <div class="flex justify-between items-start gap-8">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground uppercase">
                  Technical Summary
                </h3>
                <p class="text-lg font-medium mt-1">
                  {analysisResult.summary_analysis.technical_summary}
                </p>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-primary">
                  {analysisResult.summary_analysis.overall_rating}
                </div>
                <div class="text-xs text-muted-foreground uppercase">
                  Rating
                </div>
              </div>
            </div>
            <div class="flex gap-4 mt-2">
              <div class="bg-muted px-3 py-1.5 rounded-md text-sm">
                <span class="text-muted-foreground mr-1">Register:</span>
                <span class="font-medium"
                  >{analysisResult.summary_analysis.primary_register}</span
                >
              </div>
            </div>
          </div>

          <!-- Drill Down Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-card p-4 rounded-xl border border-border shadow-sm">
              <h4 class="text-xs font-medium text-muted-foreground uppercase">
                Pitch Stability
              </h4>
              <p class="mt-2 text-sm">
                {analysisResult.technical_drill_down.pitch_stability}
              </p>
            </div>
            <div class="bg-card p-4 rounded-xl border border-border shadow-sm">
              <h4 class="text-xs font-medium text-muted-foreground uppercase">
                Breath Management
              </h4>
              <p class="mt-2 text-sm">
                {analysisResult.technical_drill_down.breath_management}
              </p>
            </div>
            <div class="bg-card p-4 rounded-xl border border-border shadow-sm">
              <h4 class="text-xs font-medium text-muted-foreground uppercase">
                Diction Score
              </h4>
              <p class="mt-2 text-2xl font-bold">
                {analysisResult.technical_drill_down.diction_score}
              </p>
            </div>
          </div>

          <!-- Timeline -->
          {#if analysisResult.vocal_timeline.length > 0}
            <div
              class="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col gap-4"
            >
              <h3
                class="text-sm font-medium text-muted-foreground uppercase tracking-wider"
              >
                Vocal Timeline
              </h3>
              <div class="grid gap-2">
                {#each analysisResult.vocal_timeline as event}
                  <button
                    onclick={() => wavesurfer.setTime(event.time_offset)}
                    class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <span
                      class="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                    >
                      {formatTime(event.time_offset)}
                    </span>
                    <div class="flex-1 flex flex-col">
                      <span class="text-sm">{event.feedback_note}</span>
                      <span class="text-[10px] text-muted-foreground uppercase"
                        >{event.sub_category}</span
                      >
                    </div>
                    <span
                      class={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        event.category === "strength"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-orange-500/10 text-orange-500"
                      }`}
                    >
                      {event.category}
                    </span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
