import React from 'react';
import { SingleChoiceQuestion } from './SingleChoice';
import { MultipleChoiceQuestion } from './MultipleChoice';
import { DropdownQuestion } from './Dropdown';
import { TextShortQuestion } from './TextShort';
import { TextLongQuestion } from './TextLong';
import { LikertScaleQuestion } from './LikertScale';
import { SliderScaleQuestion } from './SliderScale';
import { RatingScaleQuestion } from './RatingScale';
import { NetPromoterScoreQuestion } from './NetPromoterScore';
import { MatrixGridQuestion } from './MatrixGrid';
import { RankingQuestion } from './Ranking';
import { MaxDiffQuestion } from './MaxDiff';
import { ConstantSumQuestion } from './ConstantSum';
import { SemanticDifferentialQuestion } from './SemanticDifferential';
import { CardSortQuestion } from './CardSort';
import { ImageChoiceQuestion } from './ImageChoice';
import { HeatMapQuestion } from './HeatMap';
import { VideoResponseQuestion } from './VideoResponse';
import { FileUploadQuestion } from './FileUpload';
import { SignatureCaptureQuestion } from './SignatureCapture';
import { DateTimeQuestion } from './DateTime';
import { NumericEntryQuestion } from './NumericEntry';
import { QuestionType, QuestionComponentProps } from '@/lib/types/questionnaire';

// Import individual question components

// Map question types to components
const questionComponents: Record<QuestionType, React.FC<QuestionComponentProps>> = {
  [QuestionType.MULTIPLE_CHOICE_SINGLE]: SingleChoiceQuestion,
  [QuestionType.MULTIPLE_CHOICE_MULTI]: MultipleChoiceQuestion,
  [QuestionType.DROPDOWN]: DropdownQuestion,
  [QuestionType.TEXT_SHORT]: TextShortQuestion,
  [QuestionType.TEXT_LONG]: TextLongQuestion,
  [QuestionType.LIKERT_SCALE]: LikertScaleQuestion,
  [QuestionType.SLIDER_SCALE]: SliderScaleQuestion,
  [QuestionType.RATING_SCALE]: RatingScaleQuestion,
  [QuestionType.NET_PROMOTER_SCORE]: NetPromoterScoreQuestion,
  [QuestionType.MATRIX_GRID]: MatrixGridQuestion,
  [QuestionType.RANKING]: RankingQuestion,
  [QuestionType.MAX_DIFF]: MaxDiffQuestion,
  [QuestionType.CONSTANT_SUM]: ConstantSumQuestion,
  [QuestionType.SEMANTIC_DIFFERENTIAL]: SemanticDifferentialQuestion,
  [QuestionType.CARD_SORT]: CardSortQuestion,
  [QuestionType.IMAGE_CHOICE]: ImageChoiceQuestion,
  [QuestionType.HEAT_MAP]: HeatMapQuestion,
  [QuestionType.VIDEO_RESPONSE]: VideoResponseQuestion,
  [QuestionType.FILE_UPLOAD]: FileUploadQuestion,
  [QuestionType.SIGNATURE_CAPTURE]: SignatureCaptureQuestion,
  [QuestionType.DATE_TIME]: DateTimeQuestion,
  [QuestionType.NUMERIC_ENTRY]: NumericEntryQuestion
}

// Question renderer component
export const QuestionRenderer: React.FC<QuestionComponentProps> = (props: any) => {
  const Component = questionComponents[props.question.type];

  if (!Component) {
    console.error(`Unknown question type: ${props.question.type}`);
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Unknown question type: {props.question.type}
        </p>
      </div>
    )
  }

  return <Component {...props} />;
}

// Export all question components
export * from './SingleChoice';
export * from './MultipleChoice';
export * from './Dropdown';
export * from './TextShort';
export * from './TextLong';
export * from './LikertScale';
export * from './SliderScale';
export * from './RatingScale';
export * from './NetPromoterScore';
export * from './MatrixGrid';
export * from './Ranking';
export * from './MaxDiff';
export * from './ConstantSum';
export * from './SemanticDifferential';
export * from './CardSort';
export * from './ImageChoice';
export * from './HeatMap';
export * from './VideoResponse';
export * from './FileUpload';
export * from './SignatureCapture';
export * from './DateTime';
export * from './NumericEntry';

