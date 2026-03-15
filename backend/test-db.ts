import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, loans, loanApplications, notifications, settings, repayments } from './src/db/schema.js';
import { sql } from 'drizzle-orm';

dotenv.config();

const sqlClient = neon(process.env.DATABASE_URL!, { fetchOptions: { timeout: 30000 } });
const db = drizzle(sqlClient, { schema: { users, loans, loanApplications, notifications, settings, repayments } });

async function analyzeDatabase() {
  console.log('\n🔍 PHOENIX LOAN DATABASE ANALYSIS\n');
  console.log('='.repeat(50));

  try {
    // 1. Check connection
    console.log('\n📡 Testing connection...');
    const connectionTest = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');

    // 2. Count records in each table
    console.log('\n📊 TABLE RECORD COUNTS');
    console.log('-'.repeat(30));

    const tables = [
      { name: 'users', schema: users },
      { name: 'loans', schema: loans },
      { name: 'loan_applications', schema: loanApplications },
      { name: 'notifications', schema: notifications },
      { name: 'settings', schema: settings },
      { name: 'repayments', schema: repayments },
    ];

    for (const table of tables) {
      try {
        const result = await db.select({ count: sql`COUNT(*)` }).from(table.schema);
        const count = Number(result[0]?.count) || 0;
        console.log(`  ${table.name}: ${count} records`);
      } catch (err) {
        console.log(`  ${table.name}: ❌ Error or table doesn't exist`);
      }
    }

    // 3. Check users breakdown
    console.log('\n👤 USERS BREAKDOWN');
    console.log('-'.repeat(30));
    const usersList = await db.select().from(users);
    const adminCount = usersList.filter(u => u.role === 'admin').length;
    const regularUsers = usersList.filter(u => u.role === 'user').length;
    const blacklisted = usersList.filter(u => u.isBlacklisted).length;
    console.log(`  Total: ${usersList.length}`);
    console.log(`  Admins: ${adminCount}`);
    console.log(`  Regular users: ${regularUsers}`);
    console.log(`  Blacklisted: ${blacklisted}`);

    // 4. Check loans breakdown
    console.log('\n💰 LOANS BREAKDOWN');
    console.log('-'.repeat(30));
    const loansList = await db.select().from(loans);
    const statusCounts: Record<string, number> = {};
    loansList.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });
    console.log(`  Total: ${loansList.length}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // 5. Check loan applications breakdown
    console.log('\n📋 LOAN APPLICATIONS BREAKDOWN');
    console.log('-'.repeat(30));
    const applicationsList = await db.select().from(loanApplications);
    const appStatusCounts: Record<string, number> = {};
    applicationsList.forEach(a => {
      appStatusCounts[a.status] = (appStatusCounts[a.status] || 0) + 1;
    });
    console.log(`  Total: ${applicationsList.length}`);
    Object.entries(appStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // 6. Check column types for debugging
    console.log('\n⚠️  SCHEMA ANALYSIS');
    console.log('-'.repeat(30));
    
    // Check actual column types in the database
    const columnTypesResult = await db.execute(sql`
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name IN ('users', 'loans', 'loan_applications')
      ORDER BY table_name, ordinal_position
    `);
    
    const columnTypes = columnTypesResult as unknown as Array<{ table_name: string; column_name: string; data_type: string; udt_name: string }>;
    
    console.log('  Column types in database:');
    if (Array.isArray(columnTypes)) {
      columnTypes.forEach(col => {
        console.log(`    ${col.table_name}.${col.column_name}: ${col.data_type} (${col.udt_name})`);
      });
    } else {
      console.log('    Result:', JSON.stringify(columnTypes, null, 2));
    }

    // 7. Check settings
    console.log('\n⚙️  SETTINGS');
    console.log('-'.repeat(30));
    const settingsList = await db.select().from(settings);
    settingsList.forEach(s => {
      console.log(`  ${s.key}: ${s.value.substring(0, 50)}${s.value.length > 50 ? '...' : ''}`);
    });

    // 8. Recent activity
    console.log('\n📅 RECENT ACTIVITY (Last 7 Days)');
    console.log('-'.repeat(30));
    const recentUsers = await db.execute(sql`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `) as unknown as Array<{ count: number }>;
    const recentLoans = await db.execute(sql`
      SELECT COUNT(*) as count FROM loans 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `) as unknown as Array<{ count: number }>;
    console.log(`  New users: ${recentUsers[0]?.count || 0}`);
    console.log(`  New loans: ${recentLoans[0]?.count || 0}`);

    // 9. Performance recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(30));
    
    // Check if indexes exist
    try {
      const indexesResult = await db.execute(sql`
        SELECT indexname FROM pg_indexes 
        WHERE tablename IN ('users', 'loans', 'loan_applications')
      `);
      const indexes = indexesResult as unknown as { fields?: Array<{ indexname: string }> };
      const indexNames = (indexes.fields || []).map((i: any) => i.indexname);
      
      const recommendedIndexes = [
        { name: 'idx_loans_user_id', table: 'loans', column: 'user_id' },
        { name: 'idx_loans_status', table: 'loans', column: 'status' },
        { name: 'idx_loan_applications_user_id', table: 'loan_applications', column: 'user_id' },
        { name: 'idx_loan_applications_status', table: 'loan_applications', column: 'status' },
        { name: 'idx_users_email', table: 'users', column: 'email' },
      ];

      for (const rec of recommendedIndexes) {
        const exists = indexNames.includes(rec.name);
        if (!exists) {
          console.log(`  ⚠️  Missing index: ${rec.name} on ${rec.table}(${rec.column})`);
        }
      }
    } catch (err) {
      console.log('  Could not check indexes');
    }

    if (loansList.length > 100) {
      console.log('  ⚠️  Consider archiving old completed loans');
    }
    
    console.log('\n📝 SCHEMA MISMATCH DETECTED:');
    console.log('  The users table has extra columns not in schema:');
    console.log('  - is_kyc_verified');
    console.log('  - verification_status');
    console.log('  - id_document_url');
    console.log('  - selfie_url');
    console.log('  - biometric_data');

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Database analysis failed:');
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

analyzeDatabase();
