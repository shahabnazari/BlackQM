'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useParticipantAssistance } from '@/hooks/useAIBackend';
import { 
  HelpCircle, 
  Send,
  Loader2,
  User,
  Bot,
  Info,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
// ScrollArea component - using div with overflow for now
const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-y-auto ${className}`}>{children}</div>
);
import { Badge } from '@/components/ui/badge';

type AssistanceStage = 'consent' | 'prescreening' | 'presorting' | 'qsort' | 'postsurvey';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  stage?: AssistanceStage;
}

interface ParticipantAssistantProps {
  participantId: string;
  currentStage: AssistanceStage;
  studyContext?: {
    topic?: string;
    statementCount?: number;
    currentProgress?: number;
    timeElapsed?: number;
  };
  onAssistanceProvided?: (message: Message) => void;
  className?: string;
}

const stageInfo: Record<AssistanceStage, { label: string; description: string; color: string }> = {
  consent: {
    label: 'Consent',
    description: 'Understanding the study and your rights',
    color: 'bg-blue-100 text-blue-700'
  },
  prescreening: {
    label: 'Pre-screening',
    description: 'Checking eligibility and demographics',
    color: 'bg-purple-100 text-purple-700'
  },
  presorting: {
    label: 'Pre-sorting',
    description: 'Familiarizing with the statements',
    color: 'bg-green-100 text-green-700'
  },
  qsort: {
    label: 'Q-Sort',
    description: 'Arranging statements by agreement',
    color: 'bg-yellow-100 text-yellow-700'
  },
  postsurvey: {
    label: 'Post-survey',
    description: 'Additional questions and feedback',
    color: 'bg-pink-100 text-pink-700'
  }
};

const commonQuestions: Record<AssistanceStage, string[]> = {
  consent: [
    "What data will be collected?",
    "Can I withdraw from the study?",
    "How will my privacy be protected?",
    "Who can I contact with questions?"
  ],
  prescreening: [
    "Why do you need this information?",
    "Am I eligible for this study?",
    "How long will this take?",
    "What happens if I'm not eligible?"
  ],
  presorting: [
    "What should I focus on when reading?",
    "Can I take notes?",
    "Should I group similar statements?",
    "How much time should I spend on this?"
  ],
  qsort: [
    "How do I decide placement?",
    "Can I change my mind?",
    "What if I'm neutral about a statement?",
    "Is there a right or wrong answer?"
  ],
  postsurvey: [
    "Why these additional questions?",
    "Can I see my results?",
    "How will my responses be used?",
    "When will the study results be available?"
  ]
};

export function ParticipantAssistant({
  participantId,
  currentStage,
  studyContext,
  onAssistanceProvided,
  className
}: ParticipantAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { loading, error, execute } = useParticipantAssistance();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message when stage changes
  useEffect(() => {
    const welcomeMessage: Message = {
      id: `welcome-${currentStage}`,
      role: 'assistant',
      content: getWelcomeMessage(currentStage),
      timestamp: new Date(),
      stage: currentStage
    };
    setMessages([welcomeMessage]);
  }, [currentStage]);

  const getWelcomeMessage = (stage: AssistanceStage): string => {
    const stageMessages: Record<AssistanceStage, string> = {
      consent: "Welcome! I'm here to help you understand the study and consent process. Feel free to ask any questions about your participation.",
      prescreening: "Let's go through the pre-screening questions together. I can explain why we need this information.",
      presorting: "Time to familiarize yourself with the statements. Take your time reading each one - I'm here if you need clarification.",
      qsort: "Now for the main task! Arrange the statements based on your agreement. Remember, there's no right or wrong answer - we want your honest perspective.",
      postsurvey: "Almost done! Just a few more questions to help us understand your choices better."
    };
    return stageMessages[stage];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowQuickQuestions(false);

    try {
      const response = await execute({
        participantId,
        stage: currentStage,
        context: studyContext || {},
        question: inputMessage
      });

      if (response && response.assistance) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.assistance.message,
          timestamp: new Date(),
          stage: currentStage
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (onAssistanceProvided) {
          onAssistanceProvided(assistantMessage);
        }
      }
    } catch (err) {
      console.error('Failed to get assistance:', err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again or contact the study administrator if the problem persists.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    handleSendMessage();
  };

  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg"
        variant="default"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 shadow-xl ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="text-base">Study Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={stageInfo[currentStage].color}>
              {stageInfo[currentStage].label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6"
            >
              <span className="text-xs">−</span>
            </Button>
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {stageInfo[currentStage].description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-3">
        {/* Progress Indicator */}
        {studyContext?.currentProgress !== undefined && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Progress: {studyContext.currentProgress}%</span>
            {studyContext.timeElapsed && (
              <span>• {Math.round(studyContext.timeElapsed / 60)} min</span>
            )}
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        {showQuickQuestions && commonQuestions[currentStage] && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Common questions:</p>
            <div className="flex flex-wrap gap-1">
              {commonQuestions[currentStage].slice(0, 2).map((question, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={loading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your question..."
            className="min-h-[40px] max-h-[80px] text-sm"
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            size="icon"
            className="flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Connection error. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Tips */}
        <Alert className="py-2">
          <Info className="h-3 w-3" />
          <AlertDescription className="text-xs">
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI-powered assistance available 24/7
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default ParticipantAssistant;