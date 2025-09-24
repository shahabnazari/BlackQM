'use client';

import React, { useState, useMemo, useRef } from 'react';
// import { DndProvider, useDrag, useDrop } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
const DndProvider = ({ children }: any) => children;
const useDrag = () => [{}, () => {}, () => {}];
const useDrop = () => [{}, () => {}];
const HTML5Backend = {};
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Plus,
  Search,
  Maximize2,
  Minimize2,
  Layers,
  FileText,
  CheckSquare,
  CircleDot,
  ToggleLeft,
  Calendar,
  Upload,
  Star,
  Grid,
  List,
  Hash,
  Type,
  MessageSquare,
  Video,
  Image,
  Mic,
  MapPin,
  Clock,
  ArrowUpDown,
  Copy,
  Trash2,
  MoreVertical,
  Download,
  Share2,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/apple-ui/Card';
import { Badge } from '@/components/ui/badge';
// import { ScrollArea } from '@/components/ui/scroll-area';
const ScrollArea = ({ children, className }: any) => (
  <div className={`overflow-auto ${className}`}>{children}</div>
);
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// import { Slider } from '@/components/ui/slider';
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';
// Tooltip components removed as unused
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Question type configurations
const questionTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  textarea: MessageSquare,
  radio: CircleDot,
  checkbox: CheckSquare,
  select: List,
  scale: ArrowUpDown,
  likert: Star,
  matrix: Grid,
  ranking: Hash,
  date: Calendar,
  time: Clock,
  file: Upload,
  image: Image,
  video: Video,
  audio: Mic,
  location: MapPin,
  slider: ToggleLeft,
};

const questionCategories = [
  {
    id: 'basic',
    label: 'Basic Input',
    types: ['text', 'textarea', 'radio', 'checkbox', 'select'],
    color: 'bg-blue-500',
  },
  {
    id: 'rating',
    label: 'Rating & Scale',
    types: ['scale', 'likert', 'slider', 'ranking'],
    color: 'bg-purple-500',
  },
  {
    id: 'datetime',
    label: 'Date & Time',
    types: ['date', 'time'],
    color: 'bg-green-500',
  },
  {
    id: 'media',
    label: 'Media Upload',
    types: ['file', 'image', 'video', 'audio'],
    color: 'bg-orange-500',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    types: ['matrix', 'location'],
    color: 'bg-pink-500',
  },
];

interface Column {
  id: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  collapsed: boolean;
}

interface DragItem {
  id: string;
  type: string;
  index?: number;
  source?: string;
}

const ITEM_TYPE = 'QUESTION';

