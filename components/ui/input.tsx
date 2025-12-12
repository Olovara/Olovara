import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onWheel, ...props }, ref) => {
    // Prevent number inputs from changing value when scrolling
    const handleWheel = React.useCallback(
      (e: React.WheelEvent<HTMLInputElement>) => {
        // If it's a number input, prevent the default scroll behavior
        // This stops the value from incrementing/decrementing when scrolling
        if (type === "number") {
          e.currentTarget.blur();
        }
        // Call the original onWheel handler if provided
        onWheel?.(e);
      },
      [type, onWheel]
    );

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onWheel={handleWheel}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
