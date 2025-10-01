'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import PopupModal from '@/components/ui/PopupModal';
import {
  Download,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  BookOpen,
  Users,
  Lightbulb,
  Printer,
  Mail,
  Sparkles,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';

// Types
interface ReportSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  enabled: boolean;
  wordCount?: number;
  status?: 'pending' | 'generating' | 'complete' | 'error';
  content?: string;
  aiSuggestions?: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  citationStyle: string;
  formatting: {
    fontSize: number;
    lineSpacing: number;
    margins: string;
    font: string;
  };
}

interface GenerationOptions {
  format: 'pdf' | 'word' | 'latex' | 'markdown' | 'html';
  citationStyle: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver';
  includeVisualizations: boolean;
  includeRawData: boolean;
  includeAppendices: boolean;
  language: string;
  academicLevel: 'undergraduate' | 'graduate' | 'doctoral' | 'professional';
  tone: 'formal' | 'semi-formal' | 'accessible';
  length: 'concise' | 'standard' | 'comprehensive';
}

interface ReportGenerationUIProps {
  studyId: string;
  onGenerate?: (report: any) => void;
  onExport?: (format: string, data: any) => void;
}

// Available sections
const AVAILABLE_SECTIONS: ReportSection[] = [
  {
    id: 'title_page',
    title: 'Title Page',
    description: 'Title, authors, affiliations, date',
    required: true,
    enabled: true,
  },
  {
    id: 'abstract',
    title: 'Abstract',
    description: 'Brief summary of the study (150-250 words)',
    required: true,
    enabled: true,
  },
  {
    id: 'keywords',
    title: 'Keywords',
    description: '5-7 keywords for indexing',
    required: false,
    enabled: true,
  },
  {
    id: 'introduction',
    title: 'Introduction',
    description: 'Background, problem statement, objectives',
    required: true,
    enabled: true,
  },
  {
    id: 'literature_review',
    title: 'Literature Review',
    description: 'Review of relevant research',
    required: true,
    enabled: true,
  },
  {
    id: 'theoretical_framework',
    title: 'Theoretical Framework',
    description: 'Underlying theories and concepts',
    required: false,
    enabled: true,
  },
  {
    id: 'methodology',
    title: 'Methodology',
    description: 'Research design, participants, procedures',
    required: true,
    enabled: true,
  },
  {
    id: 'results',
    title: 'Results',
    description: 'Findings and statistical analyses',
    required: true,
    enabled: true,
  },
  {
    id: 'discussion',
    title: 'Discussion',
    description: 'Interpretation of findings',
    required: true,
    enabled: true,
  },
  {
    id: 'limitations',
    title: 'Limitations',
    description: 'Study constraints and biases',
    required: false,
    enabled: true,
  },
  {
    id: 'implications',
    title: 'Implications',
    description: 'Practical and theoretical implications',
    required: false,
    enabled: true,
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    description: 'Summary and final thoughts',
    required: true,
    enabled: true,
  },
  {
    id: 'references',
    title: 'References',
    description: 'Bibliography and citations',
    required: true,
    enabled: true,
  },
  {
    id: 'appendices',
    title: 'Appendices',
    description: 'Supplementary materials',
    required: false,
    enabled: false,
  },
];

// Report templates
const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'academic_journal',
    name: 'Academic Journal Article',
    description: 'Standard format for journal submission',
    sections: ['abstract', 'keywords', 'introduction', 'literature_review', 'methodology', 'results', 'discussion', 'conclusion', 'references'],
    citationStyle: 'apa',
    formatting: {
      fontSize: 12,
      lineSpacing: 2,
      margins: '1 inch',
      font: 'Times New Roman',
    },
  },
  {
    id: 'thesis_chapter',
    name: 'Thesis/Dissertation Chapter',
    description: 'Chapter format for thesis or dissertation',
    sections: ['introduction', 'literature_review', 'theoretical_framework', 'methodology', 'results', 'discussion', 'limitations', 'implications', 'conclusion', 'references'],
    citationStyle: 'apa',
    formatting: {
      fontSize: 12,
      lineSpacing: 2,
      margins: '1.5 inch',
      font: 'Times New Roman',
    },
  },
  {
    id: 'conference_paper',
    name: 'Conference Paper',
    description: 'Format for conference proceedings',
    sections: ['abstract', 'keywords', 'introduction', 'methodology', 'results', 'discussion', 'conclusion', 'references'],
    citationStyle: 'ieee',
    formatting: {
      fontSize: 10,
      lineSpacing: 1,
      margins: '0.75 inch',
      font: 'Arial',
    },
  },
  {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'Brief report for stakeholders',
    sections: ['abstract', 'introduction', 'methodology', 'results', 'implications', 'conclusion'],
    citationStyle: 'harvard',
    formatting: {
      fontSize: 11,
      lineSpacing: 1.5,
      margins: '1 inch',
      font: 'Calibri',
    },
  },
];

