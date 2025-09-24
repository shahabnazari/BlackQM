import { PrismaClient, Role, SurveyStatus, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.response.deleteMany();
  await prisma.question.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      emailVerified: true,
      tenantId: 'test-tenant',
    },
  });

  const researcherUser = await prisma.user.create({
    data: {
      email: 'researcher@test.com',
      password: hashedPassword,
      name: 'Researcher User',
      role: Role.RESEARCHER,
      emailVerified: true,
      tenantId: 'test-tenant',
    },
  });

  const participantUser = await prisma.user.create({
    data: {
      email: 'participant@test.com',
      password: hashedPassword,
      name: 'Participant User',
      role: Role.PARTICIPANT,
      emailVerified: true,
      tenantId: 'test-tenant',
    },
  });

  console.log('✅ Created test users');

  // Create a test survey with Q-methodology setup
  const survey = await prisma.survey.create({
    data: {
      title: 'Climate Change Perspectives Study',
      description:
        'A Q-methodology study exploring different perspectives on climate change and environmental policies.',
      createdBy: researcherUser.id,
      status: SurveyStatus.ACTIVE,
      settings: {
        qSort: {
          enabled: true,
          gridShape: 'pyramid',
          minValue: -4,
          maxValue: 4,
          columns: [1, 2, 3, 4, 5, 4, 3, 2, 1], // Pyramid shape
          forcedDistribution: true,
        },
        consent: {
          required: true,
          text: 'I understand this study uses Q-methodology and my responses will be analyzed.',
        },
        demographics: {
          age: { required: true, type: 'range', min: 18, max: 100 },
          gender: {
            required: true,
            type: 'select',
            options: ['Male', 'Female', 'Other', 'Prefer not to say'],
          },
          education: { required: false, type: 'select' },
        },
      },
      questions: {
        create: [
          // Q-sort statements
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Climate change is primarily caused by human activities.',
            order: 1,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Economic growth should be prioritized over environmental protection.',
            order: 2,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Individual actions can make a significant difference in combating climate change.',
            order: 3,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Governments should impose strict regulations on carbon emissions.',
            order: 4,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Renewable energy is a viable replacement for fossil fuels.',
            order: 5,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Climate change effects are exaggerated by the media.',
            order: 6,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Future generations will find technological solutions to climate problems.',
            order: 7,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Developed nations should bear more responsibility for climate action.',
            order: 8,
            required: true,
          },
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Climate change is a natural cycle, not influenced by humans.',
            order: 9,
            required: true,
          },
          // Post-sort questions
          {
            type: QuestionType.TEXT_ENTRY,
            text: 'Please explain why you placed the statements at the extremes of your distribution.',
            order: 10,
            required: true,
            validation: { minLength: 50 },
          },
          {
            type: QuestionType.LIKERT_SCALE,
            text: 'How confident are you in your sorting decisions?',
            order: 11,
            required: true,
            options: [
              'Very unconfident',
              'Unconfident',
              'Neutral',
              'Confident',
              'Very confident',
            ],
          },
          {
            type: QuestionType.MULTIPLE_CHOICE_SINGLE,
            text: 'What is your primary source of information about climate change?',
            order: 12,
            required: true,
            options: [
              'Scientific journals',
              'News media',
              'Social media',
              'Educational institutions',
              'Government sources',
            ],
          },
        ],
      },
    },
  });

  console.log('✅ Created test survey with Q-sort statements');

  // Create test responses
  const participantResponse = await prisma.response.create({
    data: {
      surveyId: survey.id,
      participantId: participantUser.id,
      sessionCode: 'test-session-001',
      createdAt: new Date(),
      demographics: {
        age: 28,
        gender: 'Female',
        education: 'Bachelors',
      },
      timeSpent: 450, // seconds
    },
  });

  console.log('✅ Created test responses');

  // Create PQMethod benchmark data for validation
  const benchmarkSurvey = await prisma.survey.create({
    data: {
      title: 'PQMethod Benchmark Study',
      description:
        'Reference dataset for validating statistical calculations against PQMethod.',
      createdBy: researcherUser.id,
      status: SurveyStatus.ENDED,
      settings: {
        qSort: {
          enabled: true,
          gridShape: 'pyramid',
          minValue: -3,
          maxValue: 3,
          columns: [2, 3, 4, 5, 4, 3, 2], // Standard distribution
          forcedDistribution: true,
        },
        benchmark: {
          isPQMethodReference: true,
          expectedFactors: 3,
          expectedEigenvalues: [3.45, 2.12, 1.89],
          expectedVariance: [28.7, 17.6, 15.7],
        },
      },
    },
  });

  console.log('✅ Created PQMethod benchmark survey');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@test.com / TestPassword123!');
  console.log('Researcher: researcher@test.com / TestPassword123!');
  console.log('Participant: participant@test.com / TestPassword123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
