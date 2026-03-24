<template>
  <div class="slidev-layout section">
    <div class="section-content">
      <slot />
    </div>
    <div class="section-line" />
  </div>
</template>

<style scoped>
.section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  background: radial-gradient(ellipse at bottom, var(--enbu-surface) 0%, var(--enbu-bg) 70%);
  position: relative;
}

.section-content {
  text-align: center;
}

.section-line {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--enbu-accent),
    var(--enbu-primary),
    var(--enbu-gold),
    var(--enbu-primary),
    var(--enbu-accent),
    transparent
  );
  border-radius: 2px;
}
</style>
