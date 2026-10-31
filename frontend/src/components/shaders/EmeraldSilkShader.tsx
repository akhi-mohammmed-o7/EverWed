import React, { useEffect, useRef, useState } from "react";

/**
 * Emerald Silk WebGL Shader
 *
 * Cinematic fluid emerald silk shader with champagne-gold light refractions.
 * Renders via raw WebGL with zero extra dependencies, throttled to ~30 FPS,
 * DPR capped at 1.5, viewport-paused, and equipped with CSS fallback.
 */

interface EmeraldSilkShaderProps {
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
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  // Simplex-inspired organic noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p = (uv - 0.5) * aspect;

    // Mouse influence interpolation
    vec2 mouseOffset = (u_mouse - 0.5) * 0.18;
    p += mouseOffset * (1.0 - length(p));

    // Slow, stately time pace for calm luxury movement
    float t = u_time * 0.18;

    // Domain warping for flowing silk folds
    vec2 q = vec2(
      snoise(p * 1.35 + vec2(t * 0.45, t * 0.3)),
      snoise(p * 1.45 + vec2(-t * 0.35, t * 0.5))
    );

    vec2 r = vec2(
      snoise(p * 2.1 + q * 1.6 + vec2(t * 0.25, -t * 0.2)),
      snoise(p * 2.3 + q * 1.7 + vec2(-t * 0.2, t * 0.35))
    );

    // Primary silk wave function
    float silkWave1 = sin(p.x * 2.8 + r.x * 3.2 + t * 0.8) * cos(p.y * 2.5 + r.y * 3.0 + t * 0.6);
    float silkWave2 = sin(p.y * 3.4 + q.y * 2.8 - t * 0.5) * cos(p.x * 3.1 + q.x * 2.6 + t * 0.7);
    float folds = (silkWave1 + silkWave2) * 0.5;
    folds += snoise(p * 3.6 + r * 1.8) * 0.15;

    // Base Palette:
    // Deep Emerald: rgb(9, 43, 33)   -> vec3(0.035, 0.169, 0.129)
    // Dark Forest:  rgb(6, 31, 25)   -> vec3(0.024, 0.122, 0.098)
    // Champagne Gold: rgb(217, 182, 111) -> vec3(0.851, 0.714, 0.435)
    // Muted Gold:   rgb(185, 154, 91)  -> vec3(0.725, 0.604, 0.357)
    // Charcoal Depth: rgb(10, 20, 16) -> vec3(0.039, 0.078, 0.063)

    vec3 darkForest = vec3(0.024, 0.110, 0.086);
    vec3 deepEmerald = vec3(0.039, 0.176, 0.133);
    vec3 luminousEmerald = vec3(0.065, 0.245, 0.185);
    vec3 champagneGold = vec3(0.865, 0.725, 0.445);
    vec3 mutedGold = vec3(0.680, 0.550, 0.320);

    // Silk base layer
    float foldNorm = smoothstep(-0.85, 0.85, folds);
    vec3 color = mix(darkForest, deepEmerald, foldNorm);

    // Secondary emerald silk sheen
    float sheen = pow(smoothstep(-0.2, 0.7, folds), 2.2);
    color = mix(color, luminousEmerald, sheen * 0.45);

    // Champagne gold light reflections on the crests of the fabric
    float goldCrest = smoothstep(0.48, 0.92, folds + r.x * 0.3);
    float goldSpark = pow(goldCrest, 3.8);
    color = mix(color, champagneGold, goldSpark * 0.42);

    // Subtle luminous gold rays near the outer corners and perimeter
    float distFromCenter = length(uv - 0.5);
    float edgeLuminance = smoothstep(0.35, 0.95, distFromCenter);
    float edgeFolds = sin(atan(p.y, p.x) * 4.0 + t * 0.6 + r.y * 2.0);
    float edgeGold = edgeLuminance * smoothstep(0.3, 0.9, edgeFolds) * 0.22;
    color += mutedGold * edgeGold;

    // Center dimming: Keep the area behind hero heading clean, calm, and readable
    float centerDarken = smoothstep(0.65, 0.08, distFromCenter);
    color = mix(color, darkForest * 0.75, centerDarken * 0.45);

    // Subtle noise grain to eliminate 8-bit banding on dark gradients
    float grain = (fract(sin(dot(uv + t * 0.01, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.022;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const EmeraldSilkShader: React.FC<EmeraldSilkShaderProps> = ({
  className = "",
  mouseInfluence = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Keep a non-null reference for the animation callback, where TypeScript
    // cannot preserve the ref's narrowing across the closure boundary.
    const canvasElement = canvas;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Initialize WebGL context
    let gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) {
      gl = (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGL2RenderingContext | null;
    }

    if (!gl) {
      setHasWebGL(false);
      return;
    }

    // Helper: compile shader
    function compileShader(source: string, type: number): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      setHasWebGL(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setHasWebGL(false);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Program link error:", gl.getProgramInfoLog(program));
      setHasWebGL(false);
      return;
    }

    gl.useProgram(program);

    // Full-screen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");

    // Mouse coordinates tracking (smoothed)
    let targetMouse = { x: 0.5, y: 0.5 };
    let currentMouse = { x: 0.5, y: 0.5 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInfluence) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetMouse.x = (e.clientX - rect.left) / rect.width;
        targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Sizing and DPR cap at 1.5
    function resizeCanvas() {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    // Render loop state
    let isVisible = true;
    let isTabActive = true;
    let animationFrameId: number;
    let startTime = performance.now();
    let lastRenderTime = 0;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    // Viewport intersection observer: Pause when out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Visibility change: Pause when tab is inactive
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Main animation loop
    function render(now: number) {
      if (!gl || !program) return;

      if (isVisible && isTabActive) {
        const elapsedSinceLast = now - lastRenderTime;

        if (elapsedSinceLast >= FRAME_INTERVAL) {
          lastRenderTime = now - (elapsedSinceLast % FRAME_INTERVAL);

          // Smooth lerp mouse
          currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
          currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

          const timeInSeconds = (now - startTime) * 0.001;

          gl.uniform1f(timeLocation, timeInSeconds);
          gl.uniform2f(resolutionLocation, canvasElement.width, canvasElement.height);
          gl.uniform2f(mouseLocation, currentMouse.x, currentMouse.y);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }

      // If prefers-reduced-motion is true, render once and do not loop
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    // Render initial frame
    render(performance.now());

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();

      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [mouseInfluence]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
    >
      {hasWebGL ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        // CSS Fallback when WebGL is unavailable
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_#092B21_0%,_#061F19_55%,_#03100D_100%)]" />
      )}

      {/* Dark gradient scrims to ensure absolute contrast and typography readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950/60 via-transparent to-forest-950/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(6,31,25,0.75)_100%)] pointer-events-none" />
    </div>
  );
};

