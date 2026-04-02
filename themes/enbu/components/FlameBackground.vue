<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref(null);
let animationId = null;

onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
    });
    if (!gl) return;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    const vsSource = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

    const fsSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;

    // --- Simplex noise ---
    vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m * m; m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // --- FBM ---
    float fbm(vec2 p, int octaves) {
      float f = 0.0, amp = 0.5;
      for (int i = 0; i < 7; i++) {
        if (i >= octaves) break;
        f += amp * snoise(p);
        p *= 2.03;
        amp *= 0.48;
      }
      return f;
    }

    // Warped FBM for painterly organic feel
    float warpedFbm(vec2 p, float t) {
      vec2 q = vec2(fbm(p + vec2(0.0, 0.0), 5), fbm(p + vec2(5.2, 1.3), 5));
      vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.12 * t, 5),
                     fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.10 * t, 5));
      return fbm(p + 3.5 * r, 5);
    }

    // --- Soft flame tongue (painterly) ---
    float flameTongue(vec2 p, float t, float seed, float width, float height) {
      float xOff = snoise(vec2(seed * 13.7, t * 0.5)) * 0.05;
      float dx = p.x - xOff;
      // Softer gaussian with wider spread at base
      float shape = exp(-dx * dx / (width * width * (0.6 + p.y * 2.0)));
      float tip = smoothstep(height, height * 0.2, p.y);
      float base = smoothstep(-0.02, 0.08, p.y);
      // Gentle turbulence
      float turbulence = snoise(vec2(dx * 6.0 + seed, p.y * 4.0 - t * 2.0)) * 0.25;
      return shape * tip * base * (1.0 + turbulence);
    }

    // --- Moth (蛾) ---
    // Returns intensity of a moth at position, orbiting the flame
    float moth(vec2 p, float t, float seed, float orbitR, float speed, float size) {
      // Elliptical orbit around flame center
      float angle = t * speed + seed * 6.283;
      float wobble = snoise(vec2(seed * 7.0, t * 0.8)) * 0.3;
      vec2 center = vec2(
        cos(angle + wobble) * orbitR * 0.7,
        sin(angle * 0.7 + wobble) * orbitR + 0.45
      );

      // Wing flutter
      float flutter = sin(t * 12.0 + seed * 20.0) * 0.3 + 0.7;

      // Moth body
      vec2 d = p - center;
      float dist = length(d);

      // Wing shape: elongated horizontally with flutter
      float wingSpread = size * (1.0 + flutter * 0.5);
      float wingShape = exp(-d.x * d.x / (wingSpread * wingSpread) - d.y * d.y / (size * size * 0.4));

      // Soft glow around moth
      float glow = exp(-dist * dist / (size * size * 3.0)) * 0.3;

      return (wingShape + glow) * smoothstep(0.0, 0.1, dist * 0.5 + 0.05);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv;
      p.x = (p.x - 0.5) * aspect;

      // Slower, more meditative pace
      float t = u_time * 0.25;

      // === Main flame body ===
      float baseWidth = 0.08 + 0.14 * pow(1.0 - p.y, 1.8);
      float envelope = 1.0 - smoothstep(0.0, baseWidth, abs(p.x));
      float verticalFade = smoothstep(0.85, 0.0, p.y);
      float bottomFade = smoothstep(-0.02, 0.06, p.y);
      float flameMask = envelope * verticalFade * bottomFade;

      // Organic turbulence — more painterly, slower
      vec2 nc = vec2(p.x * 3.5, p.y * 2.5 - t * 2.0);
      float warp = warpedFbm(nc * 0.6, t);
      float detail1 = fbm(nc * 1.0 + vec2(3.1, 7.4), 6);

      // Softer distortion for nihonga feel
      float distort = snoise(vec2(p.x * 5.0 + t * 0.2, p.y * 3.5 - t * 1.5)) * 0.06;
      float curl = snoise(vec2(p.x * 10.0, p.y * 6.0 - t * 2.5)) * 0.03;

      flameMask *= 1.0 + warp * 0.2 + detail1 * 0.1 + distort + curl;
      flameMask = clamp(flameMask, 0.0, 1.0);

      // === Flame tongues — fewer, softer ===
      float tongues = 0.0;
      tongues += flameTongue(p, t, 0.0, 0.055, 0.72) * 0.55;
      tongues += flameTongue(p, t * 1.05, 1.0, 0.04, 0.82) * 0.45;
      tongues += flameTongue(p, t * 0.92, 2.0, 0.05, 0.62) * 0.4;
      tongues += flameTongue(p, t * 1.15, 3.0, 0.035, 0.52) * 0.3;
      tongues += flameTongue(p, t * 0.88, 4.0, 0.045, 0.68) * 0.35;

      flameMask = max(flameMask, tongues);
      flameMask = clamp(flameMask, 0.0, 1.0);

      // === Color palette — 速水御舟「炎舞」に寄せた配色 ===
      // 暗い焦茶の根元 → 深い朱色 → 琥珀 → 淡い金の芯
      vec3 coreLight = vec3(0.92, 0.68, 0.28);           // 明るい琥珀（白にせず暖色を保つ）
      vec3 coreAmber = vec3(0.82, 0.52, 0.15);           // 琥珀
      vec3 midOrange = vec3(0.72, 0.32, 0.05);           // 深い朱色
      vec3 deepRed   = vec3(0.55, 0.12, 0.02);           // 暗い朱
      vec3 darkEdge  = vec3(0.30, 0.08, 0.02);           // 焦げ茶
      vec3 embers    = vec3(0.15, 0.05, 0.01);            // 闇に溶ける縁

      float intensity = flameMask;
      float heightBias = smoothstep(0.0, 0.55, p.y) * 0.25;
      float adjustedI = clamp(intensity + heightBias * intensity, 0.0, 1.0);

      vec3 fc = mix(embers, darkEdge, smoothstep(0.0, 0.12, adjustedI));
      fc = mix(fc, deepRed, smoothstep(0.08, 0.25, adjustedI));
      fc = mix(fc, midOrange, smoothstep(0.2, 0.45, adjustedI));
      fc = mix(fc, coreAmber, smoothstep(0.4, 0.7, adjustedI));
      fc = mix(fc, coreLight, smoothstep(0.75, 0.95, adjustedI));

      // Subtle flicker — less aggressive than before
      float flicker = snoise(vec2(t * 3.0, p.y * 2.0)) * 0.04 + 1.0;
      fc *= flicker;

      // === Heat haze ===
      float hazeY = smoothstep(0.35, 0.9, p.y);
      float hazeX = exp(-p.x * p.x * 10.0);
      float haze = hazeY * hazeX * 0.05;
      haze *= (1.0 + snoise(vec2(p.x * 2.0, p.y * 1.5 - t * 1.0)) * 0.4);
      vec3 hazeColor = vec3(0.35, 0.12, 0.03) * haze;

      // === Background: 焦げ茶の闇（絵の背景色）===
      vec3 bg = vec3(0.055, 0.035, 0.022);
      // Warm glow from flame — 控えめ
      float gd = length(vec2(p.x * 0.7, (p.y - 0.25) * 0.8));
      bg += vec3(0.30, 0.08, 0.02) * exp(-gd * 2.5) * 0.12;
      // Upward warm gradient
      bg += vec3(0.04, 0.02, 0.008) * (1.0 - uv.y) * 0.4;
      // Ambient glow
      bg += vec3(0.2, 0.06, 0.01) * flameMask * 0.1 * exp(-gd * 1.8);

      // === Moths (蛾) ===
      float mothGlow = 0.0;
      // 5匹の蛾 — 炎の周りを漂う
      mothGlow += moth(p, t, 0.0, 0.18, 0.35, 0.012);
      mothGlow += moth(p, t, 1.3, 0.22, -0.28, 0.010);
      mothGlow += moth(p, t, 2.7, 0.15, 0.42, 0.011);
      mothGlow += moth(p, t, 4.1, 0.25, -0.32, 0.009);
      mothGlow += moth(p, t, 5.5, 0.20, 0.38, 0.010);

      // Moth color — 白銀〜淡い金（絵の蛾の色）
      vec3 mothColor = vec3(0.85, 0.82, 0.72) * mothGlow * 0.8;

      // === Composite ===
      vec3 color = mix(bg, fc, flameMask);
      color += hazeColor;
      color += mothColor;

      // Vignette — stronger for nihonga scroll feel
      float vignette = 1.0 - length((uv - 0.5) * vec2(1.2, 1.0)) * 0.65;
      vignette = clamp(vignette, 0.0, 1.0);
      vignette = smoothstep(0.0, 1.0, vignette);
      color *= vignette;

      // Very subtle grain — like washi paper texture
      color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.012;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

    function createShader(type, source) {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");

    const start = performance.now();
    function render() {
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, (performance.now() - start) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationId = requestAnimationFrame(render);
    }
    render();
});

onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId);
});
</script>

<template>
    <canvas ref="canvasRef" class="flame-bg" />
</template>

<style scoped>
.flame-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
}
</style>
