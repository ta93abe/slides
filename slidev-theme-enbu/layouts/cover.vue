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
        <!-- 上 1/4 の星空: 3 レイヤー（小・中・明るい）の box-shadow 多重 + 流れ星 -->
        <div class="starfield">
            <div class="stars stars-small" />
            <div class="stars stars-medium" />
            <div class="stars stars-bright" />
            <div class="shooting-star shooting-star-1" />
        </div>
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

/* 上 1/3 の星空 — 闇の上層に瞬く星 */
.starfield {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 33.33%;
    overflow: hidden;
    pointer-events: none;
    /* 下端がフェードして炎側と自然に繋がる */
    mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, #000 60%, transparent 100%);
}

.stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    border-radius: 50%;
    background: transparent;
}

/* small: 細かい背景星 (約 50 個、opacity 0.35-0.55) */
.stars-small {
    box-shadow:
        23px 18px rgba(255, 255, 255, 0.45),
        67px 42px rgba(255, 255, 255, 0.35),
        102px 9px rgba(255, 255, 255, 0.5),
        148px 31px rgba(255, 255, 255, 0.4),
        191px 64px rgba(255, 255, 255, 0.45),
        237px 12px rgba(255, 255, 255, 0.5),
        279px 47px rgba(255, 255, 255, 0.35),
        318px 22px rgba(255, 255, 255, 0.45),
        361px 73px rgba(255, 255, 255, 0.4),
        407px 14px rgba(255, 255, 255, 0.5),
        449px 51px rgba(255, 255, 255, 0.35),
        492px 27px rgba(255, 255, 255, 0.45),
        534px 88px rgba(255, 255, 255, 0.4),
        579px 6px rgba(255, 255, 255, 0.5),
        622px 36px rgba(255, 255, 255, 0.45),
        667px 60px rgba(255, 255, 255, 0.35),
        712px 19px rgba(255, 255, 255, 0.5),
        756px 80px rgba(255, 255, 255, 0.4),
        801px 33px rgba(255, 255, 255, 0.45),
        845px 11px rgba(255, 255, 255, 0.5),
        889px 56px rgba(255, 255, 255, 0.35),
        933px 24px rgba(255, 255, 255, 0.45),
        978px 71px rgba(255, 255, 255, 0.4),
        1023px 17px rgba(255, 255, 255, 0.5),
        1068px 45px rgba(255, 255, 255, 0.35),
        1112px 8px rgba(255, 255, 255, 0.5),
        1158px 67px rgba(255, 255, 255, 0.45),
        1201px 29px rgba(255, 255, 255, 0.4),
        1245px 53px rgba(255, 255, 255, 0.5),
        45px 95px rgba(255, 255, 255, 0.4),
        88px 117px rgba(255, 255, 255, 0.35),
        129px 102px rgba(255, 255, 255, 0.5),
        174px 138px rgba(255, 255, 255, 0.4),
        217px 109px rgba(255, 255, 255, 0.45),
        262px 147px rgba(255, 255, 255, 0.35),
        307px 121px rgba(255, 255, 255, 0.5),
        351px 100px rgba(255, 255, 255, 0.4),
        396px 145px rgba(255, 255, 255, 0.45),
        441px 113px rgba(255, 255, 255, 0.35),
        486px 130px rgba(255, 255, 255, 0.5),
        530px 102px rgba(255, 255, 255, 0.4),
        575px 142px rgba(255, 255, 255, 0.45),
        620px 118px rgba(255, 255, 255, 0.35),
        664px 96px rgba(255, 255, 255, 0.5),
        709px 133px rgba(255, 255, 255, 0.4),
        754px 108px rgba(255, 255, 255, 0.45),
        798px 140px rgba(255, 255, 255, 0.35),
        843px 119px rgba(255, 255, 255, 0.5),
        887px 99px rgba(255, 255, 255, 0.4);
}

