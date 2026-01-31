<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div class="slidev-layout center" :class="$props.class">
    <slot />
  </div>
</template>

<style scoped>
.center {
  @apply h-full w-full flex flex-col items-center justify-center text-center;
}
</style>
