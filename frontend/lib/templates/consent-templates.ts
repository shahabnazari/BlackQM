export interface ConsentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  fields: string[];
  category: 'irb-standard' | 'hipaa' | 'gdpr' | 'minimal';
  requiresSignature: boolean;
}

export const consentTemplates: ConsentTemplate[] = [
  {
    id: 'irb-standard',
    name: 'IRB Standard Consent',
    description: 'Standard IRB-approved consent form for academic research',
    category: 'irb-standard',
    requiresSignature: true,
    content: `
      <h2>INFORMED CONSENT TO PARTICIPATE IN RESEARCH</h2>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Study Title:</strong> [STUDY_TITLE]</p>
        <p><strong>Principal Investigator:</strong> [PI_NAME], [PI_CREDENTIALS]</p>
        <p><strong>Institution:</strong> [INSTITUTION]</p>
        <p><strong>IRB Protocol Number:</strong> [IRB_NUMBER]</p>
        <p><strong>Date:</strong> [DATE]</p>
      </div>
      
      <h3>1. PURPOSE OF THE STUDY</h3>
      <p>[STUDY_PURPOSE]</p>
      
      <h3>2. PROCEDURES</h3>
      <p>If you agree to participate in this research study, you will be asked to:</p>
      <ul>
        <li>[PROCEDURE_1]</li>
        <li>[PROCEDURE_2]</li>
        <li>[PROCEDURE_3]</li>
      </ul>
      <p>The total time commitment is approximately <strong>[DURATION]</strong>.</p>
      
      <h3>3. RISKS AND BENEFITS</h3>
      <p><strong>Risks:</strong> [RISKS_DESCRIPTION]</p>
      <p><strong>Benefits:</strong> [BENEFITS_DESCRIPTION]</p>
      
      <h3>4. CONFIDENTIALITY</h3>
      <p>[CONFIDENTIALITY_STATEMENT]</p>
      <p>Your data will be stored securely and only accessible to the research team. Data will be retained for [RETENTION_PERIOD] and then destroyed.</p>
      
      <h3>5. COMPENSATION</h3>
      <p>[COMPENSATION_DETAILS]</p>
      
      <h3>6. VOLUNTARY PARTICIPATION AND WITHDRAWAL</h3>
      <p>Your participation in this research is <strong>completely voluntary</strong>. You may refuse to participate or withdraw at any time without penalty or loss of benefits. Your decision will not affect your current or future relationship with [INSTITUTION].</p>
      
      <h3>7. CONTACT INFORMATION</h3>
      <p><strong>For questions about this research:</strong><br/>
      Contact [PI_NAME] at [PI_EMAIL] or [PI_PHONE]</p>
      
      <p><strong>For questions about your rights as a research participant:</strong><br/>
      Contact the Institutional Review Board at [IRB_CONTACT]</p>
      
      <h3>8. CONSENT</h3>
      <p>By clicking "I Agree" below and providing your signature, you confirm that:</p>
      <ul>
        <li>You have read and understood the information provided above</li>
        <li>You voluntarily agree to participate in this research study</li>
        <li>You are at least 18 years of age</li>
        <li>You understand you may withdraw at any time</li>
      </ul>
    `,
    fields: [
      'STUDY_TITLE',
      'PI_NAME',
      'PI_CREDENTIALS',
      'INSTITUTION',
      'IRB_NUMBER',
      'DATE',
      'STUDY_PURPOSE',
      'PROCEDURE_1',
      'PROCEDURE_2',
      'PROCEDURE_3',
      'DURATION',
      'RISKS_DESCRIPTION',
      'BENEFITS_DESCRIPTION',
      'CONFIDENTIALITY_STATEMENT',
      'RETENTION_PERIOD',
      'COMPENSATION_DETAILS',
      'PI_EMAIL',
      'PI_PHONE',
      'IRB_CONTACT',
    ],
  },
  {
    id: 'hipaa',
    name: 'HIPAA Compliant Consent',
    description: 'HIPAA-compliant consent for healthcare research',
    category: 'hipaa',
    requiresSignature: true,
    content: `
      <h2>AUTHORIZATION TO USE AND DISCLOSE PROTECTED HEALTH INFORMATION FOR RESEARCH</h2>
      
      <p style="background: #fef3c7; padding: 10px; border-radius: 8px;">
        <strong>⚕️ This form complies with HIPAA Privacy Rule (45 CFR 164.508)</strong>
      </p>
      
      <h3>RESEARCH INFORMATION</h3>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
        <p><strong>Study Title:</strong> [STUDY_TITLE]</p>
        <p><strong>Sponsor:</strong> [SPONSOR]</p>
        <p><strong>Principal Investigator:</strong> [PI_NAME], [PI_CREDENTIALS]</p>
        <p><strong>Institution:</strong> [INSTITUTION]</p>
      </div>
      
      <h3>PROTECTED HEALTH INFORMATION (PHI) TO BE USED/DISCLOSED</h3>
      <p>The following types of health information may be used or disclosed for this research:</p>
      <ul>
        <li>[PHI_TYPE_1]</li>
        <li>[PHI_TYPE_2]</li>
        <li>[PHI_TYPE_3]</li>
        <li>[PHI_TYPE_4]</li>
      </ul>
      
      <h3>PURPOSE OF USE/DISCLOSURE</h3>
      <p>[PURPOSE_DESCRIPTION]</p>
      
      <h3>WHO MAY USE/RECEIVE YOUR PHI</h3>
      <p>Your PHI may be used by and/or disclosed to:</p>
      <ul>
        <li>The Principal Investigator and research team</li>
        <li>The Institutional Review Board</li>
        <li>[ADDITIONAL_RECIPIENT_1]</li>
        <li>[ADDITIONAL_RECIPIENT_2]</li>
      </ul>
      
      <h3>AUTHORIZATION EXPIRATION</h3>
      <p>This authorization expires on <strong>[EXPIRATION_DATE]</strong> or when the research study ends, whichever comes first.</p>
      
      <h3>YOUR RIGHTS</h3>
      <ul>
        <li>You may refuse to sign this authorization</li>
        <li>You may revoke this authorization at any time by written notice to [REVOCATION_CONTACT]</li>
        <li>Your treatment will not be affected if you refuse to sign or revoke this authorization</li>
        <li>You have the right to receive a copy of this authorization</li>
      </ul>
      
      <h3>RE-DISCLOSURE STATEMENT</h3>
      <p>Once your PHI has been disclosed to parties outside of [INSTITUTION], it may no longer be protected by federal privacy regulations.</p>
      
      <h3>SIGNATURE</h3>
      <p>I have read this form and authorize the use and disclosure of my protected health information as described above for this research study.</p>
    `,
    fields: [
      'STUDY_TITLE',
      'SPONSOR',
      'PI_NAME',
      'PI_CREDENTIALS',
      'INSTITUTION',
      'PHI_TYPE_1',
      'PHI_TYPE_2',
      'PHI_TYPE_3',
      'PHI_TYPE_4',
      'PURPOSE_DESCRIPTION',
      'ADDITIONAL_RECIPIENT_1',
      'ADDITIONAL_RECIPIENT_2',
      'EXPIRATION_DATE',
      'REVOCATION_CONTACT',
    ],
  },
  {
    id: 'gdpr',
    name: 'GDPR Compliant Consent',
    description: 'GDPR-compliant consent for EU participants',
    category: 'gdpr',
    requiresSignature: true,
    content: `
      <h2>CONSENT FOR DATA PROCESSING - GDPR COMPLIANT</h2>
      
      <p style="background: #eff6ff; padding: 10px; border-radius: 8px;">
        <strong>🇪🇺 This consent form complies with the General Data Protection Regulation (GDPR)</strong>
      </p>
      
      <h3>DATA CONTROLLER INFORMATION</h3>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
        <p><strong>Organization:</strong> [ORGANIZATION]</p>
        <p><strong>Address:</strong> [ADDRESS]</p>
        <p><strong>Data Protection Officer:</strong> [DPO_NAME]</p>
        <p><strong>Contact:</strong> [DPO_CONTACT]</p>
      </div>
      
      <h3>PURPOSE OF DATA PROCESSING</h3>
      <p>[PROCESSING_PURPOSE]</p>
      
      <h3>LEGAL BASIS FOR PROCESSING</h3>
      <p>The legal basis for processing your personal data is your explicit consent (Article 6(1)(a) GDPR).</p>
      
      <h3>CATEGORIES OF PERSONAL DATA</h3>
      <p>We will collect and process the following categories of personal data:</p>
      <ul>
        <li>[DATA_CATEGORY_1]</li>
        <li>[DATA_CATEGORY_2]</li>
        <li>[DATA_CATEGORY_3]</li>
        <li>[DATA_CATEGORY_4]</li>
      </ul>
      
      <h3>DATA RETENTION</h3>
      <p>Your personal data will be retained for <strong>[RETENTION_PERIOD]</strong> and then securely deleted in accordance with our data retention policy.</p>
      
      <h3>DATA RECIPIENTS</h3>
      <p>Your data may be shared with:</p>
      <ul>
        <li>[RECIPIENT_1]</li>
        <li>[RECIPIENT_2]</li>
      </ul>
      
      <h3>INTERNATIONAL DATA TRANSFERS</h3>
      <p>[TRANSFER_STATEMENT]</p>
      
      <h3>YOUR RIGHTS UNDER GDPR</h3>
      <p>You have the following rights regarding your personal data:</p>
      <ul>
        <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
        <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
        <li><strong>Right to Restrict Processing:</strong> Request limitation of processing</li>
        <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
        <li><strong>Right to Object:</strong> Object to certain types of processing</li>
        <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time</li>
      </ul>
      
      <p>To exercise any of these rights, contact: [RIGHTS_CONTACT]</p>
      
      <h3>RIGHT TO LODGE A COMPLAINT</h3>
      <p>You have the right to lodge a complaint with the supervisory authority: [SUPERVISORY_AUTHORITY]</p>
      
      <h3>CONSENT DECLARATION</h3>
      <p>By clicking "I Consent" and providing your signature below, you:</p>
      <ul>
        <li>Confirm you have read and understood this information</li>
        <li>Freely give your informed consent to the processing of your personal data as described</li>
        <li>Understand you may withdraw consent at any time without giving a reason</li>
      </ul>
    `,
    fields: [
      'ORGANIZATION',
      'ADDRESS',
      'DPO_NAME',
      'DPO_CONTACT',
      'PROCESSING_PURPOSE',
      'DATA_CATEGORY_1',
      'DATA_CATEGORY_2',
      'DATA_CATEGORY_3',
      'DATA_CATEGORY_4',
      'RETENTION_PERIOD',
      'RECIPIENT_1',
      'RECIPIENT_2',
      'TRANSFER_STATEMENT',
      'RIGHTS_CONTACT',
      'SUPERVISORY_AUTHORITY',
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal Consent',
    description: 'Simple consent form for low-risk studies',
    category: 'minimal',
    requiresSignature: false,
    content: `
      <h2>Consent to Participate</h2>
      
      <h3>Study Information</h3>
      <p><strong>Study:</strong> [STUDY_TITLE]</p>
      <p><strong>Researcher:</strong> [RESEARCHER_NAME]</p>
      <p><strong>Organization:</strong> [ORGANIZATION]</p>
      
      <h3>What We're Asking</h3>
      <p>[STUDY_DESCRIPTION]</p>
      
      <h3>Time Required</h3>
      <p>This study will take approximately <strong>[DURATION]</strong> minutes.</p>
      
      <h3>Your Privacy</h3>
      <p>Your responses will be kept confidential and anonymous. No personally identifiable information will be collected.</p>
      
      <h3>Voluntary Participation</h3>
      <p>Your participation is voluntary. You may stop at any time without penalty.</p>
      
      <h3>Contact</h3>
      <p>Questions? Contact [CONTACT_EMAIL]</p>
      
      <h3>Agreement</h3>
      <p>By clicking "I Agree" below, you confirm that:</p>
      <ul>
        <li>You are at least 18 years old</li>
        <li>You understand the study information</li>
        <li>You voluntarily agree to participate</li>
      </ul>
    `,
    fields: [
      'STUDY_TITLE',
      'RESEARCHER_NAME',
      'ORGANIZATION',
      'STUDY_DESCRIPTION',
      'DURATION',
      'CONTACT_EMAIL',
    ],
  },
];

export function getConsentTemplateById(id: string): ConsentTemplate | undefined {
  return consentTemplates.find((template) => template.id === id);
}

export function getConsentTemplatesByCategory(category: string): ConsentTemplate[] {
  return consentTemplates.filter((template) => template.category === category);
}

export function fillConsentTemplate(template: string, values: Record<string, string>): string {
  let filled = template;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    filled = filled.replace(regex, value);
  });
  return filled;
}