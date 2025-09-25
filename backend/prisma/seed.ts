import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const hashedPassword = await bcryptjs.hash('Test123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'RESEARCHER',
      emailVerified: true,
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create admin user
  const adminPassword = await bcryptjs.hash('Admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vqmethod.com' },
    update: {},
    create: {
      email: 'admin@vqmethod.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
