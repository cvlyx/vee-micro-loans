import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

// Load environment variables (works in both development and production)
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('⚠️  DATABASE_URL is not defined in environment variables');
  console.error('📄 Please check your .env file at:', process.cwd() + '/.env');
  console.error('💡 Make sure it contains: DATABASE_URL=postgresql://...');
  throw new Error('DATABASE_URL is not defined');
}

console.log('🔗 Connecting to database...');
const sql = neon(DATABASE_URL, { fetchOptions: { timeout: 30000 } });
export const db = drizzle(sql, { schema });
console.log('✅ Database connected successfully!');
