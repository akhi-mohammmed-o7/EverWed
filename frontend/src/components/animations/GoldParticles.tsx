import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  baseOpacity: number;
  fadeSpeed: number;
  fadingIn: boolean;
  blur: number;
  /** 0 = champagne, 1 = rose-gold, 2 = warm gold */
  colorVariant: number;
}

interface GoldParticlesProps {
  className?: string;
  count?: number;
  /** "champagne" | "rose-gold" — determines particle colour scheme */
  palette?: "champagne" | "rose-gold";
}

const PALETTES = {
  champagne: [
    "217, 182, 111", // #D9B66F champagne gold
    "230, 200, 140", // lighter champagne
    "198, 162,  90", // warm gold
  ],
  "rose-gold": [
    "200, 140, 120", // #C88C78 rose-gold
    "220, 170, 140", // champagne-rose
    "185, 115,  95", // deeper rose
  ],
};

export const GoldParticles: React.FC<GoldParticlesProps> = ({
  className = "",
  count = 28,
  palette = "rose-gold",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width  = (canvas.width  = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    const handleResize = () => {
      if (!canvas) return;
      width  = canvas.width  = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Initialise particles — slightly biased toward the outer edges
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const baseOpacity   = 0.12 + Math.random() * 0.42;
      // Bias x toward outer thirds
      const xBias = Math.random() < 0.6
        ? (Math.random() < 0.5 ? Math.random() * 0.28 : 0.72 + Math.random() * 0.28)
        : Math.random();

      particles.push({
        x: xBias * width,
        y: Math.random() * height,
        size: 0.8 + Math.random() * 2.0,
        speedY: 0.12 + Math.random() * 0.28,
        speedX: (Math.random() - 0.5) * 0.18,
        opacity: Math.random() * baseOpacity,
        baseOpacity,
        fadeSpeed: 0.002 + Math.random() * 0.005,
        fadingIn: Math.random() > 0.5,
        blur: Math.random() > 0.65 ? 1.2 : 0,
        colorVariant: Math.floor(Math.random() * 3),
      });
    }

    let isVisible   = true;
    let isTabActive = true;
    let animId: number;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { isVisible = e.isIntersecting; });
    });
    observer.observe(canvas);

    const onVisibility = () => { isTabActive = !document.hidden; };
    document.addEventListener("visibilitychange", onVisibility);

    const colors = PALETTES[paletteRef.current];

    const render = () => {
      if (isVisible && isTabActive) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Drift
          p.y -= p.speedY;
          p.x += p.speedX;

          // Gentle twinkle
          if (p.fadingIn) {
            p.opacity += p.fadeSpeed;
            if (p.opacity >= p.baseOpacity) p.fadingIn = false;
          } else {
            p.opacity -= p.fadeSpeed;
            if (p.opacity <= 0.04) p.fadingIn = true;
          }

          // Wrap
          if (p.y < -8)  { p.y = height + 8; p.x = Math.random() * width; }
          if (p.x < -8)  p.x = width + 8;
          if (p.x > width + 8) p.x = -8;

          // Draw
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          const rgb = colors[p.colorVariant] ?? colors[0];
          ctx.fillStyle = `rgba(${rgb}, ${p.opacity.toFixed(3)})`;

          if (p.blur > 0) {
            ctx.shadowColor = `rgba(${rgb}, 0.55)`;
            ctx.shadowBlur  = p.blur * 4;
          }
          ctx.fill();
          ctx.restore();
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, [count, palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      style={{ zIndex: 5, pointerEvents: "none" }}
    />
  );
};
