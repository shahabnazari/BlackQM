'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Brain,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// ScrollArea component with proper typing
interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className = '',
}) => <div className={`overflow-auto ${className}`}>{children}</div>;
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  themeToSurveyService,
  Theme,
  SurveyItem,
  GenerateSurveyItemsOptions,
} from '@/lib/api/services/theme-to-survey.service';
import { toast } from 'sonner';

import type { ImportableItem } from '@/lib/types/questionnaire-import.types';

export interface ThemeImportModalProps {
  onClose: () => void;
  onImport: (items: ImportableItem[]) => void;
  currentSectionId?: string;
}

export const ThemeImportModal: React.FC<ThemeImportModalProps> = ({
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'preview' | 'settings'>(
    'themes'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [generatedItems, setGeneratedItems] = useState<SurveyItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generation settings
  const [itemType, setItemType] =
    useState<GenerateSurveyItemsOptions['itemType']>('mixed');
  const [scaleType, setScaleType] =
    useState<GenerateSurveyItemsOptions['scaleType']>('1-5');
  const [itemsPerTheme, setItemsPerTheme] = useState(3);
  const [includeReverseCoded, setIncludeReverseCoded] = useState(true);
  const [researchContext, setResearchContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('General population');

  // Load saved themes on mount
  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setIsLoading(true);
    try {
      const savedThemes = await themeToSurveyService.getUserThemes();
      setThemes(savedThemes.length > 0 ? savedThemes : getMockThemes());
    } catch (error) {
      console.error('Failed to load themes:', error);
      setThemes(getMockThemes());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockThemes = (): Theme[] => [
    {
      id: 'theme-1',
      name: 'Environmental Responsibility',
      description:
        'Individual and collective actions toward environmental protection and sustainability',
      prevalence: 0.85,
      confidence: 0.92,
      sources: [
        {
          id: 'p1',
          title: 'Climate Action and Individual Behavior',
          type: 'paper',
        },
        { id: 'p2', title: 'Sustainable Living Practices', type: 'paper' },
      ],
      keyPhrases: [
        'recycling',
        'carbon footprint',
        'renewable energy',
        'conservation',
      ],
      subthemes: [
        {
          name: 'Personal Actions',
          description: 'Individual behaviors for environmental protection',
        },
        {
          name: 'Policy Support',
          description: 'Support for environmental policies and regulations',
        },
      ],
    },
    {
      id: 'theme-2',
      name: 'Digital Transformation Impact',
      description:
        'Effects of digital technology on work, education, and social interactions',
      prevalence: 0.78,
      confidence: 0.88,
      sources: [
        { id: 'p3', title: 'Remote Work and Productivity', type: 'paper' },
        { id: 'v1', title: 'The Future of Digital Education', type: 'video' },
      ],
      keyPhrases: [
        'remote work',
        'online learning',
        'digital divide',
        'virtual collaboration',
      ],
      subthemes: [
        {
          name: 'Work-Life Balance',
          description: 'Impact on work-life boundaries',
        },
        {
          name: 'Digital Skills',
          description: 'Required competencies for digital age',
        },
      ],
    },
    {
      id: 'theme-3',
      name: 'Health and Wellbeing',
      description:
        'Physical and mental health considerations in modern society',
      prevalence: 0.91,
      confidence: 0.94,
      sources: [
        { id: 'p4', title: 'Mental Health in the Workplace', type: 'paper' },
        { id: 'p5', title: 'Preventive Healthcare Strategies', type: 'paper' },
      ],
      keyPhrases: [
        'mental health',
        'wellness',
        'stress management',
        'preventive care',
      ],
    },
  ];

  const toggleTheme = (themeId: string) => {
    const newSelected = new Set(selectedThemes);
    if (newSelected.has(themeId)) {
      newSelected.delete(themeId);
    } else {
      newSelected.add(themeId);
    }
    setSelectedThemes(newSelected);
  };

  const toggleExpanded = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  const selectAllThemes = () => {
    setSelectedThemes(new Set(themes.map(t => t.id)));
  };

  const deselectAllThemes = () => {
    setSelectedThemes(new Set());
  };

  const generateSurveyItems = async () => {
    if (selectedThemes.size === 0) {
      toast.error('Please select at least one theme');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedThemesList = themes.filter(t => selectedThemes.has(t.id));

      const result = await themeToSurveyService.generateSurveyItems({
        themes: selectedThemesList,
        itemType,
        ...(scaleType && { scaleType }),
        itemsPerTheme,
        includeReverseCoded,
        researchContext,
        targetAudience,
      });

      setGeneratedItems(result.items);
      setSelectedItems(new Set(result.items.map(item => item.id)));
      setActiveTab('preview');

      toast.success(
        `Generated ${result.items.length} survey items from ${selectedThemes.size} themes`
      );
    } catch (error) {
      console.error('Failed to generate survey items:', error);
      toast.error('Failed to generate survey items. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(generatedItems.map(item => item.id)));
  };

  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  const handleImport = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to import');
      return;
    }

    const itemsToImport = generatedItems.filter(item =>
      selectedItems.has(item.id)
    );
    const questionnaireItems =
      themeToSurveyService.convertToQuestionnaireFormat(itemsToImport);

    onImport(questionnaireItems);
    toast.success(`Imported ${selectedItems.size} items to questionnaire`);
    onClose();
  };

  const filteredThemes = themes.filter(
    theme =>
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full mx-4 h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-500" />
              Import from Themes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Convert extracted themes into survey items
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={v =>
            setActiveTab(v as 'themes' | 'preview' | 'settings')
          }
          className="flex-1 flex flex-col"
        >
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="themes" className="flex-1">
              1. Select Themes
              {selectedThemes.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedThemes.size}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              2. Generation Settings
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex-1"
              disabled={generatedItems.length === 0}
            >
              3. Preview & Select
              {generatedItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedItems.size}/{generatedItems.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Theme Selection Tab */}
          <TabsContent value="themes" className="flex-1 flex flex-col p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search themes..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchQuery(e.target.value)
                    }
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAllThemes}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllThemes}>
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredThemes.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No themes found. Extract themes from literature first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredThemes.map(theme => (
                    <Card
                      key={theme.id}
                      className={cn(
                        'p-4 transition-all',
                        selectedThemes.has(theme.id) &&
                          'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedThemes.has(theme.id)}
                            onCheckedChange={() => toggleTheme(theme.id)}
                            className="mt-1"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {theme.name}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(theme.confidence * 100)}% confidence
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(theme.prevalence * 100)}% prevalence
                              </Badge>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {theme.description}
                            </p>

                            {theme.keyPhrases &&
                              theme.keyPhrases.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {theme.keyPhrases.map(phrase => (
                                    <Badge
                                      key={phrase}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {phrase}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                            <button
                              onClick={() => toggleExpanded(theme.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {expandedThemes.has(theme.id) ? (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  Hide details
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3 h-3" />
                                  Show details
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {expandedThemes.has(theme.id) && (
                          <div className="ml-7 space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            {theme.sources && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Sources ({theme.sources.length}):
                                </p>
                                <div className="space-y-1">
                                  {theme.sources.map(source => (
                                    <div
                                      key={source.id}
                                      className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span className="truncate">
                                        {source.title}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {source.type}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {theme.subthemes && theme.subthemes.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Subthemes:
                                </p>
                                <div className="space-y-1">
                                  {theme.subthemes.map(subtheme => (
                                    <div
                                      key={subtheme.name}
                                      className="text-xs"
                                    >
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {subtheme.name}:
                                      </span>{' '}
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {subtheme.description}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <Label>Item Type</Label>
                <Select
                  value={itemType}
                  onValueChange={v =>
                    setItemType(v as GenerateSurveyItemsOptions['itemType'])
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                    <SelectItem value="likert">Likert Scales Only</SelectItem>
                    <SelectItem value="multiple_choice">
                      Multiple Choice Only
                    </SelectItem>
                    <SelectItem value="semantic_differential">
                      Semantic Differential
                    </SelectItem>
                    <SelectItem value="matrix_grid">
                      Matrix/Grid Questions
                    </SelectItem>
                    <SelectItem value="rating_scale">Rating Scales</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Mixed type generates a variety of question formats
                </p>
              </div>

              <div>
                <Label>Scale Type</Label>
                <RadioGroup
                  value={scaleType || '1-5'}
                  onValueChange={v =>
                    setScaleType(v as GenerateSurveyItemsOptions['scaleType'])
                  }
                >
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      '1-5',
                      '1-7',
                      '1-10',
                      'agree-disagree',
                      'frequency',
                      'satisfaction',
                    ].map(scale => (
                      <div key={scale} className="flex items-center space-x-2">
                        <RadioGroupItem value={scale} id={scale} />
                        <Label htmlFor={scale} className="text-sm capitalize">
                          {scale.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Items Per Theme</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={itemsPerTheme}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setItemsPerTheme(parseInt(e.target.value) || 3)
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">
                    Will generate ~{selectedThemes.size * itemsPerTheme} items
                    total
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reverse"
                  checked={includeReverseCoded}
                  onCheckedChange={checked =>
                    setIncludeReverseCoded(checked as boolean)
                  }
                />
                <Label htmlFor="reverse" className="text-sm">
                  Include reverse-coded items for reliability
                </Label>
              </div>

              <div>
                <Label>Research Context (Optional)</Label>
                <Input
                  placeholder="e.g., Environmental attitudes in urban communities"
                  value={researchContext}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResearchContext(e.target.value)
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Target Audience</Label>
                <Input
                  placeholder="e.g., College students, Healthcare professionals"
                  value={targetAudience}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTargetAudience(e.target.value)
                  }
                  className="mt-2"
                />
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1 flex flex-col p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedItems.size} of {generatedItems.length} items selected
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllItems}>
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllItems}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {generatedItems.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No items generated yet. Select themes and click Generate.
                    </AlertDescription>
                  </Alert>
                ) : (
                  generatedItems.map((item, index) => (
                    <Card
                      key={item.id}
                      className={cn(
                        'p-4 transition-all',
                        selectedItems.has(item.id) &&
                          'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="mt-1"
                        />

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{index + 1}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {item.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.themeName}
                            </Badge>
                            {item.reversed && (
                              <Badge
                                variant="outline"
                                className="text-xs border-orange-300 text-orange-600"
                              >
                                Reverse-coded
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-2">
                            {item.text}
                          </p>

                          {item.scaleLabels && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {item.scaleLabels.map((label, i) => (
                                <React.Fragment key={i}>
                                  <span>{label}</span>
                                  {i < item.scaleLabels!.length - 1 && (
                                    <span>•</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}

                          {item.options && (
                            <div className="space-y-1 mt-2">
                              {item.options.map((option, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                >
                                  <Square className="w-3 h-3" />
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.leftPole && item.rightPole && (
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                              <span>{item.leftPole}</span>
                              <span className="text-gray-400">↔</span>
                              <span>{item.rightPole}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {activeTab === 'themes' && selectedThemes.size > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedThemes.size} theme
                {selectedThemes.size !== 1 ? 's' : ''} selected
              </p>
            )}
            {activeTab === 'preview' && generatedItems.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to import {selectedItems.size} item
                {selectedItems.size !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>

            {activeTab === 'themes' && (
              <Button
                onClick={() => setActiveTab('settings')}
                disabled={selectedThemes.size === 0}
              >
                Next: Settings
              </Button>
            )}

            {activeTab === 'settings' && (
              <Button
                onClick={generateSurveyItems}
                disabled={selectedThemes.size === 0 || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Items
                  </>
                )}
              </Button>
            )}

            {activeTab === 'preview' && (
              <Button
                onClick={handleImport}
                disabled={selectedItems.size === 0}
              >
                Import {selectedItems.size} Item
                {selectedItems.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
