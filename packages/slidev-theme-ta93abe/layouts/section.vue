<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div class="slidev-layout section" :class="$props.class">
    <slot />
  </div>
</template>

<style scoped>
.section {
  @apply h-full w-full flex flex-col items-start justify-center;
}

.section :deep(h1) {
  @apply text-5xl font-bold;
}
</style>
