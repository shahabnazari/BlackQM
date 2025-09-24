'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Lightbulb,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
  BookOpen,
  Search,
  AlertCircle,
} from 'lucide-react';

interface InterpretationTool {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'in-progress' | 'not-started';
  aiPowered?: boolean;
}

export default function InterpretPhasePage() {
  const router = useRouter();

  const interpretationTools: InterpretationTool[] = [
    {
      title: 'Factor Narratives',
      description:
        'AI-generated narratives for each factor based on distinguishing statements',
      icon: BookOpen,
      status: 'in-progress',
      aiPowered: true,
    },
    {
      title: 'Theme Extraction',
      description:
        'Identify recurring themes across factors and participant comments',
      icon: Search,
      status: 'not-started',
      aiPowered: true,
    },
    {
      title: 'Bias Analysis',
      description:
        'Multi-dimensional bias detection and perspective validation',
      icon: AlertCircle,
      status: 'not-started',
      aiPowered: true,
    },
    {
      title: 'Consensus Analysis',
      description: 'Identify statements with agreement across all factors',
      icon: Users,
      status: 'completed',
    },
    {
      title: 'Distinguishing Views',
      description: 'Analyze what makes each factor unique',
      icon: TrendingUp,
      status: 'completed',
    },
    {
      title: 'Insight Synthesis',
      description: 'Synthesize findings into actionable insights',
      icon: Lightbulb,
      status: 'not-started',
      aiPowered: true,
    },
  ];

  const interpretationMetrics = {
    factorsInterpreted: 2,
    totalFactors: 4,
    themesIdentified: 8,
    narrativesGenerated: 2,
    consensusStatements: 5,
    distinguishingStatements: 12,
  };

  const interpretationProgress =
    (interpretationMetrics.factorsInterpreted /
      interpretationMetrics.totalFactors) *
    100;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interpret Phase</h1>
          <p className="text-muted-foreground mt-2">
            Extract meaning and insights from your analysis results
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Phase 8 of 10
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Interpretation Progress</CardTitle>
          <CardDescription>
            {interpretationMetrics.factorsInterpreted} of{' '}
            {interpretationMetrics.totalFactors} factors fully interpreted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={interpretationProgress} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Narratives</p>
                <p className="text-xl font-semibold">
                  {interpretationMetrics.narrativesGenerated}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Themes</p>
                <p className="text-xl font-semibold">
                  {interpretationMetrics.themesIdentified}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consensus</p>
                <p className="text-xl font-semibold">
                  {interpretationMetrics.consensusStatements}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distinguishing</p>
                <p className="text-xl font-semibold">
                  {interpretationMetrics.distinguishingStatements}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Enhancement Alert */}
      <Alert className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>AI-Enhanced Interpretation</AlertTitle>
        <AlertDescription>
          This phase leverages AI to help you create narratives, identify
          themes, and detect potential biases. All AI-generated content should
          be reviewed and validated by the researcher.
        </AlertDescription>
      </Alert>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Interpretation Workspace
            </CardTitle>
            <CardDescription>
              Access the unified interpretation workspace with all tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push('/interpretation/current')}
            >
              Open Workspace
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Quick Interpretation
            </CardTitle>
            <CardDescription>
              Get AI-powered quick interpretations for all factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Generate All Narratives
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Interpretation Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interpretationTools.map(tool => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        tool.status === 'completed'
                          ? 'bg-green-100'
                          : tool.status === 'in-progress'
                            ? 'bg-primary/10'
                            : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          tool.status === 'completed'
                            ? 'text-green-600'
                            : tool.status === 'in-progress'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      {tool.aiPowered && (
                        <Badge variant="secondary" className="mt-1">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI-Powered
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {tool.description}
                </CardDescription>
                <Button
                  variant={tool.status === 'completed' ? 'outline' : 'default'}
                  className="w-full"
                  onClick={() => router.push('/interpretation/current')}
                >
                  {tool.status === 'completed'
                    ? 'Review'
                    : tool.status === 'in-progress'
                      ? 'Continue'
                      : 'Start'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interpretation Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Interpretation Guidelines</CardTitle>
          <CardDescription>
            Best practices for Q-methodology interpretation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-medium">
                  Start with distinguishing statements
                </h3>
                <p className="text-sm text-muted-foreground">
                  Focus on what makes each factor unique before looking at
                  commonalities
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-medium">Consider participant comments</h3>
                <p className="text-sm text-muted-foreground">
                  Post-sort comments provide valuable context for interpretation
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-medium">Validate AI interpretations</h3>
                <p className="text-sm text-muted-foreground">
                  AI-generated narratives should be reviewed and adjusted based
                  on your expertise
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold">4</span>
              </div>
              <div>
                <h3 className="font-medium">
                  Look for patterns across factors
                </h3>
                <p className="text-sm text-muted-foreground">
                  Identify themes that emerge across multiple viewpoints
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Narratives */}
      <Card>
        <CardHeader>
          <CardTitle>Example Factor Narratives</CardTitle>
          <CardDescription>
            AI-generated narratives for your factors (click to edit)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">
                  Factor 1: Environmental Pragmatists
                </h3>
                <Badge className="bg-green-100 text-green-700">
                  Interpreted
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This viewpoint represents individuals who balance environmental
                concerns with practical considerations. They strongly agree with
                technological solutions (+4) and renewable energy investments
                (+3), but are skeptical of immediate economic sacrifices (-3)...
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                <FileText className="h-4 w-4 mr-2" />
                Edit Narrative
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">Factor 2: Deep Ecologists</h3>
                <Badge className="bg-yellow-100 text-yellow-700">
                  In Progress
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Participants loading on this factor prioritize environmental
                preservation above economic considerations. They show strong
                agreement with statements about biodiversity (+5) and climate
                urgency (+4)...
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                <FileText className="h-4 w-4 mr-2" />
                Continue Writing
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/visualize">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Visualize
          </Button>
        </Link>
        <Link href="/report">
          <Button>
            Continue to Report
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
