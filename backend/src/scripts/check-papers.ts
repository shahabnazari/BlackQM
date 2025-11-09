import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentPapers() {
  console.log('🔍 Checking recent papers in database...\n');

  // Get papers saved in last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const papers = await prisma.paper.findMany({
    where: {
      createdAt: {
        gte: tenMinutesAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      doi: true,
      fullTextStatus: true,
      hasFullText: true,
      createdAt: true,
      userId: true,
    },
  });

  console.log(`📊 Found ${papers.length} papers saved in last 10 minutes:\n`);

  papers.forEach((paper, index) => {
    console.log(`${index + 1}. "${paper.title?.substring(0, 60)}..."`);
    console.log(`   • ID: ${paper.id}`);
    console.log(`   • DOI: ${paper.doi || 'N/A'}`);
    console.log(`   • Full-text status: ${paper.fullTextStatus}`);
    console.log(`   • Has full-text: ${paper.hasFullText}`);
    console.log(`   • User ID: ${paper.userId}`);
    console.log(`   • Created: ${paper.createdAt.toISOString()}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkRecentPapers().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
