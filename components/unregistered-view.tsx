import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/components/auth-provider"

export default function UnregisteredView() {
  const { telegramUser } = useAuthContext()

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">Not Registered</CardTitle>
          <CardDescription>You're not registered in the system yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to assign you to a team and get access to the reporting system.
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              Your Telegram ID: <span className="font-mono">{telegramUser?.id}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
