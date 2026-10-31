import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed border-border bg-ivory-50/50">
      {icon && <div className="p-4 bg-white rounded-2xl shadow-sm text-forest-700 mb-4">{icon}</div>}
      <h3 className="font-serif text-lg md:text-xl font-semibold text-forest-800">{title}</h3>
      <p className="text-xs md:text-sm text-muted-foreground max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="gold" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
