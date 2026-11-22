import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get categories
router.get('/categories', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }
    const categories = await prisma.productCategory.findMany({
      where: { businessId },
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create category
router.post('/categories', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    const { name, description } = req.body;
    if (!businessId || !name) {
      res.status(400).json({ error: 'Business ID and category name are required' });
      return;
    }
    const category = await prisma.productCategory.create({
      data: { businessId, name, description },
    });
    res.status(201).json({ category });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List products
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const { search, categoryId, lowStock } = req.query;

    const where: any = { businessId, isActive: true };

    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { hsnCode: { contains: q } },
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

    let result = products;
    if (lowStock === 'true') {
      result = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    res.json({ products: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      res.status(400).json({ error: 'Business ID required' });
      return;
    }

    const {
      name,
      sku,
      categoryId,
      description,
      purchasePrice,
      sellingPrice,
      initialStock = 0,
      minStockAlert = 5,
      unit = 'PCS',
      hsnCode,
      taxRate = 18,
    } = req.body;

    if (!name || !sku || purchasePrice === undefined || sellingPrice === undefined) {
      res.status(400).json({ error: 'Name, SKU, purchase price, and selling price are required' });
      return;
    }

    // Check duplicate SKU
    const existing = await prisma.product.findUnique({
      where: {
        businessId_sku: {
          businessId,
          sku,
        },
      },
    });

    if (existing) {
      res.status(400).json({ error: `Product SKU "${sku}" already exists in this business` });
      return;
    }

    const initStockNum = parseFloat(initialStock) || 0;

    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          businessId,
          categoryId: categoryId || undefined,
          name,
          sku,
          description,
          purchasePrice: parseFloat(purchasePrice),
          sellingPrice: parseFloat(sellingPrice),
          initialStock: initStockNum,
          currentStock: initStockNum,
          minStockAlert: parseFloat(minStockAlert) || 5,
          unit,
          hsnCode,
          taxRate: parseFloat(taxRate) || 18,
        },
        include: { category: true },
      });

      // Record initial inventory movement if initial stock > 0
      if (initStockNum > 0) {
        await tx.inventoryMovement.create({
          data: {
            businessId,
            productId: prod.id,
            type: 'ADJUSTMENT',
            quantity: initStockNum,
            previousStock: 0,
            updatedStock: initStockNum,
            referenceType: 'INITIAL_STOCK',
            reason: 'Opening stock entry',
          },
        });
      }

      return prod;
    });

    res.status(201).json({ product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = req.businessId;

    const {
      name,
      sku,
      categoryId,
      description,
      purchasePrice,
      sellingPrice,
      minStockAlert,
      unit,
      hsnCode,
      taxRate,
    } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        categoryId: categoryId || undefined,
        description,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        minStockAlert: minStockAlert !== undefined ? parseFloat(minStockAlert) : undefined,
        unit,
        hsnCode,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : undefined,
      },
      include: { category: true },
    });

    res.json({ product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete or archive product
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if sales or purchases reference this product
    const salesCount = await prisma.saleItem.count({ where: { productId: id } });
    const purCount = await prisma.purchaseItem.count({ where: { productId: id } });

    if (salesCount > 0 || purCount > 0) {
      // Soft-delete / archive
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      res.json({ message: 'Product archived successfully (preserved for historical accounting)' });
    } else {
      await prisma.inventoryMovement.deleteMany({ where: { productId: id } });
      await prisma.product.delete({ where: { id } });
      res.json({ message: 'Product deleted permanently' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
