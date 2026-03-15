import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/index.js';
import { loans, repayments } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

const loansRouter = new Hono();

// Add missing columns to database if they don't exist
async function ensureLoanColumns() {
  console.log('Checking loan table columns...');
  
  // Try to add the columns - if they exist, this will fail gracefully
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN disbursed_at timestamp`);
    console.log('Added disbursed_at column');
  } catch (error) {
    console.log('disbursed_at column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN disbursement_method varchar(50)`);
    console.log('Added disbursement_method column');
  } catch (error) {
    console.log('disbursement_method column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN disbursement_reference varchar(100)`);
    console.log('Added disbursement_reference column');
  } catch (error) {
    console.log('disbursement_reference column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN repaid_at timestamp`);
    console.log('Added repaid_at column');
  } catch (error) {
    console.log('repaid_at column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN repayment_amount numeric(12,2)`);
    console.log('Added repayment_amount column');
  } catch (error) {
    console.log('repayment_amount column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN repayment_method varchar(50)`);
    console.log('Added repayment_method column');
  } catch (error) {
    console.log('repayment_method column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN repayment_reference varchar(100)`);
    console.log('Added repayment_reference column');
  } catch (error) {
    console.log('repayment_reference column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN completed_at timestamp`);
    console.log('Added completed_at column');
  } catch (error) {
    console.log('completed_at column already exists');
  }
  
  try {
    await db.execute(sql`ALTER TABLE loans ADD COLUMN completion_notes text`);
    console.log('Added completion_notes column');
  } catch (error) {
    console.log('completion_notes column already exists');
  }
  
  console.log('Loan column check completed');
}

// Ensure columns exist when module loads
ensureLoanColumns();

// Validation schemas
const createLoanSchema = z.object({
  amount: z.string(),
  interestRate: z.string(),
  term: z.number(),
  purpose: z.string().optional(),
});

// Get all loans (admin only - needs middleware)
loansRouter.get('/', async (c) => {
  try {
    const allLoans = await db.query.loans.findMany({
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(loans.createdAt)],
    });

    return c.json({ loans: allLoans });
  } catch (error) {
    console.error('Get loans error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user's loans
loansRouter.get('/my-loans', async (c) => {
  try {
    // TODO: Add auth middleware to get userId from token
    const userId = c.req.header('X-User-Id'); // Temporary
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userLoans = await db.query.loans.findMany({
      where: eq(loans.userId, userId),
      with: {
        repayments: true,
      },
      orderBy: [desc(loans.createdAt)],
    });

    return c.json({ loans: userLoans });
  } catch (error) {
    console.error('Get my loans error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single loan
loansRouter.get('/:id', async (c) => {
  try {
    const loanId = c.req.param('id');
    
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        repayments: true,
      },
    });

    if (!loan) {
      return c.json({ error: 'Loan not found' }, 404);
    }

    return c.json({ loan });
  } catch (error) {
    console.error('Get loan error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create loan
loansRouter.post('/', zValidator('json', createLoanSchema), async (c) => {
  try {
    const { amount, interestRate, term, purpose } = c.req.valid('json');
    const userId = c.req.header('X-User-Id'); // Temporary - will use auth middleware

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const [newLoan] = await db.insert(loans).values({
      userId,
      amount,
      interestRate,
      term,
      purpose,
      status: 'pending',
    }).returning();

    return c.json({ 
      message: 'Loan created successfully',
      loan: newLoan 
    }, 201);
  } catch (error) {
    console.error('Create loan error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update loan status (admin)
loansRouter.patch('/:id/status', async (c) => {
  try {
    const loanId = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    const [updatedLoan] = await db.update(loans)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    return c.json({ 
      message: 'Loan status updated',
      loan: updatedLoan 
    });
  } catch (error) {
    console.error('Update loan error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Disburse loan (admin)
loansRouter.patch('/:id/disburse', async (c) => {
  try {
    const loanId = c.req.param('id');
    const body = await c.req.json();
    const { disbursementMethod, disbursementReference } = body;

    const [updatedLoan] = await db.update(loans)
      .set({ 
        status: 'disbursed',
        disbursedAt: new Date(),
        disbursementMethod,
        disbursementReference,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    return c.json({ 
      message: 'Loan disbursed successfully',
      loan: updatedLoan 
    });
  } catch (error) {
    console.error('Disburse loan error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark loan as repaid (admin)
loansRouter.patch('/:id/repaid', async (c) => {
  try {
    const loanId = c.req.param('id');
    const body = await c.req.json();
    const { repaymentAmount, repaymentMethod, repaymentReference } = body;

    const [updatedLoan] = await db.update(loans)
      .set({ 
        status: 'completed',
        repaidAt: new Date(),
        repaymentAmount,
        repaymentMethod,
        repaymentReference,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    // Also create a repayment record
    if (updatedLoan) {
      await db.insert(repayments).values({
        loanId,
        amount: repaymentAmount,
        paymentMethod: repaymentMethod,
        reference: repaymentReference,
        paidAt: new Date(),
        dueDate: new Date(), // Set due date to now since it's already paid
        status: 'paid',
        paidDate: new Date(),
      });
    }

    return c.json({ 
      message: 'Loan marked as repaid',
      loan: updatedLoan 
    });
  } catch (error) {
    console.error('Mark loan as repaid error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Complete loan (admin) - for when loan is fully completed
loansRouter.patch('/:id/complete', async (c) => {
  try {
    const loanId = c.req.param('id');
    const body = await c.req.json();
    const { completionNotes } = body;

    const [updatedLoan] = await db.update(loans)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        completionNotes,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    return c.json({ 
      message: 'Loan completed successfully',
      loan: updatedLoan 
    });
  } catch (error) {
    console.error('Complete loan error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { loansRouter as loanRoutes };
