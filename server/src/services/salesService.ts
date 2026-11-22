import { prisma } from '../db.js';
import { recordJournalEntry } from './accountingService.js';

export interface CreateSaleItemInput {
  productId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface CreateSaleInput {
  businessId: string;
  customerId: string;
  invoiceNumber?: string;
  date?: string | Date;
  dueDate?: string | Date;
  items: CreateSaleItemInput[];
  paymentMethod?: string;
  amountReceived?: number;
  isInterState?: boolean;
  notes?: string;
  userId?: string;
}

export async function createSale(input: CreateSaleInput) {
  const {
    businessId,
    customerId,
    items,
    paymentMethod = 'UPI',
    amountReceived = 0,
    isInterState = false,
    notes,
    userId,
  } = input;

  if (!items || items.length === 0) {
    throw new Error('At least one item is required to generate a sales invoice');
  }

  // Run in atomic Prisma transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Verify Customer
    const customer = await tx.customer.findFirst({
      where: { id: customerId, businessId },
    });
    if (!customer) {
      throw new Error('Customer not found for this business');
    }

    // 2. Fetch and Validate all Products & Stock
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, businessId },
    });

    const productMap = new Map<string, any>();
    products.forEach((p) => productMap.set(p.id, p));

    // Validate existence & stock
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Quantity for ${product.name} must be greater than zero`);
      }
      if (product.currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available stock: ${product.currentStock}, Requested: ${item.quantity}`
        );
      }
    }

    // 3. Calculate Financial Totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const calculatedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      const discount = item.discount || 0;
      const taxRate = item.taxRate !== undefined ? item.taxRate : product.taxRate || 18;
      const baseItemTotal = item.quantity * item.unitPrice;
      const netItemBeforeTax = Math.max(0, baseItemTotal - discount);
      const itemTax = (netItemBeforeTax * taxRate) / 100;
      const itemTotal = netItemBeforeTax + itemTax;

      subtotal += baseItemTotal;
      totalDiscount += discount;
      totalTax += itemTax;

      return {
        productId: item.productId,
        description: item.description || product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount,
        taxRate,
        taxAmount: Math.round(itemTax * 100) / 100,
        totalAmount: Math.round(itemTotal * 100) / 100,
      };
    });

    const netTaxable = Math.max(0, subtotal - totalDiscount);
    const grandTotal = Math.round((netTaxable + totalTax) * 100) / 100;
    const finalReceived = Math.min(amountReceived, grandTotal);
    const remainingBalance = Math.round((grandTotal - finalReceived) * 100) / 100;

    let paymentStatus = 'UNPAID';
    if (finalReceived >= grandTotal) {
      paymentStatus = 'PAID';
    } else if (finalReceived > 0) {
      paymentStatus = 'PARTIAL';
    }

    // Generate Invoice Number if not provided
    const saleCount = await tx.sale.count({ where: { businessId } });
    const invoiceNumber =
      input.invoiceNumber ||
      `INV-${new Date().getFullYear()}-${String(saleCount + 1).padStart(5, '0')}`;

    const saleDate = input.date ? new Date(input.date) : new Date();

    // 4. Create Sale Record
    const sale = await tx.sale.create({
      data: {
        businessId,
        customerId,
        invoiceNumber,
        date: saleDate,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        taxAmount: Math.round(totalTax * 100) / 100,
        grandTotal,
        amountReceived: finalReceived,
        remainingBalance,
        paymentStatus,
        paymentMethod,
        isInterState,
        notes,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    // 5. Update Inventory and Record Movements
    for (const item of items) {
      const product = productMap.get(item.productId);
      const prevStock = product.currentStock;
      const updatedStock = prevStock - item.quantity;

      // Update product current stock
      await tx.product.update({
        where: { id: product.id },
        data: { currentStock: updatedStock },
      });

      // Record stock movement
      await tx.inventoryMovement.create({
        data: {
          businessId,
          productId: product.id,
          type: 'SALE',
          quantity: -item.quantity,
          previousStock: prevStock,
          updatedStock,
          referenceType: 'SALE',
          referenceId: invoiceNumber,
          reason: `Sold in invoice ${invoiceNumber}`,
          date: saleDate,
        },
      });

      // Check low stock threshold alert
      if (updatedStock <= product.minStockAlert) {
        await tx.notification.create({
          data: {
            businessId,
            userId,
            title: 'Low Stock Alert',
            message: `Product "${product.name}" has reached low stock (${updatedStock} ${product.unit} remaining, alert threshold: ${product.minStockAlert}).`,
            type: 'WARNING',
          },
        });
      }
    }

    // 6. Update Customer Balance
    if (remainingBalance > 0) {
      await tx.customer.update({
        where: { id: customer.id },
        data: { currentBalance: { increment: remainingBalance } },
      });
    }

    // 7. Generate Balanced Double-Entry Journal Entry
    const journalLines: any[] = [];

    // Cash or Bank for amount received
    if (finalReceived > 0) {
      const paymentAccount = paymentMethod === 'CASH' ? '1010' : '1020';
      journalLines.push({
        accountCode: paymentAccount,
        type: 'DEBIT',
        amount: finalReceived,
        description: `Payment received for ${invoiceNumber} via ${paymentMethod}`,
      });
    }

    // Accounts Receivable for credit portion
    if (remainingBalance > 0) {
      journalLines.push({
        accountCode: '1030',
        type: 'DEBIT',
        amount: remainingBalance,
        description: `Receivable from ${customer.name} for ${invoiceNumber}`,
      });
    }

    // Sales Revenue (Credit)
    journalLines.push({
      accountCode: '4010',
      type: 'CREDIT',
      amount: netTaxable,
      description: `Revenue from ${invoiceNumber}`,
    });

    // GST Taxes (Credit)
    if (totalTax > 0) {
      if (isInterState) {
        journalLines.push({
          accountCode: '2022',
          type: 'CREDIT',
          amount: Math.round(totalTax * 100) / 100,
          description: `Output IGST on ${invoiceNumber}`,
        });
      } else {
        const halfTax = Math.round((totalTax / 2) * 100) / 100;
        const otherHalf = Math.round((totalTax - halfTax) * 100) / 100;
        journalLines.push({
          accountCode: '2020',
          type: 'CREDIT',
          amount: halfTax,
          description: `Output CGST on ${invoiceNumber}`,
        });
        journalLines.push({
          accountCode: '2021',
          type: 'CREDIT',
          amount: otherHalf,
          description: `Output SGST on ${invoiceNumber}`,
        });
      }
    }

    // Balance check adjustment if any floating point 0.01 discrepancy
    const debitSum = journalLines
      .filter((l) => l.type === 'DEBIT')
      .reduce((sum, l) => sum + l.amount, 0);
    const creditSum = journalLines
      .filter((l) => l.type === 'CREDIT')
      .reduce((sum, l) => sum + l.amount, 0);
    const diff = Math.round((debitSum - creditSum) * 100) / 100;

    if (diff !== 0 && Math.abs(diff) <= 0.05) {
      // Adjust revenue line by minor diff
      const revLine = journalLines.find((l) => l.accountCode === '4010');
      if (revLine) revLine.amount = Math.round((revLine.amount + diff) * 100) / 100;
    }

    await recordJournalEntry(tx, {
      businessId,
      date: saleDate,
      description: `Sales Invoice ${invoiceNumber} - ${customer.name}`,
      referenceType: 'SALE',
      referenceId: sale.id,
      lines: journalLines,
    });

    // 8. Record Tax Information for GST module
    const halfTax = Math.round((totalTax / 2) * 100) / 100;
    const otherHalf = Math.round((totalTax - halfTax) * 100) / 100;
    await tx.taxRecord.create({
      data: {
        businessId,
        referenceType: 'SALE',
        referenceId: invoiceNumber,
        date: saleDate,
        partyGstin: customer.gstin,
        partyName: customer.name,
        taxableAmount: netTaxable,
        cgstRate: isInterState ? 0 : 9,
        cgstAmount: isInterState ? 0 : halfTax,
        sgstRate: isInterState ? 0 : 9,
        sgstAmount: isInterState ? 0 : otherHalf,
        igstRate: isInterState ? 18 : 0,
        igstAmount: isInterState ? totalTax : 0,
        totalTax,
        isInterState,
      },
    });

    // 9. Audit Log
    await tx.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'CREATE_SALE_INVOICE',
        entity: 'Sale',
        entityId: sale.id,
        details: JSON.stringify({
          invoiceNumber,
          customer: customer.name,
          grandTotal,
          paymentStatus,
          itemCount: items.length,
        }),
      },
    });

    return sale;
  });
}
