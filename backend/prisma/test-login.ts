import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin(email: string, password: string) {
  console.log(`\n🔐 Testing login for: ${email}`);
  console.log(`   Using password: ${password}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ User not found');
    return false;
  }

  console.log('✅ User found in database');
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Email Verified: ${user.emailVerified}`);

  // Test password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (isValidPassword) {
    console.log('✅ Password is CORRECT!');
    return true;
  } else {
    console.log('❌ Password is INCORRECT');

    // Try some common passwords
    const commonPasswords = [
      'TestPassword123!',
      'Password123!',
      'password123',
      'test123',
      'Test123!',
    ];

    console.log('\n🔍 Testing common passwords...');
    for (const testPass of commonPasswords) {
      const isValid = await bcrypt.compare(testPass, user.password);
      if (isValid) {
        console.log(`✅ Found correct password: ${testPass}`);
        return true;
      }
    }

    console.log('❌ None of the common passwords worked');
    return false;
  }
}

async function main() {
  // Test the researcher@test.com account
  await testLogin('researcher@test.com', 'TestPassword123!');

  // Also test with Password123!
  await testLogin('researcher@test.com', 'Password123!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
