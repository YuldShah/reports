"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-[#10161f]/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const isChildType = (child: React.ReactNode, displayName: string) =>
  React.isValidElement(child) &&
  typeof child.type !== "string" &&
  (child.type as React.ComponentType).displayName === displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const childArray = React.Children.toArray(children);
  const headerChildren = childArray.filter((c) => isChildType(c, "DialogHeader"));
  const footerChildren = childArray.filter((c) => isChildType(c, "DialogFooter"));
  const bodyChildren = childArray.filter(
    (c) => !isChildType(c, "DialogHeader") && !isChildType(c, "DialogFooter"),
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed bottom-0 left-[50%] z-50 flex flex-col w-full max-w-lg translate-x-[-50%] border border-b-0 bg-background shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-[100%] data-[state=open]:slide-in-from-bottom-[100%] rounded-t-[calc(var(--radius)+16px)] max-h-[85vh] overflow-hidden sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:border-b sm:rounded-[calc(var(--radius)+16px)] sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
          className,
        )}
        {...props}
      >
        {/* Drag handle */}
        <div className="absolute left-1/2 top-3 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted-foreground/20" />

        {/* Close button */}
        <DialogPrimitive.Close className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/95 text-muted-foreground shadow-sm ring-offset-background transition-[background-color,color,border-color,transform] hover:border-primary/20 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-95 disabled:pointer-events-none cursor-pointer">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        {/* Fixed header */}
        {headerChildren.length > 0 && (
          <div className="flex-shrink-0 px-6 pt-8 pb-4 text-center">
            {headerChildren}
          </div>
        )}

        {/* Scrollable body */}
        {bodyChildren.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 py-2">
            {bodyChildren}
          </div>
        )}

        {/* Fixed footer */}
        {footerChildren.length > 0 && (
          <div className="flex-shrink-0 border-t border-border/40 px-6 py-4">
            {footerChildren}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex gap-2 w-full", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
