<script setup lang="ts">
import { handleBackground } from "../layoutHelper";
import { computed } from "vue";

const props = defineProps({
    background: {
        type: String,
        default: undefined,
    },
});

const style = computed(() => handleBackground(props.background));
</script>

<template>
    <div class="slidev-layout section" :style="style">
        <div class="section-content">
            <slot />
        </div>
    </div>
</template>

<style scoped>
.section {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    text-align: center;
}

.section-content {
    position: relative;
    display: inline-block;
    padding-bottom: 1.5rem;
}

.section-content :deep(h1) {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1.2;
    margin: 0;
}

.section-content :deep(h2) {
    font-size: 1.5rem;
    font-weight: 400;
    opacity: 0.7;
    margin-top: 0.5rem;
}

.section-content::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: 60%;
    min-width: 4rem;
    height: 3px;
    background: var(--slidev-theme-primary);
    border-radius: 2px;
}
</style>
