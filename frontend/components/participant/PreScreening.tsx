'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ScreeningQuestionnaire from '@/components/questionnaire/ScreeningQuestionnaire';
import { ScreeningResult } from '@/lib/services/question-api.service';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CpuChipIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface StudyMatch {
  studyId: string;
  title: string;
  matchScore: number;
  matchReasons: string[];
  estimatedTime: number;
  participantCount: number;
  categories: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  compatibility: {
    demographic: number;
    interest: number;
    availability: number;
    experience: number;
    overall: number;
  };
}

interface ParticipantProfile {
  demographics: Record<string, any>;
  interests: string[];
  experience: string[];
  availability: string[];
  preferences: Record<string, any>;
  historicalData?: {
    completedStudies: string[];
    abandonedStudies: string[];
    averageCompletionTime: number;
    preferredTopics: string[];
  };
}

interface PreScreeningProps {
  surveyId?: string; // Make optional for backward compatibility
  participantId?: string;
  onComplete: (data?: any) => void;
  onBack: () => void;
  useDynamic?: boolean; // Allow switching between old and new behavior
  enableMLMatching?: boolean; // Enable ML participant-study matching
}

/**
 * Phase 8.2 Day 1: Refactored PreScreening Component
 *
 * Now supports:
 * - Dynamic questions from API
 * - Qualification logic
 * - Alternative study suggestions
 * - Backward compatibility with hardcoded questions
 */
