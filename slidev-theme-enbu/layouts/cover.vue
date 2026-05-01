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
        <!-- 焚き火: 薪 (3 本の log を井桁状) + 周辺光 + 主炎 + 中心コア -->
        <div class="firepit">
            <div class="log log-back" />
            <div class="log log-left" />
            <div class="log log-right" />
        </div>
        <div class="flame flame-glow" />
        <div class="flame flame-body" />
        <div class="flame flame-core" />
        <!-- 上空に漂う火の粉 -->
        <div class="ember ember-1" />
        <div class="ember ember-2" />
        <div class="ember ember-3" />
        <div class="ember ember-4" />
        <div class="ember ember-5" />
        <div class="ember ember-6" />
        <div class="ember ember-7" />
        <div class="ember ember-8" />
        <div class="ember ember-9" />
        <div class="ember ember-10" />
        <div class="ember ember-11" />
        <div class="ember ember-12" />
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

/* 焚き火の薪 (井桁状に組んだ 3 本の log) */
.firepit {
    position: absolute;
    bottom: 5%;
    left: 50%;
    transform: translateX(-50%);
    width: 280px;
    height: 80px;
    pointer-events: none;
    z-index: 1;
    /* 接地面の影 */
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.65));
}

/* log: リアルな丸太。background を 7 層重ねて樹皮 / 木目 / ノイズ / 節を表現 */
.log {
    position: absolute;
    width: 240px;
    height: 26px;
    background:
        /* (1) SVG fractalNoise: 木の表面のザラつき。混色で繊維感を出す */
        url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='26'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.10  0 0 0 0 0.05  0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
        /* (2) 上部のハイライト (光が当たっている上面) */
        linear-gradient(to bottom,
            rgba(170, 110, 65, 0.55) 0%,
            rgba(115, 70, 38, 0.18) 22%,
            transparent 45%,
            transparent 70%,
            rgba(0, 0, 0, 0.45) 100%),
        /* (3) 縦の割れ目 (薄い暗線、樹皮の裂け目) */
        linear-gradient(to right,
            transparent 18%, rgba(0, 0, 0, 0.45) 18.3%, transparent 18.7%,
            transparent 47%, rgba(0, 0, 0, 0.4) 47.3%, transparent 47.6%,
            transparent 73%, rgba(0, 0, 0, 0.5) 73.3%, transparent 73.7%),
        /* (4) 節 (knot): 円形のダーク斑、木の枝跡 */
        radial-gradient(circle 4px at 32% 55%, rgba(20, 10, 4, 0.85) 30%, rgba(40, 22, 10, 0.5) 70%, transparent),
        radial-gradient(circle 3px at 64% 40%, rgba(15, 8, 3, 0.8) 25%, rgba(35, 18, 8, 0.45) 70%, transparent),
        /* (5) 木目の細かい縦縞 (繊維方向の凹凸) */
        repeating-linear-gradient(90deg,
            rgba(60, 35, 18, 0.5) 0px,
            transparent 1px,
            transparent 4px,
            rgba(40, 22, 10, 0.4) 5px,
            transparent 6px,
            transparent 9px,
            rgba(80, 50, 28, 0.3) 10px,
            transparent 11px),
        /* (6) 樹皮の大きなまだら (色ムラ) */
        radial-gradient(ellipse 20px 7px at 25% 45%, rgba(30, 18, 8, 0.5), transparent),
        radial-gradient(ellipse 16px 6px at 58% 60%, rgba(40, 22, 10, 0.45), transparent),
        radial-gradient(ellipse 24px 8px at 82% 38%, rgba(25, 14, 6, 0.55), transparent),
        /* (7) 樹皮の主色 (暗い茶のグラデ) */
        linear-gradient(to bottom,
            #6a3d20 0%,
            #4a2914 32%,
            #341d0d 65%,
            #1c0e05 100%);
    background-blend-mode: overlay, normal, normal, normal, normal, normal, normal, normal, normal;
    border-radius: 13px;
    box-shadow:
        0 3px 5px rgba(0, 0, 0, 0.55),                  /* 接地影 */
        inset 0 2px 1px rgba(200, 135, 85, 0.4),        /* 上端のハイライトライン */
        inset 0 -3px 6px rgba(0, 0, 0, 0.6),            /* 下端の影 */
        inset 0 0 20px rgba(50, 25, 10, 0.5),           /* 内側全体に陰影 */
        inset 8px 0 12px rgba(0, 0, 0, 0.35),           /* 左端の暗がり */
        inset -8px 0 12px rgba(0, 0, 0, 0.35);          /* 右端の暗がり */
}

/* 木口 (両端の年輪): 多層 radial-gradient で年輪 + 樹皮の輪 */
.log::before,
.log::after {
    content: '';
    position: absolute;
    top: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background:
        /* 樹皮の輪 (外側の暗い枠) */
        radial-gradient(circle at 50% 50%,
            transparent 78%,
            #2a1808 82%,
            #170b03 100%),
        /* 年輪 (中心から複数の輪) */
        radial-gradient(circle at 50% 50%,
            #b07848 0%,
            #8b5a2b 8%,
            #6b3f22 14%,
            #835230 22%,
            #5e371a 30%,
            #4a2a14 40%,
            #623a1c 48%,
            #3e2210 58%,
            #2c1808 72%,
            #1a0d05 100%);
    box-shadow:
        inset 0 0 6px rgba(0, 0, 0, 0.7),
        inset 0 2px 1px rgba(195, 130, 80, 0.35);
}

.log::before { left: -4px; }
.log::after  { right: -4px; }

/* 奥の薪 (土台、ほぼ水平) */
.log-back {
    bottom: 4px;
    left: 20px;
    transform: rotate(-2deg);
}

/* 手前左の薪 (時計回りに傾く) */
.log-left {
    bottom: 22px;
    left: 4px;
    width: 260px;
    transform: rotate(8deg);
}

/* 手前右の薪 (反時計回りに傾いて井桁完成) — こちらは燃え始めている端を強調 */
.log-right {
    bottom: 22px;
    left: 12px;
    width: 260px;
    transform: rotate(-8deg);
}

/* 主炎側の端 (左端) は炭化 + 内側から赤い熱を発する */
.log-back::before,
.log-left::before,
.log-right::after {
    background:
        radial-gradient(circle at 50% 50%,
            transparent 78%,
            #2a1808 82%,
            #170b03 100%),
        radial-gradient(circle at 45% 50%,
            rgba(255, 140, 50, 0.85) 0%,
            rgba(220, 80, 20, 0.55) 18%,
            #5e371a 38%,
            #3e2210 60%,
            #1a0d05 100%);
    box-shadow:
        inset 0 0 6px rgba(0, 0, 0, 0.6),
        inset 0 2px 1px rgba(195, 130, 80, 0.3),
        0 0 14px 3px rgba(255, 110, 40, 0.4);
}

/* 焚き火を包む周辺光 (大きくぼやけた柔らかいオレンジ) */
.flame-glow {
    position: absolute;
    bottom: 5%;
    left: 50%;
    width: 460px;
    height: 360px;
    background: radial-gradient(
        ellipse at 50% 95%,
        rgba(243, 128, 32, 0.4) 0%,
        rgba(199, 62, 29, 0.22) 30%,
        rgba(80, 30, 10, 0.1) 55%,
        transparent 80%
    );
    filter: blur(45px);
    transform: translateX(-50%);
    transform-origin: 50% 100%;
    animation: sway-glow 6.5s ease-in-out infinite;
    pointer-events: none;
}

/* 主炎 (焚き火本体、中央でユラユラ) */
.flame-body {
    position: absolute;
    bottom: 7%;
    left: 50%;
    width: 220px;
    height: 280px;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 220, 130, 0.85) 0%,
        rgba(251, 173, 65, 0.65) 22%,
        rgba(243, 128, 32, 0.5) 45%,
        rgba(199, 62, 29, 0.3) 68%,
        transparent 90%
    );
    filter: blur(14px);
    mix-blend-mode: screen;
    transform: translateX(-50%);
    transform-origin: 50% 100%;
    animation: sway-body 4.5s ease-in-out infinite;
    pointer-events: none;
}

/* 中心コア (一番明るい白〜黄、細く立ち昇る) */
.flame-core {
    position: absolute;
    bottom: 8%;
    left: 50%;
    width: 110px;
    height: 200px;
    background: radial-gradient(
        ellipse at 50% 100%,
        rgba(255, 250, 220, 0.95) 0%,
        rgba(255, 220, 130, 0.7) 30%,
        rgba(251, 173, 65, 0.35) 60%,
        transparent 85%
    );
    filter: blur(7px);
    mix-blend-mode: screen;
    transform: translateX(-50%);
    transform-origin: 50% 100%;
    animation: sway-core 3.2s ease-in-out infinite;
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

/* 焚き火の上から立ち昇る火の粉: 中央 38-62% に集中 */
.ember-1  { left: 46%; bottom: 12%; animation: rise 7s    ease-in-out infinite; }
.ember-2  { left: 54%; bottom: 9%;  animation: rise 9s    ease-in-out 2s   infinite; }
.ember-3  { left: 50%; bottom: 14%; animation: rise 8s    ease-in-out 4s   infinite; }
.ember-4  { left: 42%; bottom: 10%; animation: rise 7.5s  ease-in-out 1s   infinite; }
.ember-5  { left: 58%; bottom: 13%; animation: rise 8.5s  ease-in-out 3s   infinite; }
.ember-6  { left: 48%; bottom: 8%;  animation: rise 9.5s  ease-in-out 5s   infinite; }
.ember-7  { left: 52%; bottom: 11%; animation: rise 8s    ease-in-out 0.5s infinite; }
.ember-8  { left: 44%; bottom: 13%; animation: rise 7.2s  ease-in-out 1.5s infinite; }
.ember-9  { left: 56%; bottom: 10%; animation: rise 9.2s  ease-in-out 2.5s infinite; }
.ember-10 { left: 38%; bottom: 11%; animation: rise 7.8s  ease-in-out 3.5s infinite; }
.ember-11 { left: 62%; bottom: 12%; animation: rise 8.7s  ease-in-out 4.5s infinite; }
.ember-12 { left: 50%; bottom: 9%;  animation: rise 9.7s  ease-in-out 5.5s infinite; }

/* 焚き火のユラユラ: 周辺光は緩く、中心ほど大きく揺れる */
@keyframes sway-glow {
    0%   { transform: translateX(-50%) scale(1)    skewX(0deg);  opacity: 0.85; }
    25%  { transform: translateX(-48%) scale(1.04) skewX(2deg);  opacity: 0.95; }
    50%  { transform: translateX(-50%) scale(1.06) skewX(0deg);  opacity: 1;    }
    75%  { transform: translateX(-52%) scale(1.04) skewX(-2deg); opacity: 0.9;  }
    100% { transform: translateX(-50%) scale(1)    skewX(0deg);  opacity: 0.85; }
}

@keyframes sway-body {
    0%   { transform: translateX(-50%) scale(1)    translateY(0)    skewX(0deg);  opacity: 0.9; }
    25%  { transform: translateX(-46%) scale(1.06) translateY(-2%)  skewX(5deg);  opacity: 1;   }
    50%  { transform: translateX(-50%) scale(1.1)  translateY(-3%)  skewX(0deg);  opacity: 1;   }
    75%  { transform: translateX(-54%) scale(1.06) translateY(-2%)  skewX(-5deg); opacity: 1;   }
    100% { transform: translateX(-50%) scale(1)    translateY(0)    skewX(0deg);  opacity: 0.9; }
}

@keyframes sway-core {
    0%   { transform: translateX(-50%) scale(1)    translateY(0)    skewX(0deg);  opacity: 0.95; }
    25%  { transform: translateX(-44%) scale(1.07) translateY(-3%)  skewX(7deg);  opacity: 1;    }
    50%  { transform: translateX(-50%) scale(1.12) translateY(-5%)  skewX(0deg);  opacity: 1;    }
    75%  { transform: translateX(-56%) scale(1.07) translateY(-3%)  skewX(-7deg); opacity: 1;    }
    100% { transform: translateX(-50%) scale(1)    translateY(0)    skewX(0deg);  opacity: 0.95; }
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
