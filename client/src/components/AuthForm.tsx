import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"

export function AuthForm({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: t.success,
        description: "You've been logged in successfully.",
      })
      onAuthSuccess()
    }, 1000)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t.auth_title}</CardTitle>
          <CardDescription className="text-center">
            {t.auth_description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">{t.auth_login}</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">{t.auth_register}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth_email}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com"
                    data-testid="input-email"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth_password}</Label>
                  <Input 
                    id="password" 
                    type="password"
                    data-testid="input-password"
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? t.auth_signing_in : t.auth_signin}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.auth_name}</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe"
                    data-testid="input-name"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">{t.auth_email}</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="your@email.com"
                    data-testid="input-register-email"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">{t.auth_password}</Label>
                  <Input 
                    id="reg-password" 
                    type="password"
                    data-testid="input-register-password"
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? t.auth_creating_account : t.auth_create_account}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}