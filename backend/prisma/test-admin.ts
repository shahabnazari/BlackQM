import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Checking admin@test.com account...\n');

  const user = await prisma.user.findUnique({
    where: { email: 'admin@test.com' },
  });

  if (!user) {
    console.log('❌ User admin@test.com NOT FOUND in database');
    return;
  }

  console.log('✅ User found in database:');
  console.log('   Email:', user.email);
  console.log('   Name:', user.name);
  console.log('   Role:', user.role);
  console.log('   ID:', user.id);
  console.log('   Email Verified:', user.emailVerified);
  console.log('   Active:', user.isActive);
  console.log('   Created:', user.createdAt);

  console.log('\n🔐 Testing password...');
  const passwords = [
    'Password123!',
    'TestPassword123!',
    'password123',
    'admin',
  ];

  for (const pwd of passwords) {
    const isValid = await bcrypt.compare(pwd, user.password);
    console.log(`   "${pwd}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    if (isValid) {
      console.log(`\n✅ CORRECT PASSWORD: ${pwd}`);
      break;
    }
  }

  console.log('\n📊 Checking all users with "admin" in email:');
  const adminUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: 'admin',
      },
    },
    select: {
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  adminUsers.forEach((u) => {
    console.log(`   - ${u.email} (${u.role}) - ${u.name}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
