import * as React from "react";
import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const colorMap: Record<BadgeVariant, "accent" | "success" | "danger" | "default"> = {
  default: "accent",
  secondary: "success",
  destructive: "danger",
  outline: "default",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <Chip
      size="sm"
      variant={variant === "outline" ? "secondary" : "soft"}
      color={colorMap[variant]}
      className={cn(className)}
      {...props}
    >
      {children}
    </Chip>
  );
}

export { Badge };
