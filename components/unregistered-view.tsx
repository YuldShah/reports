import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/components/auth-provider"
import { AlertTriangle } from "lucide-react"

export default function UnregisteredView() {
  const { telegramUser } = useAuthContext()

  return (
    <div className="min-h-screen bg-mesh flex items-start justify-center pt-20 p-4 noise">
      <Card className="w-full max-w-md glass border-glass-border fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <CardTitle className="font-heading text-xl">Not Registered</CardTitle>
          <CardDescription>You&apos;re not registered in the system yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to assign you to a team and get access to the reporting system.
          </p>
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              Your Telegram ID: <span className="font-mono text-foreground/80">{telegramUser?.id}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
