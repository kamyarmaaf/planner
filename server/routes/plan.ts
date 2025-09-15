import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { generateDailyPlan } from '../services/ai/generateDailyPlan';

const router = Router();

// Validation schemas
const generatePlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  timezone: z.string().optional(),
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
  req.query.date = today;
  return router.handle(req, res);
});

export default router;
