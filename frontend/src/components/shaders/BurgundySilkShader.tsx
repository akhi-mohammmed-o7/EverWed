import React, { useEffect, useRef, useState } from "react";

/**
 * Burgundy Rose-Gold Silk WebGL Shader
 *
 * Deep wine and black centre with flowing burgundy silk ribbons on the edges,
 * rose-gold and champagne metallic highlights, and fine warm specular reflections.
 * Renders via raw WebGL — no extra dependencies.
 *
 * Performance: ~30 FPS throttle, DPR ≤ 1.5, viewport-paused,
 * reduced-motion fallback, CSS gradient fallback on WebGL failure.
 */

interface BurgundySilkShaderProps {
  className?: string;
  mouseInfluence?: boolean;
}

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  varying vec2 v_uv;
  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec2  u_mouse;

  // ── Simplex noise ────────────────────────────────────────────────────────
  vec3 mod289v3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289v3(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy  -= i1;
    i = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv     = gl_FragCoord.xy / u_resolution.xy;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p      = (uv - 0.5) * aspect;

    // Gentle mouse influence — only on the background
    vec2 mouseOffset = (u_mouse - 0.5) * 0.07;

    // Very slow, stately movement — luxury pace
    float t = u_time * 0.072;

    // ── Color Palette (linear-light sRGB) ────────────────────────────────
    vec3 deepBlack    = vec3(0.022, 0.004, 0.010);   // Near-black centre
    vec3 deepWine     = vec3(0.110, 0.016, 0.036);   // Dark wine undertone
    vec3 richBurgundy = vec3(0.320, 0.042, 0.095);   // Rich burgundy ribbon body
    vec3 midBurgundy  = vec3(0.440, 0.060, 0.130);   // Lighter ribbon highlight
    vec3 roseGold     = vec3(0.760, 0.435, 0.365);   // Rose-gold metallic edge
    vec3 champagne    = vec3(0.880, 0.730, 0.530);   // Champagne specular crest
    vec3 warmGold     = vec3(0.820, 0.600, 0.340);   // Warm gold accent

    // ── Domain warping — two layers for organic silk drape ───────────────
    // Layer 1: low-frequency drape shape
    vec2 q = vec2(
      snoise(p * 1.1 + vec2(t * 0.38, t * 0.22) + mouseOffset * 0.8),
      snoise(p * 1.2 + vec2(-t * 0.28, t * 0.45))
    );

    // Layer 2: mid-frequency fold detail
    vec2 r = vec2(
      snoise(p * 2.1 + q * 1.5 + vec2(t * 0.22, -t * 0.18)),
      snoise(p * 2.4 + q * 1.6 + vec2(-t * 0.17, t * 0.30))
    );

    // Tertiary fine detail
    float detail = snoise(p * 4.2 + r * 2.0 + t * 0.12);

    // ── Silk fold field ──────────────────────────────────────────────────
    float silkA = sin(p.x * 2.8 + r.x * 3.0 + t * 0.65)
                * cos(p.y * 2.4 + r.y * 2.8 + t * 0.48);
    float silkB = sin(p.y * 3.2 + q.y * 2.6 - t * 0.40)
                * cos(p.x * 2.9 + q.x * 2.4 + t * 0.55);
    float folds = (silkA + silkB) * 0.5 + detail * 0.12;

    // ── Ribbon mask: concentrated in the outer 40 % of the frame ─────────
    float distCenter = length(p);
    // 0 = at centre, 1 = at outer edge
    float ribbonMask = smoothstep(0.18, 0.64, distCenter);

    // Additional top / bottom bias — ribbons drape from horizontal edges
    float yEdgeBias = pow(1.0 - abs(uv.y - 0.5) * 1.3, 1.4);
    ribbonMask = ribbonMask * mix(0.55, 1.0, yEdgeBias);

    // Side corner deepening
    float xCorner = smoothstep(0.30, 0.70, abs((uv.x - 0.5) * aspect.x));
    ribbonMask = mix(ribbonMask, ribbonMask * 1.15, xCorner * 0.4);
    ribbonMask = clamp(ribbonMask, 0.0, 1.0);

    // ── Base: near-black centre ──────────────────────────────────────────
    vec3 color = deepBlack;

    // Very faint wine warmth in the inner shadow region
    float wineAura = smoothstep(0.46, 0.10, distCenter);
    color = mix(color, deepWine * 0.28, wineAura * 0.50);

    // ── Burgundy ribbon body ─────────────────────────────────────────────
    float foldNorm = smoothstep(-0.80, 0.80, folds);
    vec3  ribbonColor = mix(richBurgundy, midBurgundy, foldNorm);
    color = mix(color, ribbonColor, ribbonMask * 0.90);

    // ── Silk sheen layer (soft luminosity variation across folds) ─────────
    float sheen = pow(smoothstep(0.05, 0.75, folds * 0.5 + r.x * 0.25), 2.2);
    color = mix(color, mix(midBurgundy, roseGold * 0.55, sheen), ribbonMask * sheen * 0.55);

    // ── Rose-gold metallic ribbon edge highlights ─────────────────────────
    float roseEdge = smoothstep(0.50, 0.88, folds + r.y * 0.22 + q.x * 0.12);
    float roseSpark = pow(roseEdge, 2.6);
    color = mix(color, roseGold, roseSpark * ribbonMask * 0.70);

    // ── Champagne specular crests ─────────────────────────────────────────
    float champSpec = smoothstep(0.70, 0.96, folds + r.x * 0.18 + q.y * 0.12);
    float champPeak = pow(champSpec, 4.0);
    color = mix(color, champagne, champPeak * ribbonMask * 0.60);

    // ── Warm-gold accent ribbons (secondary flow lines) ───────────────────
    float goldFlow = sin(p.x * 2.5 + q.y * 2.0 + t * 0.55) * 0.5 + 0.5;
    float goldMask = smoothstep(0.60, 0.90, distCenter) * goldFlow * 0.35;
    goldMask      *= (1.0 - abs(silkB) * 0.4);
    color = mix(color, warmGold * 0.75, goldMask);

    // ── Corner depth enhancement (frame the scene) ────────────────────────
    float cornerDist = max(abs(uv.x - 0.5) * 1.8, abs(uv.y - 0.5) * 1.8);
    float cornerVign = smoothstep(0.38, 0.70, cornerDist);
    color = mix(color, deepWine * 0.35, cornerVign * 0.45);

    // ── Centre darkening — absolute priority for text readability ─────────
    // Radial gradient: black within inner 32 %, soft fade to ribbon from 32-55 %
    float centerMask = smoothstep(0.55, 0.10, distCenter);
    color = mix(color, deepBlack, centerMask * 0.92);

    // Additional oval wipe: horizontal axis slightly wider than vertical
    vec2 ovalP = vec2(p.x / (aspect.x * 0.68), p.y / 0.52);
    float ovalDist = length(ovalP);
    float ovalMask = smoothstep(0.85, 0.30, ovalDist);
    color = mix(color, deepBlack * 1.08, ovalMask * 0.60);

    // ── Subtle film grain (break up colour banding on dark areas) ─────────
    float grain = (fract(sin(dot(uv + t * 0.008, vec2(12.9898, 78.233)))
                  * 43758.5453) - 0.5) * 0.016;
    color = clamp(color + grain, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const BurgundySilkShader: React.FC<BurgundySilkShaderProps> = ({
  className = "",
  mouseInfluence = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Initialise WebGL — try WebGL2 then WebGL1
    let gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) {
      gl = (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGL2RenderingContext | null;
    }
    if (!gl) {
      setHasWebGL(false);
      return;
    }

    // ── Shader compilation helper ─────────────────────────────────────────
    function compile(src: string, type: number): WebGLShader | null {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[BurgundySilkShader] compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
    const fs = compile(FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER);
    if (!vs || !fs) { setHasWebGL(false); return; }

    const program = gl.createProgram();
    if (!program) { setHasWebGL(false); return; }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[BurgundySilkShader] link error:", gl.getProgramInfoLog(program));
      setHasWebGL(false);
      return;
    }
    gl.useProgram(program);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime  = gl.getUniformLocation(program, "u_time");
    const uRes   = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    // Smoothed mouse
    let targetMouse  = { x: 0.5, y: 0.5 };
    let currentMouse = { x: 0.5, y: 0.5 };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseInfluence) return;
      const r = canvas.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        targetMouse.x = (e.clientX - r.left) / r.width;
        targetMouse.y = 1.0 - (e.clientY - r.top) / r.height;
      }
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Resize — DPR capped at 1.5
    const resize = () => {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Visibility / intersection state
    let visible   = true;
    let tabActive = true;
    let rafId: number;
    const startTime   = performance.now();
    let lastRender    = 0;
    const FRAME_MS    = 1000 / 30; // ~30 FPS

    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { visible = e.isIntersecting; }); },
      { threshold: 0.05 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    const onVisChange = () => { tabActive = !document.hidden; };
    document.addEventListener("visibilitychange", onVisChange);

    // Render loop
    const render = (now: number) => {
      if (!gl) return;

      if (visible && tabActive) {
        const elapsed = now - lastRender;
        if (elapsed >= FRAME_MS) {
          lastRender = now - (elapsed % FRAME_MS);

          // Lerp mouse for silky response
          currentMouse.x += (targetMouse.x - currentMouse.x) * 0.045;
          currentMouse.y += (targetMouse.y - currentMouse.y) * 0.045;

          const secs = (now - startTime) * 0.001;
          gl.uniform1f(uTime,  secs);
          gl.uniform2f(uRes,   canvas.width, canvas.height);
          gl.uniform2f(uMouse, currentMouse.x, currentMouse.y);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    // Render once immediately (covers reduced-motion case)
    render(performance.now());

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisChange);
      observer.disconnect();
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buf);
      }
    };
  }, [mouseInfluence]);

  return (
    /* Strict isolation: absolute, pointer-events:none, behind all content */
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      style={{ zIndex: 0 }}
    >
      {hasWebGL ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        />
      ) : (
        /* CSS fallback: deep wine radial gradient */
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, #0A0205 0%, #180408 35%, #2D0A14 65%, #180408 85%, #0A0205 100%)",
          }}
        />
      )}

      {/* Gradient scrims — also pointer-events:none, keep text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,2,5,0.70) 0%, transparent 25%, transparent 75%, rgba(10,2,5,0.85) 100%)",
          zIndex: 1,
        }}
      />
      {/* Oval centre dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 50% 50%, rgba(8,2,4,0.65) 0%, transparent 70%)",
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default BurgundySilkShader;

