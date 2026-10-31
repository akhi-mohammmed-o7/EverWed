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
        "bg-white rounded-xl border border-border/80 shadow-sm overflow-hidden",
        hover && "transition-all duration-200 hover:shadow-md hover:border-gold/40 cursor-pointer",
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
    <div className={cn("p-5 border-b border-border/60 flex items-center justify-between", className)} {...props}>
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
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
}> = ({ title, value, subtitle, icon, trend, className }) => {
  return (
    <Card className={cn("p-5 relative", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="font-serif text-2xl lg:text-3xl font-bold text-forest-800 mt-2">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-2 flex items-center gap-1", trend.positive ? "text-emerald-700" : "text-terracotta")}>
              <span>{trend.positive ? "↑" : "↓"}</span> {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-ivory-200 text-forest-800 rounded-xl">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
