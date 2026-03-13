"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger(
  {
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Trigger>>,
) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "surface-field flex h-9 w-full items-center justify-between whitespace-nowrap rounded-[calc(var(--radius)+2px)] border px-4 py-2 text-sm shadow-none ring-offset-background data-[placeholder]:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent(
  {
    className,
    children,
    position = "item-aligned",
    sideOffset = 0,
    avoidCollisions = true,
    style,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Content>>,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "glass-floating fixed bottom-0 left-1/2 z-50 w-full max-w-[560px] translate-x-[-50%] overflow-hidden rounded-t-[26px] rounded-b-none border-b-0 px-0 pb-[calc(0.5rem+var(--tg-safe-area-inset-bottom,0px))] pt-2 shadow-[0_-20px_60px_rgba(15,23,42,0.18)]",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-[100%] data-[state=open]:duration-300",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-[100%] data-[state=closed]:duration-200 data-[state=closed]:ease-in",
          className,
        )}
        position={position}
        side="bottom"
        align="center"
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        style={style}
        {...props}
      >
        <div className="px-4 pb-1 pt-2">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
        </div>
        <SelectPrimitive.Viewport className="max-h-[42vh] px-3 pb-2">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel(
  {
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Label>>,
) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  );
});
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem(
  {
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Item>>,
) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full min-h-11 cursor-pointer select-none items-center rounded-[14px] px-3 py-3 pr-9 text-[15px] outline-none mb-1.5",
        "bg-muted border border-border/30",
        "data-[highlighted]:bg-accent data-[highlighted]:border-border/40 data-[highlighted]:outline-none",
        "data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary/30",
        "data-[disabled]:text-muted-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="whitespace-normal leading-snug">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex items-center">
        <Check className="h-4 w-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator(
  {
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>,
  ref: React.Ref<React.ElementRef<typeof SelectPrimitive.Separator>>,
) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  );
});
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
