-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS area VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income VARCHAR(20);

-- Add loan status column if not exists
ALTER TABLE loans ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'registration', 'loan_approved', 'loan_rejected', 'kyc_verified', etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Verify the structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
