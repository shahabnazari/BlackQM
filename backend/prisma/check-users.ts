import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking existing users in database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (users.length === 0) {
    console.log('❌ No users found in database');
  } else {
    console.log(`✅ Found ${users.length} users:\n`);
    users.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'Not set'}`);
      console.log(`Role: ${user.role}`);
      console.log(`Verified: ${user.emailVerified}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('---');
    });
  }

  // Check if specific user exists
  const researcherUser = await prisma.user.findUnique({
    where: { email: 'researcher@test.com' },
  });

  if (researcherUser) {
    console.log('\n✅ User researcher@test.com EXISTS in database');
    console.log('Password is hashed, use: TestPassword123!');
  } else {
    console.log('\n❌ User researcher@test.com NOT FOUND in database');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
