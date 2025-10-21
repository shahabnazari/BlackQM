import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testGetLibrary() {
  try {
    const userId = 'cmgzq44q20000gsxsirc0hszg';

    console.log('Fetching papers for user:', userId);

    const papers = await prisma.paper.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${papers.length} papers`);
    console.log('');

    papers.forEach((paper, i) => {
      console.log(`Paper ${i + 1}:`);
      console.log(`  ID: ${paper.id}`);
      console.log(`  Title: ${paper.title}`);
      console.log(`  Authors: ${JSON.stringify(paper.authors)}`);
      console.log(`  Year: ${paper.year}`);
      console.log(`  Source: ${paper.source}`);
      console.log('');
    });

    // Try to JSON.stringify the result (like NestJS does)
    console.log('Testing JSON serialization...');
    const serialized = JSON.stringify({ papers, total: papers.length }, null, 2);
    console.log('✅ JSON serialization successful');
    console.log('Response size:', serialized.length, 'bytes');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testGetLibrary();
