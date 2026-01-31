<script setup lang="ts">
defineProps<{
  class?: string
  background?: string
}>()
</script>

<template>
  <div
    class="slidev-layout cover"
    :class="$props.class"
    :style="background ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
  >
    <div class="cover-content">
      <slot />
    </div>
    <div class="cover-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.cover {
  @apply h-full w-full flex flex-col items-center justify-center text-center relative;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
}

.cover::before {
  content: '';
  @apply absolute inset-0;
  background: radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%);
}

.cover-content {
  @apply relative z-10;
}

.cover-content :deep(h1) {
  @apply text-5xl md:text-6xl font-bold mb-6;
  background: linear-gradient(135deg, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cover-content :deep(p) {
  @apply text-xl text-gray-300;
}

.cover-footer {
  @apply absolute bottom-8 text-gray-400 text-sm;
}
</style>
