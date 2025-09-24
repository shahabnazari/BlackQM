'use client';

import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Star,
  Copy,
  Share2,
  Lock,
  Users,
  Clock,
  TrendingUp,
  Download,
  Upload,
  ChevronRight,
  Edit2,
  BarChart2,
  Archive,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// ScrollArea not available - using overflow-y-auto instead
// Tabs components removed as unused
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Dialog component not available - using custom modal
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuestionBankItem {
  id: string;
  text: string;
  type: string;
  category: string;
  tags: string[];
  usage: number;
  successRate: number;
  lastUsed: Date | null;
  createdBy: string;
  createdAt: Date;
  version: number;
  isPublic: boolean;
  isValidated: boolean;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // seconds
  metadata: {
    department?: string;
    project?: string;
    client?: string;
    compliance?: string[];
  };
}

interface QuestionCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
  subcategories?: QuestionCategory[];
  expanded?: boolean;
}

export function QuestionBankManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterValidated, setFilterValidated] = useState(false);

  // Mock data for demonstration
  const categories: QuestionCategory[] = [
    {
      id: 'demographics',
      name: 'Demographics',
      icon: Users,
      count: 124,
      subcategories: [
        { id: 'age', name: 'Age & Gender', icon: Users, count: 32 },
        { id: 'location', name: 'Location', icon: Users, count: 28 },
        { id: 'education', name: 'Education', icon: Users, count: 41 },
        { id: 'occupation', name: 'Occupation', icon: Users, count: 23 },
      ],
    },
    {
      id: 'satisfaction',
      name: 'Satisfaction',
      icon: Star,
      count: 89,
      subcategories: [
        { id: 'product', name: 'Product Satisfaction', icon: Star, count: 45 },
        { id: 'service', name: 'Service Satisfaction', icon: Star, count: 44 },
      ],
    },
    {
      id: 'behavioral',
      name: 'Behavioral',
      icon: TrendingUp,
      count: 156,
    },
    {
      id: 'psychographic',
      name: 'Psychographic',
      icon: Users,
      count: 203,
    },
    {
      id: 'custom',
      name: 'Custom Questions',
      icon: Edit2,
      count: 67,
    },
  ];

  const questions: QuestionBankItem[] = [
    {
      id: '1',
      text: 'What is your age range?',
      type: 'radio',
      category: 'demographics',
      tags: ['age', 'required', 'gdpr-compliant'],
      usage: 3421,
      successRate: 98.5,
      lastUsed: new Date('2024-01-15'),
      createdBy: 'System',
      createdAt: new Date('2023-01-01'),
      version: 2,
      isPublic: true,
      isValidated: true,
      language: 'en',
      difficulty: 'easy',
      estimatedTime: 5,
      metadata: {
        compliance: ['GDPR', 'CCPA'],
      },
    },
    {
      id: '2',
      text: 'How satisfied are you with our product?',
      type: 'likert',
      category: 'satisfaction',
      tags: ['satisfaction', 'nps', 'core-metric'],
      usage: 5678,
      successRate: 96.2,
      lastUsed: new Date('2024-01-20'),
      createdBy: 'Research Team',
      createdAt: new Date('2023-02-15'),
      version: 3,
      isPublic: true,
      isValidated: true,
      language: 'en',
      difficulty: 'easy',
      estimatedTime: 8,
      metadata: {
        department: 'Customer Success',
      },
    },
    {
      id: '3',
      text: 'Describe your experience with our customer service',
      type: 'textarea',
      category: 'satisfaction',
      tags: ['qualitative', 'open-ended', 'sentiment'],
      usage: 1234,
      successRate: 82.1,
      lastUsed: new Date('2024-01-18'),
      createdBy: 'Sarah Johnson',
      createdAt: new Date('2023-03-20'),
      version: 1,
      isPublic: false,
      isValidated: true,
      language: 'en',
      difficulty: 'medium',
      estimatedTime: 45,
      metadata: {
        project: 'Q1 Customer Feedback',
        client: 'Internal',
      },
    },
  ];

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.tags.some(tag => tag.includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || q.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 || 
                          selectedTags.some(tag => q.tags.includes(tag));
      const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
      const matchesValidated = !filterValidated || q.isValidated;
      
      return matchesSearch && matchesCategory && matchesTags && 
             matchesDifficulty && matchesValidated;
    });
  }, [questions, searchQuery, selectedCategory, selectedTags, filterDifficulty, filterValidated]);

  const toggleQuestionSelection = (id: string) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedQuestions(newSelection);
  };

  const renderCategoryTree = (cats: QuestionCategory[], level = 0) => {
    return cats.map(cat => (
      <div key={cat.id} style={{ marginLeft: `${level * 20}px` }}>
        <button
          onClick={() => setSelectedCategory(cat.id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
            selectedCategory === cat.id
              ? "bg-blue-50 text-blue-600"
              : "hover:bg-gray-50 text-gray-700"
          )}
        >
          {cat.subcategories && (
            <ChevronRight className="w-4 h-4" />
          )}
          <cat.icon className="w-4 h-4" />
          <span className="flex-1 text-left">{cat.name}</span>
          <Badge variant="secondary" className="text-xs">
            {cat.count}
          </Badge>
        </button>
        {cat.subcategories && cat.expanded && (
          <div className="mt-1">
            {renderCategoryTree(cat.subcategories, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Sidebar - Categories & Filters */}
      <div className="w-64 flex-shrink-0">
        <Card className="h-full p-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Question Bank</h3>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-2">
                Difficulty
              </Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={filterValidated}
                onCheckedChange={(checked) => setFilterValidated(checked as boolean)}
              />
              <Label className="text-sm">Validated Only</Label>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3">Categories</h4>
            <div className="h-96 overflow-y-auto">
              <div className="space-y-1">
                {renderCategoryTree(categories)}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions</span>
                <span className="font-medium">639</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Public</span>
                <span className="font-medium">482</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Private</span>
                <span className="font-medium">157</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {selectedQuestions.size > 0 && (
                <>
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <Badge variant="secondary">
                    {selectedQuestions.size} selected
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="grid">Grid View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Questions List/Grid */}
        <Card className="flex-1 p-4">
          <div className="h-full overflow-y-auto">
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-2 gap-4"
                : "space-y-3"
            )}>
              {filteredQuestions.map(question => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer",
                    selectedQuestions.has(question.id) && "border-blue-500 bg-blue-50"
                  )}
                  onClick={() => toggleQuestionSelection(question.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{question.text}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BarChart2 className="w-3 h-3" />
                          {question.usage} uses
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {question.successRate}% success
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {question.estimatedTime}s
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {question.isValidated && (
                        <Badge variant="secondary" className="text-xs">
                          Validated
                        </Badge>
                      )}
                      {question.isPublic ? (
                        <Users className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {question.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>v{question.version} • {question.createdBy}</span>
                    <span>{question.lastUsed?.toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Import Modal */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Import Questions</h3>
            <div className="space-y-4">
              <div>
                <Label>Import Source</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV File</SelectItem>
                    <SelectItem value="json">JSON File</SelectItem>
                    <SelectItem value="qualtrics">Qualtrics Export</SelectItem>
                    <SelectItem value="surveymonkey">SurveyMonkey Export</SelectItem>
                    <SelectItem value="typeform">Typeform Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drop your file here or click to browse
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button>Import</Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Share Question Bank</h3>
            <div className="space-y-4">
              <div>
                <Label>Share with Team</Label>
                <Input placeholder="Enter email addresses..." />
              </div>
              <div>
                <Label>Permissions</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select permissions..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="use">Use in Surveys</SelectItem>
                    <SelectItem value="edit">Edit Questions</SelectItem>
                    <SelectItem value="admin">Full Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Cancel
              </Button>
              <Button>Share</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}