import { prisma } from './db.js';
import { createSale } from './services/salesService.js';
import { createPurchase } from './services/purchaseService.js';
import { initializeBusinessAccounts } from './services/accountingService.js';
import { initializeExpenseCategories, createExpense } from './services/expenseService.js';
import { getDashboardData } from './services/dashboardService.js';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('====================================================');
  console.log('   MULTISOLVE ECOSYSTEM INTEGRATION TEST SUITE      ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: USER AUTHENTICATION
    // ------------------------------------------------------------------------
    console.log('--- TEST 1: USER AUTHENTICATION ---');
    const testEmail = `tester_${Date.now()}@multisolve.com`;
    const passwordHash = await bcrypt.hash('SecretPass123!', 10);
    const testUser = await prisma.user.create({
      data: {
        name: 'Quality Assurance Engineer',
        email: testEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    assert(!!testUser.id, 'User account registered and persisted in database');

    const verifyPass = await bcrypt.compare('SecretPass123!', testUser.passwordHash);
    assert(verifyPass, 'Password successfully validated against bcrypt hash');

    const wrongPass = await bcrypt.compare('WrongPassword', testUser.passwordHash);
    assert(!wrongPass, 'Invalid password rejected');

    // Create Business for testing
    const testBiz = await prisma.business.create({
      data: {
        name: 'QA Test Corp',
        type: 'Wholesale Electronics',
        ownerName: testUser.name,
        email: testUser.email,
        phone: '9876543210',
        address: 'BKC Tech Hub',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400051',
        gstin: '27AABCQ1234T1Z1',
      },
    });
    await prisma.businessMember.create({
      data: { userId: testUser.id, businessId: testBiz.id, role: 'OWNER' },
    });
    await initializeBusinessAccounts(testBiz.id);
    await initializeExpenseCategories(testBiz.id);
    assert(!!testBiz.id, 'Business entity created and linked to user');

    // ------------------------------------------------------------------------
    // TEST 2: PRODUCT MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 2: PRODUCT MANAGEMENT ---');
    const sku = `TEST-SKU-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        businessId: testBiz.id,
        name: 'Enterprise Precision Mouse',
        sku,
        purchasePrice: 1500,
        sellingPrice: 2800,
        initialStock: 20,
        currentStock: 20,
        minStockAlert: 5,
        unit: 'PCS',
        taxRate: 18,
      },
    });
    assert(product.currentStock === 20, 'Product created with Initial stock = 20');

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { sellingPrice: 2950 },
    });
    assert(updatedProduct.sellingPrice === 2950, 'Product details updated and verified in database');

    // ------------------------------------------------------------------------
    // TEST 3: PURCHASE INTEGRATION (Stock +10 => 30)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 3: PURCHASE INTEGRATION ---');
    const supplier = await prisma.supplier.create({
      data: {
        businessId: testBiz.id,
        name: 'Reliable Components Dist',
        phone: '9800011122',
        city: 'Mumbai',
      },
    });

    await createPurchase({
      businessId: testBiz.id,
      supplierId: supplier.id,
      purchaseNumber: `PUR-TEST-${Date.now()}`,
      items: [{ productId: product.id, quantity: 10, unitPrice: 1500, taxRate: 18 }],
      amountPaid: 17700,
      paymentMethod: 'BANK_TRANSFER',
      userId: testUser.id,
    });

    const stockAfterPurchase = await prisma.product.findUnique({ where: { id: product.id } });
    assert(stockAfterPurchase?.currentStock === 30, `Purchase of 10 units increased stock to 30 (Actual: ${stockAfterPurchase?.currentStock})`);

    const movementsAfterPur = await prisma.inventoryMovement.findMany({
      where: { productId: product.id, type: 'PURCHASE' },
    });
    assert(movementsAfterPur.length > 0 && movementsAfterPur[0].quantity === 10, 'Stock movement audit record recorded for purchase');

    // ------------------------------------------------------------------------
    // TEST 4: SALES INTEGRATION (Stock -5 => 25)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 4: SALES INTEGRATION ---');
    const customer = await prisma.customer.create({
      data: {
        businessId: testBiz.id,
        name: 'Alpha Corporate Client',
        phone: '9811122233',
        city: 'Mumbai',
      },
    });

    await createSale({
      businessId: testBiz.id,
      customerId: customer.id,
      invoiceNumber: `INV-TEST-${Date.now()}`,
      items: [{ productId: product.id, quantity: 5, unitPrice: 2950, taxRate: 18 }],
      amountReceived: 10000,
      paymentMethod: 'UPI',
      userId: testUser.id,
    });

    const stockAfterSale = await prisma.product.findUnique({ where: { id: product.id } });
    assert(stockAfterSale?.currentStock === 25, `Sale of 5 units reduced stock to 25 (Actual: ${stockAfterSale?.currentStock})`);

    const movementsAfterSale = await prisma.inventoryMovement.findMany({
      where: { productId: product.id, type: 'SALE' },
    });
    assert(movementsAfterSale.length > 0 && movementsAfterSale[0].quantity === -5, 'Stock-out movement logged automatically');

    const customerAfterSale = await prisma.customer.findUnique({ where: { id: customer.id } });
    assert(customerAfterSale!.currentBalance > 0, `Customer receivable balance updated (Balance: ₹${customerAfterSale?.currentBalance})`);

    // ------------------------------------------------------------------------
    // TEST 5: INSUFFICIENT STOCK REJECTION
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 5: INSUFFICIENT STOCK REJECTION ---');
    let rejectedAsExpected = false;
    let errorMessage = '';

    try {
      await createSale({
        businessId: testBiz.id,
        customerId: customer.id,
        invoiceNumber: `INV-TEST-FAIL-${Date.now()}`,
        items: [{ productId: product.id, quantity: 30, unitPrice: 2950, taxRate: 18 }], // 30 requested > 25 available
        amountReceived: 0,
        userId: testUser.id,
      });
    } catch (err: any) {
      rejectedAsExpected = true;
      errorMessage = err.message;
    }

    assert(rejectedAsExpected, `Attempt to sell 30 units with only 25 in stock was rejected! Error: "${errorMessage}"`);

    const stockAfterFailedSale = await prisma.product.findUnique({ where: { id: product.id } });
    assert(stockAfterFailedSale?.currentStock === 25, 'Stock remained untouched at 25 after failed transaction');

    // ------------------------------------------------------------------------
    // TEST 6: EXPENSE MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 6: EXPENSE MANAGEMENT ---');
    const expCat = await prisma.expenseCategory.create({
      data: { businessId: testBiz.id, name: 'Office Logistics' },
    });

    const expense = await createExpense({
      businessId: testBiz.id,
      categoryId: expCat.id,
      title: 'Packaging & Courier Service',
      amount: 4500,
      paymentMethod: 'UPI',
      userId: testUser.id,
    });
    assert(expense.amount === 4500, 'Expense record created with ₹4500');

    // ------------------------------------------------------------------------
    // TEST 7: DASHBOARD METRICS CALCULATION
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 7: DASHBOARD METRICS ---');
    const dashboard = await getDashboardData(testBiz.id);
    assert(dashboard.kpis.totalSales.value > 0, `Dashboard total sales computed: ₹${dashboard.kpis.totalSales.value}`);
    assert(dashboard.kpis.totalPurchases.value > 0, `Dashboard total purchases computed: ₹${dashboard.kpis.totalPurchases.value}`);
    assert(dashboard.kpis.totalExpenses.value >= 4500, `Dashboard total expenses computed: ₹${dashboard.kpis.totalExpenses.value}`);
    assert(dashboard.kpis.inventoryValue.value === 25 * 1500, `Inventory valuation accurate: ₹${dashboard.kpis.inventoryValue.value} (25 * ₹1500)`);
    assert(dashboard.recentSales.length > 0, 'Recent sales feed populated with live records');

    // ------------------------------------------------------------------------
    // TEST 8: MULTI-BUSINESS DATA ISOLATION
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 8: MULTI-BUSINESS DATA ISOLATION ---');
    const secondBiz = await prisma.business.create({
      data: {
        name: 'Isolated Second Business Ltd',
        type: 'Consultancy',
        ownerName: testUser.name,
        email: 'second@biz.com',
        phone: '9888877777',
        address: 'Aerocity',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110037',
      },
    });

    const secondBizProducts = await prisma.product.findMany({ where: { businessId: secondBiz.id } });
    const secondBizSales = await prisma.sale.findMany({ where: { businessId: secondBiz.id } });

    assert(secondBizProducts.length === 0, 'Second business has 0 products (Strict isolation from Business 1)');
    assert(secondBizSales.length === 0, 'Second business has 0 sales (No data leaks across business boundaries)');

    // ------------------------------------------------------------------------
    // TEST 9: DATA PERSISTENCE
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 9: DATA PERSISTENCE ---');
    const persistedBiz = await prisma.business.findUnique({ where: { id: testBiz.id } });
    const persistedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    assert(persistedBiz?.name === 'QA Test Corp', 'Business record persisted');
    assert(persistedProduct?.currentStock === 25, 'Product stock persisted at 25');

    console.log('\n====================================================');
    console.log(`TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (e) {
    console.error('Test execution error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
