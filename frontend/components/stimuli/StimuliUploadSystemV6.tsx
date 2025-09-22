'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Edit2,
  Trash2,
  Eye,
  Grid3x3,
  CheckCircle,
  Image,
  Video,
  Music,
  Type,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Zap,
  Info,
  FileText,
  Plus,
  LayoutGrid,
  Square,
  Grid3X3Icon,
  Download,
  Share2,
  Filter,
  SortAsc,
  Search,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/apple-ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/apple-ui/Card';
import { Badge } from '@/components/apple-ui/Badge/Badge';
import PopupModal, { usePopup } from '@/components/ui/PopupModal';
import { cn } from '@/lib/utils';

// Q-Method text requirements
const Q_METHOD_TEXT_LIMITS = {
  minWords: 50,
  maxWords: 150,
  recommendedWords: 100,
  maxCharacters: 750,
};

// Stimuli requirements for Q-methodology
const STIMULI_REQUIREMENTS = {
  min: 20,
  recommended: 30,
  max: 60,
  distribution: {
    small: {
      range: '20-30',
      description: 'Good for focused studies with clear dimensions',
    },
    medium: { range: '30-45', description: 'Ideal balance for most Q-studies' },
    large: {
      range: '45-60',
      description: 'Comprehensive coverage for complex topics',
    },
  },
};

interface GridColumn {
  value: number;
  label?: string;
  cells: number;
}

interface GridConfiguration {
  columns: GridColumn[];
  totalCells: number;
  distribution?: 'bell' | 'flat' | 'custom';
}

export interface Stimulus {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text';
  content: string;
  title?: string;
  preview?: string;
  duration?: string;
  gridPosition?: number;
  editedText?: string;
  file?: File;
  url?: string;
  metadata?: {
    size?: number;
    dimensions?: { width: number; height: number };
    uploadedAt?: Date;
  };
}

type UploadMode = 'image' | 'video' | 'audio' | 'text' | null;

interface StimuliUploadSystemV6Props {
  grid: GridConfiguration;
  initialStimuli?: Stimulus[];
  onStimuliChange?: (stimuli: Stimulus[]) => void;
  readOnly?: boolean;
}

// Apple-style color definitions for media types
const MEDIA_COLORS = {
  image: { primary: '#667eea', secondary: '#764ba2', light: '#667eea22' },
  video: { primary: '#f093fb', secondary: '#f5576c', light: '#f093fb22' },
  audio: { primary: '#4facfe', secondary: '#00f2fe', light: '#4facfe22' },
  text: { primary: '#43e97b', secondary: '#38f9d7', light: '#43e97b22' },
};

