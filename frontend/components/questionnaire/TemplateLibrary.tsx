'use client';

import React, { useState, ReactNode } from 'react';

import {
  Target,
  Activity,
  TrendingUp,
  Award,
  FileText,
  Search,
  Filter,
  Star,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  ShoppingCart,
  Sparkles,
  BarChart,
  ThumbsUp,
  Clock,
  Globe,
  Zap,
  BookOpen,
  Home
} from 'lucide-react'
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: ReactNode;
  questionCount: number;
  estimatedTime: number;
  popularity: number;
  tags: string[];
  questions: any[];
}
interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
}
export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // 50+ Pre-built templates
  const templates: Template[] = [
    // Customer Satisfaction (10 templates)
    {
      id: 'csat-1',
      name: 'Customer Satisfaction Survey',
      description: 'Measure overall customer satisfaction with your product or service',
      category: 'Customer Satisfaction',
      icon: <ThumbsUp className="w-5 h-5" />,
      questionCount: 12,
      estimatedTime: 5,
      popularity: 98,
      tags: ['satisfaction', 'feedback', 'customer'],
      questions: []
    },
    {
      id: 'csat-2',
      name: 'Net Promoter Score (NPS)',
      description: 'Measure customer loyalty and likelihood to recommend',
      category: 'Customer Satisfaction',
      icon: <TrendingUp className="w-5 h-5" />,
      questionCount: 5,
      estimatedTime: 2,
      popularity: 95,
      tags: ['nps', 'loyalty', 'recommendation'],
      questions: []
    },
    {
      id: 'csat-3',
      name: 'Customer Effort Score (CES)',
      description: 'Measure how easy it is for customers to interact with your business',
      category: 'Customer Satisfaction',
      icon: <Activity className="w-5 h-5" />,
      questionCount: 8,
      estimatedTime: 3,
      popularity: 87,
      tags: ['effort', 'ease', 'interaction'],
      questions: []
    },
    {
      id: 'csat-4',
      name: 'Post-Purchase Feedback',
      description: 'Gather feedback immediately after a purchase',
      category: 'Customer Satisfaction',
      icon: <ShoppingCart className="w-5 h-5" />,
      questionCount: 10,
      estimatedTime: 4,
      popularity: 92,
      tags: ['purchase', 'feedback', 'transaction'],
      questions: []
    },
    {
      id: 'csat-5',
      name: 'Service Quality Assessment',
      description: 'Evaluate the quality of customer service interactions',
      category: 'Customer Satisfaction',
      icon: <Heart className="w-5 h-5" />,
      questionCount: 15,
      estimatedTime: 6,
      popularity: 89,
      tags: ['service', 'quality', 'support'],
      questions: []
    },
    {
      id: 'csat-6',
      name: 'Product Feedback Survey',
      description: 'Collect detailed feedback about specific products',
      category: 'Customer Satisfaction',
      icon: <Target className="w-5 h-5" />,
      questionCount: 18,
      estimatedTime: 7,
      popularity: 91,
      tags: ['product', 'features', 'improvement'],
      questions: []
    },
    {
      id: 'csat-7',
      name: 'Website Usability Survey',
      description: 'Assess the usability and user experience of your website',
      category: 'Customer Satisfaction',
      icon: <Globe className="w-5 h-5" />,
      questionCount: 14,
      estimatedTime: 5,
      popularity: 88,
      tags: ['website', 'usability', 'ux'],
      questions: []
    },
    {
      id: 'csat-8',
      name: 'Customer Churn Survey',
      description: 'Understand why customers leave and how to retain them',
      category: 'Customer Satisfaction',
      icon: <Users className="w-5 h-5" />,
      questionCount: 11,
      estimatedTime: 4,
      popularity: 86,
      tags: ['churn', 'retention', 'loyalty'],
      questions: []
    },
    {
      id: 'csat-9',
      name: 'Customer Onboarding Feedback',
      description: 'Evaluate the effectiveness of your onboarding process',
      category: 'Customer Satisfaction',
      icon: <Zap className="w-5 h-5" />,
      questionCount: 9,
      estimatedTime: 3,
      popularity: 84,
      tags: ['onboarding', 'new customer', 'experience'],
      questions: []
    },
    {
      id: 'csat-10',
      name: 'Brand Perception Survey',
      description: 'Understand how customers perceive your brand',
      category: 'Customer Satisfaction',
      icon: <Award className="w-5 h-5" />,
      questionCount: 13,
      estimatedTime: 5,
      popularity: 87,
      tags: ['brand', 'perception', 'image'],
      questions: []
    },
    // Employee Engagement (10 templates)
    {
      id: 'emp-1',
      name: 'Employee Engagement Survey',
      description: 'Measure overall employee engagement and satisfaction',
      category: 'Employee Engagement',
      icon: <Users className="w-5 h-5" />,
      questionCount: 25,
      estimatedTime: 10,
      popularity: 94,
      tags: ['engagement', 'satisfaction', 'culture'],
      questions: []
    },
    {
      id: 'emp-2',
      name: 'Pulse Check Survey',
      description: 'Quick regular check-in on employee sentiment',
      category: 'Employee Engagement',
      icon: <Activity className="w-5 h-5" />,
      questionCount: 5,
      estimatedTime: 2,
      popularity: 90,
      tags: ['pulse', 'quick', 'sentiment'],
      questions: []
    },
    {
      id: 'emp-3',
      name: '360-Degree Feedback',
      description: 'Comprehensive feedback from multiple perspectives',
      category: 'Employee Engagement',
      icon: <Target className="w-5 h-5" />,
      questionCount: 30,
      estimatedTime: 12,
      popularity: 88,
      tags: ['360', 'feedback', 'performance'],
      questions: []
    },
    {
      id: 'emp-4',
      name: 'Remote Work Survey',
      description: 'Assess the effectiveness of remote work arrangements',
      category: 'Employee Engagement',
      icon: <Home className="w-5 h-5" />,
      questionCount: 16,
      estimatedTime: 6,
      popularity: 93,
      tags: ['remote', 'work from home', 'flexibility'],
      questions: []
    },
    {
      id: 'emp-5',
      name: 'Team Effectiveness Survey',
      description: 'Evaluate team dynamics and collaboration',
      category: 'Employee Engagement',
      icon: <Users className="w-5 h-5" />,
      questionCount: 12,
      estimatedTime: 5,
      popularity: 87,
      tags: ['team', 'collaboration', 'dynamics'],
      questions: []
    },
    {
      id: 'emp-6',
      name: 'Manager Effectiveness Survey',
      description: 'Assess management performance and leadership',
      category: 'Employee Engagement',
      icon: <Briefcase className="w-5 h-5" />,
      questionCount: 18,
      estimatedTime: 7,
      popularity: 89,
      tags: ['manager', 'leadership', 'performance'],
      questions: []
    },
    {
      id: 'emp-7',
      name: 'Workplace Culture Assessment',
      description: 'Evaluate organizational culture and values alignment',
      category: 'Employee Engagement',
      icon: <Heart className="w-5 h-5" />,
      questionCount: 20,
      estimatedTime: 8,
      popularity: 91,
      tags: ['culture', 'values', 'environment'],
      questions: []
    },
    {
      id: 'emp-8',
      name: 'Training Effectiveness Survey',
      description: 'Measure the impact of training programs',
      category: 'Employee Engagement',
      icon: <GraduationCap className="w-5 h-5" />,
      questionCount: 14,
      estimatedTime: 5,
      popularity: 85,
      tags: ['training', 'development', 'learning'],
      questions: []
    },
    {
      id: 'emp-9',
      name: 'Exit Interview Survey',
      description: 'Understand why employees leave the organization',
      category: 'Employee Engagement',
      icon: <Clock className="w-5 h-5" />,
      questionCount: 15,
      estimatedTime: 6,
      popularity: 86,
      tags: ['exit', 'turnover', 'retention'],
      questions: []
    },
    {
      id: 'emp-10',
      name: 'Diversity & Inclusion Survey',
      description: 'Assess diversity, equity, and inclusion in the workplace',
      category: 'Employee Engagement',
      icon: <Globe className="w-5 h-5" />,
      questionCount: 17,
      estimatedTime: 7,
      popularity: 92,
      tags: ['diversity', 'inclusion', 'equity'],
      questions: []
    },
    // Market Research (10 templates)
    {
      id: 'market-1',
      name: 'Market Segmentation Survey',
      description: 'Identify and understand different customer segments',
      category: 'Market Research',
      icon: <BarChart className="w-5 h-5" />,
      questionCount: 22,
      estimatedTime: 9,
      popularity: 88,
      tags: ['segmentation', 'demographics', 'targeting'],
      questions: []
    },
    {
      id: 'market-2',
      name: 'Product-Market Fit Survey',
      description: 'Validate product-market fit for your offering',
      category: 'Market Research',
      icon: <Target className="w-5 h-5" />,
      questionCount: 10,
      estimatedTime: 4,
      popularity: 91,
      tags: ['product', 'market fit', 'validation'],
      questions: []
    },
    {
      id: 'market-3',
      name: 'Competitor Analysis Survey',
      description: 'Understand competitive positioning and perception',
      category: 'Market Research',
      icon: <TrendingUp className="w-5 h-5" />,
      questionCount: 16,
      estimatedTime: 6,
      popularity: 87,
      tags: ['competition', 'analysis', 'positioning'],
      questions: []
    },
    {
      id: 'market-4',
      name: 'Brand Awareness Survey',
      description: 'Measure brand recognition and recall',
      category: 'Market Research',
      icon: <Award className="w-5 h-5" />,
      questionCount: 12,
      estimatedTime: 5,
      popularity: 89,
      tags: ['brand', 'awareness', 'recognition'],
      questions: []
    },
    {
      id: 'market-5',
      name: 'Pricing Research Survey',
      description: 'Determine optimal pricing strategies',
      category: 'Market Research',
      icon: <ShoppingCart className="w-5 h-5" />,
      questionCount: 14,
      estimatedTime: 5,
      popularity: 90,
      tags: ['pricing', 'willingness to pay', 'value'],
      questions: []
    },
    {
      id: 'market-6',
      name: 'New Product Concept Test',
      description: 'Test and validate new product ideas',
      category: 'Market Research',
      icon: <Sparkles className="w-5 h-5" />,
      questionCount: 18,
      estimatedTime: 7,
      popularity: 92,
      tags: ['concept', 'testing', 'innovation'],
      questions: []
    },
    {
      id: 'market-7',
      name: 'Customer Journey Mapping',
      description: 'Map the complete customer journey and touchpoints',
      category: 'Market Research',
      icon: <Activity className="w-5 h-5" />,
      questionCount: 20,
      estimatedTime: 8,
      popularity: 88,
      tags: ['journey', 'touchpoints', 'experience'],
      questions: []
    },
    {
      id: 'market-8',
      name: 'Market Size & Opportunity',
      description: 'Assess market size and growth opportunities',
      category: 'Market Research',
      icon: <Globe className="w-5 h-5" />,
      questionCount: 15,
      estimatedTime: 6,
      popularity: 86,
      tags: ['market size', 'opportunity', 'growth'],
      questions: []
    },
    {
      id: 'market-9',
      name: 'Customer Needs Assessment',
      description: 'Identify and prioritize customer needs',
      category: 'Market Research',
      icon: <Heart className="w-5 h-5" />,
      questionCount: 17,
      estimatedTime: 7,
      popularity: 90,
      tags: ['needs', 'priorities', 'requirements'],
      questions: []
    },
    {
      id: 'market-10',
      name: 'Market Trend Analysis',
      description: 'Identify and analyze market trends',
      category: 'Market Research',
      icon: <TrendingUp className="w-5 h-5" />,
      questionCount: 13,
      estimatedTime: 5,
      popularity: 87,
      tags: ['trends', 'analysis', 'insights'],
      questions: []
    },
    // Academic Research (10 templates)
    {
      id: 'academic-1',
      name: 'Dissertation Research Survey',
      description: 'Comprehensive survey for doctoral research',
      category: 'Academic Research',
      icon: <GraduationCap className="w-5 h-5" />,
      questionCount: 35,
      estimatedTime: 15,
      popularity: 85,
      tags: ['dissertation', 'phd', 'research'],
      questions: []
    },
    {
      id: 'academic-2',
      name: 'Student Satisfaction Survey',
      description: 'Measure student satisfaction with educational programs',
      category: 'Academic Research',
      icon: <BookOpen className="w-5 h-5" />,
      questionCount: 20,
      estimatedTime: 8,
      popularity: 88,
      tags: ['student', 'satisfaction', 'education'],
      questions: []
    },
    {
      id: 'academic-3',
      name: 'Course Evaluation Survey',
      description: 'Evaluate course effectiveness and instructor performance',
      category: 'Academic Research',
      icon: <Award className="w-5 h-5" />,
      questionCount: 15,
      estimatedTime: 6,
      popularity: 90,
      tags: ['course', 'evaluation', 'feedback'],
      questions: []
    },
    {
      id: 'academic-4',
      name: 'Research Participant Screening',
      description: 'Screen and qualify research participants',
      category: 'Academic Research',
      icon: <Filter className="w-5 h-5" />,
      questionCount: 10,
      estimatedTime: 4,
      popularity: 87,
      tags: ['screening', 'qualification', 'participants'],
      questions: []
    },
    {
      id: 'academic-5',
      name: 'Alumni Engagement Survey',
      description: 'Track alumni satisfaction and engagement',
      category: 'Academic Research',
      icon: <Users className="w-5 h-5" />,
      questionCount: 18,
      estimatedTime: 7,
      popularity: 84,
      tags: ['alumni', 'engagement', 'network'],
      questions: []
    },
    {
      id: 'academic-6',
      name: 'Learning Outcomes Assessment',
      description: 'Assess achievement of learning objectives',
      category: 'Academic Research',
      icon: <Target className="w-5 h-5" />,
      questionCount: 16,
      estimatedTime: 6,
      popularity: 86,
      tags: ['outcomes', 'assessment', 'learning'],
      questions: []
    },
    {
      id: 'academic-7',
      name: 'Campus Climate Survey',
      description: 'Evaluate campus environment and culture',
      category: 'Academic Research',
      icon: <Home className="w-5 h-5" />,
      questionCount: 22,
      estimatedTime: 9,
      popularity: 89,
      tags: ['campus', 'climate', 'culture'],
      questions: []
    },
    {
      id: 'academic-8',
      name: 'Faculty Satisfaction Survey',
      description: 'Measure faculty satisfaction and engagement',
      category: 'Academic Research',
      icon: <Briefcase className="w-5 h-5" />,
      questionCount: 19,
      estimatedTime: 8,
      popularity: 83,
      tags: ['faculty', 'satisfaction', 'academic'],
      questions: []
    },
    {
      id: 'academic-9',
      name: 'Online Learning Effectiveness',
      description: 'Evaluate online learning platforms and methods',
      category: 'Academic Research',
      icon: <Globe className="w-5 h-5" />,
      questionCount: 17,
      estimatedTime: 7,
      popularity: 91,
      tags: ['online', 'e-learning', 'distance'],
      questions: []
    },
    {
      id: 'academic-10',
      name: 'Research Ethics Survey',
      description: 'Assess understanding of research ethics',
      category: 'Academic Research',
      icon: <Activity className="w-5 h-5" />,
      questionCount: 12,
      estimatedTime: 5,
      popularity: 82,
      tags: ['ethics', 'compliance', 'research'],
      questions: []
    },
    // Healthcare (10 templates)
    {
      id: 'health-1',
      name: 'Patient Satisfaction Survey',
      description: 'Measure patient satisfaction with healthcare services',
      category: 'Healthcare',
      icon: <Heart className="w-5 h-5" />,
      questionCount: 18,
      estimatedTime: 7,
      popularity: 92,
      tags: ['patient', 'satisfaction', 'healthcare'],
      questions: []
    },
    {
      id: 'health-2',
      name: 'Health Risk Assessment',
      description: 'Assess individual health risks and lifestyle factors',
      category: 'Healthcare',
      icon: <Activity className="w-5 h-5" />,
      questionCount: 25,
      estimatedTime: 10,
      popularity: 89,
      tags: ['health', 'risk', 'assessment'],
      questions: []
    },
    {
      id: 'health-3',
      name: 'Mental Health Screening',
      description: 'Screen for common mental health conditions',
      category: 'Healthcare',
      icon: <Heart className="w-5 h-5" />,
      questionCount: 15,
      estimatedTime: 6,
      popularity: 91,
      tags: ['mental health', 'screening', 'wellness'],
      questions: []
    },
    {
      id: 'health-4',
      name: 'Telehealth Experience Survey',
      description: 'Evaluate telehealth service experience',
      category: 'Healthcare',
      icon: <Globe className="w-5 h-5" />,
      questionCount: 12,
      estimatedTime: 5,
      popularity: 88,
      tags: ['telehealth', 'virtual', 'remote'],
      questions: []
    },
    {
      id: 'health-5',
      name: 'Clinical Trial Participant Survey',
      description: 'Gather feedback from clinical trial participants',
      category: 'Healthcare',
      icon: <Activity className="w-5 h-5" />,
      questionCount: 20,
      estimatedTime: 8,
      popularity: 85,
      tags: ['clinical trial', 'research', 'participant'],
      questions: []
    },
  ]
  const categories = Array.from(new Set(templates.map((t: any) => t.category)));
  const filteredTemplates = templates.filter((template: any) => {
    if (
      searchQuery && (
      !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !template.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !template.tags.some((tag: any) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    ) {
      return false;
    }

    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }

    return true;
  });
  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        {/* Category Filter */}
        <div className="mt-3 flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-colors',
              !selectedCategory
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
            )}
          >
            All ({templates.length})
          </button>
          {categories.map((category: any) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-2 py-1 text-xs rounded-md transition-colors',
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
              )}
            >
              {category} ({templates.filter((t: any) => t.category === category).length})
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {filteredTemplates.length} templates available
        </div>
      </div>
      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredTemplates.map((template: any) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">{template.icon}</div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>

                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {template.questionCount} questions
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {template.estimatedTime} min
                    </span>
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1 text-yellow-500" />
                      {template.popularity}%
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.slice(0, 3).map((tag: any) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
