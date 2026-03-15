import { pgTable, text, integer, decimal, timestamp, boolean, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  dob: varchar('dob', { length: 20 }), // Date of birth
  nationalId: varchar('national_id', { length: 50 }), // National ID or Passport number
  district: varchar('district', { length: 50 }),
  area: varchar('area', { length: 100 }),
  employmentStatus: varchar('employment_status', { length: 50 }),
  monthlyIncome: varchar('monthly_income', { length: 20 }),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' or 'admin'
  isBlacklisted: boolean('is_blacklisted').default(false),
  // Admin-managed fields
  creditScore: integer('credit_score').default(500),
  loanLimit: integer('loan_limit').default(50000),
  isKycVerified: boolean('is_kyc_verified').default(false),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  // KYC Document fields
  idDocumentType: varchar('id_document_type', { length: 20 }), // 'national_id' or 'passport'
  idDocumentImage: text('id_document_image'), // Base64 encoded image
  selfieWithIdImage: text('selfie_with_id_image'), // Base64 encoded selfie
  // Biometric fields
  biometricEnabled: boolean('biometric_enabled').default(false),
  biometricId: varchar('biometric_id', { length: 255 }), // Device biometric identifier
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Loans table
export const loans = pgTable('loans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).notNull(),
  term: integer('term').notNull(), // in months
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected, active, disbursed, completed, defaulted
  purpose: text('purpose'),
  // Disbursement fields
  disbursedAt: timestamp('disbursed_at'),
  disbursementMethod: varchar('disbursement_method', { length: 50 }), // airtel_money, tnm_mpamba, national_bank, etc.
  disbursementReference: varchar('disbursement_reference', { length: 100 }),
  // Repayment fields
  repaidAt: timestamp('repaid_at'),
  repaymentAmount: decimal('repayment_amount', { precision: 12, scale: 2 }),
  repaymentMethod: varchar('repayment_method', { length: 50 }),
  repaymentReference: varchar('repayment_reference', { length: 100 }),
  // Completion fields
  completedAt: timestamp('completed_at'),
  completionNotes: text('completion_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Loan Applications table
export const loanApplications = pgTable('loan_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  loanId: uuid('loan_id').references(() => loans.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  employmentStatus: varchar('employment_status', { length: 50 }).notNull(),
  monthlyIncome: decimal('monthly_income', { precision: 12, scale: 2 }).notNull(),
  employerName: varchar('employer_name', { length: 255 }),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, under_review, approved, rejected
  adminNotes: text('admin_notes'),
  // Collateral fields
  collateralItemName: varchar('collateral_item_name', { length: 255 }),
  collateralDescription: text('collateral_description'),
  collateralEstimatedValue: decimal('collateral_estimated_value', { precision: 12, scale: 2 }),
  collateralImage1: text('collateral_image_1'), // Base64 encoded
  collateralImage2: text('collateral_image_2'),
  collateralImage3: text('collateral_image_3'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
});

// Repayments table
export const repayments = pgTable('repayments', {
  id: uuid('id').primaryKey().defaultRandom(),
  loanId: uuid('loan_id').references(() => loans.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  paidDate: timestamp('paid_date'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, paid, overdue
  paymentMethod: varchar('payment_method', { length: 50 }),
  reference: varchar('reference', { length: 100 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // registration, loan_approved, loan_rejected, kyc_verified, etc.
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Settings table
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(), // e.g., 'interest_rates', 'disbursement_channels'
  value: text('value').notNull(), // stored as JSON string
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans),
  applications: many(loanApplications),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  repayments: many(repayments),
  application: one(loanApplications),
}));

export const loanApplicationsRelations = relations(loanApplications, ({ one }) => ({
  user: one(users, {
    fields: [loanApplications.userId],
    references: [users.id],
  }),
  loan: one(loans, {
    fields: [loanApplications.loanId],
    references: [loans.id],
  }),
  reviewer: one(users, {
    fields: [loanApplications.reviewedBy],
    references: [users.id],
  }),
}));

export const repaymentsRelations = relations(repayments, ({ one }) => ({
  loan: one(loans, {
    fields: [repayments.loanId],
    references: [loans.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type LoanApplication = typeof loanApplications.$inferSelect;
export type NewLoanApplication = typeof loanApplications.$inferInsert;
export type Repayment = typeof repayments.$inferSelect;
export type NewRepayment = typeof repayments.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
