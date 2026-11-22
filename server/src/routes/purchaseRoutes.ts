import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createPurchase } from '../services/purchaseService.js';

const router = Router();

// List purchases
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { search, paymentStatus, fromDate, toDate } = req.query;
    const where: any = { businessId };

    if (search) {
      const q = String(search);
      where.OR = [
        { purchaseNumber: { contains: q } },
        { supplier: { name: { contains: q } } },
      ];
    }

    if (paymentStatus) {
      where.paymentStatus = String(paymentStatus);
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(String(fromDate));
      if (toDate) where.date.lte = new Date(String(toDate));
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ purchases });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single purchase details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        business: true,
        items: { include: { product: true } },
      },
    });

    if (!purchase) {
      res.status(404).json({ error: 'Purchase record not found' });
      return;
    }

    res.json({ purchase });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new purchase bill (triggers automatic stock addition, supplier payable balance update, journal entry, tax record)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const {
      supplierId,
      purchaseNumber,
      date,
      items,
      amountPaid,
      paymentMethod,
      isInterState,
      notes,
    } = req.body;

    const purchase = await createPurchase({
      businessId,
      supplierId,
      purchaseNumber,
      date,
      items,
      amountPaid: amountPaid !== undefined ? parseFloat(amountPaid) : 0,
      paymentMethod,
      isInterState: Boolean(isInterState),
      notes,
      userId: req.user?.id,
    });

    res.status(201).json({ purchase, message: 'Purchase saved and stock added automatically!' });
  } catch (err: any) {
    console.error('Purchase creation error:', err);
    res.status(400).json({ error: err.message || 'Failed to record purchase' });
  }
});

export default router;