/* medium: ややはっきりした星 (約 25 個、1.5px) */
.stars-medium {
    width: 1.5px;
    height: 1.5px;
    box-shadow:
        78px 25px rgba(255, 255, 240, 0.7),
        165px 52px rgba(255, 255, 240, 0.65),
        253px 18px rgba(255, 255, 240, 0.7),
        342px 58px rgba(255, 255, 240, 0.65),
        428px 31px rgba(255, 255, 240, 0.7),
        516px 75px rgba(255, 255, 240, 0.65),
        604px 22px rgba(255, 255, 240, 0.7),
        692px 48px rgba(255, 255, 240, 0.65),
        781px 15px rgba(255, 255, 240, 0.7),
        870px 67px rgba(255, 255, 240, 0.65),
        958px 35px rgba(255, 255, 240, 0.7),
        1047px 82px rgba(255, 255, 240, 0.65),
        1135px 28px rgba(255, 255, 240, 0.7),
        1223px 60px rgba(255, 255, 240, 0.65),
        62px 110px rgba(255, 255, 240, 0.65),
        152px 138px rgba(255, 255, 240, 0.7),
        241px 92px rgba(255, 255, 240, 0.65),
        331px 145px rgba(255, 255, 240, 0.7),
        419px 124px rgba(255, 255, 240, 0.65),
        508px 99px rgba(255, 255, 240, 0.7),
        596px 142px rgba(255, 255, 240, 0.65),
        685px 115px rgba(255, 255, 240, 0.7),
        773px 95px rgba(255, 255, 240, 0.65),
        862px 137px rgba(255, 255, 240, 0.7),
        950px 108px rgba(255, 255, 240, 0.65);
}

/* bright: たまに目立つ明るい星 (約 12 個、2px、glow 付き、twinkle) */
.stars-bright {
    width: 2px;
    height: 2px;
    box-shadow:
        118px 36px 1px rgba(255, 245, 220, 0.95),
        298px 65px 1px rgba(255, 240, 210, 0.9),
        478px 19px 1px rgba(255, 245, 220, 0.95),
        658px 88px 1px rgba(255, 240, 210, 0.9),
        838px 41px 1px rgba(255, 245, 220, 0.95),
        1018px 71px 1px rgba(255, 240, 210, 0.9),
        1198px 26px 1px rgba(255, 245, 220, 0.95),
        205px 125px 1px rgba(255, 240, 210, 0.9),
        565px 105px 1px rgba(255, 245, 220, 0.95),
        745px 130px 1px rgba(255, 240, 210, 0.9),
        925px 95px 1px rgba(255, 245, 220, 0.95),
        1105px 145px 1px rgba(255, 240, 210, 0.9);
    animation: twinkle 4.5s ease-in-out infinite;
}

@keyframes twinkle {
    0%, 100% { opacity: 0.7; }
    50%      { opacity: 1; }
}

/* 流れ星: 細い光跡が斜めに走る。
   animation の duration を長く取り、発光〜消失は最初の 5-10% だけにすることで
   「たまに流れる」演出を実現。3 本を時差・角度・速度を変えて配置。 */
/* 流れ星の本体: 左 = 尾（透明にフェード）/ 右 = 先端（明るいコア）。
   transform-origin: right center で回転と進行方向の起点を先端に揃える。 */
.shooting-star {
    position: absolute;
    width: 90px;
    height: 1.5px;
    background: linear-gradient(
        to right,
        rgba(255, 255, 240, 0) 0%,
        rgba(255, 255, 240, 0.15) 40%,
        rgba(255, 255, 240, 0.6) 80%,
        rgba(255, 255, 240, 1) 100%
    );
    border-radius: 999px;
    transform-origin: right center;
    box-shadow:
        0 0 6px 1px rgba(255, 240, 210, 0.55),
        0 0 12px 3px rgba(255, 200, 130, 0.25);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
}

/* 進行方向（angle）と移動ベクトル（dx, dy）を整合: dy / dx = tan(angle)。
   空から地上へ流れる隕石風に、すべて右下方向（angle 正の値）。 */
.shooting-star-1 {
    --angle: 18deg;
    --dx: 420px;
    --dy: 137px;
    top: 8%;
    left: -10%;
    animation: shoot 14s ease-out infinite;
}

