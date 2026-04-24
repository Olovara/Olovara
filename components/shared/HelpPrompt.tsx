"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type HelpPromptProps = {
  content: React.ReactNode;
  /**
   * Accessible label for the icon button.
   * Keep it specific (ex: "Product status help").
   */
  ariaLabel?: string;
  /**
   * Optional extra text/element rendered BEFORE the icon (rare).
   * Usually you only want the icon button.
   */
  leading?: React.ReactNode;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  align?: React.ComponentProps<typeof TooltipContent>["align"];
  sideOffset?: number;
  collisionPadding?: number;
  className?: string;
  iconClassName?: string;
  maxWidthClassName?: string;
  /**
   * If true, tooltip will only open on click (not hover/focus).
   */
  clickOnly?: boolean;
};

export function HelpPrompt({
  content,
  ariaLabel = "Help",
  leading,
  side = "top",
  align = "start",
  sideOffset = 8,
  collisionPadding = 12,
  className,
  iconClassName,
  maxWidthClassName = "max-w-xs",
  clickOnly = false,
}: HelpPromptProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [hasHover, setHasHover] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    // Heuristic: prefer hover-capable behavior when either:
    // - the device reports hover support, OR
    // - the primary pointer is fine (mouse/trackpad)
    //
    // Some Windows devices incorrectly report one of these, so we OR them.
    const mqHover = window.matchMedia?.("(hover: hover)");
    const mqFine = window.matchMedia?.("(pointer: fine)");

    const compute = () => Boolean(mqHover?.matches || mqFine?.matches);
    setHasHover(compute());

    const onChange = () => setHasHover(compute());
    mqHover?.addEventListener?.("change", onChange);
    mqFine?.addEventListener?.("change", onChange);
    return () => {
      mqHover?.removeEventListener?.("change", onChange);
      mqFine?.removeEventListener?.("change", onChange);
    };
  }, []);

  const effectiveClickOnly = clickOnly || !hasHover;

  React.useEffect(() => {
    if (!open) return;

    const handleScroll = () => {
      setOpen(false);
      // Blur so the icon doesn't look "stuck" active.
      queueMicrotask(() => buttonRef.current?.blur());
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const trigger = (
    <button
      ref={buttonRef}
      type="button"
      className="text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors touch-manipulation"
      aria-label={ariaLabel}
      onClick={(e) => {
        // Prevent accidental form submits and keep this purely UI.
        e.preventDefault();
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      onMouseEnter={
        effectiveClickOnly
          ? undefined
          : () => {
              setOpen(true);
            }
      }
      onMouseLeave={
        effectiveClickOnly
          ? undefined
          : () => {
              setOpen(false);
            }
      }
      onFocus={
        effectiveClickOnly
          ? undefined
          : () => {
              setOpen(true);
            }
      }
      onBlur={
        effectiveClickOnly
          ? undefined
          : () => {
              setOpen(false);
            }
      }
    >
      <HelpCircle className={cn("h-4 w-4", iconClassName)} />
    </button>
  );

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {leading}
      {effectiveClickOnly ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            className={cn(
              "w-auto p-3",
              // Prevent mobile popover from hugging screen edges.
              "max-w-[calc(100vw-2rem)]",
              maxWidthClassName
            )}
            side={side}
            sideOffset={sideOffset}
            align={align}
            avoidCollisions={true}
            collisionPadding={collisionPadding}
          >
            {content}
          </PopoverContent>
        </Popover>
      ) : (
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <Tooltip
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) buttonRef.current?.blur();
            }}
            disableHoverableContent
          >
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent
              className={cn(maxWidthClassName)}
              side={side}
              sideOffset={sideOffset}
              align={align}
              avoidCollisions={true}
              collisionPadding={collisionPadding}
            >
              {content}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}
