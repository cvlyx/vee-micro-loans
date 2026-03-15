-- Add missing columns to loans table
ALTER TABLE loans 
ADD COLUMN disbursed_at timestamp,
ADD COLUMN disbursement_method varchar(50),
ADD COLUMN disbursement_reference varchar(100),
ADD COLUMN repaid_at timestamp,
ADD COLUMN repayment_amount numeric(12,2),
ADD COLUMN repayment_method varchar(50),
ADD COLUMN repayment_reference varchar(100),
ADD COLUMN completed_at timestamp,
ADD COLUMN completion_notes text;
