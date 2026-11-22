import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GST Overview Summary
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { fromDate, toDate } = req.query;
    const where: any = { businessId };

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(String(fromDate));
      if (toDate) where.date.lte = new Date(String(toDate));
    }

    const records = await prisma.taxRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const salesTaxRecords = records.filter((r) => r.referenceType === 'SALE');
    const purchaseTaxRecords = records.filter((r) => r.referenceType === 'PURCHASE');

    // Output GST (collected on sales)
    const outputTaxable = salesTaxRecords.reduce((s, r) => s + r.taxableAmount, 0);
    const outputCGST = salesTaxRecords.reduce((s, r) => s + r.cgstAmount, 0);
    const outputSGST = salesTaxRecords.reduce((s, r) => s + r.sgstAmount, 0);
    const outputIGST = salesTaxRecords.reduce((s, r) => s + r.igstAmount, 0);
    const totalOutputGST = salesTaxRecords.reduce((s, r) => s + r.totalTax, 0);

    // Input GST (paid on purchases, available as ITC)
    const inputTaxable = purchaseTaxRecords.reduce((s, r) => s + r.taxableAmount, 0);
    const inputCGST = purchaseTaxRecords.reduce((s, r) => s + r.cgstAmount, 0);
    const inputSGST = purchaseTaxRecords.reduce((s, r) => s + r.sgstAmount, 0);
    const inputIGST = purchaseTaxRecords.reduce((s, r) => s + r.igstAmount, 0);
    const totalInputGST = purchaseTaxRecords.reduce((s, r) => s + r.totalTax, 0);

    // Net GST liability
    const netGstPayable = Math.max(0, totalOutputGST - totalInputGST);
    const excessItcCarriedForward = Math.max(0, totalInputGST - totalOutputGST);

    res.json({
      summary: {
        output: {
          taxableAmount: Math.round(outputTaxable * 100) / 100,
          cgst: Math.round(outputCGST * 100) / 100,
          sgst: Math.round(outputSGST * 100) / 100,
          igst: Math.round(outputIGST * 100) / 100,
          total: Math.round(totalOutputGST * 100) / 100,
        },
        input: {
          taxableAmount: Math.round(inputTaxable * 100) / 100,
          cgst: Math.round(inputCGST * 100) / 100,
          sgst: Math.round(inputSGST * 100) / 100,
          igst: Math.round(inputIGST * 100) / 100,
          total: Math.round(totalInputGST * 100) / 100,
        },
        netGstPayable: Math.round(netGstPayable * 100) / 100,
        excessItcCarriedForward: Math.round(excessItcCarriedForward * 100) / 100,
      },
      records,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GSTR-1 Outward Supplies Preparation Report
router.get('/gstr1', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const sales = await prisma.sale.findMany({
      where: { businessId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
    });

    const b2bInvoices = sales.filter((s) => s.customer.gstin && s.customer.gstin.trim() !== '');
    const b2cInvoices = sales.filter((s) => !s.customer.gstin || s.customer.gstin.trim() === '');

    res.json({
      b2bInvoices,
      b2cInvoices,
      totalB2BAmount: b2bInvoices.reduce((acc, s) => acc + s.grandTotal, 0),
      totalB2CAmount: b2cInvoices.reduce((acc, s) => acc + s.grandTotal, 0),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
