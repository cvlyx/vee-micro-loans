import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/index.js';
import { loanApplications, loans } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const applicationsRouter = new Hono();

// Validation schemas
const createApplicationSchema = z.object({
  amount: z.string(),
  employmentStatus: z.string(),
  monthlyIncome: z.string(),
  employerName: z.string().optional(),
  reason: z.string(),
});

// Extended schema with collateral
const createApplicationWithCollateralSchema = z.object({
  amount: z.string(),
  employmentStatus: z.string(),
  monthlyIncome: z.string(),
  employerName: z.string().optional(),
  reason: z.string(),
  // Collateral fields (mandatory)
  collateralItemName: z.string().min(1, 'Collateral item name is required'),
  collateralDescription: z.string().optional(),
  collateralEstimatedValue: z.string().optional(),
  collateralImage1: z.string().optional(), // Base64 encoded
  collateralImage2: z.string().optional(),
  collateralImage3: z.string().optional(),
});

const reviewApplicationSchema = z.object({
  status: z.enum(['pending', 'under_review', 'approved', 'rejected']),
  adminNotes: z.string().optional(),
});

// Get all applications (admin)
applicationsRouter.get('/', async (c) => {
  try {
    const applications = await db.query.loanApplications.findMany({
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        loan: true,
        reviewer: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: [desc(loanApplications.createdAt)],
    });

    return c.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user's applications
applicationsRouter.get('/my-applications', async (c) => {
  try {
    const userId = c.req.header('X-User-Id'); // Temporary
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const applications = await db.query.loanApplications.findMany({
      where: eq(loanApplications.userId, userId),
      with: {
        loan: true,
      },
      orderBy: [desc(loanApplications.createdAt)],
    });

    return c.json({ applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single application
applicationsRouter.get('/:id', async (c) => {
  try {
    const applicationId = c.req.param('id');
    
    const application = await db.query.loanApplications.findFirst({
      where: eq(loanApplications.id, applicationId),
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        loan: true,
      },
    });

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    return c.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create application
applicationsRouter.post('/', zValidator('json', createApplicationSchema), async (c) => {
  try {
    const { amount, employmentStatus, monthlyIncome, employerName, reason } = c.req.valid('json');
    const userId = c.req.header('X-User-Id'); // Temporary

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const [newApplication] = await db.insert(loanApplications).values({
      userId,
      amount,
      employmentStatus,
      monthlyIncome,
      employerName,
      reason,
      status: 'pending',
    }).returning();

    return c.json({ 
      message: 'Application submitted successfully',
      application: newApplication 
    }, 201);
  } catch (error) {
    console.error('Create application error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create application with collateral (mandatory)
applicationsRouter.post('/with-collateral', zValidator('json', createApplicationWithCollateralSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const { 
      amount, employmentStatus, monthlyIncome, employerName, reason,
      collateralItemName, collateralDescription, collateralEstimatedValue,
      collateralImage1, collateralImage2, collateralImage3
    } = data;
    const userId = c.req.header('X-User-Id');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Validate at least one collateral image is provided
    if (!collateralImage1 && !collateralImage2 && !collateralImage3) {
      return c.json({ error: 'At least one collateral image is required' }, 400);
    }

    const [newApplication] = await db.insert(loanApplications).values({
      userId,
      amount,
      employmentStatus,
      monthlyIncome,
      employerName,
      reason,
      status: 'pending',
      // Collateral fields
      collateralItemName,
      collateralDescription: collateralDescription || null,
      collateralEstimatedValue: collateralEstimatedValue || null,
      collateralImage1: collateralImage1 || null,
      collateralImage2: collateralImage2 || null,
      collateralImage3: collateralImage3 || null,
    }).returning();

    return c.json({ 
      message: 'Application submitted successfully with collateral',
      application: newApplication 
    }, 201);
  } catch (error) {
    console.error('Create application with collateral error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get collateral for an application
applicationsRouter.get('/:id/collateral', async (c) => {
  try {
    const applicationId = c.req.param('id');
    
    const application = await db.query.loanApplications.findFirst({
      where: eq(loanApplications.id, applicationId),
      columns: {
        id: true,
        collateralItemName: true,
        collateralDescription: true,
        collateralEstimatedValue: true,
        collateralImage1: true,
        collateralImage2: true,
        collateralImage3: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Check if collateral exists
    if (!application.collateralItemName) {
      return c.json({ 
        collateral: null,
        message: 'No collateral found for this application' 
      });
    }

    return c.json({ 
      collateral: {
        itemName: application.collateralItemName,
        description: application.collateralDescription,
        estimatedValue: application.collateralEstimatedValue,
        images: [
          application.collateralImage1,
          application.collateralImage2,
          application.collateralImage3,
        ].filter(Boolean),
      },
      user: application.user,
    });
  } catch (error) {
    console.error('Get collateral error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Review application (admin)
applicationsRouter.patch('/:id/review', zValidator('json', reviewApplicationSchema), async (c) => {
  try {
    const applicationId = c.req.param('id');
    const { status, adminNotes } = c.req.valid('json');
    const adminId = c.req.header('X-User-Id'); // Temporary

    const [updatedApplication] = await db.update(loanApplications)
      .set({ 
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: adminId || undefined,
      })
      .where(eq(loanApplications.id, applicationId))
      .returning();

    return c.json({ 
      message: 'Application reviewed successfully',
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Review application error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { applicationsRouter as applicationRoutes };
