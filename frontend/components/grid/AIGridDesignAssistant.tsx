'use client';

import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { GridConfigurationService, StandardGridConfig } from '@/lib/services/grid-configuration.service';
import { useGridRecommendations } from '@/hooks/useAIBackend';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart3,
    BookOpen,
    Brain,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Info,
    Lightbulb,
    Settings,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';

interface GridRecommendation {
  config: StandardGridConfig;
  columns: number;
  range: { min: number; max: number };
  distribution: number[];
  totalCells: number;
  reasoning: string[];
  confidence: number;
  alternativeOptions?: GridRecommendation[];
  citation?: string;
}

interface StudyContext {
  studyType: 'exploratory' | 'confirmatory' | 'mixed' | null;
  participantCount: number | null;
  participantExpertise: 'expert' | 'general' | 'mixed' | null;
  complexityLevel: 'simple' | 'moderate' | 'complex' | null;
  stimuliType: 'text' | 'image' | 'mixed' | null;
  timeConstraint: 'short' | 'medium' | 'long' | null;
  previousExperience: 'none' | 'some' | 'extensive' | null;
}

interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: 'single' | 'number' | 'range';
  options?: { value: string; label: string; description?: string }[];
  min?: number;
  max?: number;
  icon: React.ElementType;
}

