import { useState } from "react"
import { Switch, Route } from "wouter"
import { queryClient } from "./lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeProvider } from "./components/ThemeProvider"
import { ThemeToggle } from "./components/ThemeToggle"
import { LanguageProvider } from "./contexts/LanguageContext"
import { LanguageToggle } from "./components/LanguageToggle"
import { AppSidebar } from "./components/AppSidebar"
import { AuthForm } from "./components/AuthForm"
import { ProfileSetup } from "./components/ProfileSetup"
import { DailyDashboard } from "./components/DailyDashboard"
import { MonthlyPlanner } from "./components/MonthlyPlanner"
import { ProgressTracking } from "./components/ProgressTracking"
import { ContactForm } from "./components/ContactForm"
import NotFound from "@/pages/not-found"

type AppState = 'auth' | 'profile-setup' | 'app'

function Router() {
  return (
    <Switch>
      <Route path="/" component={DailyDashboard} />
      <Route path="/dashboard" component={DailyDashboard} />
      <Route path="/monthly" component={MonthlyPlanner} />
      <Route path="/progress" component={ProgressTracking} />
      <Route path="/goals" component={MonthlyPlanner} />
      <Route path="/contact" component={ContactForm} />
      <Route path="/settings">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">Settings panel coming soon...</p>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  )
}

function AppContent() {
  const [appState, setAppState] = useState<AppState>('auth')

  // Custom sidebar width for life planning application
  const style = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  }

  if (appState === 'auth') {
    return <AuthForm onAuthSuccess={() => setAppState('profile-setup')} />
  }

  if (appState === 'profile-setup') {
    return <ProfileSetup onComplete={() => setAppState('app')} />
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              <Router />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" storageKey="lifeplan-ui-theme">
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}