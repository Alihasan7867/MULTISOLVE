import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { recordJournalEntry } from '../services/accountingService.js';

const router = Router();

// Chart of accounts
router.get('/accounts', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const accounts = await prisma.account.findMany({
      where: { businessId },
      orderBy: { code: 'asc' },
    });

    res.json({ accounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Journal entries list
router.get('/journal-entries', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const entries = await prisma.journalEntry.findMany({
      where: { businessId },
      include: {
        lines: {
          include: { account: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    res.json({ entries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual journal entry (with strict double-entry validation)
router.post('/journal-entries', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    const { date, description, lines } = req.body;

    if (!businessId || !description || !lines || lines.length < 2) {
      res.status(400).json({ error: 'Journal entry requires at least 2 balanced lines' });
      return;
    }

    const entry = await prisma.$transaction(async (tx) => {
      return await recordJournalEntry(tx, {
        businessId,
        date: date ? new Date(date) : new Date(),
        description,
        referenceType: 'MANUAL',
        lines,
      });
    });

    res.status(201).json({ entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Trial balance
router.get('/trial-balance', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const accounts = await prisma.account.findMany({
      where: { businessId },
      orderBy: { code: 'asc' },
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const trialBalanceRows = accounts.map((acc) => {
      let debit = 0;
      let credit = 0;

      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        if (acc.balance >= 0) debit = acc.balance;
        else credit = Math.abs(acc.balance);
      } else {
        if (acc.balance >= 0) credit = acc.balance;
        else debit = Math.abs(acc.balance);
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: Math.round(debit * 100) / 100,
        credit: Math.round(credit * 100) / 100,
      };
    });

    res.json({
      rows: trialBalanceRows,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced: Math.abs(totalDebit - totalCredit) <= 0.05,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Profit and Loss statement
router.get('/profit-loss', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const accounts = await prisma.account.findMany({
      where: {
        businessId,
        type: { in: ['REVENUE', 'EXPENSE'] },
      },
      orderBy: { code: 'asc' },
    });

    const revenueAccounts = accounts.filter((a) => a.type === 'REVENUE');
    const expenseAccounts = accounts.filter((a) => a.type === 'EXPENSE');

    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    const netProfit = totalRevenue - totalExpenses;

    res.json({
      revenueAccounts,
      expenseAccounts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Balance sheet
router.get('/balance-sheet', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const accounts = await prisma.account.findMany({
      where: {
        businessId,
        type: { in: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
      },
      orderBy: { code: 'asc' },
    });

    const assetAccounts = accounts.filter((a) => a.type === 'ASSET');
    const liabilityAccounts = accounts.filter((a) => a.type === 'LIABILITY');
    const equityAccounts = accounts.filter((a) => a.type === 'EQUITY');

    // Net profit transfers to retained earnings in balance sheet
    const rev = accounts.filter((a) => a.type === 'REVENUE').reduce((sum, a) => sum + a.balance, 0);
    const exp = accounts.filter((a) => a.type === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0);
    const currentPeriodNetIncome = rev - exp;

    const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
    const baseEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = baseEquity + currentPeriodNetIncome;

    res.json({
      assetAccounts,
      liabilityAccounts,
      equityAccounts,
      currentPeriodNetIncome: Math.round(currentPeriodNetIncome * 100) / 100,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      totalLiabilitiesAndEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Accounts Receivable & Accounts Payable summaries
router.get('/receivables-payables', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const customers = await prisma.customer.findMany({
      where: { businessId, currentBalance: { gt: 0 } },
      orderBy: { currentBalance: 'desc' },
    });

    const suppliers = await prisma.supplier.findMany({
      where: { businessId, currentBalance: { gt: 0 } },
      orderBy: { currentBalance: 'desc' },
    });

    const totalReceivables = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

    res.json({
      receivables: {
        customers,
        total: Math.round(totalReceivables * 100) / 100,
      },
      payables: {
        suppliers,
        total: Math.round(totalPayables * 100) / 100,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
