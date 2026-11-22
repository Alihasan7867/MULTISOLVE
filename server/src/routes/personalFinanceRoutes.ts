import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// List personal transactions
router.get('/transactions', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, monthYear } = req.query;

    const where: any = { userId };
    if (type) {
      where.type = String(type);
    }

    const transactions = await prisma.personalTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const savings = income - expense;

    res.json({
      transactions,
      summary: {
        totalIncome: Math.round(income * 100) / 100,
        totalExpense: Math.round(expense * 100) / 100,
        netSavings: Math.round(savings * 100) / 100,
        savingsRate: income > 0 ? Math.round((savings / income) * 100) : 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add personal transaction
router.post('/transactions', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, category, amount, date, description, paymentMethod, savingsBucket } = req.body;

    if (!type || !category || !amount) {
      res.status(400).json({ error: 'Type, category and amount are required' });
      return;
    }

    const txn = await prisma.personalTransaction.create({
      data: {
        userId,
        type,
        category,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        description,
        paymentMethod: paymentMethod || 'UPI',
        savingsBucket: savingsBucket || undefined,
      },
    });

    res.status(201).json({ transaction: txn });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get personal budgets
router.get('/budgets', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const budgets = await prisma.personalBudget.findMany({
      where: { userId },
    });

    // Calculate actual spending for each category in current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthExpenses = await prisma.personalTransaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth },
      },
    });

    const enrichedBudgets = budgets.map((b) => {
      const spent = monthExpenses
        .filter((e) => e.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        ...b,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round((b.monthlyLimit - spent) * 100) / 100,
        progress: Math.min(100, Math.round((spent / b.monthlyLimit) * 100)),
      };
    });

    res.json({ budgets: enrichedBudgets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update personal budget
router.post('/budgets', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category, monthlyLimit } = req.body;
    const monthYear = new Date().toISOString().slice(0, 7);

    const budget = await prisma.personalBudget.upsert({
      where: {
        userId_category_monthYear: {
          userId,
          category,
          monthYear,
        },
      },
      update: { monthlyLimit: parseFloat(monthlyLimit) },
      create: {
        userId,
        category,
        monthlyLimit: parseFloat(monthlyLimit),
        monthYear,
      },
    });

    res.status(201).json({ budget });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
