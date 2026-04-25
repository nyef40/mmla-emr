// src/components/ui/label.tsx
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        subtle: "text-muted-foreground",
        destructive: "text-destructive",
        warning: "text-amber-600 dark:text-amber-400",
        success: "text-green-600 dark:text-green-400",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
        xl: "text-lg",
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      required: false,
    },
  }
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, size, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant, size, required, className }))}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };