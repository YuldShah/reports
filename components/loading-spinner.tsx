export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center noise px-4">
      <div className="glass-floating fade-in flex items-center gap-3 rounded-full px-4 py-3">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <div className="text-sm font-medium text-foreground/85">Loading workspace...</div>
      </div>
    </div>
  )
}
