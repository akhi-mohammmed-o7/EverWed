import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  shine?: boolean;
  magneticStrength?: number; // Distance multiplier (default: 0.22)
  children: React.ReactNode;
}

export const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  (
    {
      className,
      variant = "gold",
      size = "md",
      shine = true,
      magneticStrength = 0.22,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseMove,
      disabled,
      style: customStyle,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const buttonRef = (forwardedRef as React.RefObject<HTMLButtonElement>) || internalRef;
    const [isHovered, setIsHovered] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Raw motion values for magnetic pull
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);

    // Spring physics configuration for refined, silky magnetic snapping
    const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
    const springX = useSpring(rawX, springConfig);
    const springY = useSpring(rawY, springConfig);

    useEffect(() => {
      // Check touch screen or reduced motion
      const touchQuery = window.matchMedia("(hover: none)");
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

      const updateCapabilities = () => {
        setIsTouchDevice(touchQuery.matches || motionQuery.matches);
      };

      updateCapabilities();
      touchQuery.addEventListener("change", updateCapabilities);
      motionQuery.addEventListener("change", updateCapabilities);

      return () => {
        touchQuery.removeEventListener("change", updateCapabilities);
        motionQuery.removeEventListener("change", updateCapabilities);
      };
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isTouchDevice || !buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from center
      const deltaX = (e.clientX - centerX) * magneticStrength;
      const deltaY = (e.clientY - centerY) * magneticStrength;

      // Clamp within restrained luxury limits (max ~10px)
      const maxDistance = 10;
      const clampedX = Math.max(-maxDistance, Math.min(maxDistance, deltaX));
      const clampedY = Math.max(-maxDistance, Math.min(maxDistance, deltaY));

      rawX.set(clampedX);
      rawY.set(clampedY);

      onMouseMove?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      rawX.set(0);
      rawY.set(0);
      onMouseLeave?.(e);
    };

    // Styling variants matching Burgundy & Champagne luxury aesthetic
    const variantStyles = {
      gold: "bg-[#C9A14A] text-[#2D0A14] font-bold border border-[#D4B870]/70 hover:bg-[#DECA8E] hover:shadow-lg hover:shadow-[#C9A14A]/25 active:bg-[#B88E35]",
      secondary: "bg-[#2D0A14]/50 text-[#F5EEE6] font-semibold border border-[#D4B870]/40 backdrop-blur-sm hover:bg-[#3D101C]/75 hover:border-[#D4B870]/70 hover:shadow-md active:bg-[#20060D]",
      outline: "border border-[#C9A14A]/40 text-forest-900 bg-transparent hover:bg-[#C9A14A]/10 hover:border-[#C9A14A] active:bg-[#C9A14A]/20",
      ghost: "text-forest-900 bg-transparent hover:bg-ivory-200/80 active:bg-ivory-300",
    };

    const sizeStyles = {
      sm: "px-3.5 py-1.5 text-xs rounded-xl",
      md: "px-5 py-2.5 text-sm rounded-xl",
      lg: "px-7 py-3.5 text-base rounded-2xl",
    };

    return (
      <motion.button
        ref={buttonRef}
        {...(props as any)}
        style={{
          ...(customStyle as object),
          x: isTouchDevice ? 0 : springX,
          y: isTouchDevice ? 0 : springY,
        }}
        whileHover={{ scale: isTouchDevice ? 1 : 1.02, y: isTouchDevice ? 0 : -1 }}
        whileTap={{ scale: 0.98 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center justify-center font-sans tracking-tight transition-colors overflow-hidden select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A14A]/60 focus-visible:ring-offset-2",
          variantStyles[variant],
          sizeStyles[size],
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        {/* Champagne-Gold Shine Sweep on Hover */}
        {shine && !disabled && (
          <motion.span
            initial={{ x: "-150%", opacity: 0 }}
            animate={
              isHovered
                ? { x: "200%", opacity: [0, 0.6, 0.8, 0] }
                : { x: "-150%", opacity: 0 }
            }
            transition={{
              duration: 0.75,
              ease: "easeInOut",
              repeat: isHovered ? Infinity : 0,
              repeatDelay: 1.5,
            }}
            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none"
          />
        )}

        {/* Content wrapper with micro-motion for icons */}
        <span className="relative z-10 inline-flex items-center gap-2 [&>svg]:transition-transform [&>svg]:duration-200 group-hover:[&>svg]:translate-x-0.5">
          {children}
        </span>
      </motion.button>
    );
  }
);

MagneticButton.displayName = "MagneticButton";
