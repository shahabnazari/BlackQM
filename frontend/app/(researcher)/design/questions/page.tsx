/**
 * Research Question Wizard - DESIGN Phase
 * World-class implementation for research question formulation
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Target,
  Users,
  Calendar,
  MapPin,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Book,
  Beaker
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ResearchQuestion {
  main: string;
  subQuestions: string[];
  type: 'exploratory' | 'descriptive' | 'explanatory' | 'evaluative';
  scope: 'broad' | 'focused' | 'narrow';
  methodology: 'qualitative' | 'quantitative' | 'mixed' | 'q-methodology';
  feasibility: {
    score: number;
    concerns: string[];
    strengths: string[];
  };
}

type WizardStep = 'topic' | 'type' | 'components' | 'refinement' | 'validation' | 'summary';

const QUESTION_TEMPLATES = {
  exploratory: [
    "What are the key factors influencing [phenomenon] in [context]?",
    "How do [stakeholders] perceive [topic] in [setting]?",
    "What patterns emerge from [participants'] experiences of [phenomenon]?"
  ],
  descriptive: [
    "What is the current state of [phenomenon] in [population/context]?",
    "How prevalent is [condition/behavior] among [group]?",
    "What are the characteristics of [population] regarding [topic]?"
  ],
  explanatory: [
    "Why does [phenomenon] occur in [context]?",
    "What causes [outcome] among [population]?",
    "How does [variable A] influence [variable B] in [setting]?"
  ],
  evaluative: [
    "How effective is [intervention] in achieving [outcome]?",
    "To what extent does [program] meet [objectives]?",
    "What is the impact of [policy] on [stakeholders]?"
  ]
};

const Q_METHOD_QUESTIONS = [
  "What are the distinct viewpoints on [topic] among [stakeholders]?",
  "How do [participants] subjectively understand [phenomenon]?",
  "What are the shared and divergent perspectives on [issue] within [community]?",
  "How do individuals prioritize [aspects] of [topic]?",
  "What subjective meanings do [stakeholders] attach to [concept]?"
];

export default function ResearchQuestionWizardPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('topic');
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);
  
  const [formData, setFormData] = useState<{
    topic: string;
    background: string;
    questionType: ResearchQuestion['type'] | '';
    population: string;
    setting: string;
    timeframe: string;
    variables: string[];
    mainQuestion: string;
    subQuestions: string[];
    methodology: ResearchQuestion['methodology'] | '';
  }>({
    topic: '',
    background: '',
    questionType: '',
    population: '',
    setting: '',
    timeframe: '',
    variables: [],
    mainQuestion: '',
    subQuestions: [],
    methodology: ''
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [validation, setValidation] = useState<{
    clarity: boolean;
    feasibility: boolean;
    significance: boolean;
    specificity: boolean;
  }>({
    clarity: false,
    feasibility: false,
    significance: false,
    specificity: false
  });

  const steps: WizardStep[] = ['topic', 'type', 'components', 'refinement', 'validation', 'summary'];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      if (nextStep) setCurrentStep(nextStep);
      if (aiAssistEnabled && steps[currentStepIndex + 1] === 'refinement') {
        generateQuestionSuggestions();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      if (prevStep) setCurrentStep(prevStep);
    }
  };

  const generateQuestionSuggestions = () => {
    const templates = formData.methodology === 'q-methodology' 
      ? Q_METHOD_QUESTIONS 
      : QUESTION_TEMPLATES[formData.questionType as keyof typeof QUESTION_TEMPLATES] || [];
    
    const customized = templates.map(template => 
      template
        .replace('[phenomenon]', formData.topic)
        .replace('[topic]', formData.topic)
        .replace('[population]', formData.population)
        .replace('[stakeholders]', formData.population)
        .replace('[participants]', formData.population)
        .replace('[context]', formData.setting)
        .replace('[setting]', formData.setting)
        .replace('[group]', formData.population)
        .replace('[community]', formData.setting)
    );
    
    setSuggestions(customized);
  };

  const validateQuestion = () => {
    const question = formData.mainQuestion;
    setValidation({
      clarity: question.split(' ').length > 5 && question.split(' ').length < 30,
      feasibility: formData.timeframe !== '' && formData.population !== '',
      significance: question.includes('how') || question.includes('what') || question.includes('why'),
      specificity: formData.variables.length > 0 && formData.population !== '' && formData.setting !== ''
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'topic':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">What's Your Research Topic?</h2>
              <p className="text-gray-600 mb-6">
                Start by describing the general area or phenomenon you want to investigate.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Research Topic</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Climate change attitudes, Remote work productivity..."
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="background">Background & Context</Label>
                <Textarea
                  id="background"
                  value={formData.background}
                  onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                  placeholder="Briefly describe what you already know about this topic and why it's important..."
                  className="mt-2 min-h-[120px]"
                />
              </div>
            </div>

            {aiAssistEnabled && formData.topic && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">AI Insight</p>
                    <p className="text-sm text-purple-700 mt-1">
                      Consider exploring specific aspects like stakeholder perspectives, temporal changes, 
                      or comparative analyses to narrow your focus.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 'type':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">What Type of Question?</h2>
              <p className="text-gray-600 mb-6">
                Different question types serve different research purposes. Choose the one that best fits your goals.
              </p>
            </div>
            
            <RadioGroup
              value={formData.questionType}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                questionType: value as ResearchQuestion['type']
              }))}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="exploratory" id="exploratory" />
                <Label htmlFor="exploratory" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">Exploratory</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Investigate a new or poorly understood phenomenon. Perfect for generating insights and hypotheses.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Example: "What factors influence..." or "How do people experience..."
                    </p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="descriptive" id="descriptive" />
                <Label htmlFor="descriptive" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">Descriptive</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Document characteristics, frequencies, or patterns. Ideal for mapping current states.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Example: "What is the prevalence of..." or "What are the characteristics of..."
                    </p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="explanatory" id="explanatory" />
                <Label htmlFor="explanatory" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">Explanatory</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Understand causes, relationships, and mechanisms. Best for testing theories.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Example: "Why does..." or "How does X affect Y..."
                    </p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="evaluative" id="evaluative" />
                <Label htmlFor="evaluative" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">Evaluative</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Assess effectiveness, impact, or outcomes. Perfect for program evaluation.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Example: "How effective is..." or "What is the impact of..."
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="mt-6">
              <Label>Methodology Approach</Label>
              <RadioGroup
                value={formData.methodology}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  methodology: value as ResearchQuestion['methodology']
                }))}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="qualitative" id="qualitative" />
                  <Label htmlFor="qualitative">Qualitative</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="quantitative" id="quantitative" />
                  <Label htmlFor="quantitative">Quantitative</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed">Mixed Methods</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-purple-50 border-purple-300">
                  <RadioGroupItem value="q-methodology" id="q-methodology" />
                  <Label htmlFor="q-methodology">Q Methodology</Label>
                </div>
              </RadioGroup>
            </div>
          </motion.div>
        );

      case 'components':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Define Key Components</h2>
              <p className="text-gray-600 mb-6">
                A good research question clearly identifies who, what, where, and when.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="population">
                  <Users className="w-4 h-4 inline mr-1" />
                  Population/Participants
                </Label>
                <Input
                  id="population"
                  value={formData.population}
                  onChange={(e) => setFormData(prev => ({ ...prev, population: e.target.value }))}
                  placeholder="e.g., Healthcare workers, University students, Small business owners..."
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="setting">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Setting/Context
                </Label>
                <Input
                  id="setting"
                  value={formData.setting}
                  onChange={(e) => setFormData(prev => ({ ...prev, setting: e.target.value }))}
                  placeholder="e.g., Urban hospitals, Online learning environments, Tech startups..."
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="timeframe">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Timeframe
                </Label>
                <Input
                  id="timeframe"
                  value={formData.timeframe}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
                  placeholder="e.g., During COVID-19, 2020-2024, Past 5 years..."
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="variables">
                  <Target className="w-4 h-4 inline mr-1" />
                  Key Variables/Concepts
                </Label>
                <Textarea
                  id="variables"
                  value={formData.variables.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                  }))}
                  placeholder="Enter key concepts separated by commas..."
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: job satisfaction, productivity, well-being, attitudes, behaviors
                </p>
              </div>
            </div>

            {formData.methodology === 'q-methodology' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Beaker className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Q Methodology Tip</p>
                    <p className="text-sm text-purple-700 mt-1">
                      Focus on identifying different viewpoints or perspectives. Your question should explore 
                      subjective opinions rather than objective facts.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 'refinement':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Refine Your Question</h2>
              <p className="text-gray-600 mb-6">
                Craft your main research question and supporting sub-questions.
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-3">
                <Label>AI-Generated Suggestions</Label>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100"
                      onClick={() => setFormData(prev => ({ ...prev, mainQuestion: suggestion }))}
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-900">{suggestion}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="main-question">Main Research Question</Label>
                <Textarea
                  id="main-question"
                  value={formData.mainQuestion}
                  onChange={(e) => setFormData(prev => ({ ...prev, mainQuestion: e.target.value }))}
                  placeholder="Write your main research question here..."
                  className="mt-2 min-h-[100px]"
                />
              </div>
              
              <div>
                <Label htmlFor="sub-questions">Sub-Questions (Optional)</Label>
                <Textarea
                  id="sub-questions"
                  value={formData.subQuestions.join('\n')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    subQuestions: e.target.value.split('\n').filter(Boolean)
                  }))}
                  placeholder="Enter each sub-question on a new line..."
                  className="mt-2 min-h-[120px]"
                />
              </div>
            </div>

            <Button
              onClick={validateQuestion}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Check Question Quality
            </Button>
          </motion.div>
        );

      case 'validation':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Question Validation</h2>
              <p className="text-gray-600 mb-6">
                Let's ensure your research question meets quality criteria.
              </p>
            </div>

            <div className="space-y-4">
              <Card className={cn(
                "p-4 border-2",
                validation.clarity ? "border-green-200 bg-green-50" : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  {validation.clarity ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">Clarity</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Question is clear, concise, and unambiguous
                    </p>
                    {!validation.clarity && (
                      <p className="text-sm text-orange-600 mt-2">
                        Tip: Aim for 10-25 words. Avoid jargon and complex terminology.
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className={cn(
                "p-4 border-2",
                validation.feasibility ? "border-green-200 bg-green-50" : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  {validation.feasibility ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">Feasibility</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Can be answered with available resources and time
                    </p>
                    {!validation.feasibility && (
                      <p className="text-sm text-orange-600 mt-2">
                        Tip: Ensure you've defined your population and timeframe clearly.
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className={cn(
                "p-4 border-2",
                validation.significance ? "border-green-200 bg-green-50" : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  {validation.significance ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">Significance</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Addresses an important gap or problem
                    </p>
                    {!validation.significance && (
                      <p className="text-sm text-orange-600 mt-2">
                        Tip: Start with "How", "What", or "Why" to ensure analytical depth.
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className={cn(
                "p-4 border-2",
                validation.specificity ? "border-green-200 bg-green-50" : "border-gray-200"
              )}>
                <div className="flex items-start gap-3">
                  {validation.specificity ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">Specificity</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Focused enough to be answerable
                    </p>
                    {!validation.specificity && (
                      <p className="text-sm text-orange-600 mt-2">
                        Tip: Add specific context, population, and variables.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Overall Assessment</h3>
              </div>
              <p className="text-sm text-blue-800">
                {Object.values(validation).filter(v => v).length === 4
                  ? "Excellent! Your research question is well-formulated and ready to guide your study."
                  : `Your question needs some refinement. Focus on the areas marked above to strengthen it.`}
              </p>
            </div>
          </motion.div>
        );

      case 'summary':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Research Question Summary</h2>
              <p className="text-gray-600 mb-6">
                Here's your complete research question framework. You can export or save this for your study.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Research Question Framework
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Main Question</h3>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="font-medium text-purple-900">{formData.mainQuestion}</p>
                  </div>
                </div>

                {formData.subQuestions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Sub-Questions</h3>
                    <div className="space-y-2">
                      {formData.subQuestions.map((q, i) => (
                        <div key={i} className="p-2 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-sm">{i + 1}. {q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <Badge className="mt-1">{formData.questionType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Methodology</p>
                    <Badge className="mt-1">{formData.methodology}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Population</p>
                    <p className="font-medium mt-1">{formData.population}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Setting</p>
                    <p className="font-medium mt-1">{formData.setting}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Timeframe</p>
                    <p className="font-medium mt-1">{formData.timeframe}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Key Variables</p>
                    <p className="font-medium mt-1">{formData.variables.join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button className="flex-1">
                Save to Study
              </Button>
              <Button variant="outline" className="flex-1">
                Export as PDF
              </Button>
              <Button variant="outline" className="flex-1">
                Share with Team
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                  index <= currentStepIndex
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-600"
                )}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-1 ml-2",
                    index < currentStepIndex
                      ? "bg-purple-600"
                      : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Topic</span>
            <span>Type</span>
            <span>Components</span>
            <span>Refinement</span>
            <span>Validation</span>
            <span>Summary</span>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                variant="outline"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={() => setAiAssistEnabled(!aiAssistEnabled)}
                variant="ghost"
                size="sm"
              >
                <Sparkles className={cn(
                  "w-4 h-4 mr-2",
                  aiAssistEnabled && "text-purple-600"
                )} />
                AI Assist {aiAssistEnabled ? 'On' : 'Off'}
              </Button>

              <Button
                onClick={handleNextStep}
                disabled={currentStepIndex === steps.length - 1}
              >
                {currentStepIndex === steps.length - 2 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}