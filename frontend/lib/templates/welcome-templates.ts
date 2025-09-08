export interface WelcomeTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  fields: string[];
  category: 'standard' | 'academic' | 'market-research' | 'healthcare';
}

export const welcomeTemplates: WelcomeTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Welcome',
    description: 'General purpose welcome message for most studies',
    category: 'standard',
    content: `
      <h2>Welcome to Our Research Study</h2>
      <p>Thank you for your interest in participating in this study about <strong>[TOPIC]</strong>.</p>
      <p>This study will take approximately <strong>[TIME]</strong> minutes to complete.</p>
      <p>Your responses will help us understand <strong>[PURPOSE]</strong>.</p>
      <h3>What to Expect:</h3>
      <ul>
        <li>All responses are confidential and anonymous</li>
        <li>You may withdraw at any time without penalty</li>
        <li>Your data will be securely stored and protected</li>
        <li>Results will be used for research purposes only</li>
      </ul>
      <p>We greatly appreciate your time and thoughtful participation.</p>
      <p><em>Click "Continue" to proceed to the consent form.</em></p>
    `,
    fields: ['TOPIC', 'TIME', 'PURPOSE'],
  },
  {
    id: 'academic',
    name: 'Academic Research',
    description: 'University research study with IRB information',
    category: 'academic',
    content: `
      <h2>University Research Study: [STUDY_TITLE]</h2>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Principal Investigator:</strong> [PI_NAME], [DEPARTMENT]</p>
        <p><strong>Institution:</strong> [UNIVERSITY]</p>
        <p><strong>IRB Protocol #:</strong> [IRB_NUMBER]</p>
      </div>
      
      <h3>Study Overview</h3>
      <p>You are invited to participate in a research study examining <strong>[RESEARCH_TOPIC]</strong>. 
      This study has been approved by the [UNIVERSITY] Institutional Review Board.</p>
      
      <h3>Time Commitment</h3>
      <p>Participation will require approximately <strong>[DURATION]</strong> minutes of your time.</p>
      
      <h3>What You'll Do</h3>
      <p>[STUDY_ACTIVITIES]</p>
      
      <h3>Compensation</h3>
      <p>[COMPENSATION_DETAILS]</p>
      
      <p><strong>Important:</strong> Your participation is voluntary and you may discontinue at any time without penalty.</p>
      
      <p><em>Please click "Continue" to review the informed consent form.</em></p>
    `,
    fields: [
      'STUDY_TITLE',
      'PI_NAME',
      'DEPARTMENT',
      'UNIVERSITY',
      'IRB_NUMBER',
      'RESEARCH_TOPIC',
      'DURATION',
      'STUDY_ACTIVITIES',
      'COMPENSATION_DETAILS',
    ],
  },
  {
    id: 'market-research',
    name: 'Market Research',
    description: 'Consumer opinion and market research studies',
    category: 'market-research',
    content: `
      <h2>Share Your Opinion About [PRODUCT/SERVICE]</h2>
      
      <p style="font-size: 18px;">Hello! We value your opinion and would love to hear your thoughts.</p>
      
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>🎯 Purpose:</strong> [RESEARCH_PURPOSE]</p>
        <p><strong>⏱️ Time:</strong> [DURATION] minutes</p>
        <p><strong>🎁 Incentive:</strong> [INCENTIVE_DESCRIPTION]</p>
      </div>
      
      <h3>Why Your Opinion Matters</h3>
      <p>[VALUE_PROPOSITION]</p>
      
      <h3>What We'll Ask You</h3>
      <ul>
        <li>Your preferences and opinions</li>
        <li>Your experiences with similar products/services</li>
        <li>Your feedback on new concepts</li>
      </ul>
      
      <h3>Privacy & Confidentiality</h3>
      <p>All information you provide will be kept strictly confidential and used only for research purposes. 
      Your personal information will never be sold or shared with third parties.</p>
      
      <p><strong>Ready to get started?</strong> Click "Continue" below.</p>
    `,
    fields: [
      'PRODUCT/SERVICE',
      'RESEARCH_PURPOSE',
      'DURATION',
      'INCENTIVE_DESCRIPTION',
      'VALUE_PROPOSITION',
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare Research',
    description: 'Medical and healthcare research studies',
    category: 'healthcare',
    content: `
      <h2>Healthcare Research Study: [STUDY_NAME]</h2>
      
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>⚕️ Study Sponsor:</strong> [SPONSOR]</p>
        <p><strong>👨‍⚕️ Principal Investigator:</strong> [PI_NAME], [CREDENTIALS]</p>
        <p><strong>🏥 Institution:</strong> [INSTITUTION]</p>
        <p><strong>📋 Protocol #:</strong> [PROTOCOL_NUMBER]</p>
      </div>
      
      <h3>About This Study</h3>
      <p>We are conducting research to better understand <strong>[HEALTH_TOPIC]</strong>. 
      Your participation will contribute to improving healthcare outcomes for [TARGET_POPULATION].</p>
      
      <h3>Eligibility</h3>
      <p>You may be eligible if you:</p>
      <ul>
        <li>[ELIGIBILITY_CRITERIA_1]</li>
        <li>[ELIGIBILITY_CRITERIA_2]</li>
        <li>[ELIGIBILITY_CRITERIA_3]</li>
      </ul>
      
      <h3>Study Duration</h3>
      <p>This survey will take approximately <strong>[DURATION]</strong> minutes to complete.</p>
      
      <h3>Confidentiality</h3>
      <p>Your health information will be protected in accordance with HIPAA regulations. 
      All data will be de-identified and stored securely.</p>
      
      <p><em>Please proceed to review the detailed informed consent document.</em></p>
    `,
    fields: [
      'STUDY_NAME',
      'SPONSOR',
      'PI_NAME',
      'CREDENTIALS',
      'INSTITUTION',
      'PROTOCOL_NUMBER',
      'HEALTH_TOPIC',
      'TARGET_POPULATION',
      'ELIGIBILITY_CRITERIA_1',
      'ELIGIBILITY_CRITERIA_2',
      'ELIGIBILITY_CRITERIA_3',
      'DURATION',
    ],
  },
];

export function getTemplateById(id: string): WelcomeTemplate | undefined {
  return welcomeTemplates.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: string): WelcomeTemplate[] {
  return welcomeTemplates.filter((template) => template.category === category);
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  let filled = template;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    filled = filled.replace(regex, value);
  });
  return filled;
}