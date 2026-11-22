import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Current stock overview with inventory valuation
router.get('/stock', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { search, categoryId, lowStockOnly } = req.query;
    const where: any = { businessId, isActive: true };

    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ];
    }

    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    let filtered = products;
    if (lowStockOnly === 'true') {
      filtered = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    const totalValuation = filtered.reduce(
      (sum, p) => sum + Math.max(0, p.currentStock) * p.purchasePrice,
      0
    );

    res.json({
      products: filtered,
      totalValuation: Math.round(totalValuation * 100) / 100,
      totalItems: filtered.length,
      lowStockCount: products.filter((p) => p.currentStock <= p.minStockAlert).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stock movement audit trail
router.get('/movements', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { productId, type } = req.query;
    const where: any = { businessId };

    if (productId) {
      where.productId = String(productId);
    }
    if (type) {
      where.type = String(type);
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: { product: true },
      orderBy: { date: 'desc' },
      take: 100,
    });

    res.json({ movements });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual stock adjustment with audit trail
router.post('/adjust', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    const { productId, adjustmentType, quantity, reason } = req.body;

    if (!businessId || !productId || !quantity || !reason) {
      res.status(400).json({ error: 'Product ID, quantity, and reason are required' });
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive number' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, businessId },
      });

      if (!product) {
        throw new Error('Product not found in this business');
      }

      const prevStock = product.currentStock;
      const isAdd = adjustmentType === 'ADD';
      const delta = isAdd ? qty : -qty;
      const updatedStock = prevStock + delta;

      if (updatedStock < 0) {
        throw new Error(
          `Cannot reduce stock below zero. Current stock is ${prevStock}, attempted reduction: ${qty}`
        );
      }

      await tx.product.update({
        where: { id: product.id },
        data: { currentStock: updatedStock },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          businessId,
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: delta,
          previousStock: prevStock,
          updatedStock,
          referenceType: 'MANUAL_CORRECTION',
          reason: `${reason} (Adjusted by ${req.user?.name || 'Admin'})`,
        },
      });

      await tx.auditLog.create({
        data: {
          businessId,
          userId: req.user?.id,
          action: 'STOCK_ADJUSTMENT',
          entity: 'Product',
          entityId: product.id,
          details: JSON.stringify({
            product: product.name,
            previousStock: prevStock,
            updatedStock,
            reason,
          }),
        },
      });

      return { product, movement };
    });

    res.json({
      message: 'Stock adjusted successfully',
      currentStock: updated.product.currentStock,
      movement: updated.movement,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
