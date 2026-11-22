import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { initializeBusinessAccounts } from '../services/accountingService.js';
import { initializeExpenseCategories } from '../services/expenseService.js';

const router = Router();

// List all businesses user has access to
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberships = await prisma.businessMember.findMany({
      where: { userId: req.user!.id },
      include: { business: true },
    });

    const businesses = memberships.map((m) => m.business);
    res.json({ businesses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new business profile
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, ownerName, email, phone, address, city, state, pinCode, country, gstin, currency } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Business name and email are required' });
      return;
    }

    const business = await prisma.business.create({
      data: {
        name,
        type: type || 'General Retail',
        ownerName: ownerName || req.user!.name,
        email,
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || 'Maharashtra',
        pinCode: pinCode || '',
        country: country || 'India',
        gstin: gstin || undefined,
        currency: currency || 'INR',
        members: {
          create: {
            userId: req.user!.id,
            role: 'OWNER',
          },
        },
      },
    });

    // Initialize accounts & expense categories
    await initializeBusinessAccounts(business.id);
    await initializeExpenseCategories(business.id);

    res.status(201).json({ business });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update business details
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, ownerName, email, phone, address, city, state, pinCode, gstin, monthlySalesGoal } = req.body;

    const business = await prisma.business.update({
      where: { id },
      data: {
        name,
        type,
        ownerName,
        email,
        phone,
        address,
        city,
        state,
        pinCode,
        gstin,
        monthlySalesGoal: monthlySalesGoal ? parseFloat(monthlySalesGoal) : undefined,
      },
    });

    res.json({ business });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
