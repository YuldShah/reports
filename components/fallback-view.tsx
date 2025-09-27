import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FallbackView() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo />
          <CardDescription>Please open this app from Telegram to continue</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            asChild
            className="w-full bg-telegram-blue hover:bg-telegram-blue/90 text-white border border-telegram-blue/20 shadow-lg"
          >
            <a href="https://t.me/Reports_NewUU_Bot" target="_blank" rel="noopener noreferrer">
              Open in Telegram
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
