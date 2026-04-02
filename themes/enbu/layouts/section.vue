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
  background: radial-gradient(ellipse at bottom, rgba(30, 21, 15, 0.6) 0%, var(--enbu-bg) 70%);
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
  width: 160px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--enbu-accent-dark),
    var(--enbu-primary-dark),
    var(--enbu-gold),
    var(--enbu-primary-dark),
    var(--enbu-accent-dark),
    transparent
  );
  border-radius: 2px;
  opacity: 0.4;
}
</style>
