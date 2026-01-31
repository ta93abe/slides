<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div class="slidev-layout default" :class="$props.class">
    <slot />
  </div>
</template>

<style scoped>
.default {
  @apply h-full w-full flex flex-col;
}
</style>
