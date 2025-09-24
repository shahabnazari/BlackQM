'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  BarChart3,
  TrendingUp,
  Users,
  FileBarChart,
  Network,
  ArrowRight,
  Sparkles,
  Activity,
  Calculator,
  ChartBar,
  GitBranch,
  Layers
} from 'lucide-react'

interface AnalysisTool {
  title: string
  description: string
  href: string
  icon: React.ElementType
  status: 'ready' | 'processing' | 'not-started'
  badge?: string
}

export default function AnalyzePhasePage() {
  const router = useRouter()

  const analysisTools: AnalysisTool[] = [
    {
      title: 'Analysis Hub',
      description: 'Unified analysis dashboard with all tools in one place',
      href: '/analysis/hub/current',
      icon: Activity,
      status: 'ready',
      badge: 'PRIMARY'
    },
    {
      title: 'Q-Methodology Analysis',
      description: 'Traditional Q-methodology factor analysis',
      href: '/analysis/q-methodology',
      icon: GitBranch,
      status: 'ready',
      badge: 'SPECIALIZED'
    },
    {
      title: 'Statistical Metrics',
      description: 'View detailed statistical metrics and reports',
      href: '/analyze/metrics',
      icon: Calculator,
      status: 'ready'
    },
    {
      title: 'Factor Explorer',
      description: 'Interactive factor analysis and rotation',
      href: '/analysis/hub/current#analysis',
      icon: Network,
      status: 'ready'
    },
    {
      title: 'AI Analysis',
      description: 'AI-powered insights and pattern detection',
      href: '/analysis/hub/current#ai-insights',
      icon: Sparkles,
      status: 'processing',
      badge: 'AI-POWERED'
    },
    {
      title: 'Correlation Matrix',
      description: 'Explore participant correlations and relationships',
      href: '/analysis/hub/current#correlations',
      icon: Layers,
      status: 'ready'
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ready':
        return 'bg-green-100 text-green-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'ready':
        return 'Ready'
      case 'processing':
        return 'Processing'
      default:
        return 'Not Started'
    }
  }

  const studyMetrics = {
    participants: 28,
    factors: 4,
    variance: 67.8,
    consensusStatements: 5,
    distinguishingStatements: 12
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analyze Phase</h1>
          <p className="text-muted-foreground mt-2">
            Analyze your Q-sort data with statistical and AI-powered tools
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Phase 6 of 10
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-2xl font-bold">{studyMetrics.participants}</p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Factors</p>
                <p className="text-2xl font-bold">{studyMetrics.factors}</p>
              </div>
              <GitBranch className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variance</p>
                <p className="text-2xl font-bold">{studyMetrics.variance}%</p>
              </div>
              <ChartBar className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consensus</p>
                <p className="text-2xl font-bold">{studyMetrics.consensusStatements}</p>
              </div>
              <FileBarChart className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Distinguishing</p>
                <p className="text-2xl font-bold">{studyMetrics.distinguishingStatements}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Action */}
      <Card className="border-primary bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Unified Analysis Hub</CardTitle>
              <CardDescription className="mt-2">
                Access all analysis tools from a single, integrated dashboard
              </CardDescription>
            </div>
            <Badge className="bg-primary text-primary-foreground">RECOMMENDED</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            size="lg" 
            className="w-full md:w-auto"
            onClick={() => router.push('/analysis/hub/current')}
          >
            <Activity className="h-5 w-5 mr-2" />
            Open Analysis Hub
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysisTools.slice(1).map((tool) => {
          const Icon = tool.icon
          return (
            <Card key={tool.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      {tool.badge && (
                        <Badge variant="secondary" className="mt-1">
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(tool.status)}>
                    {getStatusText(tool.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{tool.description}</CardDescription>
                <Link href={tool.href}>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={tool.status === 'not-started'}
                  >
                    Open Tool
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Analysis Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Analysis Workflow</CardTitle>
          <CardDescription>
            Follow these steps for comprehensive Q-methodology analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Data Quality Check',
                description: 'Review completion rates and response patterns',
                completed: true
              },
              {
                step: 2,
                title: 'Factor Extraction',
                description: 'Extract factors using PCA or centroid method',
                completed: true
              },
              {
                step: 3,
                title: 'Factor Rotation',
                description: 'Apply varimax rotation or manual adjustments',
                completed: false
              },
              {
                step: 4,
                title: 'Factor Interpretation',
                description: 'Analyze distinguishing statements and create narratives',
                completed: false
              },
              {
                step: 5,
                title: 'Consensus Analysis',
                description: 'Identify statements with agreement across factors',
                completed: false
              }
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {item.completed ? '✓' : item.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Route Consolidation Notice */}
      <Alert>
        <AlertTitle>Unified Analysis Experience</AlertTitle>
        <AlertDescription>
          We've consolidated all analysis tools into the Analysis Hub for a better experience.
          Legacy routes will automatically redirect to the appropriate section in the hub.
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/collect">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Collect
          </Button>
        </Link>
        <Link href="/visualize">
          <Button>
            Continue to Visualize
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}