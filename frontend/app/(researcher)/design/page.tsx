'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  HelpCircle,
  Target,
  FileText,
  CheckCircle,
  Circle,
  ArrowRight,
  Lightbulb,
  FlaskConical
} from 'lucide-react'

interface DesignTool {
  title: string
  description: string
  href: string
  icon: React.ElementType
  status: 'completed' | 'in-progress' | 'not-started'
  progress?: number
}

export default function DesignPhasePage() {
  const designTools: DesignTool[] = [
    {
      title: 'Research Questions',
      description: 'Formulate and refine your research questions with AI guidance',
      href: '/design/questions',
      icon: HelpCircle,
      status: 'completed',
      progress: 100
    },
    {
      title: 'Hypothesis Builder',
      description: 'Develop testable hypotheses with power analysis',
      href: '/design/hypothesis',
      icon: FlaskConical,
      status: 'in-progress',
      progress: 60
    },
    {
      title: 'Methodology Design',
      description: 'Design your Q-methodology protocol with templates',
      href: '/design/methodology',
      icon: BookOpen,
      status: 'not-started',
      progress: 0
    },
    {
      title: 'Study Protocol',
      description: 'Create comprehensive study protocol documentation',
      href: '/design/protocol',
      icon: FileText,
      status: 'not-started',
      progress: 0
    }
  ]

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <div className="h-5 w-5 rounded-full border-2 border-primary animate-pulse" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-primary'
      default:
        return 'bg-muted'
    }
  }

  const overallProgress = designTools.reduce((acc, tool) => acc + (tool.progress || 0), 0) / designTools.length

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Design Phase</h1>
            <p className="text-muted-foreground mt-2">
              Design your research methodology and create your study protocol
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Phase 2 of 10
          </Badge>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Design Progress</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Design Phase Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Start with clear research questions before developing hypotheses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Use the methodology templates for proven Q-methodology designs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Consider power analysis but remember Q focuses on viewpoint saturation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Document ethical considerations early in your protocol</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Design Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {designTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Card key={tool.href} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(tool.status)} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 ${tool.status === 'completed' ? 'text-green-600' : tool.status === 'in-progress' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                      <CardDescription className="mt-1">{tool.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(tool.status)}
                </div>
              </CardHeader>
              <CardContent>
                {tool.progress !== undefined && tool.progress > 0 && (
                  <div className="mb-4">
                    <Progress value={tool.progress} className="h-1" />
                  </div>
                )}
                <Link href={tool.href}>
                  <Button 
                    variant={tool.status === 'completed' ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {tool.status === 'completed' ? 'Review' : tool.status === 'in-progress' ? 'Continue' : 'Start'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Design Workflow</CardTitle>
          <CardDescription>
            Follow these steps for a comprehensive research design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Connection lines */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {[
                { step: 1, title: 'Define Research Questions', description: 'Start with clear, focused research questions' },
                { step: 2, title: 'Develop Hypotheses', description: 'Create testable hypotheses based on your questions' },
                { step: 3, title: 'Design Methodology', description: 'Choose appropriate Q-methodology approach' },
                { step: 4, title: 'Create Protocol', description: 'Document your complete study protocol' },
                { step: 5, title: 'Power Analysis', description: 'Calculate required sample size' }
              ].map((step, index) => (
                <div key={step.step} className="flex gap-4 relative">
                  <div className={`w-12 h-12 rounded-full ${index < 2 ? 'bg-primary' : 'bg-muted'} flex items-center justify-center text-white relative z-10`}>
                    {index < 2 ? <CheckCircle className="h-6 w-6" /> : step.step}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/discover">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Discover
          </Button>
        </Link>
        <Link href="/build">
          <Button>
            Continue to Build
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}