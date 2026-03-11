import Logo from "@/components/logo"

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center noise">
      <div className="text-center fade-in">
        <div className="glow-pulse mb-6">
          <Logo />
        </div>
        <div className="flex justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
