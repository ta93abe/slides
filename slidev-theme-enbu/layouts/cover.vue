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
    <div class="slidev-layout cover" :style="style">
        <!-- 闇に纏う炎: 3 層の radial gradient を blur + 揺らがせて立ち昇る炎を表現 -->
        <div class="flame flame-base" />
        <div class="flame flame-mid" />
        <div class="flame flame-top" />
        <!-- 上空に漂う火の粉 -->
        <div class="ember ember-1" />
        <div class="ember ember-2" />
        <div class="ember ember-3" />
        <div class="ember ember-4" />
        <div class="ember ember-5" />
        <div class="ember ember-6" />
        <div class="cover-content">
            <slot />
        </div>
    </div>
</template>

<style scoped>
.cover {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: radial-gradient(ellipse at 50% 90%, #1a0a05 0%, #050201 60%, #000 100%);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
}

/* 巨大な土台の炎 (オレンジから消えていく) */
.flame-base {
    position: absolute;
    bottom: -30%;
    left: 50%;
    transform: translateX(-50%);
    width: 110%;
    height: 90%;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 200, 100, 0.55) 0%,
        rgba(243, 128, 32, 0.4) 18%,
        rgba(199, 62, 29, 0.25) 38%,
        rgba(80, 20, 10, 0.15) 60%,
        transparent 80%
    );
    filter: blur(50px);
    animation: flicker-base 5.5s ease-in-out infinite alternate;
    pointer-events: none;
}

/* 中段の炎 (左寄り) */
.flame-mid {
    position: absolute;
    bottom: -10%;
    left: 25%;
    width: 55%;
    height: 70%;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 230, 150, 0.7) 0%,
        rgba(251, 173, 65, 0.45) 25%,
        rgba(243, 128, 32, 0.25) 50%,
        transparent 75%
    );
    filter: blur(35px);
    mix-blend-mode: screen;
    animation: flicker-mid 4.2s ease-in-out infinite alternate;
    pointer-events: none;
}

/* 上段の炎 (右寄り、明るめのコア) */
.flame-top {
    position: absolute;
    bottom: -5%;
    left: 50%;
    width: 45%;
    height: 60%;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 255, 220, 0.55) 0%,
        rgba(255, 200, 100, 0.4) 30%,
        rgba(243, 128, 32, 0.15) 60%,
        transparent 80%
    );
    filter: blur(28px);
    mix-blend-mode: screen;
    animation: flicker-top 3.6s ease-in-out infinite alternate;
    pointer-events: none;
}

/* 火の粉 (天に上る粒子) */
.ember {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(255, 200, 100, 0.85);
    box-shadow: 0 0 6px 2px rgba(243, 128, 32, 0.6);
    pointer-events: none;
}

.ember-1 { left: 22%; bottom: 30%; animation: rise 7s   ease-in-out infinite; }
.ember-2 { left: 60%; bottom: 20%; animation: rise 9s   ease-in-out 2s   infinite; }
.ember-3 { left: 78%; bottom: 35%; animation: rise 8s   ease-in-out 4s   infinite; }
.ember-4 { left: 35%; bottom: 25%; animation: rise 7.5s ease-in-out 1s   infinite; }
.ember-5 { left: 50%; bottom: 32%; animation: rise 8.5s ease-in-out 3s   infinite; }
.ember-6 { left: 70%; bottom: 28%; animation: rise 9.5s ease-in-out 5s   infinite; }

@keyframes flicker-base {
    0%   { transform: translateX(-50%) scale(1)   translateY(0);   opacity: 0.85; }
    50%  { transform: translateX(-49%) scale(1.04) translateY(-1%); opacity: 1;    }
    100% { transform: translateX(-51%) scale(0.97) translateY(2%);  opacity: 0.78; }
}

@keyframes flicker-mid {
    0%   { transform: scale(1)   translateY(0);   opacity: 0.9; }
    50%  { transform: scale(1.08) translateY(-2%); opacity: 1;   }
    100% { transform: scale(0.95) translateY(1%);  opacity: 0.8; }
}

@keyframes flicker-top {
    0%   { transform: translateX(-50%) scale(1)   translateY(0);   opacity: 0.95; }
    50%  { transform: translateX(-50%) scale(1.06) translateY(-3%); opacity: 1;    }
    100% { transform: translateX(-50%) scale(0.94) translateY(2%);  opacity: 0.85; }
}

@keyframes rise {
    0%   { transform: translate(0, 0) scale(1);    opacity: 0;   }
    20%  { opacity: 1; }
    100% { transform: translate(20px, -180px) scale(0.4); opacity: 0; }
}

/* タイトル群 */
.cover-content {
    position: relative;
    z-index: 1;
    text-align: center;
    padding: 0 4rem;
    max-width: 90%;
}

/* テキストは装飾せず、素のまま (背景の炎が主役) */
.cover-content :deep(h1) {
    font-size: 5rem;
    font-weight: 800;
    line-height: 1.08;
    margin: 0;
    color: #fff;
}

.cover-content :deep(h2) {
    font-size: 1.3rem;
    font-weight: 400;
    margin-top: 1.5rem;
    color: #fff;
    opacity: 0.7;
}
</style>
