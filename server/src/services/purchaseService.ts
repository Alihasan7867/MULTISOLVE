import { prisma } from '../db.js';
import { recordJournalEntry } from './accountingService.js';

export interface CreatePurchaseItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface CreatePurchaseInput {
  businessId: string;
  supplierId: string;
  purchaseNumber?: string;
  date?: string | Date;
  items: CreatePurchaseItemInput[];
  amountPaid?: number;
  paymentMethod?: string;
  isInterState?: boolean;
  notes?: string;
  userId?: string;
}

export async function createPurchase(input: CreatePurchaseInput) {
  const {
    businessId,
    supplierId,
    items,
    amountPaid = 0,
    paymentMethod = 'BANK_TRANSFER',
    isInterState = false,
    notes,
    userId,
  } = input;

  if (!items || items.length === 0) {
    throw new Error('At least one item is required to record a purchase');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Verify Supplier
    const supplier = await tx.supplier.findFirst({
      where: { id: supplierId, businessId },
    });
    if (!supplier) {
      throw new Error('Supplier not found for this business');
    }

    // 2. Fetch and Validate all Products
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, businessId },
    });

    const productMap = new Map<string, any>();
    products.forEach((p) => productMap.set(p.id, p));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Quantity for ${product.name} must be greater than zero`);
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
      const baseTotal = item.quantity * item.unitPrice;
      const netTotal = Math.max(0, baseTotal - discount);
      const taxAmount = (netTotal * taxRate) / 100;
      const totalAmount = netTotal + taxAmount;

      subtotal += baseTotal;
      totalDiscount += discount;
      totalTax += taxAmount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount,
        taxRate,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      };
    });

    const netTaxable = Math.max(0, subtotal - totalDiscount);
    const grandTotal = Math.round((netTaxable + totalTax) * 100) / 100;
    const finalPaid = Math.min(amountPaid, grandTotal);
    const remainingBalance = Math.round((grandTotal - finalPaid) * 100) / 100;

    let paymentStatus = 'UNPAID';
    if (finalPaid >= grandTotal) {
      paymentStatus = 'PAID';
    } else if (finalPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    const purchaseCount = await tx.purchase.count({ where: { businessId } });
    const purchaseNumber =
      input.purchaseNumber ||
      `PUR-${new Date().getFullYear()}-${String(purchaseCount + 1).padStart(5, '0')}`;

    const purchaseDate = input.date ? new Date(input.date) : new Date();

    // 4. Save Purchase
    const purchase = await tx.purchase.create({
      data: {
        businessId,
        supplierId,
        purchaseNumber,
        date: purchaseDate,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: Math.round(totalDiscount * 100) / 100,
        taxAmount: Math.round(totalTax * 100) / 100,
        grandTotal,
        amountPaid: finalPaid,
        paymentStatus,
        paymentMethod,
        notes,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        items: { include: { product: true } },
        supplier: true,
      },
    });

    // 5. Increase Product Stock and Log Movements
    for (const item of items) {
      const product = productMap.get(item.productId);
      const prevStock = product.currentStock;
      const updatedStock = prevStock + item.quantity;

      // Update current stock and update purchase price if provided
      await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: updatedStock,
          purchasePrice: item.unitPrice > 0 ? item.unitPrice : product.purchasePrice,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          businessId,
          productId: product.id,
          type: 'PURCHASE',
          quantity: item.quantity,
          previousStock: prevStock,
          updatedStock,
          referenceType: 'PURCHASE',
          referenceId: purchaseNumber,
          reason: `Purchased in PO ${purchaseNumber}`,
          date: purchaseDate,
        },
      });
    }

    // 6. Update Supplier Payable Balance
    if (remainingBalance > 0) {
      await tx.supplier.update({
        where: { id: supplier.id },
        data: { currentBalance: { increment: remainingBalance } },
      });
    }

    // 7. Generate Balanced Double-Entry Journal Entry
    const journalLines: any[] = [];

    // Debit Cost of Goods Sold / Purchases Inventory
    journalLines.push({
      accountCode: '5010',
      type: 'DEBIT',
      amount: netTaxable,
      description: `Purchase Inventory from ${purchaseNumber}`,
    });

    // Debit Input GST Credits
    if (totalTax > 0) {
      if (isInterState) {
        journalLines.push({
          accountCode: '1052',
          type: 'DEBIT',
          amount: Math.round(totalTax * 100) / 100,
          description: `Input IGST on ${purchaseNumber}`,
        });
      } else {
        const halfTax = Math.round((totalTax / 2) * 100) / 100;
        const otherHalf = Math.round((totalTax - halfTax) * 100) / 100;
        journalLines.push({
          accountCode: '1050',
          type: 'DEBIT',
          amount: halfTax,
          description: `Input CGST on ${purchaseNumber}`,
        });
        journalLines.push({
          accountCode: '1051',
          type: 'DEBIT',
          amount: otherHalf,
          description: `Input SGST on ${purchaseNumber}`,
        });
      }
    }

    // Credit Cash / Bank for amount paid
    if (finalPaid > 0) {
      const paymentAccount = paymentMethod === 'CASH' ? '1010' : '1020';
      journalLines.push({
        accountCode: paymentAccount,
        type: 'CREDIT',
        amount: finalPaid,
        description: `Payment for ${purchaseNumber} via ${paymentMethod}`,
      });
    }

    // Credit Accounts Payable for unpaid portion
    if (remainingBalance > 0) {
      journalLines.push({
        accountCode: '2010',
        type: 'CREDIT',
        amount: remainingBalance,
        description: `Payable to ${supplier.name} for ${purchaseNumber}`,
      });
    }

    // Discrepancy rounding adjustment
    const debitSum = journalLines
      .filter((l) => l.type === 'DEBIT')
      .reduce((sum, l) => sum + l.amount, 0);
    const creditSum = journalLines
      .filter((l) => l.type === 'CREDIT')
      .reduce((sum, l) => sum + l.amount, 0);
    const diff = Math.round((debitSum - creditSum) * 100) / 100;

    if (diff !== 0 && Math.abs(diff) <= 0.05) {
      const cogsLine = journalLines.find((l) => l.accountCode === '5010');
      if (cogsLine) cogsLine.amount = Math.round((cogsLine.amount - diff) * 100) / 100;
    }

    await recordJournalEntry(tx, {
      businessId,
      date: purchaseDate,
      description: `Purchase Invoice ${purchaseNumber} - ${supplier.name}`,
      referenceType: 'PURCHASE',
      referenceId: purchase.id,
      lines: journalLines,
    });

    // 8. Tax Record for Input GST
    const halfTax = Math.round((totalTax / 2) * 100) / 100;
    const otherHalf = Math.round((totalTax - halfTax) * 100) / 100;
    await tx.taxRecord.create({
      data: {
        businessId,
        referenceType: 'PURCHASE',
        referenceId: purchaseNumber,
        date: purchaseDate,
        partyGstin: supplier.gstin,
        partyName: supplier.name,
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
        action: 'CREATE_PURCHASE_BILL',
        entity: 'Purchase',
        entityId: purchase.id,
        details: JSON.stringify({
          purchaseNumber,
          supplier: supplier.name,
          grandTotal,
          paymentStatus,
          itemCount: items.length,
        }),
      },
    });

    return purchase;
  });
}
