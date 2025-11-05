/**
 * Phase 10 Day 5.8: Theme Extraction Methodology Explainer
 * Communicates academic rigor and scientific backing of theme extraction
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  BookOpen,
  CheckCircle,
  FileText,
  GitBranch,
  GraduationCap,
  Info,
  Lightbulb,
  Search,
  Sparkles,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeMethodologyExplainer() {
  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="text-blue-600 w-5 h-5" />
            <h3 className="font-semibold text-lg">
              Scientific Theme Extraction
            </h3>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Research-Grade
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Methodology Badge */}
          <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-blue-100">
            <BookOpen className="text-blue-600 mt-1 w-5 h-5" />
            <div>
              <p className="font-semibold">
                Based on Reflexive Thematic Analysis
              </p>
              <p className="text-sm text-gray-600">
                Braun & Clarke (2006, 2019) • 77,000+ citations • Gold standard
                in qualitative research
              </p>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white rounded-lg p-4 space-y-3 border border-blue-100">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              How It Works:
            </p>
            <ol className="text-sm space-y-2 pl-4 list-decimal list-inside">
              <li>
                <strong className="text-blue-600">Familiarization:</strong> AI
                reads ALL sources (complete text, not excerpts)
              </li>
              <li>
                <strong className="text-blue-600">Semantic Coding:</strong>{' '}
                Identifies concepts using embeddings, not just keywords
              </li>
              <li>
                <strong className="text-blue-600">Theme Generation:</strong>{' '}
                Clusters related concepts into coherent themes
              </li>
              <li>
                <strong className="text-blue-600">Cross-Validation:</strong>{' '}
                Themes must appear in 3+ sources
              </li>
              <li>
                <strong className="text-blue-600">Refinement:</strong> Weak
                themes removed, overlaps merged
              </li>
              <li>
                <strong className="text-blue-600">Provenance Tracking:</strong>{' '}
                Full evidence chain from theme to sources
              </li>
            </ol>
          </div>

          {/* Quality Assurance */}
          <div>
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Quality Assurance:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <CheckCircle className="text-green-600 w-4 h-4 mb-1" />
                <p className="text-xs font-semibold text-gray-900">
                  Cross-Source Validation
                </p>
                <p className="text-xs text-gray-600">
                  Minimum 3 sources per theme
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <CheckCircle className="text-green-600 w-4 h-4 mb-1" />
                <p className="text-xs font-semibold text-gray-900">
                  Semantic Analysis
                </p>
                <p className="text-xs text-gray-600">
                  Understands meaning, not keywords
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <CheckCircle className="text-green-600 w-4 h-4 mb-1" />
                <p className="text-xs font-semibold text-gray-900">
                  Full Content Analysis
                </p>
                <p className="text-xs text-gray-600">
                  Complete texts, no truncation
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <CheckCircle className="text-green-600 w-4 h-4 mb-1" />
                <p className="text-xs font-semibold text-gray-900">
                  Confidence Scoring
                </p>
                <p className="text-xs text-gray-600">
                  Transparent reliability metrics
                </p>
              </div>
            </div>
          </div>

          {/* AI Role Explanation */}
          <Alert className="bg-amber-50 border-amber-200">
            <Info className="text-amber-600" />
            <AlertTitle className="text-sm">
              AI-Assisted, Research-Validated
            </AlertTitle>
            <AlertDescription className="text-xs">
              AI accelerates coding and pattern identification, but themes are
              validated against the full dataset using established qualitative
              methods. Recommend researcher review for publication.
            </AlertDescription>
          </Alert>

          {/* Academic Citation */}
          <details className="text-xs bg-gray-50 rounded-lg p-3">
            <summary className="cursor-pointer text-blue-600 font-semibold hover:text-blue-700">
              📚 Academic References
            </summary>
            <div className="mt-2 space-y-2 text-gray-700">
              <p className="border-l-2 border-blue-300 pl-2">
                <strong>Braun, V., & Clarke, V. (2006).</strong> Using thematic
                analysis in psychology.
                <em className="block text-gray-600">
                  Qualitative Research in Psychology, 3(2), 77-101.
                </em>
              </p>
              <p className="border-l-2 border-blue-300 pl-2">
                <strong>Braun, V., & Clarke, V. (2019).</strong> Reflecting on
                reflexive thematic analysis.
                <em className="block text-gray-600">
                  Qualitative Research in Sport, Exercise and Health, 11(4),
                  589-597.
                </em>
              </p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}

interface FlowStepProps {
  number: number;
  icon: any; // lucide-react icon component
  title: string;
  description: string;
  action?: string;
  color: 'purple' | 'blue' | 'amber' | 'green' | 'pink';
}

function FlowStep({
  number,
  icon: Icon,
  title,
  description,
  action,
  color,
}: FlowStepProps) {
  const colorClasses = {
    purple: 'bg-purple-500 border-purple-200',
    blue: 'bg-blue-500 border-blue-200',
    amber: 'bg-amber-500 border-amber-200',
    green: 'bg-green-500 border-green-200',
    pink: 'bg-pink-500 border-pink-200',
  };

  const bgColorClasses = {
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    green: 'bg-green-50',
    pink: 'bg-pink-50',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-4 border-2',
        `border-${color}-200`,
        bgColorClasses[color]
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white',
            colorClasses[color]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">
              {number}. {title}
            </p>
            {action && (
              <button className="text-xs text-blue-600 hover:underline">
                {action} →
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ThemeUtilityFlow() {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-600" />
          How Themes Power Your Research
        </h3>
        <p className="text-sm text-gray-600">
          Themes are the foundation of your entire study
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <FlowStep
            number={1}
            icon={Sparkles}
            title="Themes Extracted"
            description="Cross-cutting patterns identified across your literature"
            color="purple"
          />

          <div className="flex justify-center">
            <ArrowDown className="text-gray-400 w-5 h-5" />
          </div>

          <FlowStep
            number={2}
            icon={FileText}
            title="Q-Statements Generated"
            description="Themes automatically converted to Q-methodology statements for your study"
            action="View Example"
            color="blue"
          />

          <div className="flex justify-center">
            <ArrowDown className="text-gray-400 w-5 h-5" />
          </div>

          <FlowStep
            number={3}
            icon={Search}
            title="Research Gaps Identified"
            description="Missing themes reveal unexplored research opportunities"
            action="Analyze Gaps"
            color="amber"
          />

          <div className="flex justify-center">
            <ArrowDown className="text-gray-400 w-5 h-5" />
          </div>

          <FlowStep
            number={4}
            icon={BookOpen}
            title="Literature Synthesized"
            description="Organize all findings by theme for comprehensive review"
            color="green"
          />

          <div className="flex justify-center">
            <ArrowDown className="text-gray-400 w-5 h-5" />
          </div>

          <FlowStep
            number={5}
            icon={Lightbulb}
            title="Hypotheses Formed"
            description="Relationships between themes suggest research questions"
            color="pink"
          />

          <Alert className="bg-blue-50 border-blue-200 mt-4">
            <Info className="text-blue-600" />
            <AlertTitle>Full Research Pipeline</AlertTitle>
            <AlertDescription>
              Themes extracted today become the Q-statements participants sort
              tomorrow, enabling rigorous Q-methodology analysis of subjective
              viewpoints.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
