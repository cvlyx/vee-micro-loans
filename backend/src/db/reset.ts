import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Dropping existing tables...');
  
  // Drop all tables in reverse order of dependencies
  await sql`DROP TABLE IF EXISTS repayments CASCADE`;
  await sql`DROP TABLE IF EXISTS loan_applications CASCADE`;
  await sql`DROP TABLE IF EXISTS loans CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  console.log('✓ Tables dropped successfully');
  console.log('Database is now clean and ready for schema push');
}

resetDatabase().catch(console.error);
