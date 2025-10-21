import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testSavePaper() {
  try {
    console.log('Testing paper save...');

    const userId = 'cmgzpwy7u0006gsr4s4vcwrmc';

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log('User found:', user ? `${user.name} (${user.email})` : 'NOT FOUND');

    if (!user) {
      console.error('User does not exist!');
      process.exit(1);
    }

    // Try to save a paper
    const paper = await prisma.paper.create({
      data: {
        title: 'Test Paper from Script',
        authors: ['John Doe', 'Jane Smith'],
        year: 2024,
        abstract: 'This is a test abstract',
        source: 'user_added',
        userId: userId,
      },
    });

    console.log('Paper saved successfully!');
    console.log('Paper ID:', paper.id);
    console.log('Paper title:', paper.title);

    // Try to fetch it back
    const papers = await prisma.paper.findMany({
      where: { userId },
    });

    console.log(`\\nTotal papers for user: ${papers.length}`);
    papers.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} (ID: ${p.id})`);
    });

  } catch (error: any) {
    console.error('\\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    if (error.code) {
      console.error('Prisma Error Code:', error.code);
    }
    if (error.meta) {
      console.error('Prisma Meta:', JSON.stringify(error.meta, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSavePaper();
