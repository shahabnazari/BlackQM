'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  BookOpen, 
  Target, 
  Users, 
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Calculator,
  Sparkles
} from 'lucide-react'

interface StudyDesign {
  methodology: string
  approach: string
  sampleSize: number
  participantCriteria: string
  dataCollection: string[]
  analysisMethod: string
  timeframe: string
  ethicalConsiderations: string
}

export default function MethodologyDesignPage() {
  const [design, setDesign] = useState<StudyDesign>({
    methodology: 'q-methodology',
    approach: 'exploratory',
    sampleSize: 30,
    participantCriteria: '',
    dataCollection: [],
    analysisMethod: 'factor-analysis',
    timeframe: '3-months',
    ethicalConsiderations: ''
  })

  const [powerAnalysis, setPowerAnalysis] = useState<{
    effectSize: number
    power: number
    alpha: number
    calculatedN: number
  }>({
    effectSize: 0.5,
    power: 0.8,
    alpha: 0.05,
    calculatedN: 30
  })

  const calculatePowerAnalysis = () => {
    // Simplified power analysis calculation for Q-methodology
    // In reality, this would use statistical libraries
    const baseN = Math.ceil(
      (powerAnalysis.power * 100) / 
      (powerAnalysis.effectSize * 10) * 
      (1 / powerAnalysis.alpha)
    )
    setPowerAnalysis(prev => ({ ...prev, calculatedN: baseN }))
    setDesign(prev => ({ ...prev, sampleSize: baseN }))
  }

  const methodologyTemplates = [
    {
      name: 'Q-Methodology Standard',
      description: 'Classic Q-methodology design for exploring subjective viewpoints',
      config: {
        sampleSize: 30,
        approach: 'exploratory',
        analysisMethod: 'factor-analysis',
        timeframe: '3-months'
      }
    },
    {
      name: 'Mixed Methods Q',
      description: 'Q-methodology combined with qualitative interviews',
      config: {
        sampleSize: 40,
        approach: 'mixed-methods',
        analysisMethod: 'factor-analysis-plus-thematic',
        timeframe: '6-months'
      }
    },
    {
      name: 'Longitudinal Q',
      description: 'Q-methodology repeated over time to track viewpoint changes',
      config: {
        sampleSize: 25,
        approach: 'longitudinal',
        analysisMethod: 'temporal-factor-analysis',
        timeframe: '12-months'
      }
    }
  ]

  const applyTemplate = (template: any) => {
    setDesign(prev => ({ ...prev, ...template.config }))
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Methodology Design</h1>
          <p className="text-muted-foreground mt-2">
            Design your research methodology with Q-specific guidance
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          DESIGN Phase
        </Badge>
      </div>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Methodology Templates
          </CardTitle>
          <CardDescription>
            Start with a proven methodology template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {methodologyTemplates.map((template) => (
              <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyTemplate(template)}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Design Tabs */}
      <Tabs defaultValue="approach" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="approach">Approach</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="protocol">Protocol</TabsTrigger>
          <TabsTrigger value="power">Power Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="approach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Research Approach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Methodology Type</Label>
                <Select value={design.methodology} 
                        onValueChange={(v) => setDesign({...design, methodology: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q-methodology">Q-Methodology</SelectItem>
                    <SelectItem value="q-mixed">Q with Mixed Methods</SelectItem>
                    <SelectItem value="q-online">Online Q-Sort</SelectItem>
                    <SelectItem value="q-longitudinal">Longitudinal Q</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Research Approach</Label>
                <Select value={design.approach}
                        onValueChange={(v) => setDesign({...design, approach: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exploratory">Exploratory</SelectItem>
                    <SelectItem value="confirmatory">Confirmatory</SelectItem>
                    <SelectItem value="mixed-methods">Mixed Methods</SelectItem>
                    <SelectItem value="longitudinal">Longitudinal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Analysis Method</Label>
                <Select value={design.analysisMethod}
                        onValueChange={(v) => setDesign({...design, analysisMethod: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factor-analysis">Factor Analysis</SelectItem>
                    <SelectItem value="pca">Principal Component Analysis</SelectItem>
                    <SelectItem value="factor-analysis-plus-thematic">Factor + Thematic Analysis</SelectItem>
                    <SelectItem value="temporal-factor-analysis">Temporal Factor Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Q-Methodology Tip</AlertTitle>
                <AlertDescription>
                  For Q-methodology, 30-40 participants typically provide sufficient viewpoint saturation.
                  Focus on diversity rather than large sample size.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participant Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Sample Size</Label>
                  <Input 
                    type="number" 
                    value={design.sampleSize}
                    onChange={(e) => setDesign({...design, sampleSize: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Study Timeframe</Label>
                  <Select value={design.timeframe}
                          onValueChange={(v) => setDesign({...design, timeframe: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-month">1 Month</SelectItem>
                      <SelectItem value="3-months">3 Months</SelectItem>
                      <SelectItem value="6-months">6 Months</SelectItem>
                      <SelectItem value="12-months">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Participant Selection Criteria</Label>
                <Textarea 
                  placeholder="Define your inclusion and exclusion criteria..."
                  value={design.participantCriteria}
                  onChange={(e) => setDesign({...design, participantCriteria: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Data Collection Methods</Label>
                <div className="flex flex-wrap gap-2">
                  {['Q-Sort', 'Pre-Survey', 'Post-Survey', 'Interview', 'Focus Group', 'Observation'].map(method => (
                    <Badge 
                      key={method}
                      variant={design.dataCollection.includes(method) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (design.dataCollection.includes(method)) {
                          setDesign({...design, dataCollection: design.dataCollection.filter(m => m !== method)})
                        } else {
                          setDesign({...design, dataCollection: [...design.dataCollection, method]})
                        }
                      }}
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocol" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Study Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ethical Considerations</Label>
                <Textarea 
                  placeholder="Describe ethical considerations, consent procedures, data protection..."
                  value={design.ethicalConsiderations}
                  onChange={(e) => setDesign({...design, ethicalConsiderations: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Protocol Checklist</h3>
                <div className="space-y-2">
                  {[
                    'IRB/Ethics approval obtained',
                    'Informed consent prepared',
                    'Data management plan created',
                    'Risk assessment completed',
                    'Pilot study planned',
                    'Analysis plan documented'
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Protocol Requirements</AlertTitle>
                <AlertDescription>
                  Ensure your study protocol meets institutional requirements and ethical guidelines
                  before proceeding with data collection.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="power" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Power Analysis Calculator
              </CardTitle>
              <CardDescription>
                Calculate the required sample size for your study
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Effect Size</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={powerAnalysis.effectSize}
                    onChange={(e) => setPowerAnalysis({...powerAnalysis, effectSize: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Small: 0.2, Medium: 0.5, Large: 0.8</p>
                </div>
                <div className="space-y-2">
                  <Label>Statistical Power</Label>
                  <Input 
                    type="number" 
                    step="0.05"
                    value={powerAnalysis.power}
                    onChange={(e) => setPowerAnalysis({...powerAnalysis, power: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Typically 0.80</p>
                </div>
                <div className="space-y-2">
                  <Label>Alpha Level</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={powerAnalysis.alpha}
                    onChange={(e) => setPowerAnalysis({...powerAnalysis, alpha: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Typically 0.05</p>
                </div>
              </div>

              <Button onClick={calculatePowerAnalysis} className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Calculate Required Sample Size
              </Button>

              {powerAnalysis.calculatedN > 0 && (
                <Alert className="bg-primary/10">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Recommended Sample Size</AlertTitle>
                  <AlertDescription>
                    Based on your power analysis, you need approximately <strong>{powerAnalysis.calculatedN}</strong> participants
                    to achieve {powerAnalysis.power * 100}% power with an effect size of {powerAnalysis.effectSize}.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Q-Methodology Note</AlertTitle>
                <AlertDescription>
                  Traditional power analysis may not fully apply to Q-methodology. 
                  Sample size in Q focuses on achieving viewpoint saturation rather than statistical power.
                  Most Q studies successfully identify viewpoints with 30-40 participants.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Save as Draft</Button>
        <Button>
          Export Protocol
          <FileText className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}