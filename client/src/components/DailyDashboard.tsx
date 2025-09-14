import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2, Circle, Edit, Zap, Book, Dumbbell, Coffee, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  time: string
  type: 'workout' | 'meal' | 'reading' | 'work' | 'rest'
  completed: boolean
  description?: string
}

// todo: remove mock functionality
const mockTasks: Task[] = [
  { id: '1', title: 'Morning Workout', time: '07:00', type: 'workout', completed: true, description: '30min cardio + strength training' },
  { id: '2', title: 'Healthy Breakfast', time: '08:30', type: 'meal', completed: true, description: 'Oatmeal with berries and protein' },
  { id: '3', title: 'Deep Work Session', time: '09:00', type: 'work', completed: false, description: 'Focus on project deliverables' },
  { id: '4', title: 'Reading Time', time: '12:00', type: 'reading', completed: false, description: 'Atomic Habits - Chapter 3' },
  { id: '5', title: 'Lunch Break', time: '13:00', type: 'meal', completed: false, description: 'Mediterranean salad with quinoa' },
  { id: '6', title: 'Afternoon Work', time: '14:00', type: 'work', completed: false, description: 'Team meetings and code reviews' },
  { id: '7', title: 'Rest & Reflection', time: '18:00', type: 'rest', completed: false, description: 'Meditation and planning tomorrow' },
]

const typeIcons = {
  workout: Dumbbell,
  meal: Coffee,
  reading: Book,
  work: Brain,
  rest: Clock
}

const typeColors = {
  workout: 'bg-chart-1',
  meal: 'bg-chart-3', 
  reading: 'bg-chart-2',
  work: 'bg-chart-4',
  rest: 'bg-chart-5'
}

export function DailyDashboard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const { toast } = useToast()

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
    toast({
      title: "Task updated!",
      description: "Your progress has been saved.",
    })
  }

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length
  const progressPercentage = (completedTasks / totalTasks) * 100

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Good morning! 👋</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <Button variant="outline" data-testid="button-edit-schedule">
          <Edit className="w-4 h-4 mr-2" />
          Edit Schedule
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-chart-2" />
            Today's Progress
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

      {/* AI Suggestion */}
      <Card className="border-accent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-accent rounded-lg">
              <Zap className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-accent-foreground">AI Recommendation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your energy levels, consider moving your reading session to after lunch for better focus. Your workout completion shows great consistency!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = typeIcons[task.type]
          const colorClass = typeColors[task.type]
          
          return (
            <Card 
              key={task.id} 
              className={`hover-elevate cursor-pointer transition-all ${task.completed ? 'opacity-70' : ''}`}
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
                    <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
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