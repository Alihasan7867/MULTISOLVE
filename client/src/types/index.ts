export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  gstin?: string;
  currency: string;
  monthlySalesGoal: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId?: string;
  category?: ProductCategory;
  name: string;
  sku: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  initialStock: number;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  hsnCode?: string;
  taxRate: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  customerType: string;
  openingBalance: number;
  currentBalance: number;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  openingBalance: number;
  currentBalance: number;
}

export interface SaleItem {
  id?: string;
  productId: string;
  product?: Product;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Sale {
  id: string;
  businessId: string;
  customerId: string;
  customer: Customer;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  grandTotal: number;
  amountReceived: number;
  remainingBalance: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod: string;
  isInterState: boolean;
  notes?: string;
  items: SaleItem[];
}

export interface PurchaseItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplierId: string;
  supplier: Supplier;
  purchaseNumber: string;
  date: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod: string;
  notes?: string;
  items: PurchaseItem[];
}

export interface InventoryMovement {
  id: string;
  productId: string;
  product: Product;
  type: string;
  quantity: number;
  previousStock: number;
  updatedStock: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  date: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  description?: string;
  paymentMethod: string;
  referenceNumber?: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
  isDefault: boolean;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  lines: {
    id: string;
    account: Account;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description?: string;
  }[];
}

export interface TaxRecord {
  id: string;
  referenceType: string;
  referenceId: string;
  date: string;
  partyGstin?: string;
  partyName?: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  isInterState: boolean;
}

export interface PersonalTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string;
  description?: string;
  paymentMethod: string;
  savingsBucket?: string;
}

export interface DashboardData {
  kpis: {
    totalSales: { value: number; change: string; isPositive: boolean; count: number };
    totalCustomers: { value: number; change: string; isPositive: boolean };
    totalRevenue: { value: number; change: string; isPositive: boolean };
    totalProducts: { value: number; change: string; isPositive: boolean };
    totalPurchases: { value: number; change: string; isPositive: boolean };
    totalExpenses: { value: number; change: string; isPositive: boolean };
    estimatedNetProfit: { value: number; change: string; isPositive: boolean };
    inventoryValue: { value: number; change: string; isPositive: boolean };
  };
  salesOverview: {
    growthPercentage: number;
    monthlySalesGoal: number;
    currentSales: number;
    progressPercentage: number;
    netProfit: number;
    grossRevenue: number;
  };
  revenueInsights: {
    totalRevenue: number;
    chartData: { month: string; revenue: number; expense: number; profit: number }[];
  };
  recentSales: {
    id: string;
    invoiceNumber: string;
    customer: string;
    product: string;
    quantity: number;
    date: string;
    amount: number;
    paymentStatus: string;
    paymentMethod: string;
  }[];
  recentPurchases: {
    id: string;
    purchaseNumber: string;
    supplier: string;
    date: string;
    amount: number;
    paymentStatus: string;
  }[];
  recentExpenses: {
    id: string;
    title: string;
    category: string;
    date: string;
    amount: number;
    paymentMethod: string;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockAlert: number;
    unit: string;
    category: string;
  }[];
  receivables: number;
  payables: number;
}
