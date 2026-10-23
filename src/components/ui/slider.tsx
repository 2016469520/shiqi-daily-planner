"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  trackClassName,
  indicatorClassName,
  thumbClassName,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  defaultValue?: number[]
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  /** 允许调用方换掉轨道/进度/滑块的配色（例如专注区的紫青渐变） */
  trackClassName?: string
  indicatorClassName?: string
  thumbClassName?: string
}) {
  const _value = value || defaultValue || [min]
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className
      )}
      min={min}
      max={max}
      step={step}
      value={_value}
      onValueChange={(v) => onValueChange?.(v as number[])}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex w-full items-center h-5"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary",
            trackClassName
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className={cn("absolute h-full bg-primary", indicatorClassName)}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className={cn(
            "block h-4 w-4 cursor-grab rounded-full border border-primary/50 bg-background shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[dragging]:border-primary data-[dragging]:bg-primary data-[dragging]:cursor-grabbing",
            thumbClassName
          )}
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