// Question type metadata for the builder
export const questionTypeMetadata = {
  [QuestionType.MULTIPLE_CHOICE_SINGLE]: {
    label: 'Single Choice',
    description: 'Select one option from a list',
    icon: '🔘',
    category: 'Basic'
  },
  [QuestionType.MULTIPLE_CHOICE_MULTI]: {
    label: 'Multiple Choice',
    description: 'Select multiple options from a list',
    icon: '☑️',
    category: 'Basic'
  },
  [QuestionType.DROPDOWN]: {
    label: 'Dropdown',
    description: 'Select from a dropdown menu',
    icon: '📝',
    category: 'Basic'
  },
  [QuestionType.TEXT_SHORT]: {
    label: 'Short Text',
    description: 'Single line text input',
    icon: '💬',
    category: 'Basic'
  },
  [QuestionType.TEXT_LONG]: {
    label: 'Long Text',
    description: 'Multi-line text input',
    icon: '📄',
    category: 'Basic'
  },
  [QuestionType.LIKERT_SCALE]: {
    label: 'Likert Scale',
    description: 'Agreement scale (Strongly Disagree to Strongly Agree)',
    icon: '📊',
    category: 'Scale'
  },
  [QuestionType.SLIDER_SCALE]: {
    label: 'Slider',
    description: 'Continuous or stepped scale',
    icon: '🎚️',
    category: 'Scale'
  },
  [QuestionType.RATING_SCALE]: {
    label: 'Rating',
    description: 'Star or numeric rating',
    icon: '⭐',
    category: 'Scale'
  },
  [QuestionType.NET_PROMOTER_SCORE]: {
    label: 'NPS',
    description: 'Net Promoter Score (0-10)',
    icon: '📈',
    category: 'Scale'
  },
  [QuestionType.MATRIX_GRID]: {
    label: 'Matrix Grid',
    description: 'Multiple items with same scale',
    icon: '🔲',
    category: 'Advanced'
  },
  [QuestionType.RANKING]: {
    label: 'Ranking',
    description: 'Order items by preference',
    icon: '🔢',
    category: 'Advanced'
  },
  [QuestionType.MAX_DIFF]: {
    label: 'MaxDiff',
    description: 'Best-Worst scaling',
    icon: '⚖️',
    category: 'Advanced'
  },
  [QuestionType.CONSTANT_SUM]: {
    label: 'Constant Sum',
    description: 'Allocate points or percentages',
    icon: '💯',
    category: 'Advanced'
  },
  [QuestionType.SEMANTIC_DIFFERENTIAL]: {
    label: 'Semantic Differential',
    description: 'Bipolar adjective scale',
    icon: '↔️',
    category: 'Advanced'
  },
  [QuestionType.CARD_SORT]: {
    label: 'Card Sort',
    description: 'Categorize items',
    icon: '🗂️',
    category: 'Advanced'
  },
  [QuestionType.IMAGE_CHOICE]: {
    label: 'Image Choice',
    description: 'Select from images',
    icon: '🖼️',
    category: 'Multimedia'
  },
  [QuestionType.HEAT_MAP]: {
    label: 'Heat Map',
    description: 'Click on image areas',
    icon: '🗺️',
    category: 'Multimedia'
  },
  [QuestionType.VIDEO_RESPONSE]: {
    label: 'Video Response',
    description: 'Record video answer',
    icon: '📹',
    category: 'Multimedia'
  },
  [QuestionType.FILE_UPLOAD]: {
    label: 'File Upload',
    description: 'Upload files',
    icon: '📎',
    category: 'Specialized'
  },
  [QuestionType.SIGNATURE_CAPTURE]: {
    label: 'Signature',
    description: 'Draw or type signature',
    icon: '✍️',
    category: 'Specialized'
  },
  [QuestionType.DATE_TIME]: {
    label: 'Date & Time',
    description: 'Select date and/or time',
    icon: '📅',
    category: 'Specialized'
  },
  [QuestionType.NUMERIC_ENTRY]: {
    label: 'Number',
    description: 'Numeric input',
    icon: '🔢',
    category: 'Specialized'
  }
}

// Group question types by category
export const questionTypesByCategory = Object.entries(questionTypeMetadata).reduce(
  (acc, [type, metadata]) => {
    const category = metadata.category;
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push({
      type: type as QuestionType,
      ...metadata
    })
    return acc;
  },
  {} as Record<string, Array<{ type: QuestionType } & (typeof questionTypeMetadata)[QuestionType]>>
)

export const index = questionTypesByCategory;
export default index;
