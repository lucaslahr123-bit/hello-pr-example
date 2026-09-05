import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-emerald-100 text-emerald-800",
        variant === "secondary" && "bg-neutral-100 text-neutral-700",
        variant === "destructive" && "bg-red-100 text-red-700",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
