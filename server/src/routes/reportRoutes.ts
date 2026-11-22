import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Master Consolidated Reports
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { fromDate, toDate } = req.query;
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(String(fromDate));
    if (toDate) dateFilter.lte = new Date(String(toDate));

    const salesWhere: any = { businessId };
    const purchaseWhere: any = { businessId };
    const expenseWhere: any = { businessId };

    if (fromDate || toDate) {
      salesWhere.date = dateFilter;
      purchaseWhere.date = dateFilter;
      expenseWhere.date = dateFilter;
    }

    // 1. Sales Data
    const sales = await prisma.sale.findMany({
      where: salesWhere,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    // Customer-wise breakdown
    const customerMap = new Map<string, { name: string; totalAmount: number; count: number }>();
    sales.forEach((s) => {
      const existing = customerMap.get(s.customerId) || { name: s.customer.name, totalAmount: 0, count: 0 };
      existing.totalAmount += s.grandTotal;
      existing.count += 1;
      customerMap.set(s.customerId, existing);
    });

    // Product-wise sales breakdown
    const productSalesMap = new Map<string, { name: string; quantity: number; totalAmount: number }>();
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const existing = productSalesMap.get(item.productId) || {
          name: item.product.name,
          quantity: 0,
          totalAmount: 0,
        };
        existing.quantity += item.quantity;
        existing.totalAmount += item.totalAmount;
        productSalesMap.set(item.productId, existing);
      });
    });

    // 2. Purchases Data
    const purchases = await prisma.purchase.findMany({
      where: purchaseWhere,
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    const supplierMap = new Map<string, { name: string; totalAmount: number; count: number }>();
    purchases.forEach((p) => {
      const existing = supplierMap.get(p.supplierId) || { name: p.supplier.name, totalAmount: 0, count: 0 };
      existing.totalAmount += p.grandTotal;
      existing.count += 1;
      supplierMap.set(p.supplierId, existing);
    });

    // 3. Expenses Data
    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      include: { category: true },
    });

    const categoryExpenseMap = new Map<string, { name: string; amount: number }>();
    expenses.forEach((e) => {
      const existing = categoryExpenseMap.get(e.categoryId) || { name: e.category.name, amount: 0 };
      existing.amount += e.amount;
      categoryExpenseMap.set(e.categoryId, existing);
    });

    // 4. Financial Calculations
    const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      metrics: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
      },
      customerBreakdown: Array.from(customerMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
      productBreakdown: Array.from(productSalesMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
      supplierBreakdown: Array.from(supplierMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
      expenseBreakdown: Array.from(categoryExpenseMap.values()).sort((a, b) => b.amount - a.amount),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