@keyframes shoot {
    0%   { transform: rotate(var(--angle)) translate3d(0, 0, 0);                  opacity: 0; }
    2%   { opacity: 1; }
    8%   { transform: rotate(var(--angle)) translate3d(var(--dx), var(--dy), 0);  opacity: 0; }
    100% { transform: rotate(var(--angle)) translate3d(var(--dx), var(--dy), 0);  opacity: 0; }
}

/* 巨大な土台の炎 (オレンジから消えていく) */
.flame-base {
    position: absolute;
    bottom: -30%;
    left: 50%;
    transform: translateX(-50%);
    width: 110%;
    height: 58%;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 200, 100, 0.55) 0%,
        rgba(243, 128, 32, 0.4) 18%,
        rgba(199, 62, 29, 0.25) 38%,
        rgba(80, 20, 10, 0.15) 60%,
        transparent 80%
    );
    filter: blur(50px);
    animation: sway-base 6s ease-in-out infinite;
    transform-origin: 50% 100%;
    pointer-events: none;
}

/* 中段の炎 (左寄り) */
.flame-mid {
    position: absolute;
    bottom: -10%;
    left: 25%;
    width: 55%;
    height: 45%;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 230, 150, 0.7) 0%,
        rgba(251, 173, 65, 0.45) 25%,
        rgba(243, 128, 32, 0.25) 50%,
        transparent 75%
    );
    filter: blur(35px);
    mix-blend-mode: screen;
    animation: sway-mid 4.5s ease-in-out infinite;
    transform-origin: 50% 100%;
    pointer-events: none;
}

/* 上段の炎 (右寄り、明るめのコア) */
.flame-top {
    position: absolute;
    bottom: -5%;
    left: 50%;
    width: 45%;
    height: 38%;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 255, 220, 0.55) 0%,
        rgba(255, 200, 100, 0.4) 30%,
        rgba(243, 128, 32, 0.15) 60%,
        transparent 80%
    );
    filter: blur(28px);
    mix-blend-mode: screen;
    animation: sway-top 3.8s ease-in-out infinite;
    transform-origin: 50% 100%;
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

/* ユラユラ揺らぐ炎: 0 → 100% でぐるりと一周し、シームレスにループ */
@keyframes sway-base {
    0%   { transform: translateX(-50%) scale(1)    translateY(0)   skewX(0deg);  opacity: 0.85; }
    25%  { transform: translateX(-46%) scale(1.03) translateY(-1%) skewX(3deg);  opacity: 0.95; }
    50%  { transform: translateX(-50%) scale(1.06) translateY(-2%) skewX(0deg);  opacity: 1;    }
    75%  { transform: translateX(-54%) scale(1.03) translateY(-1%) skewX(-3deg); opacity: 0.92; }
    100% { transform: translateX(-50%) scale(1)    translateY(0)   skewX(0deg);  opacity: 0.85; }
}

@keyframes sway-mid {
    0%   { transform: translateX(0)   scale(1)    translateY(0)   skewX(0deg);  opacity: 0.9; }
    25%  { transform: translateX(4%)  scale(1.05) translateY(-2%) skewX(5deg);  opacity: 1;   }
    50%  { transform: translateX(0)   scale(1.08) translateY(-3%) skewX(0deg);  opacity: 1;   }
    75%  { transform: translateX(-4%) scale(1.05) translateY(-2%) skewX(-5deg); opacity: 1;   }
    100% { transform: translateX(0)   scale(1)    translateY(0)   skewX(0deg);  opacity: 0.9; }
}

@keyframes sway-top {
    0%   { transform: translateX(-50%) scale(1)    translateY(0)   skewX(0deg);  opacity: 0.95; }
    25%  { transform: translateX(-44%) scale(1.04) translateY(-2%) skewX(6deg);  opacity: 1;    }
    50%  { transform: translateX(-50%) scale(1.07) translateY(-4%) skewX(0deg);  opacity: 1;    }
    75%  { transform: translateX(-56%) scale(1.04) translateY(-2%) skewX(-6deg); opacity: 1;    }
    100% { transform: translateX(-50%) scale(1)    translateY(0)   skewX(0deg);  opacity: 0.95; }
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
    font-size: 4rem;
    font-weight: 500;
    line-height: 1.1;
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
