import { prisma } from '../db.js';
import { recordJournalEntry } from './accountingService.js';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Salaries',
  'Transportation',
  'Marketing',
  'Maintenance',
  'Office supplies',
  'Miscellaneous',
];

export async function initializeExpenseCategories(businessId: string) {
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({
      where: {
        businessId_name: {
          businessId,
          name,
        },
      },
      update: {},
      create: {
        businessId,
        name,
      },
    });
  }
}

function getExpenseAccountCode(categoryName: string): string {
  const norm = categoryName.toLowerCase();
  if (norm.includes('rent')) return '5020';
  if (norm.includes('salar') || norm.includes('wage')) return '5030';
  if (norm.includes('elect') || norm.includes('power') || norm.includes('util')) return '5040';
  if (norm.includes('market') || norm.includes('ad')) return '5050';
  if (norm.includes('office') || norm.includes('suppl')) return '5060';
  if (norm.includes('maint') || norm.includes('repair')) return '5070';
  return '5080'; // Miscellaneous
}

export interface CreateExpenseInput {
  businessId: string;
  categoryId: string;
  title: string;
  amount: number;
  date?: string | Date;
  description?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  userId?: string;
}

export async function createExpense(input: CreateExpenseInput) {
  const {
    businessId,
    categoryId,
    title,
    amount,
    date = new Date(),
    description,
    paymentMethod = 'BANK_TRANSFER',
    referenceNumber,
    userId,
  } = input;

  if (amount <= 0) {
    throw new Error('Expense amount must be greater than zero');
  }

  return await prisma.$transaction(async (tx) => {
    const category = await tx.expenseCategory.findFirst({
      where: { id: categoryId, businessId },
    });
    if (!category) {
      throw new Error('Expense category not found');
    }

    const expenseDate = new Date(date);

    const expense = await tx.expense.create({
      data: {
        businessId,
        categoryId,
        title,
        amount,
        date: expenseDate,
        description,
        paymentMethod,
        referenceNumber,
      },
      include: {
        category: true,
      },
    });

    // Accounting Journal Entry
    const expenseAccountCode = getExpenseAccountCode(category.name);
    const paymentAccountCode = paymentMethod === 'CASH' ? '1010' : '1020';

    await recordJournalEntry(tx, {
      businessId,
      date: expenseDate,
      description: `Expense: ${title} (${category.name})`,
      referenceType: 'EXPENSE',
      referenceId: expense.id,
      lines: [
        {
          accountCode: expenseAccountCode,
          type: 'DEBIT',
          amount,
          description: `Expense for ${title}`,
        },
        {
          accountCode: paymentAccountCode,
          type: 'CREDIT',
          amount,
          description: `Paid via ${paymentMethod} for ${title}`,
        },
      ],
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'CREATE_EXPENSE',
        entity: 'Expense',
        entityId: expense.id,
        details: JSON.stringify({ title, amount, category: category.name }),
      },
    });

    return expense;
  });
}
