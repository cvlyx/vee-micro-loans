-- Drop all tables in reverse order of dependencies
DROP TABLE IF EXISTS repayments CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify tables are dropped
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
