'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Download,
  Eye,
  Settings,
  CheckCircle,
  Loader2,
  AlertCircle,
  BookOpen,
  FileEdit,
  BarChart,
  Users,
  Sparkles,
} from 'lucide-react';

// Types matching backend DTOs
enum TemplateType {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  THESIS = 'thesis',
  CUSTOM = 'custom',
}

enum ReportSection {
  EXECUTIVE_SUMMARY = 'executive_summary',
  INTRODUCTION = 'introduction',
  LITERATURE_REVIEW = 'literature_review',
  RESEARCH_QUESTIONS = 'research_questions',
  METHODOLOGY = 'methodology',
  RESULTS = 'results',
  DISCUSSION = 'discussion',
  CONCLUSION = 'conclusion',
  REFERENCES = 'references',
  APPENDICES = 'appendices',
}

enum ReportFormat {
  HTML = 'html',
  PDF = 'pdf',
  WORD = 'word',
  LATEX = 'latex',
  MARKDOWN = 'markdown',
}

interface ReportMetadata {
  title: string;
  authors: string[];
  date: string;
  version: string;
  studyId: string;
}

interface ReportResponse {
  id: string;
  studyId: string;
  userId: string;
  metadata: ReportMetadata;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
  format: ReportFormat;
  createdAt: string;
  updatedAt: string;
}

const SECTION_LABELS: Record<
  ReportSection,
  { label: string; icon: React.ElementType; description: string }
> = {
  [ReportSection.EXECUTIVE_SUMMARY]: {
    label: 'Executive Summary',
    icon: FileText,
    description: 'High-level overview of study findings',
  },
  [ReportSection.INTRODUCTION]: {
    label: 'Introduction',
    icon: BookOpen,
    description: 'Background and context',
  },
  [ReportSection.LITERATURE_REVIEW]: {
    label: 'Literature Review',
    icon: BookOpen,
    description: 'Auto-generated from Phase 9 literature discovery',
  },
  [ReportSection.RESEARCH_QUESTIONS]: {
    label: 'Research Questions',
    icon: Sparkles,
    description: 'From Phase 9.5 research design',
  },
  [ReportSection.METHODOLOGY]: {
    label: 'Methodology',
    icon: Settings,
    description: 'Q-methodology with complete provenance',
  },
  [ReportSection.RESULTS]: {
    label: 'Results',
    icon: BarChart,
    description: 'Factor analysis and statistical findings',
  },
  [ReportSection.DISCUSSION]: {
    label: 'Discussion',
    icon: Users,
    description: 'Interpretation and implications',
  },
  [ReportSection.CONCLUSION]: {
    label: 'Conclusion',
    icon: CheckCircle,
    description: 'Key findings and future directions',
  },
  [ReportSection.REFERENCES]: {
    label: 'References',
    icon: BookOpen,
    description: 'Auto-populated from Phase 9 sources',
  },
  [ReportSection.APPENDICES]: {
    label: 'Appendices',
    icon: FileEdit,
    description: 'Statement provenance and supplementary materials',
  },
};

