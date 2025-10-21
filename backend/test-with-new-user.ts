import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testWithNewUser() {
  try {
    console.log('Testing with user: cmgzq44q20000gsxsirc0hszg');

    const userId = 'cmgzq44q20000gsxsirc0hszg'; // The user from the registration

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error('❌ User not found!');
      process.exit(1);
    }

    console.log('✅ User found:', user.name, `(${user.email})`);
    console.log('');

    // Try to save a paper exactly as the service does
    const saveDto = {
      title: 'Phase 10 Integration Test',
      authors: ['John Doe', 'Jane Smith'],
      year: 2024,
      abstract: 'Testing Phase 9 to Phase 10 integration after backend restart',
    };

    console.log('Attempting to save paper with data:');
    console.log(JSON.stringify(saveDto, null, 2));
    console.log('');

    const paper = await prisma.paper.create({
      data: {
        title: saveDto.title,
        authors: saveDto.authors as any,
        year: saveDto.year,
        abstract: saveDto.abstract,
        doi: undefined,
        url: undefined,
        venue: undefined,
        citationCount: undefined,
        userId,
        tags: undefined,
        collectionId: undefined,
        source: 'user_added',
      },
    });

    console.log('✅ Paper saved successfully!');
    console.log('Paper ID:', paper.id);
    console.log('');

    // Fetch it back
    const papers = await prisma.paper.findMany({
      where: { userId },
    });

    console.log(`User has ${papers.length} papers total`);

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    if (error.code) {
      console.error('Prisma Error Code:', error.code);
    }
    if (error.meta) {
      console.error('Meta:', JSON.stringify(error.meta, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

testWithNewUser();
