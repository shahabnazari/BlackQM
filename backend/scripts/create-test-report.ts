/**
 * Create Test Report - For API Testing
 * Creates a minimal report record for testing collaboration features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmh6vkojt0001iabd38vlcs7d'; // researcher@test.com
  const studyId = 'cmhb52mig0008qlq2ee758c97'; // Test study we created

  console.log('Creating minimal test report...');

  const report = await prisma.report.create({
    data: {
      userId,
      studyId,
      status: 'draft',
      templateType: 'apa',
      format: 'html',
      metadata: {
        title: 'Integration Test Report for Collaboration Features',
        authors: ['Researcher User'],
        institution: 'Test University',
        date: new Date().toISOString(),
        version: 1,
        studyId,
      },
      sections: [
        {
          id: 'abstract',
          title: 'Abstract',
          content: '<p>This is a test abstract for integration testing.</p>',
          order: 1,
          wordCount: 8,
        },
        {
          id: 'introduction',
          title: 'Introduction',
          content: '<p>This is a test introduction section.</p>',
          order: 2,
          wordCount: 6,
        },
        {
          id: 'methods',
          title: 'Methods',
          content: '<p>Test methods section for collaboration testing.</p>',
          order: 3,
          wordCount: 7,
        },
      ],
      provenance: [],
      content:
        '<h1>Integration Test Report for Collaboration Features</h1><h2>Abstract</h2><p>This is a test abstract for integration testing.</p><h2>Introduction</h2><p>This is a test introduction section.</p><h2>Methods</h2><p>Test methods section for collaboration testing.</p>',
    },
  });

  console.log('✅ Test report created successfully!');
  console.log(`   Report ID: ${report.id}`);
  console.log(`   Title: ${(report.metadata as any).title}`);
  console.log(`   Status: ${report.status}`);
  console.log(`   Format: ${report.format}`);
  console.log(
    '\nYou can now test collaboration endpoints with this report ID.',
  );

  return report;
}

main()
  .then((report) => {
    console.log('\nReport ready for testing!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating test report:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
