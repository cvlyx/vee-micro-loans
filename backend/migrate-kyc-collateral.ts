import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrateKycCollateral() {
  console.log('🔄 Running KYC & Collateral migration...');
  
  // Add KYC document columns to users table
  const userColumns = [
    { name: 'id_document_type', type: 'varchar(20)' },
    { name: 'id_document_image', type: 'text' },
    { name: 'selfie_with_id_image', type: 'text' },
    { name: 'biometric_enabled', type: 'boolean DEFAULT false' },
    { name: 'biometric_id', type: 'varchar(255)' },
  ];

  for (const col of userColumns) {
    try {
      await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`));
      console.log(`✅ Added users column: ${col.name}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`⏭️  Column exists: users.${col.name}`);
      } else {
        console.log(`⚠️  Error adding users.${col.name}:`, e.message);
      }
    }
  }

  // Add collateral columns to loan_applications table
  const loanAppColumns = [
    { name: 'collateral_item_name', type: 'varchar(255)' },
    { name: 'collateral_description', type: 'text' },
    { name: 'collateral_estimated_value', type: 'numeric(12,2)' },
    { name: 'collateral_image_1', type: 'text' },
    { name: 'collateral_image_2', type: 'text' },
    { name: 'collateral_image_3', type: 'text' },
  ];

  for (const col of loanAppColumns) {
    try {
      await db.execute(sql.raw(`ALTER TABLE loan_applications ADD COLUMN ${col.name} ${col.type}`));
      console.log(`✅ Added loan_applications column: ${col.name}`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`⏭️  Column exists: loan_applications.${col.name}`);
      } else {
        console.log(`⚠️  Error adding loan_applications.${col.name}:`, e.message);
      }
    }
  }

  console.log('✅ KYC & Collateral migration complete!');
  process.exit(0);
}

migrateKycCollateral().catch(console.error);
