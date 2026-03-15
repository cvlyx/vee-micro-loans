import bcrypt from 'bcryptjs';

async function createAdminPassword() {
  const password = 'Admin123!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nRun this SQL:');
  console.log(`INSERT INTO users (email, password, full_name, role) VALUES ('admin@phoenixloan.com', '${hash}', 'Phoenix Admin', 'admin') ON CONFLICT (email) DO UPDATE SET password = '${hash}';`);
}

createAdminPassword();
