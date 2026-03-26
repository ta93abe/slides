<script setup>
defineProps({
  background: { type: String, default: '' },
})
</script>

<template>
  <div class="slidev-layout cover">
    <FlameBackground />
    <div class="cover-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.cover {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
}

.cover-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
}
</style>
