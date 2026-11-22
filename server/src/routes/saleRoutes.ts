import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createSale } from '../services/salesService.js';

const router = Router();

// List sales invoices
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
        { invoiceNumber: { contains: q } },
        { customer: { name: { contains: q } } },
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

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ sales });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single invoice details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        business: true,
        items: { include: { product: true } },
      },
    });

    if (!sale) {
      res.status(404).json({ error: 'Sales invoice not found' });
      return;
    }

    res.json({ sale });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new sales invoice (triggers full automated ecosystem update)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const {
      customerId,
      invoiceNumber,
      date,
      dueDate,
      items,
      paymentMethod,
      amountReceived,
      isInterState,
      notes,
    } = req.body;

    const sale = await createSale({
      businessId,
      customerId,
      invoiceNumber,
      date,
      dueDate,
      items,
      paymentMethod,
      amountReceived: amountReceived !== undefined ? parseFloat(amountReceived) : 0,
      isInterState: Boolean(isInterState),
      notes,
      userId: req.user?.id,
    });

    res.status(201).json({ sale, message: 'Invoice created and all ecosystem records updated automatically!' });
  } catch (err: any) {
    console.error('Sale invoice creation error:', err);
    res.status(400).json({ error: err.message || 'Failed to create sales invoice' });
  }
});

export default router;