export default function ReportBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const studyId = params['studyId'] as string;

  // State
  const [templateType, setTemplateType] = useState<TemplateType>(
    TemplateType.APA
  );
  const [selectedSections, setSelectedSections] = useState<ReportSection[]>(
    Object.values(ReportSection)
  );
  const [format, setFormat] = useState<ReportFormat>(ReportFormat.HTML);
  const [includeProvenance, setIncludeProvenance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Load existing reports (moved above useEffect to fix hoisting error)
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login?returnUrl=' + window.location.pathname);
        return;
      }

      const response = await fetch(
        `http://localhost:4000/api/reports/study/${studyId}?pageSize=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load reports');

      const data = await response.json();
      if (data.reports && data.reports.length > 0) {
        setReport(data.reports[0]);
      }
    } catch (err: any) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  }, [studyId, router]);

  // Load existing reports on mount
  useEffect(() => {
    loadReports();
  }, [studyId, loadReports]);

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login?returnUrl=' + window.location.pathname);
        return;
      }

      const response = await fetch(
        'http://localhost:4000/api/reports/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studyId,
            templateType,
            includeSections: selectedSections,
            format,
            includeProvenance,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      const data: ReportResponse = await response.json();
      setReport(data);

      // Generate preview
      if (data.sections && data.sections.length > 0) {
        const html = data.sections
          .map(
            section =>
              `<div class="section"><h2>${section.title}</h2>${section.content}</div>`
          )
          .join('\n');
        setPreviewHtml(html);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (downloadFormat: ReportFormat) => {
    if (!report) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/reports/${report.id}/download?format=${downloadFormat}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${studyId}.${downloadFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const toggleSection = (section: ReportSection) => {
    setSelectedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Report Builder</h1>
        <p className="text-muted-foreground">
          Generate comprehensive academic reports with full Phase 9 → 9.5 → 10
          pipeline integration
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Select template, format, and sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Template
                </label>
                <Select
                  value={templateType}
                  onValueChange={v => setTemplateType(v as TemplateType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TemplateType.APA}>APA 7th</SelectItem>
                    <SelectItem value={TemplateType.MLA}>MLA</SelectItem>
                    <SelectItem value={TemplateType.CHICAGO}>
                      Chicago
                    </SelectItem>
                    <SelectItem value={TemplateType.THESIS}>Thesis</SelectItem>
                    <SelectItem value={TemplateType.CUSTOM}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Format */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Export Format
                </label>
                <Select
                  value={format}
                  onValueChange={v => setFormat(v as ReportFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReportFormat.HTML}>HTML</SelectItem>
                    <SelectItem value={ReportFormat.PDF}>PDF</SelectItem>
                    <SelectItem value={ReportFormat.WORD}>
                      Word (.docx)
                    </SelectItem>
                    <SelectItem value={ReportFormat.LATEX}>LaTeX</SelectItem>
                    <SelectItem value={ReportFormat.MARKDOWN}>
                      Markdown
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Provenance Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="provenance"
                  checked={includeProvenance}
                  onCheckedChange={checked =>
                    setIncludeProvenance(checked as boolean)
                  }
                />
                <label
                  htmlFor="provenance"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include complete provenance chain
                  <p className="text-xs text-muted-foreground mt-1">
                    Paper → Gap → Question → Theme → Statement lineage
                  </p>
                </label>
              </div>

              {/* Generate Button */}
              <Button
                className="w-full"
                onClick={generateReport}
                disabled={generating || selectedSections.length === 0}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              {/* Download Options */}
              {report && (
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium">Download As:</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(ReportFormat.PDF)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(ReportFormat.WORD)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Word
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(ReportFormat.MARKDOWN)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Markdown
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Report Sections</CardTitle>
              <CardDescription>
                Select sections to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(SECTION_LABELS).map(
                ([key, { label, icon: Icon, description }]) => (
                  <div
                    key={key}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleSection(key as ReportSection)}
                  >
                    <Checkbox
                      checked={selectedSections.includes(key as ReportSection)}
                      onCheckedChange={() =>
                        toggleSection(key as ReportSection)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {description}
                      </p>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Report Preview
                  </CardTitle>
                  <CardDescription>
                    {report
                      ? `Last updated: ${new Date(report.updatedAt).toLocaleString()}`
                      : 'Generate a report to see preview'}
                  </CardDescription>
                </div>
                {report && (
                  <Badge variant="secondary">
                    {selectedSections.length} sections
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : report && previewHtml ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Report Generated
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Configure your report settings and click "Generate Report"
                    to create a comprehensive academic report with full pipeline
                    integration.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pipeline Integration Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Phase 9 → 9.5 → 10 Pipeline Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900 p-2">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Phase 9: Literature</h4>
                <p className="text-xs text-muted-foreground">
                  Auto-populated references, literature review from
                  YouTube/papers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900 p-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  Phase 9.5: Research Design
                </h4>
                <p className="text-xs text-muted-foreground">
                  Research questions, hypotheses in introduction/methods
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900 p-2">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Phase 10: Report</h4>
                <p className="text-xs text-muted-foreground">
                  Complete provenance: paper → gap → question → statement →
                  factor
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
