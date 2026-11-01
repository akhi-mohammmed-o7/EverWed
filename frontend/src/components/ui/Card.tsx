import React from "react";
import { cn } from "@/lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }> = ({
  className,
  hover = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border/80 shadow-sm overflow-hidden",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gold/50 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-5 border-b border-border/60 flex flex-wrap items-center justify-between gap-3", className)} {...props}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
};

export const StatCard: React.FC<{
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
}> = ({ title, value, subtitle, icon, trend, className }) => {
  return (
    <Card className={cn("p-5 relative", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-relaxed">{title}</p>
          <div className="mt-2 break-words font-serif text-2xl font-bold leading-tight text-forest-800 lg:text-3xl">{value}</div>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-2 flex items-center gap-1", trend.positive ? "text-emerald-700" : "text-terracotta")}>
              <span>{trend.positive ? "↑" : "↓"}</span> {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/20 bg-ivory-100 text-forest-800">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
