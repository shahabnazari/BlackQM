'use client';

import React, { FC } from 'react';
import { QuestionType, QuestionComponentProps } from '@/lib/types/questionnaire';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { VideoResponseQuestion } from './VideoResponse';

// Basic text input components
export const TextShortQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => (
  <Input
    value={value || ''}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
    disabled={disabled}
    placeholder={question.config?.placeholder}
    maxLength={question.config?.maxLength}
  />
);

export const TextLongQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => (
  <Textarea
    value={value || ''}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
    disabled={disabled}
    placeholder={question.config?.placeholder}
    rows={question.config?.rows || 4}
    maxLength={question.config?.maxLength}
  />
);

// Choice-based components
export const SingleChoiceQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => (
  <RadioGroup value={value || ''} onValueChange={onChange} disabled={disabled}>
    {question.options?.map((option) => (
      <div key={option.id} className="flex items-center space-x-2">
        <RadioGroupItem value={option.value} id={option.id} />
        <Label htmlFor={option.id}>{option.text}</Label>
      </div>
    ))}
  </RadioGroup>
);

export const MultipleChoiceQuestion: FC<QuestionComponentProps> = ({ question, value = [], onChange, disabled }) => {
  const handleChange = (optionValue: any, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((v) => v !== optionValue);
    onChange?.(newValues);
  };

  return (
    <div className="space-y-2">
      {question.options?.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={option.id}
            checked={Array.isArray(value) && value.includes(option.value)}
            onCheckedChange={(checked: boolean | "indeterminate") => handleChange(option.value, checked as boolean)}
            disabled={disabled}
          />
          <Label htmlFor={option.id}>{option.text}</Label>
        </div>
      ))}
    </div>
  );
};

