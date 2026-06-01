export function CenterSpinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export function ErrorPanel({ message = "Failed to load data." }: { message?: string }) {
  return (
    <div className="surface-panel rounded-[calc(var(--radius)+4px)] border p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="surface-panel rounded-[calc(var(--radius)+4px)] border p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
