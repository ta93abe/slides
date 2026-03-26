<template>
  <div class="slidev-layout two-cols">
    <div class="col-left">
      <slot name="default" />
    </div>
    <div class="col-right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2.5rem 3rem;
  background: var(--enbu-bg);
  min-height: 100%;
  align-items: start;
}

.col-left,
.col-right {
  overflow: auto;
}
</style>
