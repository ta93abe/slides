<script setup lang="ts">
/**
 * 炎舞 (enbu) テーマの背景グロー
 *
 * 3 つのポリゴンを blur して重ねた "Blob" 風背景。
 * - 色は enbu のテーマカラーに合わせたオレンジ系 (#F38020 系統)。
 * - 各スライドの frontmatter で挙動を制御:
 *   - `glow: 'full' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | ... | false`
 *       false にすると非表示。cover レイアウトはデフォルトで非表示 (炎エフェクトと競合するため)
 *   - `glowOpacity: number` (デフォルト 0.35)
 *   - `glowHue: number` (HSL hue-rotate、デフォルト 0)
 *   - `glowSeed: string | false` (デフォルト 'enbu'。false にすると初回ロード時にだけランダム
 *      seed が生成され、以降そのセッションの間は同じ seed を使い続ける)
 *
 * 設計の元ネタは antfu/talks の global-bottom.vue (credits to @pi0 / @Atinux)
 */
import { useNav } from '@slidev/client'
import seedrandom from 'seedrandom'
import { computed, ref, watch } from 'vue'

const { currentSlideRoute } = useNav()

/** 2 次元の点 [x, y]。座標は 0..1 に正規化された値 (overflow 込みで -0.2..1.2) */
export type Point = [number, number]
/** 値域の閉区間 [min, max]。点ではなく軸方向の制限を表す */
export type Interval = [number, number]

export type Distribution
  = | 'full'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center'

const frontmatter = computed(
  () => (currentSlideRoute.value.meta?.slide as any)?.frontmatter || {},
)
const layoutName = computed(() => frontmatter.value.layout)

// cover レイアウトは既に炎エフェクトがあるので、明示指定がなければ非表示
const defaultGlow = computed<Distribution | false>(() =>
  layoutName.value === 'cover' ? false : 'full',
)

const glow = computed<Distribution | false>(() => {
  const v = frontmatter.value.glow
  if (v === false || v === 'false') return false
  if (typeof v === 'string') return v as Distribution
  return defaultGlow.value
})

const opacity = computed<number>(() => +(frontmatter.value.glowOpacity ?? 0.35))
const hue = computed<number>(() => +(frontmatter.value.glowHue ?? 0))
const seed = computed<string>(() => {
  const v = frontmatter.value.glowSeed
  // false 指定はセッション開始時に 1 回だけ Date.now() を引いて固定する。
  // computed の caching 特性で同じ seed が使い回されるので、毎フレーム再シャッフルは
  // しない (それが欲しい場合は setInterval 等で別途実装が必要)。
  if (v === false || v === 'false') return Date.now().toString()
  return v || 'enbu'
})

const overflow = 0.3
const disturb = 0.3
const disturbChance = 0.3

function distributionToLimits(d: Distribution) {
  const min = -0.2
  const max = 1.2
  let x: Interval = [min, max]
  let y: Interval = [min, max]
  const intersection = (a: Interval, b: Interval): Interval => [
    Math.max(a[0], b[0]),
    Math.min(a[1], b[1]),
  ]
  for (const limit of d.split('-')) {
    switch (limit) {
      case 'top':    y = intersection(y, [min, 0.6]); break
      case 'bottom': y = intersection(y, [0.4, max]); break
      case 'left':   x = intersection(x, [min, 0.6]); break
      case 'right':  x = intersection(x, [0.4, max]); break
      case 'center': x = intersection(x, [0.25, 0.75]); y = intersection(y, [0.25, 0.75]); break
      case 'full':   x = intersection(x, [0, 1]); y = intersection(y, [0, 1]); break
    }
  }
  return { x, y }
}

function distance2([x1, y1]: Point, [x2, y2]: Point) {
  return (x2 - x1) ** 2 + (y2 - y1) ** 2
}

function usePoly(count = 16) {
  function getPoints(): Point[] {
    const dist = glow.value || 'full'
    const limits = distributionToLimits(dist as Distribution)
    const rng = seedrandom(`${seed.value}-${currentSlideRoute.value.no}-${count}`)
    const randomBetween = ([a, b]: Interval) => rng() * (b - a) + a
    const applyOverflow = (random: number, ov: number) => {
      random = random * (1 + ov * 2) - ov
      return rng() < disturbChance ? random + (rng() - 0.5) * disturb : random
    }
    return Array.from({ length: count }).map(
      () => [
        applyOverflow(randomBetween(limits.x), overflow),
        applyOverflow(randomBetween(limits.y), overflow),
      ] as Point,
    )
  }

  const points = ref<Point[]>(getPoints())
  const poly = computed(() =>
    points.value.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(', '),
  )

  // スライド遷移時、最寄り点マッチングで滑らかに変形
  function jumpPoints() {
    const newPoints = new Set(getPoints())
    points.value = points.value.map((o) => {
      let minD = Number.POSITIVE_INFINITY
      let closest: Point | undefined
      for (const n of newPoints) {
        const d = distance2(o, n)
        if (d < minD) { minD = d; closest = n }
      }
      if (closest) newPoints.delete(closest)
      return closest ?? o
    })
  }

  watch(currentSlideRoute, jumpPoints)
  return poly
}

const poly1 = usePoly(10)
const poly2 = usePoly(6)
const poly3 = usePoly(3)
</script>

<template>
  <div
    v-if="glow"
    class="enbu-glow overflow-hidden pointer-events-none"
    :style="{ filter: `blur(70px) hue-rotate(${hue}deg)` }"
    aria-hidden="true"
  >
    <!-- 主役: enbu のプライマリオレンジ #F38020 -->
    <div
      class="clip"
      :style="{
        background: 'linear-gradient(to right, #F38020, rgba(255,255,255,0.1))',
        clipPath: `polygon(${poly1})`,
        opacity,
      }"
    />
    <!-- 副: 明るいオレンジ #FBAD41 -->
    <div
      class="clip"
      :style="{
        background: 'linear-gradient(to left, #FBAD41, rgba(255,255,255,0.1))',
        clipPath: `polygon(${poly2})`,
        opacity,
      }"
    />
    <!-- アクセント: 朱赤 #C73E1D (炎の芯のような) -->
    <div
      class="clip"
      :style="{
        background: 'linear-gradient(to top, #C73E1D, rgba(255,255,255,0.1))',
        clipPath: `polygon(${poly3})`,
        opacity: opacity * 0.6,
      }"
    />
  </div>
</template>

<style scoped>
/* 変化するのは形 (clip-path) / ぼかし (filter) / 透明度 のみ。
   `transition: all` だと意図しないプロパティまで対象になりブラウザ最適化も効きにくいので
   プロパティ名を明示する。 */
.enbu-glow,
.clip {
  transition: clip-path 2.5s ease, filter 2.5s ease, opacity 2.5s ease;
}

/* position: fixed + z-index: -1 で「viewport の絶対背景」になり、
   slide content (z-index >= 0) より必ず後ろに行く。
   transform-gpu (= translateZ(0)) は stacking context を作って z-index を
   ローカル化してしまうので意図的に避ける。
   dark のみのテーマなので opacity も固定 (contrast を確保しつつ「闇に揺らぐ炎」を残す値)。 */
.enbu-glow {
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0.55;
}

/* clip-path は親で polygon(...) を inline-style で指定しているのでここでは省略。
   position: absolute + inset: 0 で親 .enbu-glow に張り付け、aspect は親 viewport
   依存にする (.enbu-glow が position: fixed; inset: 0 = viewport 全面)。 */
.clip {
  position: absolute;
  inset: 0;
}
</style>
