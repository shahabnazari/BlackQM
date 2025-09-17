import { QuestionType } from '@/lib/types/questionnaire';

export interface QuestionTypeInfo {
  type: QuestionType;
  label: string;
  icon: string;
  description: string;
  category: string;
}

export const questionTypesByCategory: Record<string, QuestionTypeInfo[]> = {
  'Basic': [
    {
      type: QuestionType.TEXT_SHORT,
      label: 'Short Text',
      icon: '✏️',
      description: 'Single line text response',
      category: 'Basic'
    },
    {
      type: QuestionType.TEXT_LONG,
      label: 'Long Text',
      icon: '📝',
      description: 'Multi-line text response',
      category: 'Basic'
    },
    {
      type: QuestionType.NUMBER,
      label: 'Number',
      icon: '🔢',
      description: 'Numeric input',
      category: 'Basic'
    },
    {
      type: QuestionType.EMAIL,
      label: 'Email',
      icon: '✉️',
      description: 'Email address input',
      category: 'Basic'
    },
    {
      type: QuestionType.URL,
      label: 'URL',
      icon: '🔗',
      description: 'Website URL input',
      category: 'Basic'
    },
    {
      type: QuestionType.DATE,
      label: 'Date',
      icon: '📅',
      description: 'Date picker',
      category: 'Basic'
    },
    {
      type: QuestionType.TIME,
      label: 'Time',
      icon: '⏰',
      description: 'Time picker',
      category: 'Basic'
    }
  ],
  'Choice': [
    {
      type: QuestionType.MULTIPLE_CHOICE_SINGLE,
      label: 'Single Choice',
      icon: '⭕',
      description: 'Select one option',
      category: 'Choice'
    },
    {
      type: QuestionType.MULTIPLE_CHOICE_MULTI,
      label: 'Multiple Choice',
      icon: '☑️',
      description: 'Select multiple options',
      category: 'Choice'
    },
    {
      type: QuestionType.DROPDOWN,
      label: 'Dropdown',
      icon: '📋',
      description: 'Dropdown selection',
      category: 'Choice'
    },
    {
      type: QuestionType.YES_NO,
      label: 'Yes/No',
      icon: '👍',
      description: 'Binary choice',
      category: 'Choice'
    }
  ],
  'Scale': [
    {
      type: QuestionType.LIKERT_SCALE,
      label: 'Likert Scale',
      icon: '📊',
      description: 'Agreement scale',
      category: 'Scale'
    },
    {
      type: QuestionType.RATING_SCALE,
      label: 'Rating',
      icon: '⭐',
      description: 'Numeric rating',
      category: 'Scale'
    },
    {
      type: QuestionType.SLIDER_SCALE,
      label: 'Slider',
      icon: '🎚️',
      description: 'Sliding scale',
      category: 'Scale'
    },
    {
      type: QuestionType.NET_PROMOTER_SCORE,
      label: 'NPS',
      icon: '💯',
      description: 'Net Promoter Score',
      category: 'Scale'
    }
  ],
  'Advanced': [
    {
      type: QuestionType.RANKING,
      label: 'Ranking',
      icon: '🏆',
      description: 'Rank items in order',
      category: 'Advanced'
    },
    {
      type: QuestionType.MATRIX_GRID,
      label: 'Matrix',
      icon: '⚡',
      description: 'Grid of questions',
      category: 'Advanced'
    },
    {
      type: QuestionType.FILE_UPLOAD,
      label: 'File Upload',
      icon: '📎',
      description: 'Upload files',
      category: 'Advanced'
    },
    {
      type: QuestionType.IMAGE_UPLOAD,
      label: 'Image Upload',
      icon: '🖼️',
      description: 'Upload images',
      category: 'Advanced'
    }
  ]
};

export const getAllQuestionTypes = (): QuestionTypeInfo[] => {
  return Object.values(questionTypesByCategory).flat();
};

export const getQuestionTypeInfo = (type: QuestionType): QuestionTypeInfo | undefined => {
  return getAllQuestionTypes().find(info => info.type === type);
};