export default function ReportGenerationUI({
  studyId,
  onGenerate,
  onExport,
}: ReportGenerationUIProps) {
  // State
  const [sections, setSections] = useState<ReportSection[]>(AVAILABLE_SECTIONS);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('academic_journal');
  const [options, setOptions] = useState<GenerationOptions>({
    format: 'pdf',
    citationStyle: 'apa',
    includeVisualizations: true,
    includeRawData: false,
    includeAppendices: false,
    language: 'en',
    academicLevel: 'graduate',
    tone: 'formal',
    length: 'standard',
  });
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  // Calculate statistics
  const enabledSections = sections.filter(s => s.enabled);
  const estimatedWordCount = enabledSections.reduce((sum, s) => sum + (s.wordCount || 1500), 0);
  const estimatedPages = Math.ceil(estimatedWordCount / 250);
  const estimatedTime = Math.ceil(enabledSections.length * 3); // 3 seconds per section

  // Load template
  useEffect(() => {
    const template = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      setSections(prev =>
        prev.map(section => ({
          ...section,
          enabled: template.sections.includes(section.id),
        }))
      );
      setOptions(prev => ({
        ...prev,
        citationStyle: template.citationStyle as any,
      }));
    }
  }, [selectedTemplate]);

  // Handle section toggle
  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled && !section.required }
          : section
      )
    );
  };

  // Handle generation
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setErrors([]);
    setReportUrl(null);

    try {
      // Simulate API call for each section
      for (let i = 0; i < enabledSections.length; i++) {
        const section = enabledSections[i];
        setCurrentSection(section.id);

        // Update section status
        setSections(prev =>
          prev.map(s =>
            s.id === section.id
              ? { ...s, status: 'generating' }
              : s
          )
        );

        // Simulate generation delay
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

        // Update section as complete
        setSections(prev =>
          prev.map(s =>
            s.id === section.id
              ? {
                  ...s,
                  status: 'complete',
                  content: `Generated content for ${s.title}...`,
                  wordCount: 500 + Math.floor(Math.random() * 1000),
                }
              : s
          )
        );

        // Update progress
        setGenerationProgress(((i + 1) / enabledSections.length) * 100);
      }

      // Simulate final processing
      setCurrentSection('finalizing');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Set report URL
      setReportUrl('/api/reports/download/temp-report.pdf');

      // Call callback
      onGenerate?.({
        studyId,
        sections: enabledSections,
        options,
        url: '/api/reports/download/temp-report.pdf',
      });

    } catch (error) {
      console.error('Report generation failed:', error);
      setErrors(['Failed to generate report. Please try again.']);
    } finally {
      setIsGenerating(false);
      setCurrentSection(null);
    }
  }, [studyId, enabledSections, options, onGenerate]);

  // Handle preview
  const handlePreview = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.content) return;

    setPreviewContent(section.content);
  };

  // Handle export
  const handleExport = (format: string) => {
    if (!reportUrl) return;
    onExport?.(format, { url: reportUrl, sections: enabledSections });
  };

  // Handle AI suggestions
  const handleAISuggestion = async (sectionId: string) => {
    // Simulate AI suggestion generation
    setSections(prev =>
      prev.map(s =>
        s.id === sectionId
          ? {
              ...s,
              aiSuggestions: [
                'Consider adding more context about the research background',
                'Include specific hypotheses to be tested',
                'Reference recent studies in this area',
              ],
            }
          : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report Generator</CardTitle>
              <CardDescription>
                Generate comprehensive academic reports from your study data
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{enabledSections.length}</p>
              <p className="text-sm text-gray-600">Sections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">~{estimatedWordCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Words</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">~{estimatedPages}</p>
              <p className="text-sm text-gray-600">Pages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">~{estimatedTime}s</p>
              <p className="text-sm text-gray-600">Generation Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="col-span-2 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Template</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                className="space-y-3"
              >
                {REPORT_TEMPLATES.map(template => (
                  <div key={template.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={template.id} id={template.id} />
                    <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Sections</CardTitle>
              <CardDescription>
                Select which sections to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {sections.map(section => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={section.enabled}
                            disabled={section.required}
                            onCheckedChange={() => toggleSection(section.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="text-left">
                            <p className="font-medium">
                              {section.title}
                              {section.required && (
                                <Badge variant="secondary" className="ml-2">
                                  Required
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {section.description}
                            </p>
                          </div>
                        </div>
                        {section.status && (
                          <Badge
                            variant={
                              section.status === 'complete' ? 'default' :
                              section.status === 'generating' ? 'secondary' :
                              section.status === 'error' ? 'destructive' :
                              'outline'
                            }
                          >
                            {section.status === 'complete' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {section.status === 'generating' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            {section.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {section.status}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-9 space-y-3">
                        {/* AI Suggestions */}
                        {section.aiSuggestions && section.aiSuggestions.length > 0 && (
                          <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>AI Suggestions</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                {section.aiSuggestions.map((suggestion, idx) => (
                                  <li key={idx} className="text-sm">{suggestion}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Custom Instructions */}
                        <div>
                          <Label htmlFor={`${section.id}-instructions`}>
                            Custom Instructions (optional)
                          </Label>
                          <Textarea
                            id={`${section.id}-instructions`}
                            placeholder="Add specific instructions for this section..."
                            className="mt-1"
                            rows={2}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAISuggestion(section.id)}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Get AI Suggestions
                          </Button>
                          {section.content && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(section.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          )}
                        </div>

                        {/* Word Count */}
                        {section.wordCount && (
                          <p className="text-sm text-gray-600">
                            Word count: {section.wordCount}
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Generation Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generation Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format & Citation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Output Format</Label>
                  <Select
                    value={options.format}
                    onValueChange={(v) => setOptions({ ...options, format: v as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="word">Word (.docx)</SelectItem>
                      <SelectItem value="latex">LaTeX</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Citation Style</Label>
                  <Select
                    value={options.citationStyle}
                    onValueChange={(v) => setOptions({ ...options, citationStyle: v as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apa">APA 7th</SelectItem>
                      <SelectItem value="mla">MLA 9th</SelectItem>
                      <SelectItem value="chicago">Chicago 17th</SelectItem>
                      <SelectItem value="harvard">Harvard</SelectItem>
                      <SelectItem value="ieee">IEEE</SelectItem>
                      <SelectItem value="vancouver">Vancouver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Academic Level & Tone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Academic Level</Label>
                  <Select
                    value={options.academicLevel}
                    onValueChange={(v) => setOptions({ ...options, academicLevel: v as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="doctoral">Doctoral</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Writing Tone</Label>
                  <Select
                    value={options.tone}
                    onValueChange={(v) => setOptions({ ...options, tone: v as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal Academic</SelectItem>
                      <SelectItem value="semi-formal">Semi-Formal</SelectItem>
                      <SelectItem value="accessible">Accessible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Length */}
              <div>
                <Label>Report Length</Label>
                <RadioGroup
                  value={options.length}
                  onValueChange={(v) => setOptions({ ...options, length: v as any })}
                  className="flex gap-4 mt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="concise" id="concise" />
                    <Label htmlFor="concise">Concise</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard">Standard</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comprehensive" id="comprehensive" />
                    <Label htmlFor="comprehensive">Comprehensive</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Additional Options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visualizations"
                    checked={options.includeVisualizations}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeVisualizations: !!checked })
                    }
                  />
                  <Label htmlFor="visualizations">Include visualizations and charts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="raw-data"
                    checked={options.includeRawData}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeRawData: !!checked })
                    }
                  />
                  <Label htmlFor="raw-data">Include raw data tables</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appendices"
                    checked={options.includeAppendices}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeAppendices: !!checked })
                    }
                  />
                  <Label htmlFor="appendices">Include appendices</Label>
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <Label htmlFor="custom-instructions">
                  Additional Instructions
                </Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Add any specific requirements or preferences for the report generation..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Progress & Actions */}
        <div className="space-y-6">
          {/* Generation Progress */}
          {isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generation Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={generationProgress} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {currentSection === 'finalizing'
                      ? 'Finalizing report...'
                      : `Generating: ${sections.find(s => s.id === currentSection)?.title || '...'}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round(generationProgress)}% complete
                  </p>
                </div>
                <div className="space-y-1">
                  {enabledSections.map(section => (
                    <div key={section.id} className="flex items-center gap-2 text-sm">
                      {section.status === 'complete' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {section.status === 'generating' && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                      {section.status === 'error' && (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      {!section.status && (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={section.status === 'complete' ? 'text-green-600' : ''}>
                        {section.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Ready */}
          {reportUrl && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-800">
                  Report Ready!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-green-700">
                  Your report has been generated successfully.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(reportUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {options.format.toUpperCase()}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleExport('email')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Report
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleExport('print')}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Generation Failed</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedTemplate('academic_journal')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Use Journal Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedTemplate('executive_summary')}
              >
                <Users className="w-4 h-4 mr-2" />
                Create Executive Summary
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSections(prev => prev.map(s => ({ ...s, enabled: true })));
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Enable All Sections
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSections(prev => prev.map(s => ({
                    ...s,
                    enabled: s.required,
                  })));
                }}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Required Only
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <div className="flex gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  The AI will use your study data, analysis results, and literature
                  connections to generate comprehensive report sections.
                </p>
              </div>
              <div className="flex gap-2">
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Add custom instructions to each section for more tailored content.
                </p>
              </div>
              <div className="flex gap-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Generation typically takes 2-5 seconds per section depending on length.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Section Preview</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {previewContent}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}