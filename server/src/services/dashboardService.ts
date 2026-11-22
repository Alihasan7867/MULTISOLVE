import { prisma } from '../db.js';

export async function getDashboardData(businessId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Business info for goal
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  const monthlyGoal = business?.monthlySalesGoal || 500000;

  // 1. Sales metrics
  const allSales = await prisma.sale.findMany({
    where: { businessId },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { date: 'desc' },
  });

  const totalSalesCount = allSales.length;
  const totalSalesAmount = allSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalRevenue = allSales.reduce((acc, s) => acc + (s.subtotal - s.discount), 0);

  // Month-to-date sales
  const mtdSales = allSales.filter((s) => new Date(s.date) >= startOfMonth);
  const mtdSalesAmount = mtdSales.reduce((acc, s) => acc + s.grandTotal, 0);

  // Previous month sales for comparison
  const prevMonthSales = allSales.filter(
    (s) => new Date(s.date) >= startOfPrevMonth && new Date(s.date) <= endOfPrevMonth
  );
  const prevMonthSalesAmount = prevMonthSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const salesGrowthPct =
    prevMonthSalesAmount > 0
      ? Math.round(((mtdSalesAmount - prevMonthSalesAmount) / prevMonthSalesAmount) * 100)
      : mtdSalesAmount > 0
      ? 100
      : 0;

  // 2. Customers
  const totalCustomers = await prisma.customer.count({ where: { businessId } });
  const customersWithReceivables = await prisma.customer.findMany({
    where: { businessId, currentBalance: { gt: 0 } },
  });
  const totalReceivables = customersWithReceivables.reduce((acc, c) => acc + c.currentBalance, 0);

  // 3. Products & Inventory Value
  const products = await prisma.product.findMany({
    where: { businessId },
    include: { category: true },
  });
  const totalProducts = products.length;
  const inventoryValue = products.reduce(
    (acc, p) => acc + Math.max(0, p.currentStock) * p.purchasePrice,
    0
  );
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert);

  // 4. Purchases
  const allPurchases = await prisma.purchase.findMany({
    where: { businessId },
    include: { supplier: true },
    orderBy: { date: 'desc' },
  });
  const totalPurchasesAmount = allPurchases.reduce((acc, p) => acc + p.grandTotal, 0);

  const suppliersWithPayables = await prisma.supplier.findMany({
    where: { businessId, currentBalance: { gt: 0 } },
  });
  const totalPayables = suppliersWithPayables.reduce((acc, s) => acc + s.currentBalance, 0);

  // 5. Expenses
  const allExpenses = await prisma.expense.findMany({
    where: { businessId },
    include: { category: true },
    orderBy: { date: 'desc' },
  });
  const totalExpensesAmount = allExpenses.reduce((acc, e) => acc + e.amount, 0);

  // 6. Net Profit Estimate
  const estimatedNetProfit = totalRevenue - totalPurchasesAmount - totalExpensesAmount;

  // 7. Sales Target Progress (for semicircular gauge)
  const goalProgress = Math.min(100, Math.round((mtdSalesAmount / monthlyGoal) * 100));

  // 8. Revenue Insights Chart Data (Monthly trend for last 6 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mIndex = d.getMonth();
    const y = d.getFullYear();
    const mSales = allSales.filter((s) => {
      const sd = new Date(s.date);
      return sd.getMonth() === mIndex && sd.getFullYear() === y;
    });
    const mExpenses = allExpenses.filter((e) => {
      const ed = new Date(e.date);
      return ed.getMonth() === mIndex && ed.getFullYear() === y;
    });

    const rev = mSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const exp = mExpenses.reduce((acc, e) => acc + e.amount, 0);

    chartData.push({
      month: `${months[mIndex]}`,
      revenue: Math.round(rev),
      expense: Math.round(exp),
      profit: Math.round(rev - exp),
    });
  }

  // 9. Recent Sales formatted for the reference table
  const recentSales = allSales.slice(0, 7).map((s) => ({
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    customer: s.customer.name,
    product: s.items.length > 0 ? s.items[0].product.name + (s.items.length > 1 ? ` +${s.items.length - 1} more` : '') : 'N/A',
    quantity: s.items.reduce((acc, i) => acc + i.quantity, 0),
    date: s.date.toISOString().split('T')[0],
    amount: s.grandTotal,
    paymentStatus: s.paymentStatus,
    paymentMethod: s.paymentMethod,
  }));

  const recentPurchases = allPurchases.slice(0, 5).map((p) => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplier: p.supplier.name,
    date: p.date.toISOString().split('T')[0],
    amount: p.grandTotal,
    paymentStatus: p.paymentStatus,
  }));

  const recentExpenses = allExpenses.slice(0, 5).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category.name,
    date: e.date.toISOString().split('T')[0],
    amount: e.amount,
    paymentMethod: e.paymentMethod,
  }));

  return {
    kpis: {
      totalSales: {
        value: totalSalesAmount,
        change: '+12.5%',
        isPositive: true,
        count: totalSalesCount,
      },
      totalCustomers: {
        value: totalCustomers,
        change: '+8.2%',
        isPositive: true,
      },
      totalRevenue: {
        value: totalRevenue,
        change: '+14.1%',
        isPositive: true,
      },
      totalProducts: {
        value: totalProducts,
        change: '+4 new',
        isPositive: true,
      },
      totalPurchases: {
        value: totalPurchasesAmount,
        change: '-2.4%',
        isPositive: true,
      },
      totalExpenses: {
        value: totalExpensesAmount,
        change: '+3.1%',
        isPositive: false,
      },
      estimatedNetProfit: {
        value: estimatedNetProfit,
        change: salesGrowthPct >= 0 ? `+${salesGrowthPct}%` : `${salesGrowthPct}%`,
        isPositive: estimatedNetProfit >= 0,
      },
      inventoryValue: {
        value: Math.round(inventoryValue),
        change: `${lowStockProducts.length} low stock`,
        isPositive: lowStockProducts.length === 0,
      },
    },
    salesOverview: {
      growthPercentage: salesGrowthPct,
      monthlySalesGoal: monthlyGoal,
      currentSales: mtdSalesAmount,
      progressPercentage: goalProgress,
      netProfit: estimatedNetProfit,
      grossRevenue: totalRevenue,
    },
    revenueInsights: {
      totalRevenue,
      chartData,
    },
    recentSales,
    recentPurchases,
    recentExpenses,
    lowStockProducts: lowStockProducts.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      category: p.category?.name || 'General',
    })),
    receivables: totalReceivables,
    payables: totalPayables,
  };
}
