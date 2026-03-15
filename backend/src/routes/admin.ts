import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, loanApplications, settings } from '../db/schema.js';
import { desc, eq, sql, count } from 'drizzle-orm';

const adminRouter = new Hono();

// Get all users with pagination
adminRouter.get('/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    // Use Drizzle ORM with pagination for better type safety
    const usersResult = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit,
      offset,
    });

    const countResult = await db.select({ count: count() }).from(users);
    const total = countResult[0]?.count || 0;

    const formattedUsers = usersResult.map((u: any) => ({
      id: u.id,
      fullName: u.fullName ?? u.full_name ?? 'Unknown',
      email: u.email ?? '',
      phone: u.phone || '',
      creditScore: u.creditScore ?? 500,
      loanLimit: u.loanLimit ?? 50000,
      isKycVerified: u.isKycVerified ?? !!(u.dob && (u.nationalId || u.national_id)),
      isBlacklisted: u.isBlacklisted ?? false,
      verificationStatus: u.verificationStatus ?? 'pending',
      joinedAt: u.createdAt?.toISOString?.() ?? u.created_at ?? new Date().toISOString(),
      district: u.district || '',
      employmentStatus: (u.employmentStatus ?? u.employment_status) || '',
      monthlyIncome: (u.monthlyIncome ?? u.monthly_income) || '',
    }));

    return c.json({ 
      users: formattedUsers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get all loans/applications with pagination
adminRouter.get('/loans', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

    // Use Drizzle ORM with pagination
    const allLoans = await db.query.loanApplications.findMany({
      orderBy: [desc(loanApplications.createdAt)],
      limit,
      offset,
    });

    const countResult = await db.select({ count: count() }).from(loanApplications);
    const total = countResult[0]?.count || 0;

    // Get user data for the loans in a single query
    const userIds = [...new Set(allLoans.map((a: any) => a.userId).filter(Boolean))];
    const usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const usersList = await db.query.users.findMany({
        where: (users, { inArray }) => inArray(users.id, userIds),
      });
      usersList.forEach((u: any) => { usersMap[u.id] = u; });
    }

    const safeLoans = allLoans.map((app: any) => ({
      ...app,
      user: app.userId && usersMap[app.userId] ? {
        id: usersMap[app.userId].id,
        fullName: usersMap[app.userId].fullName ?? usersMap[app.userId].full_name,
        email: usersMap[app.userId].email,
        phone: usersMap[app.userId].phone,
      } : { fullName: 'Unknown', email: '', phone: '' },
    }));

    return c.json({ 
      loans: safeLoans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get loans error:', error);
    return c.json({ error: 'Failed to fetch loans' }, 500);
  }
});

// Get dashboard stats - optimized with aggregation queries
adminRouter.get('/stats', async (c) => {
  try {
    // Use Drizzle aggregation functions
    const userCountResult = await db.select({ count: count() }).from(users);
    const loanCountResult = await db.select({ count: count() }).from(loanApplications);
    const activeLoanResult = await db.select({ count: count() })
      .from(loanApplications)
      .where(sql`status IN ('active', 'disbursed', 'approved')`);
    const completedLoanResult = await db.select({ count: count() })
      .from(loanApplications)
      .where(eq(loanApplications.status, 'completed'));
    const totalDisbursedResult = await db.select({ 
      total: sql`COALESCE(SUM(amount), 0)` 
    }).from(loanApplications);

    return c.json({
      stats: {
        totalUsers: userCountResult[0]?.count || 0,
        totalLoans: loanCountResult[0]?.count || 0,
        activeLoans: activeLoanResult[0]?.count || 0,
        completedLoans: completedLoanResult[0]?.count || 0,
        totalDisbursed: Number(totalDisbursedResult[0]?.total) || 0,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Get settings
adminRouter.get('/settings', async (c) => {
  try {
    const allSettings = await db.select().from(settings);
    const settingsMap: Record<string, any> = {};
    for (const s of allSettings) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }
    return c.json({ settings: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// Update settings
adminRouter.put('/settings', async (c) => {
  try {
    const body = await c.req.json();
    for (const [key, value] of Object.entries(body)) {
      const existing = await db.query.settings.findFirst({
        where: eq(settings.key, key)
      });
      if (existing) {
        await db.update(settings)
          .set({ value: JSON.stringify(value), updatedAt: new Date() })
          .where(eq(settings.key, key));
      } else {
        await db.insert(settings)
          .values({ key, value: JSON.stringify(value) });
      }
    }
    return c.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Disburse a loan application (admin)
adminRouter.patch('/applications/:id/disburse', async (c) => {
  try {
    const applicationId = c.req.param('id');
    const body = await c.req.json();
    const { disbursementMethod, disbursementReference } = body;

    console.log(`💰 Disbursing loan application: ${applicationId}`);

    // Update the loan application status
    const [updatedApplication] = await db.update(loanApplications)
      .set({ 
        status: 'disbursed',
        reviewedAt: new Date(),
      })
      .where(eq(loanApplications.id, applicationId))
      .returning();

    if (!updatedApplication) {
      return c.json({ error: 'Loan application not found' }, 404);
    }

    console.log(`✅ Loan application ${applicationId} marked as disbursed`);

    return c.json({ 
      message: 'Loan disbursed successfully',
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Disburse loan error:', error);
    return c.json({ error: 'Failed to disburse loan' }, 500);
  }
});

// Complete a loan application (admin)
adminRouter.patch('/applications/:id/complete', async (c) => {
  try {
    const applicationId = c.req.param('id');
    const body = await c.req.json();
    const { repaymentAmount, repaymentMethod, repaymentReference } = body;

    console.log(`✅ Completing loan application: ${applicationId}`);

    const [updatedApplication] = await db.update(loanApplications)
      .set({ 
        status: 'completed',
        reviewedAt: new Date(),
      })
      .where(eq(loanApplications.id, applicationId))
      .returning();

    if (!updatedApplication) {
      return c.json({ error: 'Loan application not found' }, 404);
    }

    console.log(`✅ Loan application ${applicationId} marked as completed`);

    return c.json({ 
      message: 'Loan marked as completed',
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Complete loan error:', error);
    return c.json({ error: 'Failed to complete loan' }, 500);
  }
});

// Reject a loan application (admin)
adminRouter.patch('/applications/:id/reject', async (c) => {
  try {
    const applicationId = c.req.param('id');
    const body = await c.req.json();
    const { adminNotes } = body;

    console.log(`❌ Rejecting loan application: ${applicationId}`);

    const [updatedApplication] = await db.update(loanApplications)
      .set({ 
        status: 'rejected',
        adminNotes,
        reviewedAt: new Date(),
      })
      .where(eq(loanApplications.id, applicationId))
      .returning();

    if (!updatedApplication) {
      return c.json({ error: 'Loan application not found' }, 404);
    }

    console.log(`✅ Loan application ${applicationId} rejected`);

    return c.json({ 
      message: 'Loan application rejected',
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Reject loan error:', error);
    return c.json({ error: 'Failed to reject loan' }, 500);
  }
});

// Approve a loan application (admin)
adminRouter.patch('/applications/:id/approve', async (c) => {
  try {
    const applicationId = c.req.param('id');
    const body = await c.req.json();
    const { adminNotes } = body;

    console.log(`✅ Approving loan application: ${applicationId}`);

    const [updatedApplication] = await db.update(loanApplications)
      .set({ 
        status: 'approved',
        adminNotes,
        reviewedAt: new Date(),
      })
      .where(eq(loanApplications.id, applicationId))
      .returning();

    if (!updatedApplication) {
      return c.json({ error: 'Loan application not found' }, 404);
    }

    console.log(`✅ Loan application ${applicationId} approved`);

    return c.json({ 
      message: 'Loan application approved',
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    return c.json({ error: 'Failed to approve loan' }, 500);
  }
});

// ==================== USER MANAGEMENT ====================

// Verify user KYC
adminRouter.patch('/users/:id/verify-kyc', async (c) => {
  try {
    const userId = c.req.param('id');
    console.log(`✅ Verifying KYC for user: ${userId}`);

    const [updatedUser] = await db.update(users)
      .set({ 
        isKycVerified: true,
        verificationStatus: 'verified',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log(`✅ User ${userId} KYC verified`);

    return c.json({ 
      message: 'KYC verified successfully',
      user: {
        id: updatedUser.id,
        isKycVerified: updatedUser.isKycVerified,
        verificationStatus: updatedUser.verificationStatus,
      }
    });
  } catch (error) {
    console.error('Verify KYC error:', error);
    return c.json({ error: 'Failed to verify KYC' }, 500);
  }
});

// Update user credit score
adminRouter.patch('/users/:id/credit-score', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { creditScore } = body;

    if (!creditScore || creditScore < 300 || creditScore > 900) {
      return c.json({ error: 'Credit score must be between 300 and 900' }, 400);
    }

    console.log(`📊 Updating credit score for user ${userId} to ${creditScore}`);

    const [updatedUser] = await db.update(users)
      .set({ 
        creditScore,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log(`✅ User ${userId} credit score updated`);

    return c.json({ 
      message: 'Credit score updated successfully',
      user: {
        id: updatedUser.id,
        creditScore: updatedUser.creditScore,
      }
    });
  } catch (error) {
    console.error('Update credit score error:', error);
    return c.json({ error: 'Failed to update credit score' }, 500);
  }
});

// Update user loan limit
adminRouter.patch('/users/:id/loan-limit', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { loanLimit } = body;

    if (!loanLimit || loanLimit < 0) {
      return c.json({ error: 'Loan limit must be a positive number' }, 400);
    }

    console.log(`💰 Updating loan limit for user ${userId} to ${loanLimit}`);

    const [updatedUser] = await db.update(users)
      .set({ 
        loanLimit,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log(`✅ User ${userId} loan limit updated`);

    return c.json({ 
      message: 'Loan limit updated successfully',
      user: {
        id: updatedUser.id,
        loanLimit: updatedUser.loanLimit,
      }
    });
  } catch (error) {
    console.error('Update loan limit error:', error);
    return c.json({ error: 'Failed to update loan limit' }, 500);
  }
});

// Toggle user blacklist status
adminRouter.patch('/users/:id/blacklist', async (c) => {
  try {
    const userId = c.req.param('id');

    // Get current status
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const newStatus = !user.isBlacklisted;
    console.log(`${newStatus ? '🚫' : '✅'} ${newStatus ? 'Blacklisting' : 'Unblacklisting'} user: ${userId}`);

    const [updatedUser] = await db.update(users)
      .set({ 
        isBlacklisted: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    console.log(`✅ User ${userId} blacklist status updated`);

    return c.json({ 
      message: newStatus ? 'User blacklisted' : 'User unblacklisted',
      user: {
        id: updatedUser.id,
        isBlacklisted: updatedUser.isBlacklisted,
      }
    });
  } catch (error) {
    console.error('Toggle blacklist error:', error);
    return c.json({ error: 'Failed to update blacklist status' }, 500);
  }
});

// Update user password (admin)
adminRouter.patch('/users/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    console.log(`🔑 Updating password for user: ${userId}`);

    // Import bcrypt for hashing
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const [updatedUser] = await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log(`✅ User ${userId} password updated`);

    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return c.json({ error: 'Failed to update password' }, 500);
  }
});

// Get single user details
adminRouter.get('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ 
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        dob: user.dob,
        nationalId: user.nationalId,
        district: user.district,
        area: user.area,
        employmentStatus: user.employmentStatus,
        monthlyIncome: user.monthlyIncome,
        role: user.role,
        creditScore: user.creditScore ?? 500,
        loanLimit: user.loanLimit ?? 50000,
        isKycVerified: user.isKycVerified ?? false,
        isBlacklisted: user.isBlacklisted ?? false,
        verificationStatus: user.verificationStatus ?? 'pending',
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Get user's KYC documents
adminRouter.get('/users/:id/documents', async (c) => {
  try {
    const userId = c.req.param('id');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        fullName: true,
        email: true,
        nationalId: true,
        idDocumentType: true,
        idDocumentImage: true,
        selfieWithIdImage: true,
        verificationStatus: true,
        isKycVerified: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if documents exist
    const hasDocuments = user.idDocumentImage || user.selfieWithIdImage;

    return c.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        nationalId: user.nationalId,
        verificationStatus: user.verificationStatus,
        isKycVerified: user.isKycVerified,
      },
      documents: hasDocuments ? {
        idDocumentType: user.idDocumentType,
        idDocumentImage: user.idDocumentImage,
        selfieWithIdImage: user.selfieWithIdImage,
      } : null,
      hasDocuments,
    });
  } catch (error) {
    console.error('Get user documents error:', error);
    return c.json({ error: 'Failed to fetch user documents' }, 500);
  }
});

// Get application collateral
adminRouter.get('/applications/:id/collateral', async (c) => {
  try {
    const applicationId = c.req.param('id');

    const application = await db.query.loanApplications.findFirst({
      where: eq(loanApplications.id, applicationId),
      columns: {
        id: true,
        amount: true,
        status: true,
        collateralItemName: true,
        collateralDescription: true,
        collateralEstimatedValue: true,
        collateralImage1: true,
        collateralImage2: true,
        collateralImage3: true,
        createdAt: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Check if collateral exists
    const hasCollateral = !!application.collateralItemName;

    return c.json({
      application: {
        id: application.id,
        amount: application.amount,
        status: application.status,
        createdAt: application.createdAt,
      },
      user: application.user,
      collateral: hasCollateral ? {
        itemName: application.collateralItemName,
        description: application.collateralDescription,
        estimatedValue: application.collateralEstimatedValue,
        images: [
          application.collateralImage1,
          application.collateralImage2,
          application.collateralImage3,
        ].filter(Boolean),
      } : null,
      hasCollateral,
    });
  } catch (error) {
    console.error('Get application collateral error:', error);
    return c.json({ error: 'Failed to fetch application collateral' }, 500);
  }
});

export { adminRouter as adminRoutes };
