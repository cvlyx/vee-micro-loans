-- Create admin user in Phoenix Loan database
-- Run this in Neon SQL Editor

INSERT INTO users (id, email, password, full_name, phone, role, dob, national_id, district, area, employment_status, monthly_income)
VALUES (
  gen_random_uuid(),
  'admin@phoenixloan.com',
  '$2a$10$RVz2Osmrxqwx.Fznk.NxlOcIvofNO6jqex5QEfN/7JYRpog5Hsn2C',
  'Phoenix Admin',
  '+265999888777',
  'admin',
  '1990-01-01',
  'ADMIN123',
  'Lilongwe',
  'Area 1',
  'Employed',
  '500000'
)
ON CONFLICT (email) DO UPDATE SET 
  password = '$2a$10$RVz2Osmrxqwx.Fznk.NxlOcIvofNO6jqex5QEfN/7JYRpog5Hsn2C',
  full_name = 'Phoenix Admin',
  phone = '+265999888777',
  role = 'admin';

-- Verify admin was created
SELECT id, email, full_name, role FROM users WHERE email = 'admin@phoenixloan.com';
