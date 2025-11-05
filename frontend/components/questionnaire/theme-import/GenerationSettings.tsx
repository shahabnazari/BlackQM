/**
 * Generation Settings Component
 * Extracted from ThemeImportModal for better organization
 * Phase 10 Day 5.9 - Enterprise Grade
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GenerateSurveyItemsOptions } from '@/lib/api/services/theme-to-survey.service';

interface GenerationSettingsProps {
  itemType: GenerateSurveyItemsOptions['itemType'];
  scaleType: GenerateSurveyItemsOptions['scaleType'];
  itemsPerTheme: number;
  includeReverseCoded: boolean;
  researchContext: string;
  targetAudience: string;
  selectedThemesCount: number;
  onItemTypeChange: (value: GenerateSurveyItemsOptions['itemType']) => void;
  onScaleTypeChange: (value: GenerateSurveyItemsOptions['scaleType']) => void;
  onItemsPerThemeChange: (value: number) => void;
  onReverseCodedChange: (value: boolean) => void;
  onResearchContextChange: (value: string) => void;
  onTargetAudienceChange: (value: string) => void;
}

const ITEM_TYPES: Array<{ value: GenerateSurveyItemsOptions['itemType']; label: string }> = [
  { value: 'mixed', label: 'Mixed (Recommended)' },
  { value: 'likert', label: 'Likert Scales Only' },
  { value: 'multiple_choice', label: 'Multiple Choice Only' },
  { value: 'semantic_differential', label: 'Semantic Differential' },
  { value: 'matrix_grid', label: 'Matrix/Grid Questions' },
  { value: 'rating_scale', label: 'Rating Scales' },
];

const SCALE_TYPES = [
  '1-5', '1-7', '1-10', 'agree-disagree', 'frequency', 'satisfaction'
] as const;

export const GenerationSettings: React.FC<GenerationSettingsProps> = ({
  itemType,
  scaleType,
  itemsPerTheme,
  includeReverseCoded,
  researchContext,
  targetAudience,
  selectedThemesCount,
  onItemTypeChange,
  onScaleTypeChange,
  onItemsPerThemeChange,
  onReverseCodedChange,
  onResearchContextChange,
  onTargetAudienceChange,
}) => {
  const handleItemsPerThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const clampedValue = Math.max(1, Math.min(10, value));
    onItemsPerThemeChange(clampedValue);
  };

  const handleScaleTypeRadioChange = (value: string) => {
    onScaleTypeChange(value as GenerateSurveyItemsOptions['scaleType']);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Item Type Selection */}
      <div>
        <Label htmlFor="item-type">Item Type</Label>
        <Select
          value={itemType}
          onValueChange={onItemTypeChange}
        >
          <SelectTrigger id="item-type" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEM_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Mixed type generates a variety of question formats for comprehensive coverage
        </p>
      </div>

      {/* Scale Type Selection */}
      <div>
        <Label>Scale Type</Label>
        <RadioGroup
          value={scaleType || '1-5'}
          onValueChange={handleScaleTypeRadioChange}
        >
          <div className="grid grid-cols-2 gap-3 mt-2">
            {SCALE_TYPES.map(scale => (
              <div key={scale} className="flex items-center space-x-2">
                <RadioGroupItem value={scale} id={scale} />
                <Label
                  htmlFor={scale}
                  className="text-sm capitalize cursor-pointer"
                >
                  {(scale || '').replace('-', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        <p className="text-xs text-gray-500 mt-1">
          Choose the scale format that best fits your research methodology
        </p>
      </div>

      {/* Items Per Theme */}
      <div>
        <Label htmlFor="items-per-theme">Items Per Theme</Label>
        <div className="flex items-center gap-4 mt-2">
          <Input
            id="items-per-theme"
            type="number"
            min={1}
            max={10}
            value={itemsPerTheme}
            onChange={handleItemsPerThemeChange}
            className="w-24"
            aria-label="Number of items to generate per theme"
          />
          <span className="text-sm text-gray-500">
            Will generate ~{selectedThemesCount * itemsPerTheme} items total
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Recommended: 3-5 items per theme for balanced coverage
        </p>
      </div>

      {/* Reverse Coded Items */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="reverse-coded"
          checked={includeReverseCoded}
          onCheckedChange={(checked) => onReverseCodedChange(checked as boolean)}
        />
        <div className="flex-1">
          <Label htmlFor="reverse-coded" className="text-sm cursor-pointer">
            Include reverse-coded items for reliability
          </Label>
          <p className="text-xs text-gray-500 mt-1">
            Helps detect response bias and improves scale reliability (recommended)
          </p>
        </div>
      </div>

      {/* Research Context */}
      <div>
        <Label htmlFor="research-context">Research Context (Optional)</Label>
        <Input
          id="research-context"
          placeholder="e.g., Environmental attitudes in urban communities"
          value={researchContext}
          onChange={(e) => onResearchContextChange(e.target.value)}
          className="mt-2"
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">
          Provides context for more relevant item generation
        </p>
      </div>

      {/* Target Audience */}
      <div>
        <Label htmlFor="target-audience">Target Audience</Label>
        <Input
          id="target-audience"
          placeholder="e.g., College students, Healthcare professionals"
          value={targetAudience}
          onChange={(e) => onTargetAudienceChange(e.target.value)}
          className="mt-2"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">
          Helps tailor language and complexity to your participants
        </p>
      </div>
    </div>
  );
};