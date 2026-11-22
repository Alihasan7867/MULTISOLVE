import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { initializeBusinessAccounts } from '../src/services/accountingService.js';
import { initializeExpenseCategories, createExpense } from '../src/services/expenseService.js';
import { createSale } from '../src/services/salesService.js';
import { createPurchase } from '../src/services/purchaseService.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding MULTISOLVE Enterprise Database ---');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.account.deleteMany();
  await prisma.taxRecord.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.personalBudget.deleteMany();
  await prisma.personalTransaction.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Master Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@multisolve.com',
      passwordHash,
      name: 'Syed Ali Hasan',
      phone: '+91 98765 43210',
      role: 'ADMIN',
    },
  });
  console.log(`User created: ${user.name} (${user.email})`);

  // 2. Create Primary Business
  const business = await prisma.business.create({
    data: {
      name: 'MULTISOLVE Enterprises',
      type: 'IT & Hardware Distribution',
      ownerName: user.name,
      email: 'contact@multisolve.com',
      phone: '+91 98765 43210',
      address: 'Suite 402, High-Tech Park, Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400051',
      country: 'India',
      gstin: '27AABCM8812E1ZK',
      currency: 'INR',
      monthlySalesGoal: 800000,
    },
  });

  // Link Membership
  await prisma.businessMember.create({
    data: {
      userId: user.id,
      businessId: business.id,
      role: 'OWNER',
    },
  });

  // Create Secondary Business (for Multi-Business verification)
  const business2 = await prisma.business.create({
    data: {
      name: 'Apex Global Logistics',
      type: 'Supply Chain & Freight',
      ownerName: user.name,
      email: 'operations@apexlogistics.com',
      phone: '+91 91234 56789',
      address: 'Tower B, Aerocity',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110037',
      country: 'India',
      gstin: '07AAACR9981K1ZL',
      currency: 'INR',
      monthlySalesGoal: 500000,
    },
  });
  await prisma.businessMember.create({
    data: {
      userId: user.id,
      businessId: business2.id,
      role: 'OWNER',
    },
  });

  // Initialize Default Chart of Accounts & Expense Categories
  await initializeBusinessAccounts(business.id);
  await initializeExpenseCategories(business.id);
  await initializeBusinessAccounts(business2.id);
  await initializeExpenseCategories(business2.id);

  console.log('Businesses & Chart of Accounts initialized');

  // 3. Create Categories for Primary Business
  const catHardware = await prisma.productCategory.create({
    data: { businessId: business.id, name: 'Computer Hardware', description: 'Laptops, desktops & components' },
  });
  const catPeripherals = await prisma.productCategory.create({
    data: { businessId: business.id, name: 'Peripherals', description: 'Keyboards, mice & monitors' },
  });
  const catFurniture = await prisma.productCategory.create({
    data: { businessId: business.id, name: 'Office Furniture', description: 'Chairs & ergonomic desks' },
  });

  // 4. Create Products
  const p1 = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: catHardware.id,
      name: 'MacBook Pro 16" M3 Max',
      sku: 'APP-MBP16-M3',
      description: 'Apple M3 Max 36GB RAM 1TB SSD Space Black',
      purchasePrice: 195000,
      sellingPrice: 249900,
      initialStock: 20,
      currentStock: 20,
      minStockAlert: 5,
      unit: 'PCS',
      hsnCode: '84713010',
      taxRate: 18,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: catPeripherals.id,
      name: 'Dell UltraSharp 32" 4K Monitor',
      sku: 'DEL-U3223QE',
      description: 'IPS Black Technology 4K USB-C Hub Monitor',
      purchasePrice: 52000,
      sellingPrice: 71500,
      initialStock: 30,
      currentStock: 30,
      minStockAlert: 8,
      unit: 'PCS',
      hsnCode: '85285200',
      taxRate: 18,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: catPeripherals.id,
      name: 'Keychron Q1 Pro Wireless Keyboard',
      sku: 'KEY-Q1P-RGB',
      description: 'Custom Mechanical QMK/VIA Hot-swappable',
      purchasePrice: 13500,
      sellingPrice: 18900,
      initialStock: 45,
      currentStock: 45,
      minStockAlert: 10,
      unit: 'PCS',
      hsnCode: '84716040',
      taxRate: 18,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: catPeripherals.id,
      name: 'Logitech MX Master 3S Mouse',
      sku: 'LOG-MXM3S-GR',
      description: 'Quiet Clicks 8K DPI Sensor Graphite',
      purchasePrice: 7200,
      sellingPrice: 9995,
      initialStock: 60,
      currentStock: 60,
      minStockAlert: 15,
      unit: 'PCS',
      hsnCode: '84716070',
      taxRate: 18,
    },
  });

  const p5 = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: catFurniture.id,
      name: 'Ergonomic Mesh Executive Chair',
      sku: 'FURN-ERGO-01',
      description: 'Adjustable Lumbar Support Breathable Mesh',
      purchasePrice: 16500,
      sellingPrice: 24900,
      initialStock: 25,
      currentStock: 25,
      minStockAlert: 6,
      unit: 'PCS',
      hsnCode: '94013000',
      taxRate: 18,
    },
  });

  const p6 = await prisma.product.create({
    data: {
      businessId: business.id,
      categoryId: catPeripherals.id,
      name: 'USB-C Multiport Hub 10-in-1',
      sku: 'ACC-HUB-10',
      description: 'Dual HDMI 100W PD Gigabit Ethernet',
      purchasePrice: 2400,
      sellingPrice: 4200,
      initialStock: 4, // Below min stock for alert!
      currentStock: 4,
      minStockAlert: 8,
      unit: 'PCS',
      hsnCode: '84718000',
      taxRate: 18,
    },
  });

  console.log('Products created with initial inventory');

  // 5. Create Customers
  const cust1 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'TechCorp Solutions Ltd',
      phone: '+91 98200 11223',
      email: 'procurement@techcorp.in',
      address: 'Floor 8, Lotus Grandeur, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstin: '27AABCT1234A1Z5',
      customerType: 'Corporate',
      openingBalance: 0,
      currentBalance: 0,
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Nexus Innovations Pvt Ltd',
      phone: '+91 97654 33445',
      email: 'billing@nexusinnovate.com',
      address: 'Phase 1, Hinjewadi IT Park',
      city: 'Pune',
      state: 'Maharashtra',
      gstin: '27AACCN9876B1Z8',
      customerType: 'Corporate',
      openingBalance: 0,
      currentBalance: 0,
    },
  });

  const cust3 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Zenith Global Services',
      phone: '+91 99112 55667',
      email: 'accounts@zenithglobal.com',
      address: 'Barakhamba Road, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      gstin: '07AAACZ4321C1Z2', // Inter-state!
      customerType: 'Wholesale',
      openingBalance: 0,
      currentBalance: 0,
    },
  });

  // 6. Create Suppliers
  const supp1 = await prisma.supplier.create({
    data: {
      businessId: business.id,
      name: 'Apple India Distribution',
      contactPerson: 'Vikram Mehta',
      phone: '+91 98334 77889',
      email: 'orders@appledistrib.in',
      address: 'Barton Centre, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      gstin: '29AABCA9000D1ZY',
    },
  });

  const supp2 = await prisma.supplier.create({
    data: {
      businessId: business.id,
      name: 'Dell Technologies India',
      contactPerson: 'Anjali Nair',
      phone: '+91 98450 66778',
      email: 'enterprise@dellpartner.in',
      address: 'Hitec City, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      gstin: '36AADCD8899E1ZX',
    },
  });

  console.log('Customers and Suppliers created');

  // 7. Record Real Purchases via purchaseService (increases stock, creates journal entry, updates payables)
  await createPurchase({
    businessId: business.id,
    supplierId: supp1.id,
    purchaseNumber: 'PUR-2026-00001',
    date: new Date(Date.now() - 25 * 86400000),
    items: [
      { productId: p1.id, quantity: 5, unitPrice: 195000, taxRate: 18 },
    ],
    amountPaid: 800000,
    paymentMethod: 'BANK_TRANSFER',
    isInterState: true,
    notes: 'Bulk seasonal replenishment of Apple MacBooks',
    userId: user.id,
  });

  await createPurchase({
    businessId: business.id,
    supplierId: supp2.id,
    purchaseNumber: 'PUR-2026-00002',
    date: new Date(Date.now() - 15 * 86400000),
    items: [
      { productId: p2.id, quantity: 10, unitPrice: 52000, taxRate: 18 },
      { productId: p3.id, quantity: 15, unitPrice: 13500, taxRate: 18 },
    ],
    amountPaid: 852550,
    paymentMethod: 'BANK_TRANSFER',
    isInterState: true,
    notes: 'Q4 Monitor and mechanical keyboard batch',
    userId: user.id,
  });

  console.log('Purchases recorded & inventory updated automatically');

  // 8. Record Real Sales Invoices via salesService (decrements stock, creates journal entry, updates receivables, records GST)
  await createSale({
    businessId: business.id,
    customerId: cust1.id,
    invoiceNumber: 'INV-2026-00001',
    date: new Date(Date.now() - 12 * 86400000),
    items: [
      { productId: p1.id, quantity: 2, unitPrice: 249900, discount: 5000, taxRate: 18 },
      { productId: p4.id, quantity: 2, unitPrice: 9995, discount: 0, taxRate: 18 },
    ],
    amountReceived: 607448, // Paid in full
    paymentMethod: 'BANK_TRANSFER',
    isInterState: false,
    notes: 'Corporate developer workstations delivery',
    userId: user.id,
  });

  await createSale({
    businessId: business.id,
    customerId: cust2.id,
    invoiceNumber: 'INV-2026-00002',
    date: new Date(Date.now() - 6 * 86400000),
    items: [
      { productId: p2.id, quantity: 4, unitPrice: 71500, discount: 4000, taxRate: 18 },
      { productId: p3.id, quantity: 4, unitPrice: 18900, discount: 0, taxRate: 18 },
      { productId: p5.id, quantity: 4, unitPrice: 24900, discount: 2000, taxRate: 18 },
    ],
    amountReceived: 350000, // Partial payment
    paymentMethod: 'UPI',
    isInterState: false,
    notes: 'Engineering team setup - 30 days credit terms',
    userId: user.id,
  });

  await createSale({
    businessId: business.id,
    customerId: cust3.id,
    invoiceNumber: 'INV-2026-00003',
    date: new Date(Date.now() - 2 * 86400000),
    items: [
      { productId: p1.id, quantity: 1, unitPrice: 249900, discount: 0, taxRate: 18 },
      { productId: p2.id, quantity: 2, unitPrice: 71500, discount: 0, taxRate: 18 },
    ],
    amountReceived: 463622, // Paid in full
    paymentMethod: 'BANK_TRANSFER',
    isInterState: true, // Inter-state IGST
    notes: 'New Delhi regional branch procurement',
    userId: user.id,
  });

  console.log('Sales recorded & ecosystem automatically updated');

  // 9. Record Real Expenses via expenseService
  const expCats = await prisma.expenseCategory.findMany({ where: { businessId: business.id } });
  const rentCat = expCats.find((c) => c.name.toLowerCase().includes('rent')) || expCats[0];
  const salCat = expCats.find((c) => c.name.toLowerCase().includes('salari')) || expCats[0];
  const elecCat = expCats.find((c) => c.name.toLowerCase().includes('elect')) || expCats[0];
  const mktCat = expCats.find((c) => c.name.toLowerCase().includes('market')) || expCats[0];

  await createExpense({
    businessId: business.id,
    categoryId: rentCat.id,
    title: 'BKC Office Space Lease (November 2026)',
    amount: 65000,
    date: new Date(Date.now() - 18 * 86400000),
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'TXN-RENT-NOV26',
    userId: user.id,
  });

  await createExpense({
    businessId: business.id,
    categoryId: salCat.id,
    title: 'Staff Salaries & Operations Payroll',
    amount: 145000,
    date: new Date(Date.now() - 20 * 86400000),
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'NEFT-SAL-004',
    userId: user.id,
  });

  await createExpense({
    businessId: business.id,
    categoryId: elecCat.id,
    title: 'High-Tech Park Power & High-Speed Internet',
    amount: 14200,
    date: new Date(Date.now() - 8 * 86400000),
    paymentMethod: 'UPI',
    referenceNumber: 'UPI-BESP-7761',
    userId: user.id,
  });

  await createExpense({
    businessId: business.id,
    categoryId: mktCat.id,
    title: 'Google Ads & LinkedIn B2B Hardware Promotion',
    amount: 28500,
    date: new Date(Date.now() - 4 * 86400000),
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'CARD-ADS-998',
    userId: user.id,
  });

  // 10. Personal Finance Seed Records
  await prisma.personalTransaction.createMany({
    data: [
      {
        userId: user.id,
        type: 'INCOME',
        category: 'Business Dividend / Salary',
        amount: 120000,
        date: new Date(Date.now() - 20 * 86400000),
        description: 'Monthly executive remuneration',
        paymentMethod: 'BANK_TRANSFER',
        savingsBucket: 'Primary Wealth',
      },
      {
        userId: user.id,
        type: 'EXPENSE',
        category: 'Housing & Utilities',
        amount: 32000,
        date: new Date(Date.now() - 17 * 86400000),
        description: 'Apartment rent & maintenance',
        paymentMethod: 'BANK_TRANSFER',
      },
      {
        userId: user.id,
        type: 'EXPENSE',
        category: 'Investment & Mutual Funds',
        amount: 25000,
        date: new Date(Date.now() - 14 * 86400000),
        description: 'Monthly SIP in Nifty 50 Index',
        paymentMethod: 'UPI',
        savingsBucket: 'Long-term Growth',
      },
      {
        userId: user.id,
        type: 'EXPENSE',
        category: 'Groceries & Dining',
        amount: 14500,
        date: new Date(Date.now() - 5 * 86400000),
        description: 'Supermarket and family weekend dinner',
        paymentMethod: 'UPI',
      },
    ],
  });

  await prisma.personalBudget.create({
    data: {
      userId: user.id,
      category: 'Housing & Utilities',
      monthlyLimit: 35000,
      monthYear: '2026-11',
    },
  });

  await prisma.personalBudget.create({
    data: {
      userId: user.id,
      category: 'Groceries & Dining',
      monthlyLimit: 20000,
      monthYear: '2026-11',
    },
  });

  console.log('✅ MULTISOLVE Enterprise Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
