'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Download,
  BookOpen,
  FileEdit,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
  Circle,
  Sparkles,
  Mail
} from 'lucide-react'

interface ReportSection {
  title: string
  status: 'completed' | 'in-progress' | 'not-started'
  wordCount?: number
  required: boolean
}

export default function ReportPhasePage() {
  const router = useRouter()

  const reportSections: ReportSection[] = [
    { title: 'Executive Summary', status: 'completed', wordCount: 250, required: true },
    { title: 'Introduction', status: 'completed', wordCount: 500, required: true },
    { title: 'Literature Review', status: 'in-progress', wordCount: 1200, required: true },
    { title: 'Methodology', status: 'completed', wordCount: 800, required: true },
    { title: 'Results', status: 'not-started', wordCount: 0, required: true },
    { title: 'Factor Interpretations', status: 'not-started', wordCount: 0, required: true },
    { title: 'Discussion', status: 'not-started', wordCount: 0, required: true },
    { title: 'Conclusion', status: 'not-started', wordCount: 0, required: false },
    { title: 'References', status: 'in-progress', wordCount: 0, required: true },
    { title: 'Appendices', status: 'not-started', wordCount: 0, required: false }
  ]

  const completedSections = reportSections.filter(s => s.status === 'completed').length
  const requiredCompleted = reportSections.filter(s => s.required && s.status === 'completed').length
  const requiredTotal = reportSections.filter(s => s.required).length
  const totalWordCount = reportSections.reduce((acc, s) => acc + (s.wordCount || 0), 0)
  const reportProgress = (completedSections / reportSections.length) * 100

  const exportFormats = [
    { format: 'PDF', icon: FileText, description: 'Publication-ready PDF', popular: true },
    { format: 'Word', icon: FileEdit, description: 'Editable document', popular: true },
    { format: 'LaTeX', icon: BookOpen, description: 'Academic formatting', popular: false },
    { format: 'Markdown', icon: FileText, description: 'Plain text format', popular: false },
    { format: 'HTML', icon: FileText, description: 'Web-ready format', popular: false }
  ]

  const templates = [
    { name: 'APA 7th Edition', description: 'American Psychological Association', selected: true },
    { name: 'MLA 9th Edition', description: 'Modern Language Association', selected: false },
    { name: 'Chicago 17th Edition', description: 'Chicago Manual of Style', selected: false },
    { name: 'Harvard', description: 'Harvard Referencing', selected: false }
  ]

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Phase</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive research reports and publications
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Phase 9 of 10
        </Badge>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{Math.round(reportProgress)}%</p>
                <Progress value={reportProgress} className="mt-2 h-2" />
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Word Count</p>
                <p className="text-2xl font-bold">{totalWordCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Estimated 10-12 pages</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sections</p>
                <p className="text-2xl font-bold">{completedSections}/{reportSections.length}</p>
                <p className="text-xs text-muted-foreground">{requiredCompleted}/{requiredTotal} required</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Generation Alert */}
      <Alert className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>AI-Assisted Writing Available</AlertTitle>
        <AlertDescription>
          Use AI to generate report sections based on your analysis. The AI will create academic-quality
          content that you can review and edit. Literature review sections will incorporate your Phase 9 discoveries.
        </AlertDescription>
      </Alert>

      {/* Report Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Sections</CardTitle>
            <CardDescription>
              Click on any section to edit or generate content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportSections.map((section) => (
                <div
                  key={section.title}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push('/analysis/hub/current#report')}
                >
                  <div className="flex items-center gap-3">
                    {section.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : section.status === 'in-progress' ? (
                      <div className="h-5 w-5 rounded-full border-2 border-primary animate-pulse" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{section.title}</p>
                      {section.wordCount ? (
                        <p className="text-sm text-muted-foreground">{section.wordCount} words</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not started</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions Panel */}
        <div className="space-y-4">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Citation Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.name}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      template.selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="default">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Missing Sections
              </Button>
              <Button className="w-full" variant="outline">
                <FileEdit className="h-4 w-4 mr-2" />
                Edit in Builder
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Preview Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Export Formats</CardTitle>
          <CardDescription>
            Choose your preferred format for the final report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {exportFormats.map((format) => {
              const Icon = format.icon
              return (
                <Card key={format.format} className={`border-2 ${format.popular ? 'border-primary' : ''}`}>
                  <CardContent className="pt-6 text-center">
                    <div className="p-3 rounded-lg bg-muted inline-block mb-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-1">{format.format}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{format.description}</p>
                    {format.popular && (
                      <Badge variant="secondary" className="mb-2">Popular</Badge>
                    )}
                    <Button variant="outline" size="sm" className="w-full">
                      Export
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Collaboration */}
      <Card>
        <CardHeader>
          <CardTitle>Collaboration & Sharing</CardTitle>
          <CardDescription>
            Work with co-authors and share your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Co-Authors</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Invite collaborators to edit
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Authors
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Version History</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Track changes over time
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  View History
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Share Draft</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Send for review
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Share Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Link href="/interpret">
          <Button variant="outline">
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Interpret
          </Button>
        </Link>
        <Link href="/archive">
          <Button>
            Continue to Archive
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}