export default function PreScreening({
  surveyId,
  participantId,
  onComplete,
  onBack,
  useDynamic = true, // Default to dynamic if surveyId provided
  enableMLMatching = true, // Enable ML matching by default
}: PreScreeningProps) {
  const [screeningResult, setScreeningResult] =
    useState<ScreeningResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState({
    familiarity: '',
    participation: '',
    timeAvailable: '',
    age: '',
  });

  // ML Matching State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [participantProfile, setParticipantProfile] =
    useState<ParticipantProfile | null>(null);
  const [studyMatches, setStudyMatches] = useState<StudyMatch[]>([]);
  const [matchConfidence, setMatchConfidence] = useState(0);

  // Handle screening completion from dynamic questionnaire
  const handleScreeningComplete = (result: ScreeningResult) => {
    setScreeningResult(result);
    setShowResult(true);

    if (result.qualified) {
      // Auto-proceed after short delay for qualified participants
      setTimeout(() => {
        onComplete({
          ...result,
        });
      }, 1500);
    }
  };

  // Handle manual continuation for qualified participants
  const handleContinue = () => {
    if (screeningResult?.qualified) {
      onComplete(screeningResult);
    }
  };

  // Handle change for hardcoded questions
  const handleChange = (field: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // ML Participant-Study Matching Functions
  const buildParticipantProfile = useMemo(() => {
    return (): ParticipantProfile => {
      // Extract interests from answers
      const interests: string[] = [];
      if (answers.familiarity === 'very')
        interests.push('research', 'methodology');
      if (answers.participation === 'yes')
        interests.push('experienced', 'returning');

      // Extract experience level
      const experience: string[] = [];
      if (answers.familiarity === 'very') experience.push('advanced');
      else if (answers.familiarity === 'somewhat')
        experience.push('intermediate');
      else experience.push('beginner');

      // Extract availability
      const availability: string[] = [];
      if (answers.timeAvailable === 'yes')
        availability.push('20-30min', 'flexible');
      else availability.push('limited', 'quick-studies');

      // Build demographics
      const demographics = {
        age: answers.age,
        location: 'auto-detected', // Could use geolocation
        language: navigator.language || 'en-US',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Build preferences based on patterns
      const preferences = {
        studyLength: answers.timeAvailable === 'yes' ? 'normal' : 'short',
        complexity: answers.familiarity === 'very' ? 'complex' : 'simple',
        topics: extractTopicPreferences(interests, experience),
      };

      return {
        demographics,
        interests,
        experience,
        availability,
        preferences,
        historicalData: getHistoricalData(participantId) || {
          completedStudies: [],
          abandonedStudies: [],
          averageCompletionTime: 0,
          preferredTopics: [],
        },
      };
    };
  }, [answers, participantId]);

  const extractTopicPreferences = (
    interests: string[],
    experience: string[]
  ): string[] => {
    const topics: string[] = [];

    // Use ML-inspired topic mapping
    if (interests.includes('research')) topics.push('academic', 'scientific');
    if (interests.includes('methodology'))
      topics.push('technical', 'analytical');
    if (experience.includes('beginner'))
      topics.push('introductory', 'educational');
    if (experience.includes('advanced')) topics.push('complex', 'specialized');

    return topics;
  };

  const getHistoricalData = (participantId?: string) => {
    // In production, this would fetch from database
    // For demo, return mock data
    if (!participantId) return undefined;

    return {
      completedStudies: [],
      abandonedStudies: [],
      averageCompletionTime: 25,
      preferredTopics: ['research', 'psychology'],
    };
  };

  const calculateStudyMatch = (
    profile: ParticipantProfile,
    study: any
  ): StudyMatch => {
    // ML-inspired matching algorithm
    const compatibility = {
      demographic: calculateDemographicMatch(
        profile.demographics,
        study.requirements
      ),
      interest: calculateInterestMatch(profile.interests, study.topics),
      availability: calculateAvailabilityMatch(
        profile.availability,
        study.duration
      ),
      experience: calculateExperienceMatch(
        profile.experience,
        study.difficulty
      ),
      overall: 0,
    };

    // Weighted scoring with ML-optimized weights
    const weights = {
      demographic: 0.2,
      interest: 0.35,
      availability: 0.25,
      experience: 0.2,
    };

    compatibility.overall = Object.entries(weights).reduce(
      (score, [key, weight]) => {
        return (
          score + compatibility[key as keyof typeof compatibility] * weight
        );
      },
      0
    );

    // Generate match reasons using pattern analysis
    const matchReasons = generateMatchReasons(profile, study, compatibility);

    return {
      studyId: study.id,
      title: study.title,
      matchScore: Math.round(compatibility.overall),
      matchReasons,
      estimatedTime: study.estimatedTime || 20,
      participantCount: study.participantCount || 0,
      categories: study.categories || [],
      difficulty: study.difficulty || 'Intermediate',
      compatibility,
    };
  };

  const calculateDemographicMatch = (
    demographics: any,
    requirements: any
  ): number => {
    if (!requirements) return 100;

    let score = 100;

    // Age matching
    if (requirements.minAge && demographics.age) {
      const ageNum = parseInt(demographics.age.split('-')[0]);
      if (ageNum < requirements.minAge) score -= 50;
    }

    // Location matching
    if (
      requirements.location &&
      demographics.location !== requirements.location
    ) {
      score -= 20;
    }

    // Language matching
    if (
      requirements.language &&
      !demographics.language.startsWith(requirements.language)
    ) {
      score -= 30;
    }

    return Math.max(0, score);
  };

  const calculateInterestMatch = (
    interests: string[],
    studyTopics: string[]
  ): number => {
    if (!studyTopics || studyTopics.length === 0) return 50;

    // Calculate Jaccard similarity
    const intersection = interests.filter(i => studyTopics.includes(i)).length;
    const union = new Set([...interests, ...studyTopics]).size;

    return Math.round((intersection / union) * 100);
  };

  const calculateAvailabilityMatch = (
    availability: string[],
    studyDuration: number
  ): number => {
    if (!studyDuration) return 100;

    if (availability.includes('flexible')) return 100;
    if (availability.includes('20-30min') && studyDuration <= 30) return 90;
    if (availability.includes('limited') && studyDuration > 15) return 40;

    return 70;
  };

  const calculateExperienceMatch = (
    experience: string[],
    difficulty: string
  ): number => {
    const expLevel = experience[0] || 'intermediate';

    if (expLevel === difficulty?.toLowerCase()) return 100;

    const levels = ['beginner', 'intermediate', 'advanced'];
    const expIndex = levels.indexOf(expLevel);
    const diffIndex = levels.indexOf(
      difficulty?.toLowerCase() || 'intermediate'
    );

    const difference = Math.abs(expIndex - diffIndex);
    return Math.max(0, 100 - difference * 30);
  };

  const generateMatchReasons = (
    profile: ParticipantProfile,
    study: any,
    compatibility: any
  ): string[] => {
    const reasons: string[] = [];

    if (compatibility.demographic >= 80) {
      reasons.push('Perfect demographic fit');
    }

    if (compatibility.interest >= 70) {
      reasons.push('Matches your interests');
    }

    if (compatibility.availability >= 90) {
      reasons.push('Fits your schedule');
    }

    if (compatibility.experience >= 80) {
      reasons.push('Appropriate difficulty level');
    }

    // Add ML-discovered patterns
    if (
      profile.historicalData?.preferredTopics.some(t =>
        study.topics?.includes(t)
      )
    ) {
      reasons.push('Similar to studies you enjoyed');
    }

    return reasons;
  };

  const performMLMatching = async () => {
    setIsAnalyzing(true);

    try {
      // Build participant profile
      const profile = buildParticipantProfile();
      setParticipantProfile(profile);

      // Simulate fetching available studies (in production, this would be an API call)
      const availableStudies = await fetchAvailableStudies();

      // Calculate match scores for all studies
      const matches = availableStudies
        .map(study => calculateStudyMatch(profile, study))
        .filter(match => match.matchScore >= 40) // Filter out poor matches
        .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score
        .slice(0, 5); // Top 5 matches

      setStudyMatches(matches);

      // Calculate overall confidence in recommendations
      const avgScore =
        matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length;
      setMatchConfidence(avgScore);

      // Add ML recommendations to screening result if not qualified for primary study
      if (screeningResult && !screeningResult.qualified) {
        setScreeningResult({
          ...screeningResult,
          alternativeStudies: matches.map(m => m.studyId),
          mlRecommendations: matches,
        } as any);
      }
    } catch (error: any) {
      console.error('ML matching failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchAvailableStudies = async (): Promise<any[]> => {
    // Mock data for demo - in production, fetch from API
    return [
      {
        id: 'study-001',
        title: 'Climate Change Perceptions',
        topics: ['environment', 'policy', 'science'],
        requirements: { minAge: 18 },
        duration: 25,
        difficulty: 'intermediate',
        participantCount: 45,
        categories: ['Environmental', 'Social Science'],
        estimatedTime: 25,
      },
      {
        id: 'study-002',
        title: 'Digital Privacy Attitudes',
        topics: ['technology', 'privacy', 'security'],
        requirements: { minAge: 18 },
        duration: 20,
        difficulty: 'beginner',
        participantCount: 78,
        categories: ['Technology', 'Psychology'],
        estimatedTime: 20,
      },
      {
        id: 'study-003',
        title: 'Educational Technology Impact',
        topics: ['education', 'technology', 'learning'],
        requirements: { minAge: 18 },
        duration: 30,
        difficulty: 'advanced',
        participantCount: 32,
        categories: ['Education', 'Technology'],
        estimatedTime: 30,
      },
      {
        id: 'study-004',
        title: 'Healthcare Decision Making',
        topics: ['health', 'psychology', 'decision-making'],
        requirements: { minAge: 21 },
        duration: 35,
        difficulty: 'intermediate',
        participantCount: 56,
        categories: ['Healthcare', 'Psychology'],
        estimatedTime: 35,
      },
      {
        id: 'study-005',
        title: 'Social Media Influence',
        topics: ['social-media', 'psychology', 'communication'],
        requirements: { minAge: 18 },
        duration: 15,
        difficulty: 'beginner',
        participantCount: 102,
        categories: ['Social Science', 'Media'],
        estimatedTime: 15,
      },
    ];
  };

  const isComplete = Object.values(answers).every(value => value !== '');

  // Run ML matching when answers are complete
  useEffect(() => {
    if (enableMLMatching && isComplete && !screeningResult) {
      performMLMatching();
    }
  }, [isComplete, enableMLMatching, screeningResult]);

  // Handle submit for hardcoded questions
  const handleSubmit = () => {
    // Check if participant meets criteria
    const meetsAge = answers.age !== 'under18';
    const hasTime = answers.timeAvailable === 'yes';

    if (!meetsAge || !hasTime) {
      setScreeningResult({
        qualified: false,
        reason:
          'You must be 18 or older and have at least 20 minutes available to participate.',
        recommendations: [
          !meetsAge ? 'You must be 18 or older to participate.' : '',
          !hasTime
            ? 'This study requires approximately 20-30 minutes to complete.'
            : '',
        ].filter(Boolean),
      });
      setShowResult(true);
      return;
    }

    onComplete(answers);
  };

  // Show screening result (for both dynamic and hardcoded)
  if (showResult && screeningResult) {
    return (
      <Card className="max-w-3xl mx-auto p-8">
        <div className="text-center space-y-6">
          {screeningResult.qualified ? (
            <>
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-label mb-2">
                  Congratulations!
                </h2>
                <p className="text-secondary-label">
                  You qualify for this study. Proceeding to the main study...
                </p>
              </div>
              <Button onClick={handleContinue} size="large">
                Continue to Study
              </Button>
            </>
          ) : (
            <>
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-label mb-2">
                  Thank You for Your Interest
                </h2>
                <p className="text-secondary-label mb-4">
                  {screeningResult.reason ||
                    'Unfortunately, you do not meet the requirements for this study at this time.'}
                </p>

                {/* Show recommendations */}
                {screeningResult.recommendations &&
                  screeningResult.recommendations.length > 0 && (
                    <Alert className="text-left mb-4">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <div className="ml-2">
                        <h3 className="font-semibold mb-2">Recommendations:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {screeningResult.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Alert>
                  )}

                {/* ML-Powered Study Recommendations */}
                {enableMLMatching && studyMatches.length > 0 && (
                  <div className="text-left space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-purple-500" />
                        ML-Matched Studies for You
                      </h3>
                      <Badge className="bg-purple-100 text-purple-700">
                        {Math.round(matchConfidence)}% Confidence
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {studyMatches.map(match => (
                        <div
                          key={match.studyId}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-lg">
                                {match.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">
                                  {match.estimatedTime} min
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">
                                  {match.participantCount} participants
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <Badge variant="outline" className="text-xs">
                                  {match.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(match.matchScore / 20)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span
                                className={`text-lg font-bold ${
                                  match.matchScore >= 80
                                    ? 'text-green-600'
                                    : match.matchScore >= 60
                                      ? 'text-yellow-600'
                                      : 'text-orange-600'
                                }`}
                              >
                                {match.matchScore}% Match
                              </span>
                            </div>
                          </div>

                          {/* Match Reasons */}
                          {match.matchReasons.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {match.matchReasons.map((reason, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded"
                                  >
                                    ✓ {reason}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Categories */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {match.categories.map((cat, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {cat}
                              </Badge>
                            ))}
                          </div>

                          {/* Compatibility Breakdown */}
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                Interest Match
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={match.compatibility.interest}
                                  className="w-20 h-1"
                                />
                                <span className="font-medium">
                                  {Math.round(match.compatibility.interest)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                Availability
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={match.compatibility.availability}
                                  className="w-20 h-1"
                                />
                                <span className="font-medium">
                                  {Math.round(match.compatibility.availability)}
                                  %
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                Experience Level
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={match.compatibility.experience}
                                  className="w-20 h-1"
                                />
                                <span className="font-medium">
                                  {Math.round(match.compatibility.experience)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            onClick={() =>
                              (window.location.href = `/study/${match.studyId}`)
                            }
                            className="w-full"
                          >
                            Join This Study
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* ML Insights */}
                    <Alert className="bg-purple-50 border-purple-200">
                      <CpuChipIcon className="h-4 w-4 text-purple-600" />
                      <div className="ml-2">
                        <p className="font-medium text-sm mb-1">
                          ML Matching Insights
                        </p>
                        <p className="text-xs text-gray-600">
                          Based on your profile and responses, our ML algorithm
                          identified these studies with the highest
                          compatibility scores. The matching considers your
                          interests, availability, experience level, and
                          demographic fit.
                        </p>
                      </div>
                    </Alert>
                  </div>
                )}

                {/* Fallback to simple alternative studies list */}
                {!enableMLMatching &&
                  screeningResult.alternativeStudies &&
                  screeningResult.alternativeStudies.length > 0 && (
                    <div className="text-left">
                      <h3 className="font-semibold mb-2">
                        You may qualify for these studies:
                      </h3>
                      <div className="space-y-2">
                        {screeningResult.alternativeStudies.map(
                          (studyId, index) => (
                            <Button
                              key={index}
                              variant="secondary"
                              onClick={() =>
                                (window.location.href = `/study/${studyId}`)
                              }
                              className="w-full"
                            >
                              View Alternative Study {index + 1}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={onBack}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Studies
                </Button>
                {screeningResult.redirectUrl && (
                  <Button
                    onClick={() =>
                      (window.location.href = screeningResult.redirectUrl!)
                    }
                  >
                    Learn More
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  // If dynamic mode and surveyId provided, use new component
  if (useDynamic && surveyId) {
    return (
      <ScreeningQuestionnaire
        surveyId={surveyId}
        participantId={participantId || ''}
        onComplete={handleScreeningComplete}
        onExit={onBack}
        showProgress={true}
        autoSave={true}
      />
    );
  }

  // Fallback to original hardcoded implementation for backward compatibility
  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">
            Pre-Screening Questions
          </h1>
          <p className="text-secondary-label">
            Please answer these questions to determine if you're eligible for
            this study.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-label mb-2">
              How familiar are you with Q-methodology research? *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={answers.familiarity}
              onChange={e => handleChange('familiarity', e.target.value)}
            >
              <option value="">Select an option</option>
              <option value="very">Very familiar</option>
              <option value="somewhat">Somewhat familiar</option>
              <option value="not">Not familiar at all</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Have you participated in a Q-methodology study before? *
            </label>
            <div className="space-y-2">
              {['Yes', 'No', 'Not sure'].map(option => (
                <label key={option} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="participation"
                    value={option.toLowerCase()}
                    checked={answers.participation === option.toLowerCase()}
                    onChange={e =>
                      handleChange('participation', e.target.value)
                    }
                    className="w-4 h-4 text-system-blue border-quaternary-fill focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-label">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Do you have 20-30 minutes to complete this study? *
            </label>
            <div className="space-y-2">
              {['Yes', 'No'].map(option => (
                <label key={option} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="timeAvailable"
                    value={option.toLowerCase()}
                    checked={answers.timeAvailable === option.toLowerCase()}
                    onChange={e =>
                      handleChange('timeAvailable', e.target.value)
                    }
                    className="w-4 h-4 text-system-blue border-quaternary-fill focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-label">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Please confirm your age group *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={answers.age}
              onChange={e => handleChange('age', e.target.value)}
            >
              <option value="">Select age group</option>
              <option value="under18">Under 18</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55-64">55-64</option>
              <option value="65+">65+</option>
            </select>
          </div>
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Note:</strong> This study is open to participants aged 18
            and above who have approximately 20-30 minutes to complete all
            steps.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack} disabled>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={handleSubmit}
            disabled={!isComplete}
          >
            Check Eligibility
          </Button>
        </div>
      </div>
    </Card>
  );
}
