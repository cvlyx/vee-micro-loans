import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrateUsers() {
  console.log('🔄 Running users table migration...');
  
  const columns = [
    { name: 'credit_score', type: 'integer DEFAULT 500' },
    { name: 'loan_limit', type: 'integer DEFAULT 50000' },
    { name: 'is_kyc_verified', type: 'boolean DEFAULT false' },
    { name: 'verification_status', type: "varchar(20) DEFAULT 'pending'" },
  ];

  for (const col of columns) {
    try {
      await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`));
      console.log(`✅ Added column: ${col.name}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`⏭️  Column exists: ${col.name}`);
      } else {
        console.log(`⚠️  Error adding ${col.name}:`, e.message);
      }
    }
  }

  console.log('✅ Migration complete!');
  process.exit(0);
}

migrateUsers().catch(console.error);
