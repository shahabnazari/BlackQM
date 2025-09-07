import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  console.log(`\n🔐 Resetting password for: ${email}`);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      emailVerified: true, // Also mark as verified
    },
  });

  console.log('✅ Password reset successfully!');
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   New Password: ${newPassword}`);
  console.log(`   Email Verified: ${user.emailVerified}`);

  return user;
}

async function main() {
  // Reset password for researcher@test.com
  await resetPassword('researcher@test.com', 'Password123!');

  // Also create/update other test accounts
  const testAccounts = [
    { email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' },
    {
      email: 'participant@test.com',
      name: 'Participant User',
      role: 'PARTICIPANT',
    },
    { email: 'demo@vqmethod.com', name: 'Demo User', role: 'RESEARCHER' },
  ];

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  for (const account of testAccounts) {
    try {
      // Try to update existing user
      const user = await prisma.user.update({
        where: { email: account.email },
        data: {
          password: hashedPassword,
          name: account.name,
          emailVerified: true,
        },
      });
      console.log(`✅ Updated existing user: ${user.email}`);
    } catch (error) {
      // If user doesn't exist, create new one
      const user = await prisma.user.create({
        data: {
          email: account.email,
          password: hashedPassword,
          name: account.name,
          role: account.role as any,
          emailVerified: true,
        },
      });
      console.log(`✅ Created new user: ${user.email}`);
    }
  }

  console.log('\n📝 All Test Accounts Updated:');
  console.log('=====================================');
  console.log('Email: researcher@test.com');
  console.log('Password: Password123!');
  console.log('-------------------------------------');
  console.log('Email: admin@test.com');
  console.log('Password: Password123!');
  console.log('-------------------------------------');
  console.log('Email: participant@test.com');
  console.log('Password: Password123!');
  console.log('-------------------------------------');
  console.log('Email: demo@vqmethod.com');
  console.log('Password: Password123!');
  console.log('=====================================\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
