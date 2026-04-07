<template>
  <div class="slidev-layout center">
    <div class="center-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  background: var(--enbu-bg);
  padding: 2rem;
}

.center-content {
  text-align: center;
  max-width: 80%;
}
</style>
