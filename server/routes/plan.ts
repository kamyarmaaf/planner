import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { authenticateToken } from '../middleware/auth';
import { type AuthRequest } from '../auth';
import { generateDailyPlan } from '../services/ai/generateDailyPlan';

const router = Router();

// Validation schemas
const generatePlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  timezone: z.string().optional(),
});

const planningDataSchema = z.object({
  long_term_plan: z.object({
    description: z.string(),
    milestones: z.array(z.string())
  }).optional(),
  monthly_plan: z.object({
    description: z.string(),
    key_tasks: z.array(z.string())
  }).optional(),
  daily_tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    type: z.enum(['workout', 'meal', 'reading', 'work', 'rest']),
    completed: z.boolean().default(false),
    description: z.string()
  })).optional()
});

// POST /api/plan/generate - Generate daily plan
router.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validation = generatePlanSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: validation.error.errors 
      });
    }

    // Get user's profile
    const profile = await storage.getProfile(req.user!.id);
    if (!profile) {
      return res.status(400).json({ message: 'Profile not found. Please complete your profile first.' });
    }

    // Default values
    const date = validation.data.date || new Date().toISOString().slice(0, 10);
    const timezone = validation.data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Generate daily plan
    const dailyPlan = await generateDailyPlan({ profile, date, timezone });

    // Save plan to database
    await storage.upsertDailyPlan({
      userId: req.user!.id,
      date,
      timezone,
      planJson: JSON.stringify(dailyPlan)
    });

    res.status(202).json({
      message: 'Plan generation started',
      date,
      timezone
    });
  } catch (error) {
    console.error('Generate plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/plan - Get daily plan for specific date
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD format)' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format' });
    }

    const plan = await storage.getDailyPlan(req.user!.id, date);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found for this date' });
    }

    // Parse the plan JSON
    let planData;
    try {
      planData = JSON.parse(plan.planJson);
    } catch (error) {
      console.error('Error parsing plan JSON:', error);
      return res.status(500).json({ message: 'Error parsing plan data' });
    }

    res.json({
      message: 'Plan retrieved successfully',
      plan: {
        id: plan.id,
        userId: plan.userId,
        date: plan.date,
        timezone: plan.timezone,
        data: planData,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/plan/today - Convenience endpoint for today's plan
router.get('/today', authenticateToken, async (req: AuthRequest, res) => {
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    const plan = await storage.getDailyPlan(req.user!.id, today);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found for today' });
    }

    // Parse the plan JSON
    let planData;
    try {
      planData = JSON.parse(plan.planJson);
    } catch (error) {
      console.error('Error parsing plan JSON:', error);
      return res.status(500).json({ message: 'Error parsing plan data' });
    }

    res.json({
      message: 'Plan retrieved successfully',
      plan: {
        id: plan.id,
        userId: plan.userId,
        date: plan.date,
        timezone: plan.timezone,
        data: planData,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    console.error('Get today plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/plan/comprehensive - Save comprehensive planning data (long-term, monthly, daily)
router.post('/comprehensive', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validation = planningDataSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid planning data', 
        errors: validation.error.errors 
      });
    }

    const { long_term_plan, monthly_plan, daily_tasks } = validation.data;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const today = new Date().toISOString().slice(0, 10);

    // Save long-term plan if provided
    if (long_term_plan) {
      await storage.upsertDailyPlan({
        userId: req.user!.id,
        date: `long-term-${currentYear}`,
        timezone,
        planJson: JSON.stringify(long_term_plan)
      });
    }

    // Save monthly plan if provided
    if (monthly_plan) {
      await storage.upsertDailyPlan({
        userId: req.user!.id,
        date: `monthly-${currentYear}-${currentMonth}`,
        timezone,
        planJson: JSON.stringify(monthly_plan)
      });
    }

    // Save daily tasks if provided
    if (daily_tasks) {
      await storage.upsertDailyPlan({
        userId: req.user!.id,
        date: today,
        timezone,
        planJson: JSON.stringify({ daily_tasks })
      });
    }

    res.json({
      message: 'Planning data saved successfully',
      saved: {
        long_term: !!long_term_plan,
        monthly: !!monthly_plan,
        daily: !!daily_tasks
      }
    });
  } catch (error) {
    console.error('Save comprehensive plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/plan/comprehensive - Get all planning data (long-term, monthly, daily)
router.get('/comprehensive', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const today = new Date().toISOString().slice(0, 10);

    // Get long-term plan
    const longTermPlan = await storage.getDailyPlan(req.user!.id, `long-term-${currentYear}`);
    
    // Get monthly plan
    const monthlyPlan = await storage.getDailyPlan(req.user!.id, `monthly-${currentYear}-${currentMonth}`);
    
    // Get daily plan
    const dailyPlan = await storage.getDailyPlan(req.user!.id, today);

    // Parse the plans
    let longTermData = null;
    let monthlyData = null;
    let dailyData = null;

    try {
      if (longTermPlan) {
        longTermData = JSON.parse(longTermPlan.planJson);
      }
      if (monthlyPlan) {
        monthlyData = JSON.parse(monthlyPlan.planJson);
      }
      if (dailyPlan) {
        const parsed = JSON.parse(dailyPlan.planJson);
        dailyData = parsed.daily_tasks || parsed.items || [];
      }
    } catch (error) {
      console.error('Error parsing plan data:', error);
    }

    res.json({
      message: 'Planning data retrieved successfully',
      data: {
        long_term_plan: longTermData,
        monthly_plan: monthlyData,
        daily_tasks: dailyData
      }
    });
  } catch (error) {
    console.error('Get comprehensive plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  completed: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

// POST /api/plan/update-task - Update individual task completion
router.post('/update-task', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validation = updateTaskSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: validation.error.errors 
      });
    }

    const { taskId, completed, date } = validation.data;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    
    // Get current daily plan
    const plan = await storage.getDailyPlan(req.user!.id, targetDate);
    
    if (!plan) {
      return res.status(404).json({ message: 'Daily plan not found' });
    }

    // Parse plan data
    let planData;
    try {
      planData = JSON.parse(plan.planJson);
    } catch (error) {
      return res.status(500).json({ message: 'Error parsing plan data' });
    }

    // Find and update the task in daily_tasks or items array
    const tasks = planData.daily_tasks || planData.items || [];
    const taskIndex = tasks.findIndex((task: any) => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update only the completed status
    tasks[taskIndex].completed = completed;
    
    // Preserve original plan structure while updating the tasks
    if (planData.daily_tasks) {
      planData.daily_tasks = tasks;
    } else if (planData.items) {
      planData.items = tasks;
    } else {
      planData.daily_tasks = tasks;
    }
    
    // Save updated plan preserving all other fields
    await storage.upsertDailyPlan({
      userId: req.user!.id,
      date: targetDate,
      timezone: plan.timezone,
      planJson: JSON.stringify(planData)
    });

    res.json({
      message: 'Task updated successfully',
      task: tasks[taskIndex]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