// Draggable question type component
const QuestionTypeItem: React.FC<{
  type: string;
  label: string;
  description: string;
}> = ({ type, label, description }) => {
  const [collected, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: `new-${type}`, type, source: 'library' },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const Icon = questionTypeIcons[type] || FileText;
  const isDragging = (collected as any)?.isDragging || false;

  return (
    <div
      ref={drag as any}
      className={cn(
        'p-3 rounded-lg border border-gray-200 bg-white cursor-move transition-all',
        'hover:border-blue-400 hover:shadow-md hover:scale-[1.02]',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gray-50">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate">
            {label}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main QuestionnaireBuilderPro component
export const QuestionnaireBuilderPro: React.FC<{
  studyId?: string;
  initialData?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}> = ({
  studyId: _studyId,
  initialData,
  onSave: _onSave,
  onCancel: _onCancel,
}) => {
  // State management
  const [columns, setColumns] = useState<Column[]>([
    { id: 'library', width: 25, minWidth: 20, maxWidth: 35, collapsed: false },
    { id: 'builder', width: 50, minWidth: 40, maxWidth: 60, collapsed: false },
    { id: 'preview', width: 25, minWidth: 20, maxWidth: 35, collapsed: false },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('properties');
  const [questions, setQuestions] = useState<any[]>(
    initialData?.questions || []
  );
  const [undoStack, setUndoStack] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Handle column resizing
  const handleResizeStart = (columnId: string, e: React.MouseEvent) => {
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    resizingRef.current = {
      columnId,
      startX: e.clientX,
      startWidth: column.width,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current || !containerRef.current) return;

      const deltaX = e.clientX - resizingRef.current.startX;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(
        columns.find(col => col.id === resizingRef.current!.columnId)!.minWidth,
        Math.min(
          columns.find(col => col.id === resizingRef.current!.columnId)!
            .maxWidth,
          resizingRef.current.startWidth + deltaPercent
        )
      );

      setColumns(prev =>
        prev.map(col =>
          col.id === resizingRef.current!.columnId
            ? { ...col, width: newWidth }
            : col
        )
      );
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Toggle column collapse
  const toggleColumn = (columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, collapsed: !col.collapsed } : col
      )
    );
  };

  // Handle dropping questions
  const [dropCollected, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: DragItem, _monitor: any) => {
      if (item.source === 'library') {
        // Add new question
        const newQuestion = {
          id: `q-${Date.now()}`,
          type: item.type,
          title: `New ${item.type} question`,
          required: false,
          description: '',
          options:
            item.type === 'radio' || item.type === 'checkbox'
              ? ['Option 1', 'Option 2']
              : [],
          validation: {},
        };

        // Save to undo stack
        setUndoStack(prev => [...prev, questions]);
        setQuestions(prev => [...prev, newQuestion]);
        setSelectedQuestion(newQuestion.id);
      }
    },
    collect: (monitor: any) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Undo/Redo functionality
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, questions]);
    setQuestions(previousState || []);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, questions]);
    setQuestions(nextState || []);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Filter question types based on search and category
  const filteredQuestionTypes = useMemo(() => {
    let types = questionCategories.flatMap(cat =>
      cat.types.map(type => ({
        type,
        category: cat.id,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        description: `Add a ${type} question to collect specific information`,
      }))
    );

    if (selectedCategory !== 'all') {
      types = types.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      types = types.filter(
        t =>
          t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return types;
  }, [searchQuery, selectedCategory]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        ref={containerRef}
        className={cn(
          'flex h-screen bg-gray-50',
          fullscreen && 'fixed inset-0 z-50'
        )}
      >
        {/* Column 1: Question Library */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          style={{
            width: columns[0]?.collapsed ? '60px' : `${columns[0]?.width}%`,
          }}
          className="relative bg-white border-r border-gray-200 flex flex-col"
        >
          {columns[0]?.collapsed ? (
            <div className="flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleColumn('library')}
                className="mb-4"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Layers className="w-5 h-5 text-gray-400" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Question Library
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleColumn('library')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full mt-2 h-9">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {questionCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn('w-2 h-2 rounded-full', cat.color)}
                          />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Types */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {filteredQuestionTypes.map(item => (
                    <QuestionTypeItem
                      key={item.type}
                      type={item.type}
                      label={item.label}
                      description={item.description}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Resize Handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
                onMouseDown={e => handleResizeStart('library', e)}
              />
            </>
          )}
        </motion.div>

        {/* Column 2: Active Builder Workspace */}
        <motion.div
          ref={drop as any}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            width: columns[1]?.collapsed ? '60px' : `${columns[1]?.width}%`,
          }}
          className={cn(
            'relative bg-gray-50 flex flex-col',
            (dropCollected as any)?.isOver && 'bg-blue-50'
          )}
        >
          {columns[1]?.collapsed ? (
            <div className="flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleColumn('builder')}
                className="mb-4"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="bg-white border-b border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                    >
                      <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                    >
                      <Redo className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-200" />
                    <Button variant="ghost" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-200" />
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {questions.length} Questions
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFullscreen(!fullscreen)}
                    >
                      {fullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Builder Area */}
              <ScrollArea className="flex-1 p-6">
                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start Building Your Questionnaire
                    </h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      Drag questions from the library or click the + button to
                      add your first question
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        onClick={() => setSelectedQuestion(question.id)}
                      >
                        <Card
                          className={cn(
                            'p-4 cursor-pointer transition-all',
                            selectedQuestion === question.id &&
                              'ring-2 ring-blue-500'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded bg-gray-50">
                              {React.createElement(
                                questionTypeIcons[question.type] || FileText,
                                { className: 'w-4 h-4 text-gray-600' }
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {question.title || `Question ${index + 1}`}
                                </h4>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Move Up</DropdownMenuItem>
                                    <DropdownMenuItem>
                                      Move Down
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {question.description && (
                                <p className="text-sm text-gray-500 mb-2">
                                  {question.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    question.required ? 'default' : 'secondary'
                                  }
                                >
                                  {question.required ? 'Required' : 'Optional'}
                                </Badge>
                                <Badge variant="outline">{question.type}</Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Resize Handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
                onMouseDown={e => handleResizeStart('builder', e)}
              />
            </>
          )}
        </motion.div>

        {/* Column 3: Live Preview & Properties */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          style={{
            width: columns[2]?.collapsed ? '60px' : `${columns[2]?.width}%`,
          }}
          className="relative bg-white border-l border-gray-200 flex flex-col"
        >
          {columns[2]?.collapsed ? (
            <div className="flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleColumn('preview')}
                className="mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Eye className="w-5 h-5 text-gray-400" />
            </div>
          ) : (
            <>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col"
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="properties">
                        <Settings className="w-4 h-4 mr-2" />
                        Properties
                      </TabsTrigger>
                    </TabsList>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleColumn('preview')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview Tab */}
                <TabsContent
                  value="preview"
                  className="flex-1 p-4 overflow-auto"
                >
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                    {selectedQuestion ? (
                      <div className="space-y-4">
                        {/* Preview of selected question would go here */}
                        <Card className="p-4">
                          <p className="text-sm text-gray-500">
                            Preview of selected question will appear here
                          </p>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        Select a question to preview
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Properties Tab */}
                <TabsContent
                  value="properties"
                  className="flex-1 p-4 overflow-auto"
                >
                  {selectedQuestion ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="question-title">Question Title</Label>
                        <Input
                          id="question-title"
                          placeholder="Enter question title"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="question-description">
                          Description
                        </Label>
                        <Textarea
                          id="question-description"
                          placeholder="Optional description or help text"
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="required">Required</Label>
                        <Switch id="required" />
                      </div>

                      <div>
                        <Label>Validation Rules</Label>
                        <div className="mt-2 space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Validation Rule
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Skip Logic</Label>
                        <div className="mt-2 space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Skip Logic
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Select a question to edit properties
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </motion.div>
      </div>
    </DndProvider>
  );
};

export default QuestionnaireBuilderPro;
