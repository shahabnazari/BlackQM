'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Download,
  Save,
  CheckCircle,
  AlertTriangle,
  Shield,
  Database,
  BookOpen,
  FileCheck,
} from 'lucide-react';

interface ProtocolSection {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  required: boolean;
}

export default function StudyProtocolPage() {
  const [sections, setSections] = useState<ProtocolSection[]>([
    {
      id: 'background',
      title: 'Background and Rationale',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'objectives',
      title: 'Research Objectives',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'methodology',
      title: 'Methodology',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'participants',
      title: 'Participant Selection',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'procedures',
      title: 'Study Procedures',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'ethics',
      title: 'Ethical Considerations',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'data',
      title: 'Data Management',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'analysis',
      title: 'Analysis Plan',
      content: '',
      completed: false,
      required: true,
    },
    {
      id: 'timeline',
      title: 'Timeline',
      content: '',
      completed: false,
      required: false,
    },
    {
      id: 'dissemination',
      title: 'Dissemination Plan',
      content: '',
      completed: false,
      required: false,
    },
  ]);

  const [activeSection, setActiveSection] = useState('background');

  const updateSection = (id: string, content: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id
          ? { ...section, content, completed: content.length > 50 }
          : section
      )
    );
  };

  const completedSections = sections.filter(s => s.completed).length;
  const requiredSections = sections.filter(s => s.required).length;
  const completionPercentage = (completedSections / sections.length) * 100;

  const protocolTemplates = {
    background: `## Background

### Literature Review
[Summarize key literature and theoretical framework]

### Research Gap
[Identify the gap this study addresses]

### Significance
[Explain the importance of this research]

### Q-Methodology Justification
[Explain why Q-methodology is appropriate]`,

    objectives: `## Research Objectives

### Primary Objective
[State main research question]

### Secondary Objectives
1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

### Hypotheses (if applicable)
[State research hypotheses]`,

    methodology: `## Methodology

### Study Design
Q-methodology study with [design details]

### Q-Set Development
- Number of statements: [X]
- Source of statements: [interviews/literature/both]
- Pilot testing: [Yes/No]

### Q-Grid Configuration
- Distribution: [Forced/Free]
- Range: [-X to +X]
- Shape: [Normal/Flat]`,

    participants: `## Participant Selection

### Inclusion Criteria
1. [Criterion 1]
2. [Criterion 2]

### Exclusion Criteria
1. [Criterion 1]
2. [Criterion 2]

### Sample Size
Target: [X] participants
Justification: [Viewpoint saturation/diversity]

### Recruitment Strategy
[Describe recruitment methods]`,

    procedures: `## Study Procedures

### Pre-Q-Sort
1. Informed consent
2. Demographics questionnaire
3. Pre-screening (if applicable)

### Q-Sort Process
1. Instructions
2. Initial sorting (agree/neutral/disagree)
3. Refined sorting on Q-grid
4. Post-sort interview

### Data Collection Timeline
[Specify duration and phases]`,

    ethics: `## Ethical Considerations

### IRB Approval
Status: [Pending/Approved]
Protocol #: [Number]

### Informed Consent
[Describe consent process]

### Confidentiality
[Data protection measures]

### Risks and Benefits
Risks: [Minimal/describe]
Benefits: [Describe]`,

    data: `## Data Management

### Data Collection
- Platform: [Online/In-person]
- Storage: [Secure server details]
- Backup: [Backup strategy]

### Data Security
- Encryption: [Yes/No]
- De-identification: [Process]
- Access control: [Who has access]

### Data Retention
[Duration and disposal method]`,

    analysis: `## Analysis Plan

### Factor Extraction
- Method: [Centroid/PCA]
- Criteria: [Eigenvalue > 1]
- Rotation: [Varimax/Manual]

### Factor Interpretation
- Crib sheets
- Distinguishing statements
- Consensus statements

### Additional Analyses
[Qualitative analysis of comments]`,

    timeline: `## Project Timeline

### Phase 1: Preparation (Months 1-2)
- Literature review
- Q-set development
- IRB submission

### Phase 2: Data Collection (Months 3-4)
- Participant recruitment
- Q-sort administration

### Phase 3: Analysis (Month 5)
- Factor analysis
- Interpretation

### Phase 4: Dissemination (Month 6)
- Manuscript preparation
- Conference presentation`,

    dissemination: `## Dissemination Plan

### Publications
1. [Target journal 1]
2. [Target journal 2]

### Presentations
1. [Conference 1]
2. [Conference 2]

### Other Outputs
- Policy brief
- Public report
- Dataset publication`,
  };

  const applyTemplate = (sectionId: string) => {
    const template =
      protocolTemplates[sectionId as keyof typeof protocolTemplates];
    if (template) {
      updateSection(sectionId, template);
    }
  };

  const exportProtocol = () => {
    const protocol = sections
      .map(s => `# ${s.title}\n\n${s.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([protocol], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-protocol.md';
    a.click();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Protocol Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create a comprehensive protocol document for your Q-methodology
            study
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            DESIGN Phase
          </Badge>
          <Badge
            variant={completionPercentage === 100 ? 'default' : 'secondary'}
          >
            {Math.round(completionPercentage)}% Complete
          </Badge>
        </div>
      </div>

      {/* Completion Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {completionPercentage === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {completedSections} of {sections.length} sections completed
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {requiredSections -
                sections.filter(s => s.required && s.completed).length}{' '}
              required sections remaining
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {sections.map(section => (
              <div
                key={section.id}
                className={`h-2 rounded-full ${
                  section.completed
                    ? 'bg-green-500'
                    : section.required
                      ? 'bg-yellow-200'
                      : 'bg-gray-200'
                }`}
                title={section.title}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-4 gap-6">
        {/* Section Navigation */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Protocol Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="text-sm">{section.title}</span>
                <div className="flex items-center gap-1">
                  {section.required && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      REQ
                    </Badge>
                  )}
                  {section.completed && <CheckCircle className="h-3 w-3" />}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Section Editor */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {sections.find(s => s.id === activeSection)?.title}
                </CardTitle>
                <CardDescription>
                  {sections.find(s => s.id === activeSection)?.required
                    ? 'Required section'
                    : 'Optional section'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(activeSection)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sections.find(s => s.id === activeSection)?.content || ''}
              onChange={e => updateSection(activeSection, e.target.value)}
              placeholder="Enter content for this section..."
              className="min-h-[400px] font-mono text-sm"
            />

            {activeSection === 'ethics' && (
              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertTitle>Ethics Reminder</AlertTitle>
                <AlertDescription>
                  Ensure your protocol meets institutional IRB requirements
                  before data collection.
                </AlertDescription>
              </Alert>
            )}

            {activeSection === 'data' && (
              <Alert className="mt-4">
                <Database className="h-4 w-4" />
                <AlertTitle>Data Management</AlertTitle>
                <AlertDescription>
                  Follow GDPR and local data protection regulations for
                  participant data.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Checklist</CardTitle>
          <CardDescription>
            Ensure your protocol addresses these key elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              'Clear research objectives defined',
              'Q-methodology justification provided',
              'Sample size justified',
              'Inclusion/exclusion criteria specified',
              'Q-set development described',
              'Analysis plan detailed',
              'Ethical approval obtained/pending',
              'Data protection measures described',
              'Timeline established',
              'Dissemination plan created',
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <Checkbox />
                <label className="text-sm">{item}</label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" onClick={exportProtocol}>
            <Download className="h-4 w-4 mr-2" />
            Export Protocol
          </Button>
        </div>
        <Button
          disabled={sections.filter(s => s.required && !s.completed).length > 0}
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Submit for Review
        </Button>
      </div>
    </div>
  );
}
