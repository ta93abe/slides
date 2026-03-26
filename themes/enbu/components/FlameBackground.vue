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

    float fbm(vec2 p) {
      float f = 0.0, amp = 0.5;
      for (int i = 0; i < 5; i++) { f += amp * snoise(p); p *= 2.1; amp *= 0.5; }
      return f;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = uv;
      p.x = (p.x - 0.5) * aspect;

      float flameWidth = 0.14 + 0.09 * pow(p.y, 0.7);
      float flameMask = 1.0 - smoothstep(0.0, flameWidth, abs(p.x));
      float verticalFade = smoothstep(0.88, 0.0, p.y);
      float bottomFade = smoothstep(-0.02, 0.08, p.y);
      flameMask *= verticalFade * bottomFade;

      float t = u_time * 0.4;
      vec2 nc = vec2(p.x * 3.0, p.y * 2.5 - t * 2.2);
      float n1 = fbm(nc);
      float n2 = fbm(nc * 1.8 + vec2(5.2, 1.3));
      flameMask += (n1 * 0.15 + n2 * 0.08) * flameMask;
      flameMask = clamp(flameMask, 0.0, 1.0);

      vec3 core = vec3(1.0, 0.92, 0.7);
      vec3 mid = vec3(0.95, 0.5, 0.1);
      vec3 outer = vec3(0.6, 0.12, 0.02);
      vec3 edge = vec3(0.25, 0.05, 0.01);

      float intensity = flameMask;
      vec3 fc = mix(edge, outer, smoothstep(0.0, 0.2, intensity));
      fc = mix(fc, mid, smoothstep(0.15, 0.45, intensity));
      fc = mix(fc, core, smoothstep(0.5, 0.85, intensity));
      fc *= snoise(vec2(t * 4.0, 0.0)) * 0.08 + 1.0;

      vec3 bg = vec3(0.04, 0.025, 0.015) + vec3(0.03, 0.015, 0.005) * (1.0 - uv.y);
      float gd = length(vec2(p.x * 0.7, (p.y - 0.25) * 1.2));
      bg += vec3(0.5, 0.18, 0.03) * exp(-gd * 2.5) * 0.12;

      vec3 color = mix(bg, fc, flameMask);
      float vignette = 1.0 - length((uv - 0.5) * vec2(1.2, 1.0)) * 0.8;
      color *= vignette;
      color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.02;

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
