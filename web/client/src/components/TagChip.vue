<template>
  <span class="tag-chip" :class="{ small }" :style="{ background: color + '20', color, borderColor: color }">
    {{ name }}
  </span>
</template>

<script setup lang="ts">
defineProps<{ name: string; color: string; small?: boolean }>();
</script>

<style scoped>
.tag-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-round);
  font-size: var(--font-size-xs);
  font-weight: 500;
  border: 1px solid;
  margin-right: 4px;
  margin-bottom: 2px;
}
.tag-chip.small { padding: 1px 6px; font-size: 11px; }
</style>
