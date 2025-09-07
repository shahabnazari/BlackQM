import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing users
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing users');

  // Create test users with hashed password
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const users = [
    {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN as Role,
      emailVerified: true,
    },
    {
      email: 'researcher@test.com',
      password: hashedPassword,
      name: 'Researcher User',
      role: Role.RESEARCHER as Role,
      emailVerified: true,
    },
    {
      email: 'participant@test.com',
      password: hashedPassword,
      name: 'Participant User',
      role: Role.PARTICIPANT as Role,
      emailVerified: true,
    },
    {
      email: 'demo@vqmethod.com',
      password: hashedPassword,
      name: 'Demo User',
      role: Role.RESEARCHER as Role,
      emailVerified: true,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`✅ Created user: ${user.email} (${user.role})`);
  }

  console.log('\n🎉 Database seed completed successfully!\n');
  console.log('📝 Test Accounts:');
  console.log('=====================================');
  console.log('Email: researcher@test.com');
  console.log('Password: TestPassword123!');
  console.log('Role: RESEARCHER');
  console.log('-------------------------------------');
  console.log('Email: admin@test.com');
  console.log('Password: TestPassword123!');
  console.log('Role: ADMIN');
  console.log('-------------------------------------');
  console.log('Email: participant@test.com');
  console.log('Password: TestPassword123!');
  console.log('Role: PARTICIPANT');
  console.log('-------------------------------------');
  console.log('Email: demo@vqmethod.com');
  console.log('Password: TestPassword123!');
  console.log('Role: RESEARCHER');
  console.log('=====================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
