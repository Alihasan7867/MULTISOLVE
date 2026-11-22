import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { initializeBusinessAccounts } from '../services/accountingService.js';
import { initializeExpenseCategories } from '../services/expenseService.js';

const router = Router();

// Register new user & initial business
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      phone,
      businessName,
      businessType,
      city,
      state,
      address,
      pinCode,
      gstin,
    } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          role: 'ADMIN',
        },
      });

      // Create initial business
      const business = await tx.business.create({
        data: {
          name: businessName || `${name}'s Enterprise`,
          type: businessType || 'Retail',
          ownerName: name,
          email,
          phone: phone || '9999999999',
          address: address || 'Main Road',
          city: city || 'Mumbai',
          state: state || 'Maharashtra',
          pinCode: pinCode || '400001',
          gstin: gstin || undefined,
        },
      });

      // Link member as OWNER
      await tx.businessMember.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: 'OWNER',
        },
      });

      return { user, business };
    });

    // Initialize default accounts and categories for business
    await initializeBusinessAccounts(result.business.id);
    await initializeExpenseCategories(result.business.id);

    const token = generateToken(result.user);

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      business: result.business,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { business: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    const businesses = user.memberships.map((m) => m.business);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      businesses,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
