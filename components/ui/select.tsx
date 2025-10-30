"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger(
  { className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Trigger>>
) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent(
  {
    className,
    children,
    position = "popper",
    sideOffset = 4,
    avoidCollisions = false,
    style,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Content>>
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "z-50 w-[var(--radix-select-trigger-width)] bg-popover rounded-md shadow-xl border border-border overflow-hidden opacity-0 transition-opacity duration-150 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none",
          className
        )}
        position={position}
        side="bottom"
        align="start"
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        style={{
          transitionProperty: "opacity",
          transitionDuration: "150ms",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          ...style,
        }}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-2 h-full max-h-80 overflow-y-auto">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Label>>
) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  )
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem(
  { className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Item>>
) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex items-center p-2 pr-8 rounded-md text-sm outline-none select-none cursor-pointer",
        "data-[highlighted]:bg-accent data-[highlighted]:outline-none",
        "data-[disabled]:text-muted-foreground data-[disabled]:pointer-events-none",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="whitespace-normal leading-snug">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator(
  { className, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Separator>>
) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
})
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