export const DropdownQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => (
  <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger>
      <SelectValue placeholder={question.config?.placeholder || 'Select an option'} />
    </SelectTrigger>
    <SelectContent>
      {question.options?.map((option) => (
        <SelectItem key={option.id} value={option.value}>
          {option.text}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// Scale components
export const LikertScaleQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => {
  const min = question.config?.scaleMin || 1;
  const max = question.config?.scaleMax || 5;
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <RadioGroup value={value?.toString() || ''} onValueChange={(v: string) => onChange?.(parseInt(v))} disabled={disabled}>
      <div className="flex justify-between">
        {options.map((num) => (
          <div key={num} className="flex flex-col items-center">
            <RadioGroupItem value={num.toString()} id={`likert-${num}`} />
            <Label htmlFor={`likert-${num}`} className="mt-1">{num}</Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
};

export const SliderScaleQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => {
  const min = question.config?.scaleMin || 0;
  const max = question.config?.scaleMax || 100;
  const step = question.config?.scaleStep || 1;

  return (
    <div className="space-y-2">
      <Slider
        value={[value || min]}
        onValueChange={([v]: number[]) => onChange?.(v)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{min}</span>
        <span>{value || min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export const RatingScaleQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => {
  const max = question.config?.scaleMax || 5;
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="flex space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          onClick={() => onChange?.(star)}
          disabled={disabled}
          className={`text-2xl ${value >= star ? 'text-yellow-500' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export const NetPromoterScoreQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => {
  const options = Array.from({ length: 11 }, (_, i) => i);

  return (
    <RadioGroup value={value?.toString() || ''} onValueChange={(v: string) => onChange?.(parseInt(v))} disabled={disabled}>
      <div className="flex justify-between">
        {options.map((num) => (
          <div key={num} className="flex flex-col items-center">
            <RadioGroupItem value={num.toString()} id={`nps-${num}`} />
            <Label htmlFor={`nps-${num}`} className="mt-1">{num}</Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
};

// Specialized input components
export const NumericEntryQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => (
  <Input
    type="number"
    value={value || ''}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(parseFloat(e.target.value))}
    disabled={disabled}
    placeholder={question.config?.placeholder}
    min={question.config?.scaleMin}
    max={question.config?.scaleMax}
    step={question.config?.scaleStep}
  />
);

export const DateTimeQuestion: FC<QuestionComponentProps> = ({ question, value, onChange, disabled }) => (
  <Input
    type="datetime-local"
    value={value || ''}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
    disabled={disabled}
  />
);

// Placeholder components for complex types
const PlaceholderComponent: FC<QuestionComponentProps> = ({ question }) => (
  <div className="p-4 border rounded bg-muted">
    <p className="text-sm text-muted-foreground">
      {question.type} component not yet implemented
    </p>
  </div>
);

// Create placeholder exports for unimplemented components
export const MatrixGridQuestion = PlaceholderComponent;
export const RankingQuestion = PlaceholderComponent;
export const MaxDiffQuestion = PlaceholderComponent;
export const ConstantSumQuestion = PlaceholderComponent;
export const SemanticDifferentialQuestion = PlaceholderComponent;
export const CardSortQuestion = PlaceholderComponent;
export const ImageChoiceQuestion = PlaceholderComponent;
export const HeatMapQuestion = PlaceholderComponent;
export const FileUploadQuestion = PlaceholderComponent;
export const SignatureCaptureQuestion = PlaceholderComponent;

// Component mapping - handle all possible enum values
const questionComponents: Record<string, FC<QuestionComponentProps>> = {
  [QuestionType.TEXT_SHORT]: TextShortQuestion,
  [QuestionType.TEXT_LONG]: TextLongQuestion,
  [QuestionType.NUMERIC]: NumericEntryQuestion,
  // NUMBER and NUMERIC_ENTRY are aliases for NUMERIC, so they're automatically handled
  [QuestionType.EMAIL]: TextShortQuestion,
  [QuestionType.URL]: TextShortQuestion,
  [QuestionType.PHONE]: TextShortQuestion,
  [QuestionType.MULTIPLE_CHOICE]: SingleChoiceQuestion,
  [QuestionType.MULTIPLE_CHOICE_SINGLE]: SingleChoiceQuestion,
  [QuestionType.MULTIPLE_CHOICE_MULTI]: MultipleChoiceQuestion,
  [QuestionType.CHECKBOX]: MultipleChoiceQuestion,
  [QuestionType.DROPDOWN]: DropdownQuestion,
  [QuestionType.LIKERT_SCALE]: LikertScaleQuestion,
  [QuestionType.RATING_SCALE]: RatingScaleQuestion,
  [QuestionType.SLIDER]: SliderScaleQuestion,
  // SLIDER_SCALE is alias for SLIDER, automatically handled
  [QuestionType.DATE]: DateTimeQuestion,
  [QuestionType.TIME]: DateTimeQuestion,
  [QuestionType.DATE_TIME]: DateTimeQuestion,
  [QuestionType.FILE_UPLOAD]: FileUploadQuestion,
  [QuestionType.IMAGE_UPLOAD]: PlaceholderComponent,
  [QuestionType.SIGNATURE]: SignatureCaptureQuestion,
  // SIGNATURE_CAPTURE is alias for SIGNATURE, automatically handled
  [QuestionType.RANKING]: RankingQuestion,
  [QuestionType.MATRIX]: MatrixGridQuestion,
  // MATRIX_GRID is alias for MATRIX, automatically handled
  [QuestionType.CONSTANT_SUM]: ConstantSumQuestion,
  [QuestionType.MAX_DIFF]: MaxDiffQuestion,
  [QuestionType.CONJOINT]: PlaceholderComponent,
  [QuestionType.CARD_SORT]: CardSortQuestion,
  [QuestionType.HEAT_MAP]: HeatMapQuestion,
  [QuestionType.IMAGE_CHOICE]: ImageChoiceQuestion,
  [QuestionType.VIDEO_RESPONSE]: VideoResponseQuestion,
  [QuestionType.NET_PROMOTER_SCORE]: NetPromoterScoreQuestion,
  [QuestionType.SEMANTIC_DIFFERENTIAL]: SemanticDifferentialQuestion,
  [QuestionType.YES_NO]: SingleChoiceQuestion,
};

// Question renderer component
export const QuestionRenderer: FC<QuestionComponentProps> = (props) => {
  const Component = questionComponents[props.question.type];

  if (!Component) {
    console.error(`Unknown question type: ${props.question.type}`);
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Unknown question type: {props.question.type}
        </p>
      </div>
    );
  }

  return <Component {...props} />;
};

// Question type metadata for the builder
export const questionTypeMetadata: Record<string, any> = {
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
  },
  // Add missing types
  [QuestionType.NUMERIC]: {
    label: 'Number',
    description: 'Numeric input',
    icon: '🔢',
    category: 'Specialized'
  },
  [QuestionType.EMAIL]: {
    label: 'Email',
    description: 'Email address input',
    icon: '📧',
    category: 'Specialized'
  },
  [QuestionType.URL]: {
    label: 'URL',
    description: 'Website URL input',
    icon: '🔗',
    category: 'Specialized'
  },
  [QuestionType.PHONE]: {
    label: 'Phone',
    description: 'Phone number input',
    icon: '📱',
    category: 'Specialized'
  },
  [QuestionType.CHECKBOX]: {
    label: 'Checkbox',
    description: 'Select multiple options',
    icon: '☑️',
    category: 'Basic'
  },
  [QuestionType.MULTIPLE_CHOICE]: {
    label: 'Multiple Choice',
    description: 'Select options',
    icon: '⭕',
    category: 'Basic'
  },
  [QuestionType.SLIDER]: {
    label: 'Slider',
    description: 'Adjustable slider',
    icon: '🎚️',
    category: 'Scale'
  },
  [QuestionType.MATRIX]: {
    label: 'Matrix',
    description: 'Grid of options',
    icon: '🔲',
    category: 'Advanced'
  },
  [QuestionType.CONJOINT]: {
    label: 'Conjoint',
    description: 'Conjoint analysis',
    icon: '🔬',
    category: 'Advanced'
  },
  [QuestionType.SIGNATURE]: {
    label: 'Signature',
    description: 'Capture signature',
    icon: '✍️',
    category: 'Specialized'
  },
};

// Group question types by category
export const questionTypesByCategory = Object.entries(questionTypeMetadata).reduce(
  (acc, [type, metadata]) => {
    const category = metadata.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      type: type as QuestionType,
      ...metadata
    });
    return acc;
  },
  {} as Record<string, Array<{ type: QuestionType } & typeof questionTypeMetadata[keyof typeof questionTypeMetadata]>>
);

export default questionComponents;