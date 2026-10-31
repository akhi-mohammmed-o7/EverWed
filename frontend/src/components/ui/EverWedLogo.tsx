import React from "react";

interface EverWedLogoProps {
  variant?: "full" | "mark" | "stacked";
  theme?: "dark" | "light" | "gold";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

export const EverWedLogo: React.FC<EverWedLogoProps> = ({
  variant = "full",
  theme = "light",
  size = "md",
  className = "",
  showTagline = false,
}) => {
  const sizeMap = {
    xs: { icon: 20, text: "text-base", sub: "text-[8px]" },
    sm: { icon: 28, text: "text-lg", sub: "text-[9px]" },
    md: { icon: 36, text: "text-xl", sub: "text-[10px]" },
    lg: { icon: 44, text: "text-2xl", sub: "text-[11px]" },
    xl: { icon: 56, text: "text-3xl", sub: "text-[12px]" },
  };

  const { icon: iconDim, text: textSize, sub: subSize } = sizeMap[size];

  // Theme styling for text
  const getTextColor = () => {
    switch (theme) {
      case "dark":
        return {
          ever: "text-ivory-50",
          wed: "text-gold-300",
          tagline: "text-ivory-300",
        };
      case "gold":
        return {
          ever: "text-gold-400",
          wed: "text-ivory-100",
          tagline: "text-gold-300/80",
        };
      case "light":
      default:
        return {
          ever: "text-burgundy-950",
          wed: "text-gold-700",
          tagline: "text-burgundy-700/80",
        };
    }
  };

  const colors = getTextColor();

  // SVG Knot / Ring Motif
  const MarkSVG = (
    <svg
      width={iconDim}
      height={iconDim}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      aria-label="EverWed Emblem"
    >
      <defs>
        {/* Burgundy Gradient */}
        <linearGradient id="ewBurgundy" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#800020" />
          <stop offset="50%" stopColor="#5B1624" />
          <stop offset="100%" stopColor="#3F0D17" />
        </linearGradient>

        {/* Champagne Gold Gradient */}
        <linearGradient id="ewGold" x1="8" y1="40" x2="40" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C5A059" />
          <stop offset="40%" stopColor="#E9D39C" />
          <stop offset="70%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA8232" />
        </linearGradient>

        {/* Shimmer Highlight */}
        <linearGradient id="ewShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Subtle drop shadow */}
        <filter id="ewGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Outer Emblem Shield / Circular boundary */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="14"
        fill="url(#ewBurgundy)"
        stroke="url(#ewGold)"
        strokeWidth="1.25"
        filter="url(#ewGlow)"
      />

      {/* EverWed Intertwined Love Knot / Eternal Rings */}
      {/* Ring 1 - Left / Upper Arch */}
      <path
        d="M18 16 C12 16, 8 20.5, 8 26 C8 32, 13 36, 19 36 C24 36, 27 32.5, 29 29.5 L25 25.5 C23.5 28, 21.5 30.5, 19 30.5 C15.5 30.5, 13.5 28, 13.5 25.5 C13.5 22.5, 16 20.5, 19 20.5 C22 20.5, 24.5 22.5, 26 24.5 L30 20.5 C27.5 17.5, 23 16, 18 16 Z"
        fill="url(#ewGold)"
      />

      {/* Ring 2 - Right / Lower Arch (intertwined) */}
      <path
        d="M30 32 C36 32, 40 27.5, 40 22 C40 16, 35 12, 29 12 C24 12, 21 15.5, 19 18.5 L23 22.5 C24.5 20, 26.5 17.5, 29 17.5 C32.5 17.5, 34.5 20, 34.5 22.5 C34.5 25.5, 32 27.5, 29 27.5 C26 27.5, 23.5 25.5, 22 23.5 L18 27.5 C20.5 30.5, 25 32, 30 32 Z"
        fill="url(#ewGold)"
        opacity="0.95"
      />

      {/* Central Diamond / Star Sparkle */}
      <path
        d="M24 19 L25.5 23 L29.5 24 L25.5 25 L24 29 L22.5 25 L18.5 24 L22.5 23 Z"
        fill="#FFFFFF"
      />
      <circle cx="24" cy="24" r="1.2" fill="url(#ewGold)" />
    </svg>
  );

  if (variant === "mark") {
    return <div className={`inline-flex items-center ${className}`}>{MarkSVG}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {MarkSVG}

      <div className={`flex flex-col ${variant === "stacked" ? "items-center text-center" : "text-left"}`}>
        <div className={`font-serif tracking-tight font-bold ${textSize} leading-none flex items-center`}>
          <span className={colors.ever}>Ever</span>
          <span className={colors.wed}>Wed</span>
        </div>
        {showTagline && (
          <span
            className={`font-sans uppercase tracking-[0.22em] font-semibold ${subSize} ${colors.tagline} mt-1`}
          >
            Luxury Wedding OS
          </span>
        )}
      </div>
    </div>
  );
};
