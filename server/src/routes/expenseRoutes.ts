import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createExpense } from '../services/expenseService.js';

const router = Router();

// List expense categories
router.get('/categories', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }
    const categories = await prisma.expenseCategory.findMany({
      where: { businessId },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create expense category
router.post('/categories', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    const { name, description } = req.body;
    if (!businessId || !name) {
      res.status(400).json({ error: 'Business ID and name are required' });
      return;
    }
    const category = await prisma.expenseCategory.create({
      data: { businessId, name, description },
    });
    res.status(201).json({ category });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List expenses
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { categoryId, fromDate, toDate, search } = req.query;
    const where: any = { businessId };

    if (categoryId) {
      where.categoryId = String(categoryId);
    }
    if (search) {
      const q = String(search);
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { referenceNumber: { contains: q } },
      ];
    }
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(String(fromDate));
      if (toDate) where.date.lte = new Date(String(toDate));
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({ expenses, totalAmount: Math.round(totalAmount * 100) / 100 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create expense
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { categoryId, title, amount, date, description, paymentMethod, referenceNumber } = req.body;

    const expense = await createExpense({
      businessId,
      categoryId,
      title,
      amount: parseFloat(amount),
      date,
      description,
      paymentMethod,
      referenceNumber,
      userId: req.user?.id,
    });

    res.status(201).json({ expense, message: 'Expense recorded and financial ledger updated!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete expense with confirmation
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
