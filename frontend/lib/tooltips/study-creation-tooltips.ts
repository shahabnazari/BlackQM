export interface TooltipContent {
  title: string;
  content: string;
  examples?: string[];
  link?: {
    text: string;
    href: string;
  };
}

export const studyCreationTooltips: Record<string, TooltipContent> = {
  studyTitle: {
    title: 'Study Title Best Practices',
    content: 'Keep your title concise (10-100 characters) and descriptive. Avoid jargon and make it appealing to potential participants.',
    examples: [
      'Perceptions of Climate Change Solutions',
      'Healthcare Decision-Making Preferences',
      'Urban Planning Priorities Survey',
      'Student Learning Experience Study',
    ],
    link: {
      text: 'View title guidelines',
      href: '/docs/study-titles',
    },
  },
  
  studyDescription: {
    title: 'Study Description Guidelines',
    content: 'Provide a brief overview (50-500 characters) of your study\'s purpose and what participants will do. This helps with recruitment.',
    examples: [
      'Explore public opinions on renewable energy policies',
      'Understand patient preferences for treatment options',
      'Investigate teacher perspectives on educational technology',
    ],
  },
  
  welcomeMessage: {
    title: 'Welcome Message Guidelines',
    content: 'Your welcome message sets the tone. Include: purpose, time estimate, what participants will do, and why their input matters. Keep it between 100-1000 characters.',
    examples: [
      'Start with a warm greeting',
      'Explain the study purpose clearly',
      'Mention the estimated time (be accurate)',
      'Thank them for their participation',
    ],
    link: {
      text: 'View welcome message templates',
      href: '/templates/welcome',
    },
  },
  
  consentForm: {
    title: 'Consent Form Requirements',
    content: 'Consent forms must meet ethical and legal standards. Use templates for IRB, HIPAA, or GDPR compliance. Required length: 500-5000 characters.',
    examples: [
      'Study purpose and procedures',
      'Risks and benefits clearly stated',
      'Confidentiality and data protection',
      'Voluntary participation statement',
      'Contact information for questions',
      'Right to withdraw without penalty',
    ],
    link: {
      text: 'Browse consent templates',
      href: '/templates/consent',
    },
  },
  
  preScreening: {
    title: 'Pre-screening Questions',
    content: 'Pre-screening questions help filter participants based on specific criteria. Participants who don\'t meet your requirements will be politely excluded from the study.',
    examples: [
      'Age requirements (e.g., 18+ years)',
      'Geographic location restrictions',
      'Professional background or expertise',
      'Experience with specific topics',
      'Language proficiency requirements',
      'Availability for follow-up',
    ],
    link: {
      text: 'Learn about pre-screening',
      href: '/docs/pre-screening',
    },
  },
  
  postSurvey: {
    title: 'Post-Survey Questions',
    content: 'Post-survey questions gather additional context after the Q-sort is complete. These help interpret the sorting patterns and provide demographic data.',
    examples: [
      'Demographics (age, gender, education)',
      'Open-ended reflection on sorting choices',
      'Likert scales for related attitudes',
      'Multiple choice for categorization',
      'Ranking questions for priorities',
      'Comments on specific placements',
    ],
    link: {
      text: 'View question types',
      href: '/docs/question-types',
    },
  },
  
  videoConferencing: {
    title: 'Video Conferencing Support',
    content: 'Enable video interviews or think-aloud sessions during the Q-sort. Participants can join via integrated video chat while completing the study.',
    examples: [
      'Real-time think-aloud protocols',
      'Post-sort interviews',
      'Clarification of sorting decisions',
      'Deeper qualitative insights',
    ],
  },
  
  gridColumns: {
    title: 'Q-Sort Grid Configuration',
    content: 'The number of columns determines the range of your Q-sort scale. Most studies use 9-11 columns for optimal discrimination.',
    examples: [
      '9 columns: -4 to +4 (most common)',
      '11 columns: -5 to +5 (more discrimination)',
      '7 columns: -3 to +3 (simpler sorting)',
      '13 columns: -6 to +6 (expert participants)',
    ],
  },
  
  distributionShape: {
    title: 'Distribution Shape Options',
    content: 'The distribution shape determines how many cards can be placed in each column.',
    examples: [
      'Forced: Fixed number per column (most rigorous)',
      'Quasi-Normal: Bell curve shape (recommended)',
      'Free: Unlimited placement (least structured)',
    ],
    link: {
      text: 'Learn about distributions',
      href: '/docs/q-sort-distributions',
    },
  },
  
  digitalSignature: {
    title: 'Digital Signature Options',
    content: 'Collect legally-binding signatures for consent forms. Choose from typed, drawn, or uploaded signatures.',
    examples: [
      'Typed: Converts name to signature font',
      'Drawn: Touch or mouse signature pad',
      'Upload: Pre-existing signature image',
    ],
  },
  
  organizationLogo: {
    title: 'Organization Branding',
    content: 'Add your institution or company logo to consent forms for professional appearance and trust building.',
    examples: [
      'University logos for academic research',
      'Company logos for market research',
      'Hospital logos for healthcare studies',
      'NGO logos for social research',
    ],
  },
  
  templates: {
    title: 'Using Templates',
    content: 'Templates provide pre-written, compliant text that you can customize. Fill in the bracketed fields with your specific information.',
    examples: [
      'IRB Standard: For university research',
      'HIPAA: For healthcare data',
      'GDPR: For EU participants',
      'Market Research: For consumer studies',
    ],
    link: {
      text: 'Browse all templates',
      href: '/templates',
    },
  },
};

export function getTooltip(key: string): TooltipContent | undefined {
  return studyCreationTooltips[key];
}