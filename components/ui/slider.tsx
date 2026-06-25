"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    trackClassName?: string;
    rangeClassName?: string;
    showThumb?: boolean;
  }
>(({ className, trackClassName, rangeClassName, showThumb = true, ...props }, ref) => {
  const value = (props.value ?? props.defaultValue ?? [0]) as number[];
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center group/slider",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted",
          trackClassName,
        )}
      >
        <SliderPrimitive.Range className={cn("absolute h-full rounded-full bg-primary", rangeClassName)} />
      </SliderPrimitive.Track>
      {showThumb &&
        value.map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="block size-3.5 rounded-full border-2 border-primary bg-background shadow-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 hover:scale-110 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
