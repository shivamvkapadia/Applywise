import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-md bg-surface-1 text-ink placeholder:text-ink-tertiary " +
  "border border-hairline focus-ring focus:border-hairline-strong " +
  "disabled:opacity-50 transition-colors";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(fieldBase, "h-9 px-3 text-sm", className)}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-24 px-3 py-2 text-sm leading-relaxed resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("block text-sm font-medium text-ink-muted mb-1.5", className)}
    {...props}
  />
));
Label.displayName = "Label";
