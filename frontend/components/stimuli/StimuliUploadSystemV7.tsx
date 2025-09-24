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
  Sparkles,
  Info,
  LayoutGrid,
  Square,
  Grid3X3Icon,
} from 'lucide-react';
import { Button } from '@/components/apple-ui/Button';
import {
  Card,
  CardContent,
} from '@/components/apple-ui/Card';
import { Badge } from '@/components/apple-ui/Badge/Badge';
import PopupModal, { usePopup } from '@/components/ui/PopupModal';
import { useToast, ToastContainer } from '@/components/ui/ToastNotification';
import { cn } from '@/lib/utils';

// Q-Method text requirements
const Q_METHOD_TEXT_LIMITS = {
  minWords: 10,
  maxWords: 30,
  recommendedWords: 20,
  maxCharacters: 200,
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

interface StimuliUploadSystemV7Props {
  grid: GridConfiguration;
  initialStimuli?: Stimulus[];
  onStimuliChange?: (stimuli: Stimulus[]) => void;
  readOnly?: boolean;
}

// Apple-style color definitions for media types
const MEDIA_COLORS = {
  image: {
    primary: '#667eea',
    secondary: '#764ba2',
    light: '#667eea22',
    hover: '#667eea44',
  },
  video: {
    primary: '#f093fb',
    secondary: '#f5576c',
    light: '#f093fb22',
    hover: '#f093fb44',
  },
  audio: {
    primary: '#4facfe',
    secondary: '#00f2fe',
    light: '#4facfe22',
    hover: '#4facfe44',
  },
  text: {
    primary: '#43e97b',
    secondary: '#38f9d7',
    light: '#43e97b22',
    hover: '#43e97b44',
  },
};

export function StimuliUploadSystemV7({
  grid,
  initialStimuli = [],
  onStimuliChange,
  readOnly = false,
}: StimuliUploadSystemV7Props) {
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
  const [galleryColumns, setGalleryColumns] = useState(6);
  const [searchQuery, _setSearchQuery] = useState('');
  const [sortBy, _setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [previewStimulus, setPreviewStimulus] = useState<Stimulus | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const {
    popupState,
    closePopup,
    showConfirm,
    showWarning: _showPopupWarning
  } = usePopup();

  const { toasts, showSuccess, showError, showWarning, removeToast } =
    useToast();

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

  // LinkedIn-style hard limit - prevent typing beyond max words
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newWordCount = getWordCount(newText);

    // If at max words and trying to add more (not deleting), block the input
    if (newWordCount > Q_METHOD_TEXT_LIMITS.maxWords) {
      // Only allow if user is deleting (new text is shorter)
      if (newText.length < textInput.length) {
        setTextInput(newText);
      }
      // Otherwise, don't update - effectively blocks typing
      return;
    }

    // Normal update if within limits
    setTextInput(newText);
  };

  // Handle upload mode selection
  const handleModeSelect = (mode: UploadMode) => {
    if (readOnly) return;

    // Show warning if switching types with existing stimuli (regardless of grid fullness)
    if (
      stimuli.length > 0 &&
      lockedType &&
      mode !== lockedType &&
      mode !== null
    ) {
      showConfirm(
        `You cannot combine different stimuli types. Switching to ${mode} will remove all ${stimuli.length} uploaded ${lockedType} stimuli. Do you want to continue?`,
        () => {
          setStimuli([]);
          setLockedType(null);
          setUploadMode(mode);
          setSelectedStimuli(new Set());
          showSuccess(`Switched to ${mode} mode`, 2000);
        },
        {
          title: 'Change Stimuli Type?',
          onCancel: () => {},
        }
      );
      return;
    }

    // Only prevent opening upload if grid is full and trying to upload MORE of the same type
    if (stimuli.length >= totalCells && mode === lockedType && mode !== null) {
      showError(
        `Grid is full! You have uploaded all ${totalCells} required stimuli.`
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
      showWarning?.(
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
        preview: uploadMode === 'image' ? url : '',
        duration:
          uploadMode === 'video' || uploadMode === 'audio' ? '0:00' : '',
        file,
        url,
        metadata: {
          size: file.size,
          uploadedAt: new Date(),
        },
      });
    }

    setStimuli(prev => [...prev, ...newStimuli]);
    showSuccess(
      `${filesToUpload} ${uploadMode}${filesToUpload > 1 ? 's' : ''} added`,
      2000
    );

    // Lock type after first upload
    if (!lockedType && newStimuli.length > 0) {
      setLockedType(uploadMode);
    }

    if (event.target) event.target.value = '';

    if (stimuli.length + filesToUpload >= totalCells) {
      setUploadMode(null);
      showSuccess('Grid complete!', 3000);
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
      showSuccess('Text updated', 2000);
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
      showSuccess(`Text ${stimuli.length + 1} added`, 2000);

      // Lock type after first text upload
      if (!lockedType) {
        setLockedType('text');
      }

      if (stimuli.length + 1 >= totalCells) {
        setUploadMode(null);
        showSuccess('Grid complete!', 3000);
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
            showSuccess('All cleared', 2000);
          } else {
            showSuccess(`${ids.length} deleted`, 2000);
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

  // Handle stimulus preview
  const handleStimulusClick = (stimulus: Stimulus, event: React.MouseEvent) => {
    // Prevent triggering selection when clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    // If shift key is held, toggle selection
    if (event.shiftKey) {
      toggleStimulusSelection(stimulus.id);
    } else {
      // Otherwise show preview
      setPreviewStimulus(stimulus);
      setShowPreview(true);
    }
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

  // Media button component with fixed colors
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
    const isFull = stimuli.length >= totalCells;
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
        whileHover={!readOnly ? { scale: 1.02 } : {}}
        whileTap={!readOnly ? { scale: 0.98 } : {}}
        onClick={handleButtonClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={readOnly}
        className={cn(
          'relative group flex flex-col items-center justify-center p-6 rounded-lg',
          'transition-all duration-300 border-0.5 border-separator',
          isActive &&
            !isFull &&
            'ring-2 ring-primary/25 ring-offset-2 shadow-md bg-gradient-to-br',
          !isActive && 'bg-surface shadow-xs',
          !readOnly && 'hover:shadow-sm cursor-pointer',
          readOnly && 'cursor-not-allowed opacity-60'
        )}
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%)`
            : undefined,
        }}
      >
        <motion.div
          animate={{
            rotate: isActive ? [0, -5, 5, -5, 0] : 0,
            scale: isActive ? 1.15 : isHovered && !readOnly ? 1.05 : 1,
          }}
          transition={{ duration: 0.5 }}
        >
          <IconComponent
            className={cn(
              'mb-3 transition-all duration-300',
              isActive
                ? 'w-12 h-12 text-white'
                : isHovered && !readOnly
                  ? 'w-11 h-11 text-primary'
                  : 'w-10 h-10 text-text-secondary'
            )}
          />
        </motion.div>
        <div
          className={cn(
            'font-semibold text-lg mb-1 transition-all duration-300',
            isActive ? 'text-white' : 'text-text'
          )}
        >
          {buttonLabel}
        </div>
        <div
          className={cn(
            'text-xs transition-all duration-300',
            isActive ? 'text-white/90' : 'text-text-tertiary'
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
      {/* Compact Progress Bar */}
      <div className="bg-surface rounded-lg p-3.5 shadow-sm border border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-system-blue" />
            <span className="text-sm font-medium text-text">
              {stimuliCount}/{totalCells} stimuli
            </span>
            {remainingStimuli > 0 && (
              <span className="text-xs text-text-secondary">
                ({remainingStimuli} needed)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {stimuliCount >= totalCells && (
              <Badge variant="success" className="text-xs">
                Complete
              </Badge>
            )}
            <span className="text-sm font-medium text-text">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-fill-quaternary rounded-full overflow-hidden mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-system-blue to-system-purple"
          />
        </div>
      </div>

      {/* Upload Mode Selection - Compact */}
      {!readOnly && (
        <Card className="bg-surface shadow-sm border border-subtle">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-text">
                Choose Upload Type
              </h4>
              {lockedType && (
                <Badge variant="secondary" className="text-xs">
                  {lockedType.charAt(0).toUpperCase() + lockedType.slice(1)}{' '}
                  Only
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

      {/* Text Input Area */}
      <AnimatePresence mode="wait">
        {uploadMode === 'text' && !readOnly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="text-input-section bg-surface shadow-sm border border-subtle">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-text">
                      {isEditingText
                        ? 'Edit Text Statement'
                        : 'Add Text Statement'}
                    </h4>
                    {/* Tooltip */}
                    <div className="group relative inline-flex items-center cursor-help">
                      <Info className="w-4 h-4 text-system-blue" />
                      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-0 mb-2 w-56 p-2.5 bg-surface text-text text-xs rounded-md shadow-md z-50 border-0.5 border-separator">
                        <div className="relative">
                          <p className="text-xs">
                            Keep statements under 30 words. Use single, clear
                            ideas. Each should represent a unique perspective.
                          </p>
                          <div className="absolute -bottom-1 left-2 w-2 h-2 bg-surface rotate-45 border-r-0.5 border-b-0.5 border-separator"></div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    <X className="w-4 h-4 mr-1" />
                    Close
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <textarea
                      value={textInput}
                      onChange={handleTextInputChange}
                      placeholder="Enter a concise statement (10-30 words) representing a distinct viewpoint..."
                      className="w-full h-40 p-4 rounded-md bg-surface-secondary border border-border-strong
                               focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                               resize-none text-text placeholder-text-disabled transition-all"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={cn(
                            'font-medium',
                            getWordCount(textInput) <
                              Q_METHOD_TEXT_LIMITS.minWords
                              ? 'text-danger'
                              : getWordCount(textInput) ===
                                  Q_METHOD_TEXT_LIMITS.maxWords
                                ? 'text-warning'
                                : 'text-success'
                          )}
                        >
                          {getWordCount(textInput)} words
                        </span>
                        <span className="text-text-secondary">
                          (max {Q_METHOD_TEXT_LIMITS.maxWords} words)
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
                          {isEditingText ? 'Update' : 'Add'} Statement
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Preview */}
      <Card className="overflow-hidden bg-surface shadow-sm border border-subtle">
        <button
          onClick={() => setShowGridPreview(!showGridPreview)}
          className="w-full p-4 flex items-center justify-between hover:bg-fill-quaternary transition-colors"
        >
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-5 h-5 text-text-secondary" />
            <span className="font-medium text-text">
              Grid Preview - Fill Each Cell
            </span>
            <Badge
              variant={stimuli.length >= totalCells ? 'success' : 'secondary'}
            >
              {stimuli.length}/{totalCells} cells filled
            </Badge>
          </div>
          {showGridPreview ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )}
        </button>

        <AnimatePresence>
          {showGridPreview && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="border-t border-subtle"
            >
              <div className="p-6 bg-bg">
                <p className="text-sm text-text-secondary mb-4">
                  Your Q-sort grid configuration. Cells fill up as you upload
                  stimuli.
                </p>

                <div className="w-full overflow-x-auto pb-2">
                  <div className="flex justify-center min-w-fit p-5 bg-surface-interactive rounded-lg border border-subtle shadow-sm">
                    {grid && grid.columns ? (
                      grid.columns.map((column, colIndex) => {
                        // Calculate consistent column width based on total columns
                        const columnWidth = grid.columns.length > 9 ? 60 : 80;

                        return (
                          <div
                            key={colIndex}
                            className="flex flex-col items-center"
                            style={{
                              width: `${columnWidth}px`,
                              marginRight:
                                colIndex < grid.columns.length - 1
                                  ? '12px'
                                  : '0',
                            }}
                          >
                            {/* Column Value - Matching Step 3 format */}
                            <div className="text-center mb-2">
                              <div
                                className={`font-bold ${grid.columns.length > 9 ? 'text-sm' : 'text-lg'} text-text`}
                              >
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
                                  const isRecentlyAdded =
                                    globalIndex === stimuli.length - 1 &&
                                    stimulus;

                                  return (
                                    <motion.div
                                      key={cellIndex}
                                      initial={
                                        isRecentlyAdded
                                          ? { scale: 0.8, opacity: 0 }
                                          : {}
                                      }
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{
                                        duration: 0.3,
                                        type: 'spring',
                                      }}
                                      className={cn(
                                        grid.columns.length > 9
                                          ? 'w-12 h-14'
                                          : 'w-14 h-16',
                                        'rounded-md flex items-center justify-center text-xs font-medium transition-all',
                                        stimulus
                                          ? 'text-white shadow-sm border-0'
                                          : 'bg-surface-secondary border-2 border-border-strong text-text-secondary font-semibold hover:bg-surface-interactive transition-all cursor-pointer'
                                      )}
                                      style={{
                                        backgroundColor: color?.primary,
                                        borderColor: color
                                          ? `${color.primary}dd`
                                          : undefined,
                                        boxShadow:
                                          stimulus && isRecentlyAdded
                                            ? `0 8px 16px -4px ${color?.primary}40`
                                            : stimulus
                                              ? `0 2px 4px -1px ${color?.primary}20`
                                              : 'none',
                                      }}
                                      whileHover={
                                        stimulus ? { scale: 1.03 } : {}
                                      }
                                    >
                                      {stimulus ? (
                                        <motion.div
                                          className="flex flex-col items-center gap-0.5"
                                          initial={
                                            isRecentlyAdded
                                              ? { rotate: -180 }
                                              : {}
                                          }
                                          animate={{ rotate: 0 }}
                                          transition={{ duration: 0.5 }}
                                        >
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
                                        <span className="text-xs font-bold text-text-secondary">
                                          {globalIndex + 1}
                                        </span>
                                      )}
                                    </motion.div>
                                  );
                                }
                              )}
                            </div>

                            {/* Column Label - Matching Step 3 format with box */}
                            <div className="px-1.5 py-1 bg-surface-secondary rounded-md border border-subtle w-full h-11 flex items-center justify-center mt-2 shadow-sm">
                              <div
                                className={`${grid.columns.length > 9 ? 'text-[10px]' : 'text-xs'} font-medium text-text-secondary text-center break-words line-clamp-2`}
                              >
                                {column.label || `Col ${column.value}`}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-text-tertiary">
                        No grid configuration available
                      </p>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 p-4 bg-surface-secondary rounded-lg border border-subtle">
                  <h4 className="text-xs font-semibold text-text mb-2 uppercase tracking-wide">
                    Legend
                  </h4>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: MEDIA_COLORS.image.primary }}
                      ></div>
                      <span className="text-text-secondary">Image</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: MEDIA_COLORS.video.primary }}
                      ></div>
                      <span className="text-text-secondary">Video</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: MEDIA_COLORS.audio.primary }}
                      ></div>
                      <span className="text-text-secondary">Audio</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: MEDIA_COLORS.text.primary }}
                      ></div>
                      <span className="text-text-secondary">Text</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-surface-secondary rounded border-2 border-border-strong"></div>
                      <span className="text-text-secondary font-medium">
                        Empty
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Advanced Gallery */}
      {stimuli.length > 0 && (
        <Card className="overflow-hidden bg-surface shadow-sm border border-subtle">
          <div className="relative overflow-hidden bg-surface border-b border-border">
            <div className="relative px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-br from-system-blue to-system-purple rounded-md">
                    <Grid3x3 className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text">
                      Stimuli Gallery
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-fill-quaternary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                            style={{
                              width: `${(stimuli.length / totalCells) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary font-medium">
                          {stimuli.length}/{totalCells}
                        </span>
                      </div>

                      {selectedStimuli.size > 0 && (
                        <>
                          <div className="w-px h-4 bg-separator" />
                          <span className="text-xs text-system-blue font-medium">
                            {selectedStimuli.size} selected
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedStimuli.size > 0 && !readOnly && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(Array.from(selectedStimuli))}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove ({selectedStimuli.size})
                    </Button>
                  )}

                  <div className="inline-flex items-center bg-surface-secondary rounded-md p-0.5 border-0.5 border-separator">
                    <button
                      onClick={() => setGalleryView('grid')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        galleryView === 'grid'
                          ? 'bg-surface shadow-sm text-text'
                          : 'text-text-secondary hover:text-text'
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
                          ? 'bg-surface shadow-sm text-text'
                          : 'text-text-secondary hover:text-text'
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
                          ? 'bg-surface shadow-sm text-text'
                          : 'text-text-secondary hover:text-text'
                      )}
                      aria-label="List view"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>

                  {galleryView === 'grid' && (
                    <select
                      value={galleryColumns}
                      onChange={e => setGalleryColumns(Number(e.target.value))}
                      className="text-xs px-2 py-1.5 rounded-md bg-bg border-0.5 border-separator 
                               text-text focus:ring-2 focus:ring-primary/25 focus:outline-none"
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

          <div className="relative p-6">
            {/* Gallery Grid */}
            <div
              ref={galleryRef}
              className={cn(
                'relative rounded-lg',
                galleryView === 'grid' ? `grid gap-3` : '',
                galleryView === 'compact'
                  ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'
                  : '',
                galleryView === 'list' ? 'space-y-2' : '',
                'max-h-[600px] overflow-y-auto'
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
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                        delay: index * 0.02,
                      }}
                      className={cn(
                        'relative group overflow-hidden',
                        'bg-surface backdrop-blur-sm shadow-xs',
                        'border-0.5 border-separator',
                        'rounded-md transition-all duration-200',
                        !readOnly &&
                          'hover:shadow-xl hover:scale-[1.03] hover:z-10',
                        !readOnly &&
                          'hover:border-blue-300 dark:hover:border-blue-600',
                        galleryView === 'grid' ? 'aspect-square' : '',
                        galleryView === 'compact' ? 'aspect-[4/3]' : '',
                        galleryView === 'list' ? 'h-16 flex items-center' : '',
                        selectedStimuli.has(stimulus.id) &&
                          'ring-2 ring-primary ring-offset-2 bg-primary/10',
                        !readOnly && 'cursor-pointer'
                      )}
                      onClick={e => handleStimulusClick(stimulus, e)}
                    >
                      <div
                        className={cn(
                          'relative w-full h-full',
                          galleryView === 'list' ? 'flex items-center px-4' : ''
                        )}
                      >
                        {/* Media Preview */}
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
                              <div className="w-full h-full bg-surface-secondary p-4 flex items-center justify-center">
                                <p className="text-xs text-text line-clamp-4 text-center font-medium">
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
                              <p className="text-sm font-medium text-text line-clamp-1">
                                {stimulus.title ||
                                  `${stimulus.type} ${index + 1}`}
                              </p>
                              <p className="text-xs text-text-secondary">
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
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                          >
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-auto">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleStimulusClick(stimulus, e);
                                }}
                                className="p-1.5 bg-surface/90 backdrop-blur-sm rounded-lg 
                                         hover:bg-surface transition-colors shadow-sm"
                                aria-label="Preview"
                              >
                                <Eye className="w-3.5 h-3.5 text-text" />
                              </button>
                              <div className="flex gap-1">
                                {stimulus.type === 'text' && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleEditText(stimulus);
                                    }}
                                    className="p-1.5 bg-surface/90 backdrop-blur-sm rounded-lg 
                                             hover:bg-surface transition-colors shadow-sm"
                                    aria-label="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-text" />
                                  </button>
                                )}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDelete([stimulus.id]);
                                  }}
                                  className="p-1.5 bg-surface/90 backdrop-blur-sm rounded-lg 
                                           hover:bg-danger/10 transition-colors shadow-sm"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-danger" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Selection Indicator */}
                        {selectedStimuli.has(stimulus.id) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-system-blue rounded-full flex items-center justify-center shadow-sm">
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

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewStimulus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between p-4 border-b border-separator">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: MEDIA_COLORS[previewStimulus.type].light,
                    }}
                  >
                    {previewStimulus.type === 'image' && (
                      <Image
                        className="w-5 h-5"
                        style={{ color: MEDIA_COLORS.image.primary }}
                      />
                    )}
                    {previewStimulus.type === 'video' && (
                      <Video
                        className="w-5 h-5"
                        style={{ color: MEDIA_COLORS.video.primary }}
                      />
                    )}
                    {previewStimulus.type === 'audio' && (
                      <Music
                        className="w-5 h-5"
                        style={{ color: MEDIA_COLORS.audio.primary }}
                      />
                    )}
                    {previewStimulus.type === 'text' && (
                      <Type
                        className="w-5 h-5"
                        style={{ color: MEDIA_COLORS.text.primary }}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">
                      {previewStimulus.title ||
                        `${previewStimulus.type.charAt(0).toUpperCase() + previewStimulus.type.slice(1)} Preview`}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {previewStimulus.type.charAt(0).toUpperCase() +
                        previewStimulus.type.slice(1)}{' '}
                      stimulus
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-fill-quaternary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-6 max-h-[70vh] overflow-auto">
                {previewStimulus.type === 'image' &&
                  previewStimulus.preview && (
                    <img
                      src={previewStimulus.preview}
                      alt={previewStimulus.title}
                      className="w-full h-auto rounded-lg"
                    />
                  )}
                {previewStimulus.type === 'video' && (
                  <video
                    src={previewStimulus.url || previewStimulus.content}
                    controls
                    className="w-full rounded-lg"
                  />
                )}
                {previewStimulus.type === 'audio' && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
                      style={{
                        background: `linear-gradient(135deg, ${MEDIA_COLORS.audio.primary} 0%, ${MEDIA_COLORS.audio.secondary} 100%)`,
                      }}
                    >
                      <Music className="w-16 h-16 text-white" />
                    </div>
                    <audio
                      src={previewStimulus.url || previewStimulus.content}
                      controls
                      className="w-full max-w-md"
                    />
                  </div>
                )}
                {previewStimulus.type === 'text' && (
                  <div className="p-8 bg-surface-secondary rounded-md border-0.5 border-separator">
                    <p className="text-lg leading-relaxed text-text">
                      {previewStimulus.editedText || previewStimulus.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Actions */}
              {!readOnly && (
                <div className="flex items-center justify-end gap-2 p-4 border-t border-separator">
                  {previewStimulus.type === 'text' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowPreview(false);
                        handleEditText(previewStimulus);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setShowPreview(false);
                      handleDelete([previewStimulus.id]);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        position="top-center"
      />
    </div>
  );
}
