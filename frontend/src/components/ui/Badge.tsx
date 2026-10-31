import React from "react";
import { cn, getStatusBadgeClass, formatStatusLabel } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: "default" | "gold" | "forest" | "terracotta" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({ status, variant = "default", className, children, ...props }) => {
  if (status) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
          getStatusBadgeClass(status),
          className
        )}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {children || formatStatusLabel(status)}
      </span>
    );
  }

  const variants = {
    default: "bg-stone-100 text-stone-700 border border-stone-200",
    gold: "bg-gold/15 text-forest-900 border border-gold/40 font-semibold",
    forest: "bg-forest-800 text-ivory",
    terracotta: "bg-terracotta/15 text-terracotta-800 border border-terracotta/30",
    outline: "border border-border text-forest-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

