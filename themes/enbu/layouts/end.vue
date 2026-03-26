<template>
  <div class="slidev-layout end">
    <FlameBackground />
    <div class="end-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.end {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
}

.end-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.end-content :deep(h1) {
  font-size: 3em;
  background: linear-gradient(135deg, var(--enbu-gold-light), var(--enbu-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