export function StimuliUploadSystemV6({
  grid,
  initialStimuli = [],
  onStimuliChange,
  readOnly = false,
}: StimuliUploadSystemV6Props) {
  const [stimuli, setStimuli] = useState<Stimulus[]>(initialStimuli);
  const [selectedStimuli, setSelectedStimuli] = useState<Set<string>>(
    new Set()
  );
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [lockedType, setLockedType] = useState<UploadMode>(null);
  const [showGridPreview, setShowGridPreview] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [galleryView, setGalleryView] = useState<'grid' | 'compact' | 'list'>(
    'grid'
  );
  const [galleryColumns, setGalleryColumns] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const {
    popupState,
    closePopup,
    showSuccess,
    showError,
    showConfirm,
    showWarning
  } = usePopup();

  // Initialize locked type if we have initial stimuli
  useEffect(() => {
    if (initialStimuli.length > 0 && !lockedType && initialStimuli[0]) {
      setLockedType(initialStimuli[0].type);
    }
  }, [initialStimuli]);

  // Notify parent component of changes
  useEffect(() => {
    if (onStimuliChange) {
      onStimuliChange(stimuli);
    }
  }, [stimuli, onStimuliChange]);

  // Calculate stimuli progress
  const totalCells = grid?.totalCells || STIMULI_REQUIREMENTS.recommended;
  const stimuliCount = stimuli.length;
  const progress = Math.min((stimuliCount / totalCells) * 100, 100);
  const remainingStimuli = Math.max(0, totalCells - stimuliCount);

  // Helper functions
  const getGlobalCellIndex = (colIndex: number, cellIndex: number) => {
    if (!grid || !grid.columns) return 0;
    let index = 0;
    for (let i = 0; i < colIndex; i++) {
      index += grid.columns[i]?.cells || 0;
    }
    return index + cellIndex;
  };

  const getWordCount = (text: string) =>
    text
      .trim()
      .split(/\s+/)
      .filter((word: any) => word.length > 0).length;

  // Handle upload mode selection
  const handleModeSelect = (mode: UploadMode) => {
    if (readOnly) return;

    if (stimuli.length >= totalCells && mode !== null) {
      showError(
        `Grid is full! You have uploaded all ${totalCells} required stimuli.`
      );
      return;
    }

    if (lockedType && mode !== lockedType && mode !== null) {
      showConfirm(
        `Switching to ${mode} will remove all ${stimuli.length} uploaded ${lockedType} stimuli. Do you want to continue?`,
        () => {
          setStimuli([]);
          setLockedType(null);
          setUploadMode(mode);
          setSelectedStimuli(new Set());
          showSuccess(
            `Switched to ${mode} mode. Previous stimuli have been removed.`
          );
        }
      );
      return;
    }

    setUploadMode(mode === uploadMode ? null : mode);

    if (mode !== 'text') {
      setTextInput('');
      setIsEditingText(false);
      setEditingTextId(null);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !uploadMode || uploadMode === 'text') return;

    const remainingSlots = totalCells - stimuli.length;
    if (remainingSlots <= 0) {
      showError(`Grid is full! Cannot add more stimuli.`);
      if (event.target) event.target.value = '';
      return;
    }

    const filesToUpload = Math.min(files.length, remainingSlots);
    if (filesToUpload < files.length) {
      showWarning(
        `Only uploading ${filesToUpload} of ${files.length} files due to grid capacity limit.`
      );
    }

    const newStimuli: Stimulus[] = [];
    for (let i = 0; i < filesToUpload; i++) {
      const file = files[i];
      if (!file) continue;
      const id = Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);

      newStimuli.push({
        id,
        type: uploadMode,
        content: url,
        title: file.name,
        preview: uploadMode === 'image' ? url : undefined,
        duration:
          uploadMode === 'video' || uploadMode === 'audio' ? '0:00' : undefined,
        file,
        url,
        metadata: {
          size: file.size,
          uploadedAt: new Date(),
        },
      });
    }

    setStimuli(prev => [...prev, ...newStimuli]);
    showSuccess(`Successfully uploaded ${filesToUpload} ${uploadMode}(s)`);

    if (!lockedType && newStimuli.length > 0) {
      setLockedType(uploadMode);
    }

    if (event.target) event.target.value = '';

    if (stimuli.length + filesToUpload >= totalCells) {
      setUploadMode(null);
      showSuccess('Grid is now full! All stimuli slots have been filled.');
    }
  };

  // Handle text submission
  const handleTextSubmit = () => {
    const wordCount = getWordCount(textInput);

    if (wordCount < Q_METHOD_TEXT_LIMITS.minWords) {
      showError(
        `Text must be at least ${Q_METHOD_TEXT_LIMITS.minWords} words (currently ${wordCount})`
      );
      return;
    }

    if (wordCount > Q_METHOD_TEXT_LIMITS.maxWords) {
      showError(
        `Text must be no more than ${Q_METHOD_TEXT_LIMITS.maxWords} words (currently ${wordCount})`
      );
      return;
    }

    if (isEditingText && editingTextId) {
      setStimuli(prev =>
        prev.map((s: any) =>
          s.id === editingTextId
            ? { ...s, editedText: textInput, content: textInput }
            : s
        )
      );
      showSuccess('Text stimulus updated successfully');
    } else {
      if (stimuli.length >= totalCells) {
        showError(`Grid is full! Cannot add more stimuli.`);
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      setStimuli(prev => [
        ...prev,
        {
          id,
          type: 'text',
          content: textInput,
          title: `Text Statement ${stimuli.filter((s: any) => s.type === 'text').length + 1}`,
          metadata: {
            uploadedAt: new Date(),
          },
        },
      ]);
      showSuccess('Text stimulus added successfully');

      if (!lockedType) {
        setLockedType('text');
      }

      if (stimuli.length + 1 >= totalCells) {
        setUploadMode(null);
        showSuccess('Grid is now full! All stimuli slots have been filled.');
      }
    }

    setTextInput('');
    setIsEditingText(false);
    setEditingTextId(null);
  };

  // Handle text edit
  const handleEditText = (stimulus: Stimulus) => {
    if (readOnly) return;
    setUploadMode('text');
    setTextInput(stimulus.editedText || stimulus.content);
    setIsEditingText(true);
    setEditingTextId(stimulus.id);

    const textSection = document.querySelector('.text-input-section');
    textSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Fixed delete handler
  const handleDelete = useCallback(
    (ids: string[]) => {
      if (readOnly) return;

      showConfirm(
        `Are you sure you want to delete ${ids.length} stimulus/stimuli?`,
        () => {
          const newStimuli = stimuli.filter((s: any) => !ids.includes(s.id));
          setStimuli(newStimuli);
          setSelectedStimuli(new Set());

          if (newStimuli.length === 0) {
            setLockedType(null);
            showSuccess(
              'All stimuli removed. You can now choose any media type.'
            );
          } else {
            showSuccess(`Deleted ${ids.length} stimulus/stimuli`);
          }
        }
      );
    },
    [stimuli, readOnly, showConfirm, showSuccess]
  );

  // Toggle stimulus selection
  const toggleStimulusSelection = (id: string) => {
    if (readOnly) return;
    setSelectedStimuli(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter and sort stimuli
  const filteredStimuli = useMemo(() => {
    let filtered = stimuli;

    if (searchQuery) {
      filtered = filtered.filter(
        s =>
          s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return (
            (b.metadata?.uploadedAt?.getTime() || 0) -
            (a.metadata?.uploadedAt?.getTime() || 0)
          );
      }
    });
  }, [stimuli, searchQuery, sortBy]);

  // Media button component with Apple UI design
  const MediaButton = ({
    type,
    icon: Icon,
    label,
    description,
    color,
  }: {
    type: UploadMode;
    icon: any;
    label: string;
    description: string;
    color: typeof MEDIA_COLORS.image;
  }) => {
    const isActive = uploadMode === type;
    const isLocked = lockedType && lockedType !== type;
    const isFull = stimuli.length >= totalCells;
    const isDisabled = isFull && !isActive;
    const [isHovered, setIsHovered] = useState(false);

    const IconComponent = isActive && !isFull ? Upload : Icon;
    const buttonLabel = isActive && !isFull ? `Upload ${label}` : label;

    const handleButtonClick = () => {
      if (isActive && uploadMode !== 'text') {
        if (type === 'image') imageInputRef.current?.click();
        else if (type === 'video') videoInputRef.current?.click();
        else if (type === 'audio') audioInputRef.current?.click();
      } else {
        handleModeSelect(type);
      }
    };

    return (
      <motion.button
        whileHover={!isDisabled && !isLocked ? { scale: 1.02 } : {}}
        whileTap={!isDisabled && !isLocked ? { scale: 0.98 } : {}}
        onClick={handleButtonClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isDisabled || readOnly}
        className={cn(
          'relative group flex flex-col items-center justify-center p-6 rounded-2xl',
          'backdrop-blur-xl transition-all duration-500',
          'border-2',
          isActive && !isFull && 'ring-2 ring-offset-2 shadow-xl',
          isLocked && 'opacity-50 cursor-not-allowed',
          isFull && !isActive && 'opacity-40 cursor-not-allowed',
          !isFull &&
            !isDisabled &&
            !isLocked &&
            !readOnly &&
            'hover:shadow-lg cursor-pointer',
          readOnly && 'cursor-not-allowed opacity-60'
        )}
        style={{
          borderColor: isActive
            ? color.primary
            : isHovered && !readOnly
              ? `${color.primary}66`
              : 'var(--color-border)',
          backgroundColor:
            isFull || isLocked
              ? 'var(--color-fill)'
              : isActive
                ? `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%)`
                : isHovered && !readOnly
                  ? color.light
                  : 'var(--color-surface)',
          boxShadow:
            isFull || isLocked
              ? 'none'
              : isActive
                ? `0 20px 40px -10px ${color.primary}66`
                : isHovered && !readOnly
                  ? `0 15px 30px -5px ${color.primary}33`
                  : 'var(--shadow-md)',
        }}
      >
        <motion.div
          animate={{
            rotate: isActive ? [0, -5, 5, -5, 0] : 0,
            scale: isActive ? 1.2 : isHovered && !readOnly ? 1.1 : 1,
          }}
          transition={{ duration: 0.5 }}
        >
          <IconComponent
            className={cn(
              'mb-3 transition-all duration-300',
              isActive
                ? 'w-12 h-12 text-white'
                : isHovered && !readOnly
                  ? 'w-11 h-11'
                  : 'w-10 h-10',
              isActive ? 'text-white' : 'var(--color-text)'
            )}
            style={{
              color: isActive
                ? 'white'
                : isHovered && !readOnly
                  ? color.primary
                  : undefined,
            }}
          />
        </motion.div>
        <div
          className={cn(
            'font-semibold text-lg mb-1 transition-all duration-300',
            isActive ? 'text-white' : 'text-label'
          )}
        >
          {buttonLabel}
        </div>
        <div
          className={cn(
            'text-xs transition-all duration-300',
            isActive ? 'text-white/90' : 'text-secondary-label'
          )}
        >
          {isActive && !isFull ? 'Click to browse files' : description}
        </div>

        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircle className="w-4 h-4" style={{ color: color.primary }} />
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Banner - Apple Style */}
      <Card className="overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/50 dark:bg-black/30 backdrop-blur-xl rounded-xl">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-label">
                  Stimuli Collection
                </h3>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-secondary-label">
                    {stimuliCount} of {totalCells} required
                  </span>
                  <span className="text-sm font-medium text-label">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/50 dark:bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-secondary-label">
                <Info className="w-4 h-4 text-blue-500" />
                <span>
                  {remainingStimuli > 0
                    ? `Add ${remainingStimuli} more to complete your collection`
                    : `Collection complete! Ready for Q-sort`}
                </span>
              </div>
            </div>

            <div className="ml-6 flex flex-col items-center">
              <div
                className={cn(
                  'w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl',
                  'bg-white/50 dark:bg-black/30 backdrop-blur-xl',
                  stimuliCount >= totalCells
                    ? 'text-green-700 dark:text-green-400'
                    : stimuliCount >= totalCells * 0.7
                      ? 'text-yellow-700 dark:text-yellow-400'
                      : 'text-blue-700 dark:text-blue-400'
                )}
              >
                {stimuliCount}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Mode Selection - Apple Style */}
      {!readOnly && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-label">Media Type</h4>
                <p className="text-sm text-secondary-label mt-1">
                  {stimuli.length >= totalCells
                    ? 'Collection complete'
                    : lockedType
                      ? `Adding ${lockedType} stimuli`
                      : 'Choose your media type'}
                </p>
              </div>
              {lockedType && (
                <Badge variant="secondary">
                  {lockedType.charAt(0).toUpperCase() + lockedType.slice(1)}{' '}
                  Mode
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MediaButton
                type="image"
                icon={Image}
                label="Images"
                description="JPG, PNG, GIF"
                color={MEDIA_COLORS.image}
              />
              <MediaButton
                type="video"
                icon={Video}
                label="Videos"
                description="MP4, MOV, AVI"
                color={MEDIA_COLORS.video}
              />
              <MediaButton
                type="audio"
                icon={Music}
                label="Audio"
                description="MP3, WAV, M4A"
                color={MEDIA_COLORS.audio}
              />
              <MediaButton
                type="text"
                icon={Type}
                label="Text"
                description="Statements"
                color={MEDIA_COLORS.text}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Input Area - Apple Style */}
      <AnimatePresence mode="wait">
        {uploadMode === 'text' && !readOnly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="text-input-section">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-label">
                    {isEditingText ? 'Edit Statement' : 'Add Statement'}
                  </h4>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                      setUploadMode(null);
                      setTextInput('');
                      setIsEditingText(false);
                      setEditingTextId(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="Enter your text statement (50-150 words)..."
                    className="w-full h-32 p-4 rounded-xl border border-separator bg-surface
                             focus:outline-none focus:ring-2 focus:ring-primary resize-none
                             text-label placeholder-tertiary-label"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={cn(
                          getWordCount(textInput) <
                            Q_METHOD_TEXT_LIMITS.minWords
                            ? 'text-danger'
                            : getWordCount(textInput) >
                                Q_METHOD_TEXT_LIMITS.maxWords
                              ? 'text-danger'
                              : 'text-success'
                        )}
                      >
                        {getWordCount(textInput)} words
                      </span>
                      <span className="text-tertiary-label">
                        ({Q_METHOD_TEXT_LIMITS.minWords}-
                        {Q_METHOD_TEXT_LIMITS.maxWords} required)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setTextInput('');
                          setIsEditingText(false);
                          setEditingTextId(null);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleTextSubmit}
                        disabled={
                          getWordCount(textInput) <
                            Q_METHOD_TEXT_LIMITS.minWords ||
                          getWordCount(textInput) >
                            Q_METHOD_TEXT_LIMITS.maxWords
                        }
                      >
                        {isEditingText ? 'Update' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Preview - Apple Style */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowGridPreview(!showGridPreview)}
          className="w-full p-4 flex items-center justify-between hover:bg-fill transition-colors"
        >
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-5 h-5 text-secondary-label" />
            <span className="font-medium text-label">Grid Preview</span>
            <Badge
              variant={stimuli.length >= totalCells ? 'success' : 'secondary'}
            >
              {stimuli.length}/{totalCells}
            </Badge>
          </div>
          {showGridPreview ? (
            <ChevronUp className="w-5 h-5 text-secondary-label" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary-label" />
          )}
        </button>

        <AnimatePresence>
          {showGridPreview && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-separator"
            >
              <div className="p-6">
                <div className="w-full overflow-x-auto">
                  <div className="flex justify-center gap-3 min-w-fit p-4 bg-fill rounded-xl">
                    {grid && grid.columns ? (
                      grid.columns.map((column, colIndex) => (
                        <div
                          key={colIndex}
                          className="flex flex-col items-center"
                        >
                          <div className="text-center mb-2 h-12 flex flex-col justify-end">
                            <div className="text-sm font-bold text-label">
                              {column.value > 0 ? '+' : ''}
                              {column.value}
                            </div>
                          </div>

                          <div className="flex flex-col-reverse gap-1">
                            {Array.from({ length: column.cells }).map(
                              (_, cellIndex) => {
                                const globalIndex = getGlobalCellIndex(
                                  colIndex,
                                  cellIndex
                                );
                                const stimulus = stimuli[globalIndex];
                                const color = stimulus
                                  ? MEDIA_COLORS[stimulus.type]
                                  : null;

                                return (
                                  <motion.div
                                    key={cellIndex}
                                    initial={
                                      stimulus ? { scale: 0.8, opacity: 0 } : {}
                                    }
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      duration: 0.3,
                                      type: 'spring',
                                    }}
                                    className={cn(
                                      'w-12 h-16 rounded-lg flex items-center justify-center text-xs font-medium border-2 transition-all',
                                      stimulus
                                        ? 'text-white shadow-md'
                                        : 'bg-surface border-dashed border-separator text-tertiary-label'
                                    )}
                                    style={{
                                      backgroundColor: color?.primary,
                                      borderColor: color
                                        ? `${color.primary}dd`
                                        : undefined,
                                      boxShadow: stimulus
                                        ? `0 4px 6px -1px ${color?.primary}33`
                                        : undefined,
                                    }}
                                    whileHover={stimulus ? { scale: 1.05 } : {}}
                                  >
                                    {stimulus ? (
                                      <motion.div className="flex flex-col items-center gap-0.5">
                                        {stimulus.type === 'image' && (
                                          <Image className="w-4 h-4" />
                                        )}
                                        {stimulus.type === 'video' && (
                                          <Video className="w-4 h-4" />
                                        )}
                                        {stimulus.type === 'audio' && (
                                          <Music className="w-4 h-4" />
                                        )}
                                        {stimulus.type === 'text' && (
                                          <Type className="w-4 h-4" />
                                        )}
                                        <span className="text-[10px] font-semibold">
                                          {globalIndex + 1}
                                        </span>
                                      </motion.div>
                                    ) : (
                                      <span className="text-[10px]">
                                        {globalIndex + 1}
                                      </span>
                                    )}
                                  </motion.div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-tertiary-label">
                        No grid configuration
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Advanced Apple-Style Gallery */}
      {stimuli.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-separator bg-surface">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <LayoutGrid className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-label">
                      Gallery
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-secondary-label">
                      <span>{filteredStimuli.length} items</span>
                      {selectedStimuli.size > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-primary">
                            {selectedStimuli.size} selected
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  {!readOnly && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary-label" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 rounded-lg bg-fill border-0 text-sm text-label
                                 placeholder-tertiary-label focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Sort */}
                  {!readOnly && (
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="text-xs px-2 py-1.5 rounded-lg bg-fill border-0 text-label
                               focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="type">Type</option>
                    </select>
                  )}

                  {/* View Selector */}
                  <div className="inline-flex items-center bg-fill rounded-lg p-0.5">
                    <button
                      onClick={() => setGalleryView('grid')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        galleryView === 'grid'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-label'
                          : 'text-secondary-label hover:text-label'
                      )}
                      aria-label="Grid view"
                    >
                      <Grid3X3Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setGalleryView('compact')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        galleryView === 'compact'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-label'
                          : 'text-secondary-label hover:text-label'
                      )}
                      aria-label="Compact view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setGalleryView('list')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        galleryView === 'list'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-label'
                          : 'text-secondary-label hover:text-label'
                      )}
                      aria-label="List view"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Columns */}
                  {galleryView === 'grid' && (
                    <select
                      value={galleryColumns}
                      onChange={e => setGalleryColumns(Number(e.target.value))}
                      className="text-xs px-2 py-1.5 rounded-lg bg-fill border-0 text-label
                               focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value={3}>3 cols</option>
                      <option value={4}>4 cols</option>
                      <option value={5}>5 cols</option>
                      <option value={6}>6 cols</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Selection Actions */}
            {selectedStimuli.size > 0 && !readOnly && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {selectedStimuli.size} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedStimuli(new Set())}
                    >
                      Deselect All
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(Array.from(selectedStimuli))}
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery Grid */}
            <div
              ref={galleryRef}
              className={cn(
                'relative rounded-xl',
                galleryView === 'grid' ? `grid gap-3` : '',
                galleryView === 'compact'
                  ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'
                  : '',
                galleryView === 'list' ? 'space-y-2' : ''
              )}
              style={{
                gridTemplateColumns:
                  galleryView === 'grid'
                    ? `repeat(${galleryColumns}, minmax(0, 1fr))`
                    : undefined,
              }}
            >
              <AnimatePresence>
                {filteredStimuli.map((stimulus, index) => {
                  const mediaColor = MEDIA_COLORS[stimulus.type];

                  return (
                    <motion.div
                      key={stimulus.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'relative group overflow-hidden',
                        'bg-white dark:bg-gray-800 backdrop-blur-sm',
                        'border border-separator',
                        'rounded-xl transition-all duration-200',
                        !readOnly &&
                          'hover:shadow-xl hover:scale-[1.02] hover:z-10',
                        !readOnly && 'hover:border-primary',
                        galleryView === 'grid' ? 'aspect-square' : '',
                        galleryView === 'compact' ? 'aspect-[4/3]' : '',
                        galleryView === 'list' ? 'h-16 flex items-center' : '',
                        selectedStimuli.has(stimulus.id) &&
                          'ring-2 ring-primary ring-offset-2 bg-blue-50 dark:bg-blue-900/20',
                        !readOnly && 'cursor-pointer'
                      )}
                      onClick={() =>
                        !readOnly && toggleStimulusSelection(stimulus.id)
                      }
                    >
                      <div
                        className={cn(
                          'relative w-full h-full',
                          galleryView === 'list' ? 'flex items-center px-4' : ''
                        )}
                      >
                        {/* Preview Content */}
                        {galleryView !== 'list' && (
                          <div className="w-full h-full">
                            {stimulus.type === 'image' && stimulus.preview && (
                              <img
                                src={stimulus.preview}
                                alt={stimulus.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                            {stimulus.type === 'video' && (
                              <div
                                className="w-full h-full flex flex-col items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${mediaColor.primary} 0%, ${mediaColor.secondary} 100%)`,
                                }}
                              >
                                <Video className="w-12 h-12 text-white mb-2" />
                                <span className="text-xs text-white/70">
                                  Video
                                </span>
                              </div>
                            )}
                            {stimulus.type === 'audio' && (
                              <div
                                className="w-full h-full flex flex-col items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${mediaColor.primary} 0%, ${mediaColor.secondary} 100%)`,
                                }}
                              >
                                <Music className="w-12 h-12 text-white mb-2" />
                                <span className="text-xs text-white/70">
                                  Audio
                                </span>
                              </div>
                            )}
                            {stimulus.type === 'text' && (
                              <div className="w-full h-full bg-fill p-4 flex items-center justify-center">
                                <p className="text-xs text-label line-clamp-4 text-center">
                                  {stimulus.editedText || stimulus.content}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* List View Content */}
                        {galleryView === 'list' && (
                          <>
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                              style={{ backgroundColor: mediaColor.light }}
                            >
                              {stimulus.type === 'image' && (
                                <Image
                                  className="w-5 h-5"
                                  style={{ color: mediaColor.primary }}
                                />
                              )}
                              {stimulus.type === 'video' && (
                                <Video
                                  className="w-5 h-5"
                                  style={{ color: mediaColor.primary }}
                                />
                              )}
                              {stimulus.type === 'audio' && (
                                <Music
                                  className="w-5 h-5"
                                  style={{ color: mediaColor.primary }}
                                />
                              )}
                              {stimulus.type === 'text' && (
                                <Type
                                  className="w-5 h-5"
                                  style={{ color: mediaColor.primary }}
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-label line-clamp-1">
                                {stimulus.title ||
                                  `${stimulus.type} ${index + 1}`}
                              </p>
                              <p className="text-xs text-secondary-label">
                                {stimulus.type.charAt(0).toUpperCase() +
                                  stimulus.type.slice(1)}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Actions Overlay */}
                        {!readOnly && galleryView !== 'list' && (
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              {stimulus.type === 'text' && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleEditText(stimulus);
                                  }}
                                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg 
                                           hover:bg-white transition-colors shadow-sm"
                                  aria-label="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-gray-700" />
                                </button>
                              )}
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDelete([stimulus.id]);
                                }}
                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg 
                                         hover:bg-red-50 transition-colors shadow-sm"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selection Indicator */}
                        {selectedStimuli.has(stimulus.id) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Index Badge */}
                        <div className="absolute top-2 left-2">
                          <div className="px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full text-white text-[10px] font-semibold">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      )}

      {/* Hidden file inputs */}
      {!readOnly && (
        <>
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={audioInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </>
      )}

      {/* Popup Modal */}
      <PopupModal
        isOpen={popupState.isOpen}
        onClose={closePopup}
        type={popupState.type}
        title={popupState.title}
        message={popupState.message}
        onConfirm={popupState.onConfirm}
        onCancel={popupState.onCancel}
      />
    </div>
  );
}
