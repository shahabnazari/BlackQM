/**
 * Hypothesis Builder - DESIGN Phase
 * World-class implementation for hypothesis formulation and testing
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  FlaskConical,
  CheckCircle,
  AlertTriangle,
  Brain,
  Sparkles,
  BookOpen,
  Info,
  Plus,
  Trash2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  TestTube,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Hypothesis {
  id: string;
  type: 'null' | 'alternative' | 'directional' | 'non-directional';
  statement: string;
  variables: {
    independent: string[];
    dependent: string[];
    control?: string[];
    mediating?: string[];
    moderating?: string[];
  };
  rationale: string;
  testability: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  statisticalTests: string[];
  expectedOutcome?: string;
  alternativeExplanations?: string[];
  status: 'draft' | 'refined' | 'validated' | 'testing';
  createdAt: Date;
  updatedAt: Date;
}

interface HypothesisTemplate {
  id: string;
  name: string;
  description: string;
  type: Hypothesis['type'];
  template: string;
  examples: string[];
  fields: Array<{
    name: string;
    placeholder: string;
    required: boolean;
  }>;
}

const HYPOTHESIS_TEMPLATES: HypothesisTemplate[] = [
  {
    id: 'comparative',
    name: 'Comparative Hypothesis',
    description: 'Compare differences between groups or conditions',
    type: 'alternative',
    template: 'There will be a significant difference in [DEPENDENT_VAR] between [GROUP_1] and [GROUP_2]',
    examples: [
      'There will be a significant difference in environmental concern between urban and rural residents',
      'Males and females will differ significantly in their risk-taking behavior scores'
    ],
    fields: [
      { name: 'dependent_variable', placeholder: 'Dependent variable', required: true },
      { name: 'group_1', placeholder: 'First group/condition', required: true },
      { name: 'group_2', placeholder: 'Second group/condition', required: true }
    ]
  },
  {
    id: 'correlational',
    name: 'Correlational Hypothesis',
    description: 'Predict relationships between variables',
    type: 'alternative',
    template: 'There will be a [DIRECTION] relationship between [VAR_1] and [VAR_2]',
    examples: [
      'There will be a positive relationship between exercise frequency and mental well-being',
      'Job satisfaction will be negatively correlated with turnover intention'
    ],
    fields: [
      { name: 'direction', placeholder: 'positive/negative', required: true },
      { name: 'variable_1', placeholder: 'First variable', required: true },
      { name: 'variable_2', placeholder: 'Second variable', required: true }
    ]
  },
  {
    id: 'causal',
    name: 'Causal Hypothesis',
    description: 'Predict cause-and-effect relationships',
    type: 'directional',
    template: '[INDEPENDENT_VAR] will [EFFECT] [DEPENDENT_VAR]',
    examples: [
      'Increased social media use will decrease face-to-face communication skills',
      'Mindfulness training will improve emotional regulation abilities'
    ],
    fields: [
      { name: 'independent_variable', placeholder: 'Independent variable', required: true },
      { name: 'effect', placeholder: 'increase/decrease/improve/reduce', required: true },
      { name: 'dependent_variable', placeholder: 'Dependent variable', required: true }
    ]
  },
  {
    id: 'moderation',
    name: 'Moderation Hypothesis',
    description: 'Predict conditional effects',
    type: 'alternative',
    template: 'The relationship between [VAR_1] and [VAR_2] will be moderated by [MODERATOR]',
    examples: [
      'The relationship between stress and performance will be moderated by experience level',
      'Age will moderate the effect of technology adoption on productivity'
    ],
    fields: [
      { name: 'variable_1', placeholder: 'Independent variable', required: true },
      { name: 'variable_2', placeholder: 'Dependent variable', required: true },
      { name: 'moderator', placeholder: 'Moderating variable', required: true }
    ]
  }
];

export default function HypothesisBuilderPage() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [currentHypothesis, setCurrentHypothesis] = useState<Partial<Hypothesis>>({
    type: 'alternative',
    variables: {
      independent: [],
      dependent: [],
      control: [],
      mediating: [],
      moderating: []
    }
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  console.log(selectedTemplate); // TODO: Remove after template UI is fully implemented
  const [activeTab, setActiveTab] = useState('builder');
  const [aiMode, setAiMode] = useState(false);
  const [showVariableHelper, setShowVariableHelper] = useState(false);

  // AI-powered hypothesis generation
  const generateHypothesis = async () => {
    if (!currentHypothesis.statement) return;
    
    // Simulate AI processing
    const testability = calculateTestability(currentHypothesis);
    const suggestedTests = suggestStatisticalTests(currentHypothesis);
    
    setCurrentHypothesis(prev => ({
      ...prev,
      testability,
      statisticalTests: suggestedTests
    }));
  };

  // Calculate testability score
  const calculateTestability = (hypothesis: Partial<Hypothesis>) => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!hypothesis.statement || hypothesis.statement.length < 20) {
      issues.push('Hypothesis statement is too vague or short');
      suggestions.push('Provide a more specific and detailed hypothesis statement');
      score -= 30;
    }

    if (!hypothesis.variables?.independent?.length) {
      issues.push('No independent variables identified');
      suggestions.push('Clearly identify at least one independent variable');
      score -= 25;
    }

    if (!hypothesis.variables?.dependent?.length) {
      issues.push('No dependent variables identified');
      suggestions.push('Specify what you are measuring as the outcome');
      score -= 25;
    }

    if (hypothesis.statement?.includes('might') || hypothesis.statement?.includes('maybe')) {
      issues.push('Hypothesis contains uncertain language');
      suggestions.push('Use definitive language (will/will not) instead of uncertain terms');
      score -= 10;
    }

    if (!hypothesis.rationale) {
      issues.push('Missing theoretical rationale');
      suggestions.push('Provide theoretical or empirical justification for your hypothesis');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  };

  // Suggest statistical tests
  const suggestStatisticalTests = (hypothesis: Partial<Hypothesis>) => {
    const tests: string[] = [];
    
    if (hypothesis.type === 'alternative' || hypothesis.type === 'directional') {
      if (hypothesis.variables?.independent?.length === 1 && hypothesis.variables?.dependent?.length === 1) {
        tests.push('Independent t-test', 'Mann-Whitney U test', 'One-way ANOVA');
      }
      if (hypothesis.variables?.independent?.length! > 1) {
        tests.push('Two-way ANOVA', 'MANOVA', 'Multiple regression');
      }
    }
    
    if (hypothesis.statement?.toLowerCase().includes('correlation') || 
        hypothesis.statement?.toLowerCase().includes('relationship')) {
      tests.push('Pearson correlation', 'Spearman correlation', 'Regression analysis');
    }
    
    if (hypothesis.variables?.mediating?.length) {
      tests.push('Mediation analysis', 'Path analysis', 'Structural equation modeling');
    }
    
    if (hypothesis.variables?.moderating?.length) {
      tests.push('Moderation analysis', 'Moderated regression', 'Interaction effects');
    }
    
    return tests;
  };

  // Add variable to hypothesis
  const addVariable = (type: keyof Hypothesis['variables'], value: string) => {
    if (!value.trim()) return;
    
    setCurrentHypothesis(prev => ({
      ...prev,
      variables: {
        ...prev.variables!,
        [type]: [...(prev.variables![type] || []), value.trim()]
      }
    }));
  };

  // Remove variable from hypothesis
  const removeVariable = (type: keyof Hypothesis['variables'], index: number) => {
    setCurrentHypothesis(prev => ({
      ...prev,
      variables: {
        ...prev.variables!,
        [type]: prev.variables![type]?.filter((_, i) => i !== index) || []
      }
    }));
  };

  // Save hypothesis
  const saveHypothesis = () => {
    if (!currentHypothesis.statement) return;
    
    const newHypothesis: Hypothesis = {
      id: `hyp-${Date.now()}`,
      type: currentHypothesis.type as Hypothesis['type'],
      statement: currentHypothesis.statement,
      variables: currentHypothesis.variables!,
      rationale: currentHypothesis.rationale || '',
      testability: currentHypothesis.testability || calculateTestability(currentHypothesis),
      statisticalTests: currentHypothesis.statisticalTests || [],
      expectedOutcome: currentHypothesis.expectedOutcome || '',
      alternativeExplanations: currentHypothesis.alternativeExplanations || [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setHypotheses(prev => [...prev, newHypothesis]);
    setCurrentHypothesis({
      type: 'alternative',
      variables: {
        independent: [],
        dependent: [],
        control: [],
        mediating: [],
        moderating: []
      }
    });
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = HYPOTHESIS_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    setSelectedTemplate(templateId);
    setCurrentHypothesis(prev => ({
      ...prev,
      type: template.type
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Hypothesis Builder
          </h1>
          <p className="text-gray-600">
            Formulate testable hypotheses with AI-powered assistance
          </p>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="builder">
              <Lightbulb className="w-4 h-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="templates">
              <BookOpen className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="validation">
              <CheckCircle className="w-4 h-4 mr-2" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="library">
              <BarChart3 className="w-4 h-4 mr-2" />
              Library
            </TabsTrigger>
          </TabsList>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Main Builder */}
              <div className="col-span-8 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Hypothesis Statement</span>
                      <Button
                        variant={aiMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAiMode(!aiMode)}
                        className={cn(
                          aiMode && "bg-gradient-to-r from-indigo-600 to-purple-600"
                        )}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Mode
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hypothesis Type */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Hypothesis Type</label>
                      <Select
                        value={currentHypothesis.type || 'alternative'}
                        onValueChange={(value) => setCurrentHypothesis(prev => ({ ...prev, type: value as Hypothesis['type'] }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Null Hypothesis (H₀)</SelectItem>
                          <SelectItem value="alternative">Alternative Hypothesis (H₁)</SelectItem>
                          <SelectItem value="directional">Directional (One-tailed)</SelectItem>
                          <SelectItem value="non-directional">Non-directional (Two-tailed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Statement */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Statement</label>
                      <Textarea
                        value={currentHypothesis.statement || ''}
                        onChange={(e) => setCurrentHypothesis(prev => ({ ...prev, statement: e.target.value }))}
                        placeholder="Enter your hypothesis statement..."
                        className="mt-1 min-h-[100px]"
                      />
                      {aiMode && currentHypothesis.statement && (
                        <Button
                          onClick={generateHypothesis}
                          size="sm"
                          className="mt-2"
                          variant="outline"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          Analyze with AI
                        </Button>
                      )}
                    </div>

                    {/* Variables Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Variables</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowVariableHelper(!showVariableHelper)}
                        >
                          <Info className="w-4 h-4 mr-2" />
                          Variable Guide
                          {showVariableHelper ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                        </Button>
                      </div>

                      <AnimatePresence>
                        {showVariableHelper && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <Card className="bg-blue-50 border-blue-200">
                              <CardContent className="p-4 text-sm space-y-2">
                                <p><strong>Independent:</strong> The variable you manipulate or control</p>
                                <p><strong>Dependent:</strong> The outcome you measure</p>
                                <p><strong>Control:</strong> Variables held constant</p>
                                <p><strong>Mediating:</strong> Variables that explain the relationship</p>
                                <p><strong>Moderating:</strong> Variables that affect the strength/direction</p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Variable Inputs */}
                      {['independent', 'dependent', 'control', 'mediating', 'moderating'].map((varType) => (
                        <div key={varType}>
                          <label className="text-xs font-medium text-gray-600 capitalize">{varType} Variables</label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              placeholder={`Add ${varType} variable...`}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addVariable(varType as keyof Hypothesis['variables'], (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const input = document.querySelector(`input[placeholder="Add ${varType} variable..."]`) as HTMLInputElement;
                                if (input?.value) {
                                  addVariable(varType as keyof Hypothesis['variables'], input.value);
                                  input.value = '';
                                }
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {currentHypothesis.variables?.[varType as keyof Hypothesis['variables']]?.map((variable, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => removeVariable(varType as keyof Hypothesis['variables'], index)}
                              >
                                {variable}
                                <Trash2 className="w-3 h-3 ml-2" />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Rationale */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Theoretical Rationale</label>
                      <Textarea
                        value={currentHypothesis.rationale || ''}
                        onChange={(e) => setCurrentHypothesis(prev => ({ ...prev, rationale: e.target.value }))}
                        placeholder="Explain the theoretical or empirical basis for your hypothesis..."
                        className="mt-1 min-h-[80px]"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentHypothesis({
                          type: 'alternative',
                          variables: {
                            independent: [],
                            dependent: [],
                            control: [],
                            mediating: [],
                            moderating: []
                          }
                        })}
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={saveHypothesis}
                        disabled={!currentHypothesis.statement}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600"
                      >
                        Save Hypothesis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Side Panel */}
              <div className="col-span-4 space-y-4">
                {/* Testability Score */}
                {currentHypothesis.testability && (
                  <Card className="border-2 border-purple-200">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Testability Analysis</span>
                        <Badge className={cn(
                          currentHypothesis.testability.score >= 80 ? "bg-green-100 text-green-700" :
                          currentHypothesis.testability.score >= 60 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {currentHypothesis.testability.score}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentHypothesis.testability.issues.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Issues</p>
                          {currentHypothesis.testability.issues.map((issue, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs text-red-600 mb-1">
                              <AlertTriangle className="w-3 h-3 mt-0.5" />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {currentHypothesis.testability.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Suggestions</p>
                          {currentHypothesis.testability.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs text-blue-600 mb-1">
                              <Lightbulb className="w-3 h-3 mt-0.5" />
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Suggested Tests */}
                {currentHypothesis.statisticalTests && currentHypothesis.statisticalTests.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        <TestTube className="w-4 h-4 mr-2" />
                        Suggested Statistical Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {currentHypothesis.statisticalTests.map((test, index) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {HYPOTHESIS_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => applyTemplate(template.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-mono">{template.template}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Examples:</p>
                        {template.examples.map((example, index) => (
                          <p key={index} className="text-xs text-gray-600 mb-1">• {example}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle>Hypothesis Validation Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Clear and specific statement', checked: !!currentHypothesis.statement },
                    { label: 'Testable and falsifiable', checked: (currentHypothesis.testability?.score || 0) > 60 },
                    { label: 'Variables clearly identified', checked: !!currentHypothesis.variables?.independent?.length },
                    { label: 'Theoretical rationale provided', checked: !!currentHypothesis.rationale },
                    { label: 'Statistical tests identified', checked: !!currentHypothesis.statisticalTests?.length },
                    { label: 'Alternative explanations considered', checked: !!currentHypothesis.alternativeExplanations }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {item.checked ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={cn(
                        "text-sm",
                        item.checked ? "text-gray-900" : "text-gray-500"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library">
            <div className="space-y-4">
              {hypotheses.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FlaskConical className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No hypotheses saved yet</p>
                    <p className="text-sm text-gray-500 mt-2">Create your first hypothesis in the Builder tab</p>
                  </CardContent>
                </Card>
              ) : (
                hypotheses.map((hypothesis) => (
                  <Card key={hypothesis.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{hypothesis.type}</Badge>
                            <Badge className={cn(
                              hypothesis.status === 'validated' ? "bg-green-100 text-green-700" :
                              hypothesis.status === 'refined' ? "bg-blue-100 text-blue-700" :
                              hypothesis.status === 'testing' ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            )}>
                              {hypothesis.status}
                            </Badge>
                            {hypothesis.testability && (
                              <Badge className={cn(
                                hypothesis.testability.score >= 80 ? "bg-green-100 text-green-700" :
                                hypothesis.testability.score >= 60 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {hypothesis.testability.score}% testable
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{hypothesis.statement}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs font-medium text-gray-600">Independent Variables</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {hypothesis.variables.independent.map((v, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Dependent Variables</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {hypothesis.variables.dependent.map((v, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {hypothesis.statisticalTests.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-600 mb-1">Suggested Tests</p>
                          <div className="flex flex-wrap gap-1">
                            {hypothesis.statisticalTests.map((test, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{test}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}