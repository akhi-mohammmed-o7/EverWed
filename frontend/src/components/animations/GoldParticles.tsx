import React, { useEffect, useRef } from "react";

interface GoldParticlesProps {
  className?: string;
  count?: number;
}

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
}

export const GoldParticles: React.FC<GoldParticlesProps> = ({
  className = "",
  count = 28,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Initialize sparse, delicate gold particles
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const baseOpacity = 0.15 + Math.random() * 0.45;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1.0 + Math.random() * 2.4, // Small, jewel-like
        speedY: 0.15 + Math.random() * 0.35, // Slow upward drift
        speedX: (Math.random() - 0.5) * 0.2, // Subtle lateral sway
        opacity: Math.random() * baseOpacity,
        baseOpacity,
        fadeSpeed: 0.003 + Math.random() * 0.006,
        fadingIn: Math.random() > 0.5,
        blur: Math.random() > 0.6 ? 1.5 : 0,
      });
    }

    let isVisible = true;
    let isTabActive = true;
    let animId: number;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
      });
    });
    observer.observe(canvas);

    const handleVisibility = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const render = () => {
      if (isVisible && isTabActive) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Upward drift
          p.y -= p.speedY;
          p.x += p.speedX;

          // Gentle opacity breathing / twinkle
          if (p.fadingIn) {
            p.opacity += p.fadeSpeed;
            if (p.opacity >= p.baseOpacity) {
              p.fadingIn = false;
            }
          } else {
            p.opacity -= p.fadeSpeed;
            if (p.opacity <= 0.05) {
              p.fadingIn = true;
            }
          }

          // Wrap around top or sides
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          // Draw champagne gold speck
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          // Champagne gold: #D9B66F
          ctx.fillStyle = `rgba(217, 182, 111, ${p.opacity.toFixed(3)})`;
          if (p.blur > 0) {
            ctx.shadowColor = "rgba(242, 227, 181, 0.6)";
            ctx.shadowBlur = p.blur * 3;
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
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-10 ${className}`}
    />
  );
};

