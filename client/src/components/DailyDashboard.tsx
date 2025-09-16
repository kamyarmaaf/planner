import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2, Circle, Edit, Zap, Book, Dumbbell, Coffee, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"

interface Task {
  id: string
  title: string
  time: string
  type: 'workout' | 'meal' | 'reading' | 'work' | 'rest'
  completed: boolean
  description?: string
}

const typeIcons = {
  workout: Dumbbell,
  meal: Coffee,
  reading: Book,
  work: Brain,
  rest: Clock,
}

const typeColors = {
  workout: 'bg-chart-1',
  meal: 'bg-chart-3', 
  reading: 'bg-chart-2',
  work: 'bg-chart-4',
  rest: 'bg-chart-5',
}

export function DailyDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string) || '/').replace(/\/?$/, '/')
        const accessToken = localStorage.getItem('accessToken')

        // First try to load comprehensive planning data
        let res = await fetch(`${API_BASE_URL}api/plan/comprehensive`, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        })

        if (res.status === 404 || !res.ok) {
          // Fall back to generating via AI if no comprehensive data exists
          res = await fetch(`${API_BASE_URL}api/ai/daily-tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          })
        }

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Load tasks error ${res.status}: ${text}`)
        }

        const data = await res.json()
        
        // Handle comprehensive planning data or fallback to AI-generated tasks
        const dailyTasks = data?.data?.daily_tasks || 
                          data?.plan?.data?.items || 
                          data?.plan?.data?.daily_tasks || 
                          data?.daily_tasks || []

        const defaultByType: Record<string, string> = {
          workout: '07:00',
          meal: '08:30',
          work: '09:00',
          rest: '18:00',
          reading: '20:00',
        }

        const processedTasks: Task[] = (dailyTasks ?? []).map((t: any) => ({
          id: String(t.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
          title: String(t.title ?? ''),
          time: String((t.time && String(t.time)) || defaultByType[String(t.type)] || '09:00'),
          type: (t.type as Task['type']) ?? 'work',
          completed: Boolean(t.completed ?? false),
          description: t.description ? String(t.description) : undefined,
        }))

        // If no tasks exist, provide a full-day template
        if (processedTasks.length === 0) {
          const fullDayTasks: Task[] = [
            { id: '1', title: 'Sleep', time: '23:00', type: 'rest', completed: false, description: 'Sleep from 11:00 PM to 6:00 AM' },
            { id: '2', title: 'Morning Routine', time: '06:00', type: 'rest', completed: false, description: 'Wake up and morning preparation' },
            { id: '3', title: 'Morning Workout', time: '07:00', type: 'workout', completed: false, description: '30min cardio + stretching' },
            { id: '4', title: 'Healthy Breakfast', time: '08:30', type: 'meal', completed: false, description: 'Oatmeal with berries' },
            { id: '5', title: 'Deep Work Session', time: '09:00', type: 'work', completed: false, description: 'Focus block - main projects' },
            { id: '6', title: 'Lunch Break', time: '12:30', type: 'meal', completed: false, description: 'Healthy lunch and short walk' },
            { id: '7', title: 'Afternoon Work', time: '14:00', type: 'work', completed: false, description: 'Secondary tasks and meetings' },
            { id: '8', title: 'Evening Reading', time: '20:00', type: 'reading', completed: false, description: 'Read for 30-45 minutes' },
            { id: '9', title: 'Wind Down', time: '21:30', type: 'rest', completed: false, description: 'Prepare for sleep and relaxation' },
          ]
          setTasks(fullDayTasks)
        } else {
          setTasks(processedTasks)
        }
      } catch (err) {
        console.error(err)
        // Fallback to full-day template on error
        setTasks([
          { id: '1', title: 'Sleep', time: '23:00', type: 'rest', completed: false, description: 'Sleep from 11:00 PM to 6:00 AM' },
          { id: '2', title: 'Morning Routine', time: '06:00', type: 'rest', completed: false, description: 'Wake up and morning preparation' },
          { id: '3', title: 'Morning Workout', time: '07:00', type: 'workout', completed: false, description: '30min cardio + stretching' },
          { id: '4', title: 'Healthy Breakfast', time: '08:30', type: 'meal', completed: false, description: 'Nutritious breakfast' },
          { id: '5', title: 'Deep Work', time: '09:00', type: 'work', completed: false, description: 'Focus block' },
        ])
      }
    }

    fetchTasks()
  }, [])

  const toggleTask = async (taskId: string) => {
    const next = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    setTasks(next)

    try {
      const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string) || '/').replace(/\/?$/, '/')
      const accessToken = localStorage.getItem('accessToken')
      const today = new Date().toISOString().slice(0, 10)
      const updated = next.find(t => t.id === taskId)!

      // Use the new comprehensive planning API
      const response = await fetch(`${API_BASE_URL}api/plan/update-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ 
          taskId: updated.id, 
          completed: updated.completed, 
          date: today 
        }),
      })

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }

      toast({
        title: "Task updated!",
        description: "Your progress has been saved.",
      })
    } catch (e) {
      console.error(e)
      // Revert the change if API call fails
      setTasks(tasks)
      
      toast({
        title: "Update failed",
        description: "Unable to save your progress. Please try again.",
        variant: "destructive",
      })
    }
  }

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length
  const progressPercentage = (completedTasks / totalTasks) * 100

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard_good_morning}</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <Button variant="outline" data-testid="button-edit-schedule">
          <Edit className="w-4 h-4 mr-2" />
          {t.dashboard_edit_schedule}
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-chart-2" />
            {t.dashboard_progress}
          </CardTitle>
          <CardDescription>
            {completedTasks} of {totalTasks} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{progressPercentage.toFixed(0)}% Complete</span>
            <span>{totalTasks - completedTasks} tasks remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = typeIcons[task.type] ?? Brain
          const colorClass = typeColors[task.type]
          
          return (
            <Card 
              key={task.id} 
              className={`hover-elevate cursor-pointer transition-all ${
                task.completed ? "opacity-70" : ""
              }`}
              onClick={() => toggleTask(task.id)}
              data-testid={`task-${task.id}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <button className="flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-chart-1" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </button>
                
                <div className={`p-2 rounded-lg ${colorClass}/20`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-medium ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {task.time}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
