// Check user status in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user status in database...\n');

    const user = await prisma.user.findUnique({
      where: {
        email: 'researcher@test.com'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('✅ User found in database:\n');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  isActive:', user.isActive ? '✅ true' : '❌ false');
    console.log('  emailVerified:', user.emailVerified ? '✅ true' : '❌ false');
    console.log('  twoFactorEnabled:', user.twoFactorEnabled ? 'true' : 'false');
    console.log('  Created:', user.createdAt);
    console.log('  Updated:', user.updatedAt);
    console.log('');

    if (!user.isActive) {
      console.log('🚨 WARNING: User account is INACTIVE!');
      console.log('   This will cause authentication to fail.');
      console.log('');
    }

    if (!user.emailVerified) {
      console.log('⚠️  WARNING: Email is NOT verified!');
      console.log('   This might cause authentication issues depending on your guards.');
      console.log('');
    }

    // Count user's papers
    const paperCount = await prisma.paper.count({
      where: {
        userId: user.id
      }
    });

    console.log('📄 User has', paperCount, 'papers in library');
    console.log('');

    if (user.isActive && user.emailVerified) {
      console.log('✅ User account is fully active and verified!');
    }

  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStatus();
