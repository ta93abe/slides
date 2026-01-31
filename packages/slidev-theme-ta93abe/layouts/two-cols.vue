<script setup lang="ts">
defineProps<{
  class?: string
  layoutClass?: string
}>()
</script>

<template>
  <div class="slidev-layout two-cols" :class="$props.class">
    <div class="col-left">
      <slot />
    </div>
    <div class="col-right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.two-cols {
  @apply h-full w-full grid grid-cols-2 gap-8;
}

.col-left, .col-right {
  @apply flex flex-col;
}
</style>