export const AIGridDesignAssistant: React.FC<{
  onRecommendation: (config: GridRecommendation) => void;
  onClose?: () => void;
}> = ({ onRecommendation, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [context, setContext] = useState<StudyContext>({
    studyType: null,
    participantCount: null,
    participantExpertise: null,
    complexityLevel: null,
    stimuliType: null,
    timeConstraint: null,
    previousExperience: null,
  });
  const [recommendation, setRecommendation] = useState<GridRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Use the AI backend hook for recommendations
  const { getRecommendations } = useGridRecommendations();

  const questions: Question[] = [
    {
      id: 'studyType',
      text: 'What type of Q-study are you conducting?',
      subtext: 'This helps determine the optimal grid structure',
      type: 'single',
      icon: Target,
      options: [
        { 
          value: 'exploratory', 
          label: 'Exploratory Study',
          description: 'Discovering new perspectives and patterns'
        },
        { 
          value: 'confirmatory', 
          label: 'Confirmatory Study',
          description: 'Testing specific hypotheses or theories'
        },
        { 
          value: 'mixed', 
          label: 'Mixed Methods',
          description: 'Combining exploration with confirmation'
        }
      ]
    },
    {
      id: 'participantCount',
      text: 'How many participants will you have?',
      subtext: 'Helps determine the appropriate number of stimuli',
      type: 'number',
      min: 5,
      max: 100,
      icon: Users
    },
    {
      id: 'participantExpertise',
      text: 'What is your participants\' familiarity with the topic?',
      subtext: 'Experts can handle more complex grids',
      type: 'single',
      icon: Brain,
      options: [
        { 
          value: 'expert', 
          label: 'Subject Matter Experts',
          description: 'Deep knowledge of the topic'
        },
        { 
          value: 'general', 
          label: 'General Public',
          description: 'Basic or no prior knowledge'
        },
        { 
          value: 'mixed', 
          label: 'Mixed Expertise',
          description: 'Varied levels of knowledge'
        }
      ]
    },
    {
      id: 'complexityLevel',
      text: 'How complex is your research topic?',
      subtext: 'Complex topics may benefit from more nuanced sorting',
      type: 'single',
      icon: BarChart3,
      options: [
        { 
          value: 'simple', 
          label: 'Simple/Straightforward',
          description: 'Clear, well-defined concepts'
        },
        { 
          value: 'moderate', 
          label: 'Moderately Complex',
          description: 'Some nuance and interpretation needed'
        },
        { 
          value: 'complex', 
          label: 'Highly Complex',
          description: 'Abstract or multifaceted concepts'
        }
      ]
    },
    {
      id: 'stimuliType',
      text: 'What type of stimuli will you use?',
      subtext: 'Different stimuli types affect cognitive load',
      type: 'single',
      icon: Settings,
      options: [
        { 
          value: 'text', 
          label: 'Text Statements',
          description: 'Words, phrases, or sentences'
        },
        { 
          value: 'image', 
          label: 'Images/Visual',
          description: 'Photos, graphics, or illustrations'
        },
        { 
          value: 'mixed', 
          label: 'Mixed Media',
          description: 'Combination of text and images'
        }
      ]
    },
    {
      id: 'timeConstraint',
      text: 'How much time can participants spend?',
      subtext: 'Helps optimize for completion rate',
      type: 'single',
      icon: TrendingUp,
      options: [
        { 
          value: 'short', 
          label: '10-15 minutes',
          description: 'Quick study, limited time'
        },
        { 
          value: 'medium', 
          label: '15-30 minutes',
          description: 'Standard study duration'
        },
        { 
          value: 'long', 
          label: '30+ minutes',
          description: 'In-depth, thorough sorting'
        }
      ]
    },
    {
      id: 'previousExperience',
      text: 'What\'s your experience with Q-methodology?',
      subtext: 'We\'ll adjust our recommendations accordingly',
      type: 'single',
      icon: Lightbulb,
      options: [
        { 
          value: 'none', 
          label: 'First Time',
          description: 'New to Q-methodology'
        },
        { 
          value: 'some', 
          label: 'Some Experience',
          description: 'Conducted 1-3 studies'
        },
        { 
          value: 'extensive', 
          label: 'Experienced Researcher',
          description: 'Multiple studies completed'
        }
      ]
    }
  ];

  const analyzeAndRecommend = async (): Promise<GridRecommendation | null> => {
    try {
      // Prepare study topic from context
      const studyTopic = `${context.studyType || 'exploratory'} study with ${
        context.participantCount || 30
      } participants, ${context.participantExpertise || 'general'} expertise level`;
      
      // Map context to backend parameters
      const participantExperience = context.previousExperience === 'none' ? 'novice' :
                                     context.previousExperience === 'some' ? 'intermediate' : 'expert';
      
      const researchType = context.studyType === 'exploratory' ? 'exploratory' :
                           context.studyType === 'confirmatory' ? 'confirmatory' : 'comparative';
      
      // Call AI backend for recommendations
      const aiRecommendations = await getRecommendations({
        studyTopic,
        expectedStatements: context.participantCount || 30,
        participantExperience: participantExperience as 'novice' | 'intermediate' | 'expert',
        researchType: researchType as 'exploratory' | 'confirmatory' | 'comparative'
      });
      
      if (aiRecommendations && aiRecommendations.length > 0) {
        // Use first recommendation from AI
        const aiRec = aiRecommendations[0];
        
        // Get a fallback config from local service to ensure proper structure
        const fallbackConfig = GridConfigurationService.getConfigById('optimal-36');
        
        // Merge AI recommendation with local config structure
        const config: StandardGridConfig = fallbackConfig || {
          id: 'ai-recommended',
          name: 'AI Recommended Configuration',
          range: { min: -4, max: 4 },
          distribution: [1, 2, 3, 4, 5, 4, 3, 2, 1],
          totalItems: 36,
          description: aiRec?.reasoning || 'AI-optimized configuration',
          citation: 'AI Analysis',
          recommendedFor: ['general research'],
          timeEstimate: '15-20 minutes',
          expertiseLevel: 'intermediate'
        };
        
        const columns = config.range.max - config.range.min + 1;
        
        return {
          config,
          columns,
          range: config.range,
          distribution: config.distribution,
          totalCells: config.totalItems,
          reasoning: [aiRec?.reasoning || 'Optimized based on AI analysis'],
          confidence: (aiRec as any)?.confidence || 85,
          alternativeOptions: [],
          citation: 'AI-Generated Recommendation'
        };
      } else {
        // Fallback to local service if AI fails
        const serviceRecommendation = GridConfigurationService.getAIRecommendation({
          studyType: context.studyType || 'exploratory',
          participantCount: context.participantCount || 30,
          participantExpertise: context.participantExpertise || 'general',
          complexityLevel: context.complexityLevel || 'moderate',
          timeConstraint: context.timeConstraint || 'medium',
          previousExperience: context.previousExperience || 'none'
        });

        // Get additional rationale for the selected configuration
        const additionalRationale = GridConfigurationService.getConfigurationRationale(serviceRecommendation.config);

        // Convert service recommendation to component format
        const columns = serviceRecommendation.config.range.max - serviceRecommendation.config.range.min + 1;
        
        // Generate alternatives with proper format
        const alternatives: GridRecommendation[] = serviceRecommendation.alternatives.map((alt: any) => {
          const altColumns = alt.range.max - alt.range.min + 1;
          return {
            config: alt,
            columns: altColumns,
            range: alt.range,
            distribution: alt.distribution,
            totalCells: alt.totalItems,
            reasoning: GridConfigurationService.getConfigurationRationale(alt),
            confidence: serviceRecommendation.confidence - 10,
            citation: alt.citation
          };
        });

        return {
          config: serviceRecommendation.config,
          columns,
          range: serviceRecommendation.config.range,
          distribution: serviceRecommendation.config.distribution,
          totalCells: serviceRecommendation.config.totalItems,
          reasoning: [...serviceRecommendation.reasoning, ...additionalRationale],
          confidence: serviceRecommendation.confidence,
          alternativeOptions: alternatives,
          citation: serviceRecommendation.config.citation
        };
      }
    } catch (error) {
      console.error('Failed to get AI recommendation:', error);
      // Return null on error
      return null;
    }
  };

  const handleAnswer = async (value: any) => {
    const question = questions[currentStep];
    if (!question) return;
    const questionId = question.id;
    setContext(prev => ({
      ...prev,
      [questionId]: value
    }));

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Generate recommendation
      setIsAnalyzing(true);
      try {
        const rec = await analyzeAndRecommend();
        if (rec) {
          setRecommendation(rec);
        } else {
          // Handle error case
          console.error('Failed to generate recommendation');
        }
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const currentQuestion = questions[currentStep];
  if (!currentQuestion) return null;
  const Icon = currentQuestion.icon;

  if (isAnalyzing) {
    return (
      <Card className="p-8 max-w-2xl mx-auto max-h-full overflow-y-auto">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <Brain className="w-16 h-16 text-blue-500 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold">Analyzing Your Requirements</h2>
          <p className="text-gray-600">Our AI is calculating the optimal grid configuration...</p>
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((i: any) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-blue-500 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (recommendation) {
    return (
      <Card className="p-8 max-w-4xl mx-auto max-h-full overflow-y-auto">
        <div className="space-y-6 pb-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full mb-4">
              <Zap className="w-5 h-5" />
              <span className="font-medium">AI Recommendation Ready</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Your Optimal Grid Configuration</h2>
            <p className="text-gray-600">Based on your study requirements</p>
          </div>

          {/* Main Recommendation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">Recommended Configuration</h3>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Confidence</div>
                <div className="flex items-center gap-1">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${recommendation.confidence}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="text-sm font-medium">{recommendation.confidence}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{recommendation.columns}</div>
                <div className="text-sm text-gray-600">Columns</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {recommendation.range.min} to +{recommendation.range.max}
                </div>
                <div className="text-sm text-gray-600">Range</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{recommendation.totalCells}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
            </div>

            {/* Distribution Display */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">Distribution Pattern</div>
              <div className="overflow-x-auto">
                <div className="flex justify-center items-end gap-1 min-w-fit px-2">
                  {recommendation.distribution.map((height, index) => (
                    <div key={index} className="flex flex-col items-center flex-shrink-0">
                      <div 
                        className="w-6 md:w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                        style={{ height: `${Math.min(height * 10, 120)}px` }}
                      />
                      <div className="text-xs text-gray-600 mt-1">{height}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">Bell curve distribution</div>
            </div>

            {/* Scientific Backing */}
            {recommendation.citation && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Based on research by {recommendation.citation}
                </span>
              </div>
            )}

            {/* Reasoning */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Why this configuration?
              </h4>
              <ul className="space-y-1">
                {recommendation.reasoning.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Alternative Options */}
          {recommendation.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Alternative Options</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendation.alternativeOptions.slice(0, 4).map((alt, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Option {index + 1}</h4>
                      <span className="text-sm text-gray-500">{alt.confidence}% confidence</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                      <div className="truncate">
                        <span className="text-gray-500">Columns:</span> {alt.columns}
                      </div>
                      <div className="truncate">
                        <span className="text-gray-500">Range:</span> ±{alt.range.max}
                      </div>
                      <div className="truncate">
                        <span className="text-gray-500">Cells:</span> {alt.totalCells}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{alt.reasoning[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setRecommendation(null);
                setCurrentStep(0);
                setContext({
                  studyType: null,
                  participantCount: null,
                  participantExpertise: null,
                  complexityLevel: null,
                  stimuliType: null,
                  timeConstraint: null,
                  previousExperience: null,
                });
              }}
            >
              Start Over
            </Button>
            <div className="flex gap-2">
              {onClose && (
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => onRecommendation(recommendation)}
              >
                Use This Configuration
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 max-w-2xl mx-auto max-h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">AI Grid Design Assistant</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Question {currentStep + 1} of {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{currentQuestion.text}</h3>
                {currentQuestion.subtext && (
                  <p className="text-sm text-gray-600">{currentQuestion.subtext}</p>
                )}
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mt-6">
              {currentQuestion.type === 'single' && currentQuestion.options && (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className="text-left p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                    >
                      <div className="font-medium mb-1">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600">{option.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'number' && (
                <div className="space-y-4">
                  <input
                    type="number"
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    placeholder={`Enter a number between ${currentQuestion.min} and ${currentQuestion.max}`}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e: any) => {
                      if (e.key === 'Enter') {
                        const value = parseInt((e.target as HTMLInputElement).value);
                        if (value >= (currentQuestion.min || 0) && value <= (currentQuestion.max || 100)) {
                          handleAnswer(value);
                        }
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={() => {
                      const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                      const value = parseInt(input.value);
                      if (value >= (currentQuestion.min || 0) && value <= (currentQuestion.max || 100)) {
                        handleAnswer(value);
                      }
                    }}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          {currentStep > 0 && (
            <Button
              variant="secondary"
              onClick={() => handleAnswer(null)}
            >
              Skip
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};