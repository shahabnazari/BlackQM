/**
 * Mock Data Generator for Air Pollution Study
 * Phase 6.6: Enterprise Testing
 *
 * This script generates:
 * - 1 Study about air pollution
 * - 25 Text stimuli
 * - 30 Participant responses with Q-sorts
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Air Pollution Stimuli (25 statements)
const AIR_POLLUTION_STIMULI = [
  {
    id: 'AP001',
    text: 'Electric vehicles should completely replace gasoline cars by 2030',
  },
  {
    id: 'AP002',
    text: 'Industrial emissions are the primary cause of urban air pollution',
  },
  {
    id: 'AP003',
    text: 'Individual actions matter more than government regulations',
  },
  {
    id: 'AP004',
    text: 'Public transportation investment is more important than electric cars',
  },
  {
    id: 'AP005',
    text: "Air quality monitoring apps change people's daily behavior",
  },
  { id: 'AP006', text: 'Carbon taxes effectively reduce industrial emissions' },
  {
    id: 'AP007',
    text: 'Indoor air pollution is as serious as outdoor pollution',
  },
  {
    id: 'AP008',
    text: 'Cities should ban diesel vehicles from downtown areas',
  },
  {
    id: 'AP009',
    text: 'Tree planting programs significantly improve air quality',
  },
  {
    id: 'AP010',
    text: 'Work-from-home policies reduce air pollution more than expected',
  },
  { id: 'AP011', text: 'Air purifiers should be mandatory in all schools' },
  {
    id: 'AP012',
    text: 'Developing countries cannot afford strict emission standards',
  },
  {
    id: 'AP013',
    text: 'Nuclear power is necessary to eliminate coal emissions',
  },
  {
    id: 'AP014',
    text: 'Bicycle infrastructure reduces car dependency effectively',
  },
  {
    id: 'AP015',
    text: 'Air pollution causes more deaths than traffic accidents',
  },
  { id: 'AP016', text: 'Green building standards should be legally required' },
  { id: 'AP017', text: 'Citizens should sue governments for poor air quality' },
  {
    id: 'AP018',
    text: 'Technology will solve pollution without lifestyle changes',
  },
  { id: 'AP019', text: 'Economic growth requires accepting some pollution' },
  { id: 'AP020', text: 'Air quality should determine property values' },
  { id: 'AP021', text: 'Factory locations should require community approval' },
  { id: 'AP022', text: 'Masks are effective protection against air pollution' },
  { id: 'AP023', text: 'Children should stay indoors on high pollution days' },
  {
    id: 'AP024',
    text: 'Renewable energy can fully replace fossil fuels by 2040',
  },
  {
    id: 'AP025',
    text: 'Air pollution monitoring should be real-time and public',
  },
];

// Q-Sort grid configuration (-4 to +4)
const Q_SORT_GRID = {
  '-4': 2, // Most Disagree (2 items)
  '-3': 3, // Strongly Disagree (3 items)
  '-2': 4, // Disagree (4 items)
  '-1': 4, // Slightly Disagree (4 items)
  '0': 5, // Neutral (5 items)
  '1': 4, // Slightly Agree (4 items)
  '2': 4, // Agree (4 items)
  '3': 3, // Strongly Agree (3 items)
  '4': 2, // Most Agree (2 items)
};

// Pre-defined personas for realistic responses
const PERSONAS = [
  { type: 'environmentalist', bias: [1, 2, 1, -2, 1, 2, 1, 2, 1, 1] },
  { type: 'industrialist', bias: [-1, -2, -1, 1, -1, -2, 0, -1, 0, -1] },
  { type: 'pragmatist', bias: [0, 0, 1, 1, 0, 0, 0, 0, 0, 0] },
  { type: 'technologist', bias: [2, 0, -1, 0, 2, 1, 0, 1, 0, 1] },
  { type: 'skeptic', bias: [-1, -1, 0, 0, -1, -1, -1, -1, -1, -1] },
];

// Demographics generator
function generateDemographics() {
  const age = faker.number.int({ min: 18, max: 75 });
  const education = faker.helpers.arrayElement([
    'High School',
    'Some College',
    "Bachelor's",
    "Master's",
    'PhD',
  ]);
  const occupation = faker.helpers.arrayElement([
    'Student',
    'Teacher',
    'Engineer',
    'Healthcare',
    'Business',
    'Government',
    'Retired',
    'Self-employed',
    'Unemployed',
    'Other',
  ]);
  const location = faker.helpers.arrayElement(['Urban', 'Suburban', 'Rural']);

  return {
    age,
    gender: faker.helpers.arrayElement([
      'Male',
      'Female',
      'Non-binary',
      'Prefer not to say',
    ]),
    education,
    occupation,
    location,
    country: faker.location.country(),
    hasAsthma: faker.datatype.boolean({ probability: 0.15 }),
    hasChildren: faker.datatype.boolean({ probability: 0.4 }),
    ownsVehicle: faker.datatype.boolean({ probability: 0.7 }),
    usesPublicTransport: faker.datatype.boolean({ probability: 0.3 }),
  };
}

// Generate realistic Q-sort based on persona
function generateQSort(persona: (typeof PERSONAS)[0]) {
  const items = [...Array(25)].map((_, i) => i + 1);
  const placements: Record<number, number> = {};

  // Shuffle items with persona bias
  const shuffled = items.sort(() => {
    const bias = persona.bias[Math.floor(Math.random() * persona.bias.length)];
    return Math.random() - 0.5 + bias * 0.2;
  });

  let itemIndex = 0;

  // Place items according to Q-sort grid
  for (const [position, count] of Object.entries(Q_SORT_GRID)) {
    for (let i = 0; i < count; i++) {
      if (itemIndex < shuffled.length) {
        placements[shuffled[itemIndex]] = parseInt(position);
        itemIndex++;
      }
    }
  }

  return placements;
}

// Generate comments for extreme placements
function generateComments(
  qSort: Record<number, number>
): Record<string, string> {
  const comments: Record<string, string> = {};

  // Find items in extreme positions
  const extremeItems = Object.entries(qSort)
    .filter(([_, position]) => Math.abs(position) >= 3)
    .map(([item, position]) => ({ item: parseInt(item), position }));

  for (const { item, position } of extremeItems) {
    const stimulus = AIR_POLLUTION_STIMULI[item - 1];
    if (Math.random() > 0.5) {
      // 50% chance of comment
      if (position >= 3) {
        comments[`AP${String(item).padStart(3, '0')}`] =
          faker.helpers.arrayElement([
            'This is absolutely critical for our future.',
            'I strongly believe this based on personal experience.',
            'This aligns perfectly with scientific evidence.',
            'My community has seen the direct benefits of this.',
            'This is the most important issue we face.',
          ]);
      } else if (position <= -3) {
        comments[`AP${String(item).padStart(3, '0')}`] =
          faker.helpers.arrayElement([
            'This is completely unrealistic and impractical.',
            "I've seen evidence that contradicts this entirely.",
            'This would cause more harm than good.',
            'This ignores economic realities.',
            'This is based on flawed assumptions.',
          ]);
      }
    }
  }

  return comments;
}

// Main data generation function
async function generateMockData() {
  console.log('🚀 Starting mock data generation for Air Pollution Study...');

  try {
    // 1. Create researcher account
    console.log('Creating researcher account...');
    const researcher = await prisma.user.upsert({
      where: { email: 'researcher@test.com' },
      update: {},
      create: {
        email: 'researcher@test.com',
        password: '$2a$10$K7L1OJ0TfUqGJ7h8Ky0QYOqGJ7h8Ky0QYOqG', // "password123"
        firstName: 'Test',
        lastName: 'Researcher',
        role: 'researcher',
        emailVerified: true,
      },
    });

    // 2. Create the study
    console.log('Creating Air Pollution Study...');
    const study = await prisma.study.create({
      data: {
        title: 'Public Perception of Air Pollution Solutions',
        description:
          'Understanding public attitudes toward various air pollution mitigation strategies and policies.',
        researcherId: researcher.id,
        status: 'active',
        token: 'AIR-POLLUTION-2025',
        config: {
          gridConfig: {
            min: -4,
            max: 4,
            distribution: Q_SORT_GRID,
          },
          steps: [
            { id: 1, type: 'welcome', title: 'Welcome' },
            { id: 2, type: 'consent', title: 'Consent' },
            { id: 3, type: 'demographics', title: 'About You' },
            { id: 4, type: 'instructions', title: 'Instructions' },
            { id: 5, type: 'initial-sort', title: 'Initial Sort' },
            { id: 6, type: 'q-sort', title: 'Q-Sort' },
            { id: 7, type: 'post-sort', title: 'Reflection' },
            { id: 8, type: 'completion', title: 'Thank You' },
          ],
          preSurvey: [
            {
              id: 'concern',
              type: 'likert',
              question: 'How concerned are you about air pollution?',
              scale: [
                'Not at all',
                'Slightly',
                'Moderately',
                'Very',
                'Extremely',
              ],
            },
            {
              id: 'affected',
              type: 'yesno',
              question: 'Has air pollution personally affected your health?',
            },
          ],
          postSurvey: [
            {
              id: 'difficulty',
              type: 'likert',
              question: 'How difficult was it to sort the statements?',
              scale: [
                'Very Easy',
                'Easy',
                'Moderate',
                'Difficult',
                'Very Difficult',
              ],
            },
            {
              id: 'changed',
              type: 'text',
              question: 'Did this exercise change your perspective? How?',
            },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 3. Create stimuli
    console.log('Creating 25 air pollution stimuli...');
    const stimuli = await Promise.all(
      AIR_POLLUTION_STIMULI.map((stimulus, index) =>
        prisma.stimulus.create({
          data: {
            studyId: study.id,
            identifier: stimulus.id,
            content: stimulus.text,
            type: 'text',
            order: index + 1,
          },
        })
      )
    );

    // 4. Generate 30 participant responses
    console.log('Generating 30 participant responses...');

    for (let i = 1; i <= 30; i++) {
      // Create participant
      const participant = await prisma.user.create({
        data: {
          email: `participant${i}@test.com`,
          password: '$2a$10$K7L1OJ0TfUqGJ7h8Ky0QYOqGJ7h8Ky0QYOqG',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: 'participant',
          emailVerified: true,
        },
      });

      // Select persona
      const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      const demographics = generateDemographics();
      const qSort = generateQSort(persona);
      const comments = generateComments(qSort);

      // Create study response
      const response = await prisma.studyResponse.create({
        data: {
          studyId: study.id,
          participantId: participant.id,
          status: 'completed',
          startedAt: faker.date.recent({ days: 7 }),
          completedAt: faker.date.recent({ days: 1 }),
          demographics,
          preSurveyResponses: {
            concern: faker.helpers.arrayElement([2, 3, 4, 5]),
            affected: faker.datatype.boolean({ probability: 0.3 }),
          },
          postSurveyResponses: {
            difficulty: faker.helpers.arrayElement([1, 2, 3]),
            changed: faker.lorem.sentence(),
          },
        },
      });

      // Create Q-sort data
      await Promise.all(
        Object.entries(qSort).map(([itemIndex, position]) =>
          prisma.qSortItem.create({
            data: {
              responseId: response.id,
              stimulusId: stimuli[parseInt(itemIndex) - 1].id,
              position,
              comment:
                comments[`AP${String(itemIndex).padStart(3, '0')}`] || null,
            },
          })
        )
      );

      console.log(
        `  ✓ Participant ${i}/30 created (${participant.firstName} ${participant.lastName})`
      );
    }

    // 5. Generate analysis data
    console.log('Generating analysis metadata...');

    await prisma.analysisSession.create({
      data: {
        studyId: study.id,
        researcherId: researcher.id,
        type: 'factor-analysis',
        status: 'ready',
        config: {
          extractionMethod: 'pca',
          rotationMethod: 'varimax',
          numberOfFactors: 3,
        },
        results: {
          factorsExtracted: 3,
          varianceExplained: 0.67,
          eigenvalues: [8.2, 3.1, 2.4],
        },
      },
    });

    console.log('\n✅ Mock data generation complete!');
    console.log('📊 Summary:');
    console.log(`  - Study: "${study.title}"`);
    console.log(`  - Token: ${study.token}`);
    console.log(`  - Stimuli: ${stimuli.length} statements`);
    console.log(`  - Participants: 30 with complete responses`);
    console.log('\n🔗 Access URLs:');
    console.log(`  - Researcher Dashboard: http://localhost:3000/dashboard`);
    console.log(`  - Study Management: http://localhost:3000/studies`);
    console.log(`  - Analytics: http://localhost:3000/analytics`);
    console.log(`  - Q-Analysis: http://localhost:3000/analysis/q-methodology`);
    console.log(
      `  - Participant Join: http://localhost:3000/join (Token: ${study.token})`
    );
    console.log('\n📧 Test Credentials:');
    console.log(`  - Researcher: researcher@test.com / password123`);
    console.log(
      `  - Participants: participant1@test.com to participant30@test.com / password123`
    );
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the generator
generateMockData()
  .then(() => {
    console.log('\n🎉 Mock data generation successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
