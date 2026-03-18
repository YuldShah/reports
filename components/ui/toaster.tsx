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
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const resolvedVariant = (variant as "default" | "destructive" | "success") || "default"
        const iconVariant = title?.toString().toLowerCase().includes("success") ? "success" : resolvedVariant
        const Icon = variantIcons[iconVariant] || variantIcons.default
        const iconColor = variantIconColors[iconVariant] || variantIconColors.default

        return (
          <Toast key={id} variant={iconVariant} {...props}>
            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="grid gap-0.5 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
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
