"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  variantIcons,
  variantIconColors,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        // Infer success from title if variant not set
        const titleStr = title?.toString().toLowerCase() ?? ""
        const resolvedVariant =
          variant === "destructive" ? "destructive"
          : (titleStr.includes("success") || titleStr.includes("muvaffaq")) ? "success"
          : "default"

        const Icon = variantIcons[resolvedVariant]
        const iconColor = variantIconColors[resolvedVariant]

        return (
          <Toast key={id} variant={resolvedVariant} {...props}>
            {/* Icon circle — mirrors the Avatar in the profile card */}
            <div className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-full bg-muted/40 ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>

            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
