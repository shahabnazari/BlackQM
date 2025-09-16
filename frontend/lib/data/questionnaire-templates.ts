import { QuestionType } from '@/lib/types/questionnaire';

export const questionnaireTemplates = {
  'csat-1': {
    id: 'csat-1',
    name: 'Customer Satisfaction Survey',
    questions: [
      {
        type: QuestionType.RATING_SCALE,
        text: 'Overall, how satisfied are you with our product/service?',
        required: true,
        settings: {
          min: 1,
          max: 5,
          minLabel: 'Very Dissatisfied',
          maxLabel: 'Very Satisfied'
        }
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'How likely are you to continue using our product/service?',
        required: true,
        settings: {
          scale: ['Very Unlikely', 'Unlikely', 'Neutral', 'Likely', 'Very Likely']
        }
      },
      {
        type: QuestionType.MULTIPLE_CHOICE_MULTI,
        text: 'Which aspects of our product/service do you find most valuable?',
        required: false,
        options: [
          { text: 'Quality', value: 'quality' },
          { text: 'Price', value: 'price' },
          { text: 'Customer Service', value: 'service' },
          { text: 'Features', value: 'features' },
          { text: 'Reliability', value: 'reliability' },
          { text: 'User Experience', value: 'ux' }
        ]
      },
      {
        type: QuestionType.TEXT_LONG,
        text: 'What improvements would you like to see in our product/service?',
        required: false,
        settings: {
          placeholder: 'Please share your suggestions...',
          maxLength: 500
        }
      },
      {
        type: QuestionType.NET_PROMOTER_SCORE,
        text: 'How likely are you to recommend our product/service to a friend or colleague?',
        required: true
      }
    ]
  },
  'csat-2': {
    id: 'csat-2',
    name: 'Net Promoter Score (NPS)',
    questions: [
      {
        type: QuestionType.NET_PROMOTER_SCORE,
        text: 'How likely are you to recommend our company to a friend or colleague?',
        required: true
      },
      {
        type: QuestionType.TEXT_LONG,
        text: 'What is the primary reason for your score?',
        required: true,
        settings: {
          placeholder: 'Please explain your rating...',
          maxLength: 300
        }
      },
      {
        type: QuestionType.MULTIPLE_CHOICE_SINGLE,
        text: 'What could we do to improve your experience?',
        required: false,
        options: [
          { text: 'Better customer support', value: 'support' },
          { text: 'More features', value: 'features' },
          { text: 'Better pricing', value: 'pricing' },
          { text: 'Improved user interface', value: 'ui' },
          { text: 'Faster performance', value: 'performance' },
          { text: 'Other', value: 'other' }
        ]
      }
    ]
  },
  'emp-1': {
    id: 'emp-1',
    name: 'Employee Engagement Survey',
    questions: [
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'I am satisfied with my current role and responsibilities',
        required: true,
        settings: {
          scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        }
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'I feel valued and appreciated by my manager',
        required: true,
        settings: {
          scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        }
      },
      {
        type: QuestionType.RATING_SCALE,
        text: 'How would you rate the work-life balance at our company?',
        required: true,
        settings: {
          min: 1,
          max: 10,
          minLabel: 'Poor',
          maxLabel: 'Excellent'
        }
      },
      {
        type: QuestionType.MULTIPLE_CHOICE_MULTI,
        text: 'Which of the following would improve your job satisfaction?',
        required: false,
        options: [
          { text: 'Better compensation', value: 'compensation' },
          { text: 'More flexible hours', value: 'flexibility' },
          { text: 'Career development opportunities', value: 'development' },
          { text: 'Better communication', value: 'communication' },
          { text: 'Recognition programs', value: 'recognition' },
          { text: 'Team building activities', value: 'teambuilding' }
        ]
      },
      {
        type: QuestionType.TEXT_LONG,
        text: 'What changes would make you more likely to recommend our company as a great place to work?',;
        required: false,
        settings: {
          placeholder: 'Share your thoughts...',;
          maxLength: 500
        }
      }
    ]
  },
  'market-1': {
    id: 'market-1',;
    name: 'Market Research Survey',;
    questions: [
      {
        type: QuestionType.DROPDOWN,;
        text: 'What is your age group?',;
        required: true,
        options: [
          { text: '18-24', value: '18-24' },
          { text: '25-34', value: '25-34' },
          { text: '35-44', value: '35-44' },
          { text: '45-54', value: '45-54' },
          { text: '55-64', value: '55-64' },
          { text: '65+', value: '65+' }
        ]
      },
      {
        type: QuestionType.MULTIPLE_CHOICE_SINGLE,
        text: 'How often do you purchase products in our category?',;
        required: true,
        options: [
          { text: 'Daily', value: 'daily' },
          { text: 'Weekly', value: 'weekly' },
          { text: 'Monthly', value: 'monthly' },
          { text: 'Quarterly', value: 'quarterly' },
          { text: 'Rarely', value: 'rarely' },
          { text: 'Never', value: 'never' }
        ]
      },
      {
        type: QuestionType.RANKING,;
        text: 'Please rank these factors by importance when making a purchase decision',;
        required: true,
        options: [
          { text: 'Price', value: 'price' },
          { text: 'Quality', value: 'quality' },
          { text: 'Brand reputation', value: 'brand' },
          { text: 'Customer reviews', value: 'reviews' },
          { text: 'Features', value: 'features' }
        ]
      },
      {
        type: QuestionType.MATRIX_GRID,
        text: 'Please rate your satisfaction with the following aspects',
        required: true,
        settings: {
          rows: [
            { text: 'Product Quality', value: 'quality' },
            { text: 'Customer Service', value: 'service' },
            { text: 'Value for Money', value: 'value' },
            { text: 'Delivery Speed', value: 'delivery' }
          ],
          columns: [
            { text: 'Very Poor', value: '1' },
            { text: 'Poor', value: '2' },
            { text: 'Average', value: '3' },
            { text: 'Good', value: '4' },
            { text: 'Excellent', value: '5' }
          ]
        }
      }
    ]
  },
  'academic-1': {
    id: 'academic-1',;
    name: 'Course Evaluation Survey',;
    questions: [
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'The course objectives were clear and well-defined',;
        required: true,
        settings: {
          scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        }
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'The instructor was knowledgeable about the subject matter',;
        required: true,
        settings: {
          scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        }
      },
      {
        type: QuestionType.RATING_SCALE,
        text: 'How would you rate the overall quality of this course?',;
        required: true,
        settings: {
          min: 1,
          max: 5,;
          minLabel: 'Poor',
          maxLabel: 'Excellent'
        }
      },
      {
        type: QuestionType.MULTIPLE_CHOICE_SINGLE,
        text: 'Would you recommend this course to other students?',;
        required: true,
        options: [
          { text: 'Definitely yes', value: 'definitely_yes' },
          { text: 'Probably yes', value: 'probably_yes' },
          { text: 'Not sure', value: 'not_sure' },
          { text: 'Probably not', value: 'probably_not' },
          { text: 'Definitely not', value: 'definitely_not' }
        ]
      },
      {
        type: QuestionType.TEXT_LONG,
        text: 'What suggestions do you have for improving this course?',;
        required: false,
        settings: {
          placeholder: 'Your feedback is valuable...',;
          maxLength: 500
        }
      }
    ]
  },
  'health-1': {
    id: 'health-1',;
    name: 'Patient Satisfaction Survey',;
    questions: [
      {
        type: QuestionType.RATING_SCALE,
        text: 'How would you rate your overall experience at our facility?',;
        required: true,
        settings: {
          min: 1,
          max: 5,;
          minLabel: 'Very Poor',;
          maxLabel: 'Excellent'
        }
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'The medical staff was professional and courteous',;
        required: true,
        settings: {
          scale: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        }
      },
      {
        type: QuestionType.MULTIPLE_CHOICE_SINGLE,
        text: 'How long did you wait to see the healthcare provider?',;
        required: true,
        options: [
          { text: 'Less than 15 minutes', value: '<15' },
          { text: '15-30 minutes', value: '15-30' },
          { text: '30-60 minutes', value: '30-60' },
          { text: 'More than 60 minutes', value: '>60' }
        ]
      },
      {
        type: QuestionType.NET_PROMOTER_SCORE,
        text: 'How likely are you to recommend our facility to friends and family?',;
        required: true
      },
      {
        type: QuestionType.TEXT_LONG,
        text: 'Please share any additional comments about your visit',;
        required: false,
        settings: {
          placeholder: 'Your feedback helps us improve...',;
          maxLength: 300;
        }
      }
    ]
  }
}

export function getTemplateQuestions(templateId: string) {
  return (questionnaireTemplates as any)[templateId]?.questions || [];
}
