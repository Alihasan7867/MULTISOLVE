import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getDashboardData } from '../services/dashboardService.js';

const router = Router();

// Full dashboard overview backed by live database calculations
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const data = await getDashboardData(businessId);
    res.json(data);
  } catch (err: any) {
    console.error('Dashboard data error:', err);
    res.status(500).json({ error: err.message || 'Failed to load dashboard data' });
  }
});

export default router;
