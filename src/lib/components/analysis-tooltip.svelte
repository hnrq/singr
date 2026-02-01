<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip";

  let {
    text,
    category,
  }: { text: string; category: "strength" | "adjustment" } = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger
    style="background-color: {category === 'strength'
      ? 'var(--chart-2)'
      : 'var(--chart-3)'}; width: 12px; height: 12px; border-radius: 50%; border: none; transform: translateX(-50%);"
  ></Tooltip.Trigger>
  <Tooltip.Content side="bottom">
    <p>{text}</p>
  </Tooltip.Content>
</Tooltip.Root>
