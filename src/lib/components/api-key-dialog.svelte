<script lang="ts">
  import { onMount } from "svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import EyeIcon from "@material-symbols/svg-400/sharp/visibility.svg?component";
  import EyeOffIcon from "@material-symbols/svg-400/sharp/visibility_off.svg?component";
  import InfoIcon from "@material-symbols/svg-400/sharp/info.svg?component";

  let { open = $bindable(false) } = $props();

  let geminiKey = $state("");
  let openaiKey = $state("");
  let showPassword = $state(false);
  let activeTab = $state("gemini");

  // Load from local storage on mount
  onMount(() => {
    geminiKey = localStorage.getItem("gemini_api_key") || "";
    openaiKey = localStorage.getItem("openai_api_key") || "";
    activeTab = localStorage.getItem("active_provider") || "gemini";

    const hasKey = activeTab === "gemini" ? geminiKey : openaiKey;

    if (!hasKey) {
      // If no key for active provider, force open
      open = true;
    }
  });

  function saveKey() {
    if (geminiKey.trim()) {
      localStorage.setItem("gemini_api_key", geminiKey.trim());
    }
    if (openaiKey.trim()) {
      localStorage.setItem("openai_api_key", openaiKey.trim());
    }

    // Save the active provider based on which tab is open
    localStorage.setItem("active_provider", activeTab);

    open = false;
  }

  // Determine if closing is allowed (must have saved key for active provider)
  let hasValidSavedKey = $derived(
    (activeTab === "gemini" && geminiKey.trim().length > 0) ||
      (activeTab === "openai" && openaiKey.trim().length > 0),
  );

  function toggleVisibility() {
    showPassword = !showPassword;
  }

  let currentKey = $derived(activeTab === "gemini" ? geminiKey : openaiKey);
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="sm:max-w-[425px]"
    interactOutsideBehavior={hasValidSavedKey ? undefined : "ignore"}
    escapeKeydownBehavior={hasValidSavedKey ? undefined : "ignore"}
    showCloseButton={false}
  >
    <Dialog.Header>
      <Dialog.Title>AI Provider Settings</Dialog.Title>
      <Dialog.Description>
        Configure your API keys for the AI service you want to use. Keys are
        stored locally.
      </Dialog.Description>
    </Dialog.Header>

    <Tabs.Root bind:value={activeTab} class="w-full">
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="gemini">Google Gemini</Tabs.Trigger>
        <Tabs.Trigger value="openai">OpenAI</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>

    <div class="grid gap-2">
      <Label for="api-key">
        {activeTab === "gemini" ? "Gemini API Key" : "OpenAI API Key"}
      </Label>
      <div class="relative">
        <Input
          id="api-key"
          type={showPassword ? "text" : "password"}
          value={currentKey}
          oninput={(e) => {
            if (activeTab === "gemini") geminiKey = e.currentTarget.value;
            else openaiKey = e.currentTarget.value;
          }}
          placeholder={activeTab === "gemini" ? "AIzaSy..." : "sk-..."}
          class="pr-10"
        />
        <button
          type="button"
          onclick={toggleVisibility}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {#if showPassword}
            <EyeOffIcon class="h-4 w-4 fill-foreground" />
          {:else}
            <EyeIcon class="h-4 w-4 fill-foreground" />
          {/if}
        </button>
      </div>
    </div>
    <div
      class="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-md"
    >
      <InfoIcon class="h-4 w-4 mt-0.5 shrink-0 fill-foreground" />
      <p>
        Get a free key from <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:underline">Google AI Studio</a
        >.
      </p>
    </div>

    <Dialog.Footer>
      <Button onclick={saveKey} disabled={!currentKey.trim()}>
        Save & Use {activeTab === "gemini" ? "Gemini" : "OpenAI"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
