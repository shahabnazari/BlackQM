'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Edit2,
  Trash2,
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
  FileText,
  LayoutGrid,
  Square,
  Grid3X3Icon,
} from 'lucide-react';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { Badge } from '@/components/apple-ui/Badge/Badge';
import _PopupModal, { usePopup } from '@/components/ui/PopupModal';

interface PopupFunctions {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showWarning?: (message: string) => void;
}

// Extend the popup hook if showWarning is not available
const useExtendedPopup = (): PopupFunctions => {
  const basePopup = usePopup();
  return {
    ...basePopup,
    showWarning:
      basePopup.showWarning ||
      ((message: string) => basePopup.showError(message)),
  };
};
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

interface Stimulus {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text';
  content: string;
  title?: string;
  preview?: string;
  duration?: string;
  gridPosition?: number;
  editedText?: string;
}

type UploadMode = 'image' | 'video' | 'audio' | 'text' | null;

interface StimuliUploadSystemV5Props {
  grid: GridConfiguration;
}

export function StimuliUploadSystemV5({ grid }: StimuliUploadSystemV5Props) {
  const [stimuli, setStimuli] = useState<Stimulus[]>([]);
  const [selectedStimuli, setSelectedStimuli] = useState<Set<string>>(
    new Set()
  );
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [lockedType, setLockedType] = useState<UploadMode>(null); // Track the locked stimuli type
  const [showGridPreview, setShowGridPreview] = useState(true); // Show grid preview by default
  const [textInput, setTextInput] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [galleryView, setGalleryView] = useState<'grid' | 'compact' | 'list'>(
    'grid'
  );
  const [galleryColumns, setGalleryColumns] = useState(5); // Default to 5 columns
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError, showConfirm, showWarning } =
    useExtendedPopup();

  // Calculate stimuli progress based on actual grid
  const totalCells = grid?.totalCells || STIMULI_REQUIREMENTS.recommended;
  const stimuliCount = stimuli.length;
  const progress = Math.min((stimuliCount / totalCells) * 100, 100);
  const remainingStimuli = Math.max(0, totalCells - stimuliCount);

  // Helper function to get global cell index
  const getGlobalCellIndex = (colIndex: number, cellIndex: number) => {
    if (!grid || !grid.columns) return 0;
    let index = 0;
    for (let i = 0; i < colIndex; i++) {
      index += grid.columns[i]?.cells || 0;
    }
    return index + cellIndex;
  };

  // Word count utilities
  const getWordCount = (text: string) =>
    text
      .trim()
      .split(/\s+/)
      .filter((word: any) => word.length > 0).length;

  // Handle upload mode selection
  const handleModeSelect = (mode: UploadMode) => {
    // Check if grid is full
    if (stimuli.length >= totalCells && mode !== null) {
      showError(
        `Grid is full! You have uploaded all ${totalCells} required stimuli.`
      );
      return;
    }

    // Check if trying to switch to a different type when already locked
    if (lockedType && mode !== lockedType && mode !== null) {
      showConfirm(
        `⚠️ Switching to ${mode} will remove all ${stimuli.length} uploaded ${lockedType} stimuli. Do you want to continue?`,
        () => {
          // Clear all stimuli and switch type
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

    // Toggle mode on/off
    setUploadMode(mode === uploadMode ? null : mode);

    // Clear text input when switching away from text mode
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

    // Check if adding these files would exceed the grid capacity
    const remainingSlots = totalCells - stimuli.length;
    if (remainingSlots <= 0) {
      showError(`Grid is full! Cannot add more stimuli.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      const stimulus: Stimulus = {
        id,
        type: uploadMode,
        content: url,
        title: file.name,
      };

      if (uploadMode === 'image') {
        stimulus.preview = url;
      }

      if (uploadMode === 'video' || uploadMode === 'audio') {
        stimulus.duration = '0:00';
      }

      newStimuli.push(stimulus);
    }

    setStimuli(prev => [...prev, ...newStimuli]);
    showSuccess(`Successfully uploaded ${filesToUpload} ${uploadMode}(s)`);

    // Lock the type after first upload
    if (!lockedType && newStimuli.length > 0) {
      setLockedType(uploadMode);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Auto-close upload mode if grid is now full
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
      // Update existing text
      setStimuli(prev =>
        prev.map((s: any) =>
          s.id === editingTextId
            ? { ...s, editedText: textInput, content: textInput }
            : s
        )
      );
      showSuccess('Text stimulus updated successfully');
    } else {
      // Check if grid is full before adding new text
      if (stimuli.length >= totalCells) {
        showError(`Grid is full! Cannot add more stimuli.`);
        return;
      }

      // Add new text
      const id = Math.random().toString(36).substr(2, 9);
      setStimuli(prev => [
        ...prev,
        {
          id,
          type: 'text',
          content: textInput,
          title: `Text Statement ${stimuli.filter((s: any) => s.type === 'text').length + 1}`,
        },
      ]);
      showSuccess('Text stimulus added successfully');

      // Lock the type after first upload
      if (!lockedType) {
        setLockedType('text');
      }

      // Auto-close upload mode if grid is now full
      if (stimuli.length + 1 >= totalCells) {
        setUploadMode(null);
        showSuccess('Grid is now full! All stimuli slots have been filled.');
      }
    }

    // Reset
    setTextInput('');
    setIsEditingText(false);
    setEditingTextId(null);
  };

  // Handle text edit
  const handleEditText = (stimulus: Stimulus) => {
    setUploadMode('text');
    setTextInput(stimulus.editedText || stimulus.content);
    setIsEditingText(true);
    setEditingTextId(stimulus.id);

    // Scroll to text input area
    const textSection = document.getElementById('text-input-section');
    textSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Handle delete
  const handleDelete = (ids: string[]) => {
    showConfirm(
      `Are you sure you want to delete ${ids.length} stimulus/stimuli?`,
      () => {
        const newStimuli = stimuli.filter((s: any) => !ids.includes(s.id));
        setStimuli(newStimuli);
        setSelectedStimuli(new Set());

        // If all stimuli are deleted, unlock the type
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
  };

  // Toggle stimulus selection
  const toggleStimulusSelection = (id: string) => {
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

  // Remove selected stimuli
  const removeSelectedStimuli = () => {
    handleDelete(Array.from(selectedStimuli));
  };

  // Get stimulus icon
  const getStimulusIcon = (type: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
    };
    const className = sizeClasses[size];

    switch (type) {
      case 'image':
        return <Image className={className} />;
      case 'video':
        return <Video className={className} />;
      case 'audio':
        return <Music className={className} />;
      case 'text':
        return <Type className={className} />;
      default:
        return <FileText className={className} />;
    }
  };

  // Media button component with advanced upload transformation
  const MediaButton = ({
    type,
    icon: Icon,
    label,
    description,
    gradient,
    baseColor,
  }: {
    type: UploadMode;
    icon: any;
    label: string;
    description: string;
    gradient: string;
    baseColor: string;
  }) => {
    const isActive = uploadMode === type;
    const isLocked = lockedType && lockedType !== type; // Locked to a different type
    const isFull = stimuli.length >= totalCells;
    const isDisabled = isFull && !isActive;
    const [isHovered, setIsHovered] = useState(false);

    // Transform to upload button when active
    const IconComponent = isActive && !isFull ? Upload : Icon;
    const buttonLabel = isActive && !isFull ? `Upload ${label}` : label;

    const handleButtonClick = () => {
      if (isActive && uploadMode !== 'text') {
        // Trigger the appropriate file input when active
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
        disabled={isDisabled}
        className={cn(
          'relative group flex flex-col items-center justify-center p-6 rounded-2xl',
          'backdrop-blur-xl transition-all duration-500',
          'border-2',
          isActive &&
            !isFull &&
            'ring-2 ring-offset-2 ring-offset-color-bg shadow-2xl',
          isLocked && 'opacity-50 cursor-not-allowed',
          isFull &&
            !isActive &&
            'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800',
          !isFull &&
            !isDisabled &&
            !isLocked &&
            'hover:shadow-xl cursor-pointer'
        )}
        style={{
          borderColor: isActive
            ? baseColor
            : isHovered
              ? `${baseColor}66`
              : 'rgba(255,255,255,0.2)',
          background:
            isFull || isLocked
              ? undefined
              : isActive
                ? gradient
                : isHovered
                  ? `linear-gradient(135deg, ${baseColor}22 0%, ${baseColor}11 100%)`
                  : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          boxShadow:
            isFull || isLocked
              ? 'none'
              : isActive
                ? `inset 0 1px 0 0 rgba(255,255,255,0.3), 0 20px 40px -10px ${baseColor}66`
                : isHovered
                  ? `inset 0 1px 0 0 rgba(255,255,255,0.2), 0 15px 30px -5px ${baseColor}33`
                  : 'inset 0 1px 0 0 rgba(255,255,255,0.2), 0 10px 25px -5px rgba(0,0,0,0.2)',
          transform: isActive ? 'translateY(-2px)' : undefined,
        }}
      >
        {/* Animated gradient background for active state */}
        {isActive && !isFull && (
          <motion.div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            animate={{
              background: [
                gradient,
                `linear-gradient(225deg, ${baseColor} 0%, ${baseColor}dd 100%)`,
                gradient,
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        {/* Gloss effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            animate={{
              rotate: isActive ? [0, -5, 5, -5, 0] : 0,
              scale: isActive ? 1.2 : isHovered ? 1.1 : 1,
              y: isActive ? -2 : 0,
            }}
            transition={{ duration: 0.5 }}
          >
            <IconComponent
              className={cn(
                'mb-3 transition-all duration-300',
                isActive
                  ? 'w-12 h-12 text-white drop-shadow-lg'
                  : isHovered
                    ? 'w-11 h-11'
                    : 'w-10 h-10',
                isActive
                  ? 'text-white'
                  : isHovered
                    ? `text-[${baseColor}]`
                    : 'text-color-text'
              )}
              style={{
                color: isActive ? 'white' : isHovered ? baseColor : undefined,
                filter: isActive
                  ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
                  : undefined,
              }}
            />
          </motion.div>
          <div
            className={cn(
              'font-semibold text-lg mb-1 transition-all duration-300',
              isActive
                ? 'text-white'
                : isHovered
                  ? 'text-color-text'
                  : 'text-color-text'
            )}
          >
            {buttonLabel}
          </div>
          <div
            className={cn(
              'text-xs transition-all duration-300',
              isActive ? 'text-white/90' : 'text-color-text-secondary'
            )}
          >
            {isActive && !isFull ? 'Click to browse files' : description}
          </div>
        </div>

        {/* Active indicator with pulse */}
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white rounded-full opacity-40"
            />
            <CheckCircle
              className="w-4 h-4 relative z-10"
              style={{ color: baseColor }}
            />
          </motion.div>
        )}

        {/* Upload progress indicator overlay when active */}
        {isActive && !isFull && type !== 'text' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Efficient Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-color-text">
                  Stimuli Collection Progress
                </h3>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-color-text-secondary">
                    {stimuliCount} of {totalCells} required stimuli
                  </span>
                  <span className="text-sm font-medium text-color-text">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-color-fill rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm text-color-text-secondary">
                <p className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>
                    {remainingStimuli > 0
                      ? `Add ${remainingStimuli} more stimuli to fill all grid cells.`
                      : `All grid cells are filled! Your Q-sort is ready.`}
                  </span>
                </p>
                <p className="text-xs italic">
                  Q-methodology works best with 30-45 diverse stimuli that
                  represent different perspectives on your topic.
                </p>
              </div>
            </div>

            {/* Visual indicator */}
            <div className="ml-6 flex flex-col items-center">
              <div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl',
                  stimuliCount >= totalCells
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                    : stimuliCount >= totalCells * 0.7
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                )}
              >
                {stimuliCount}
              </div>
              <span className="text-xs text-color-text-secondary mt-2 text-center">
                Total Stimuli
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Mode Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-color-text">
              Select Upload Type
            </h4>
            <p className="text-sm text-color-text-secondary mt-1">
              {stimuli.length >= totalCells
                ? '✅ Grid is full! All stimuli have been uploaded.'
                : `Choose media type to upload. ${remainingStimuli} slot${remainingStimuli !== 1 ? 's' : ''} remaining.`}
            </p>
          </div>
          {stimuli.length >= totalCells && (
            <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Grid Complete
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MediaButton
            type="image"
            icon={Image}
            label="Images"
            description="JPG, PNG, GIF"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            baseColor="#667eea"
          />
          <MediaButton
            type="video"
            icon={Video}
            label="Videos"
            description="MP4, MOV, AVI"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            baseColor="#f093fb"
          />
          <MediaButton
            type="audio"
            icon={Music}
            label="Audio"
            description="MP3, WAV, M4A"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            baseColor="#4facfe"
          />
          <MediaButton
            type="text"
            icon={Type}
            label="Text"
            description="Written statements"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            baseColor="#43e97b"
          />
        </div>
      </Card>

      {/* Upload/Input Area */}
      <AnimatePresence mode="wait">
        {uploadMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {uploadMode === 'text' ? (
              // Inline Text Editor
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-color-text">
                    {isEditingText
                      ? 'Edit Text Statement'
                      : 'Add Text Statement'}
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
                  <div>
                    <textarea
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder="Enter your text statement here (50-150 words)..."
                      className="w-full h-32 p-4 rounded-xl border border-color-border-secondary bg-color-bg
                               focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                               text-color-text placeholder-color-text-secondary"
                    />
                  </div>

                  {/* Word count indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={cn(
                          getWordCount(textInput) <
                            Q_METHOD_TEXT_LIMITS.minWords
                            ? 'text-red-500'
                            : getWordCount(textInput) >
                                Q_METHOD_TEXT_LIMITS.maxWords
                              ? 'text-red-500'
                              : 'text-green-500'
                        )}
                      >
                        {getWordCount(textInput)} words
                      </span>
                      <span className="text-color-text-secondary">
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
                        {isEditingText ? 'Update' : 'Add'} Statement
                      </Button>
                    </div>
                  </div>

                  {/* Guidelines */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div className="text-sm text-color-text-secondary space-y-1">
                        <p className="font-medium text-color-text">
                          Q-Method Text Guidelines:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            Keep statements between 50-150 words for optimal
                            sorting
                          </li>
                          <li>Use clear, single-idea statements</li>
                          <li>Avoid complex or compound sentences</li>
                          <li>
                            Ensure each statement represents a unique
                            perspective
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : // File Upload Area - Now handled by the buttons themselves
            null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs for each media type */}
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

      {/* Grid Preview with Cell Highlighting - Moved Up */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowGridPreview(!showGridPreview)}
          className="w-full p-4 flex items-center justify-between hover:bg-color-fill transition-colors"
        >
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-5 h-5 text-color-text-secondary" />
            <span className="font-medium text-color-text">
              Grid Preview - Fill Each Cell
            </span>
            <Badge
              variant={stimuli.length >= totalCells ? 'success' : 'secondary'}
            >
              {stimuli.length}/{totalCells} cells filled
            </Badge>
          </div>
          {showGridPreview ? (
            <ChevronUp className="w-5 h-5 text-color-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-color-text-secondary" />
          )}
        </button>

        <AnimatePresence>
          {showGridPreview && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-color-border"
            >
              <div className="p-6">
                <p className="text-sm text-color-text-secondary mb-4">
                  Your Q-sort grid configuration. Cells fill up as you upload
                  stimuli.
                </p>

                {/* Column-based Q-sort Grid Preview */}
                <div className="w-full overflow-x-auto">
                  <div className="flex justify-center gap-3 min-w-fit p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    {grid && grid.columns ? (
                      grid.columns.map((column, colIndex) => (
                        <div
                          key={colIndex}
                          className="flex flex-col items-center"
                        >
                          {/* Column Header with Value */}
                          <div className="text-center mb-2 h-12 flex flex-col justify-end">
                            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {column.value > 0 ? '+' : ''}
                              {column.value}
                            </div>
                            {column.label && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[80px]">
                                {column.label}
                              </div>
                            )}
                          </div>

                          {/* Column Cells */}
                          <div className="flex flex-col-reverse gap-1">
                            {Array.from({ length: column.cells }).map(
                              (_, cellIndex) => {
                                const globalIndex = getGlobalCellIndex(
                                  colIndex,
                                  cellIndex
                                );
                                const stimulus = stimuli[globalIndex];
                                const isRecentlyAdded =
                                  globalIndex === stimuli.length - 1 &&
                                  stimulus;

                                // Get the color based on stimulus type
                                const getTypeColor = (
                                  type: string | undefined
                                ) => {
                                  switch (type) {
                                    case 'image':
                                      return '#667eea'; // Purple
                                    case 'video':
                                      return '#f093fb'; // Pink
                                    case 'audio':
                                      return '#4facfe'; // Blue
                                    case 'text':
                                      return '#43e97b'; // Green
                                    default:
                                      return '#9ca3af'; // Gray
                                  }
                                };

                                const cellColor = stimulus
                                  ? getTypeColor(stimulus.type)
                                  : '#f3f4f6';
                                const borderColor = stimulus
                                  ? `${cellColor}dd`
                                  : '#d1d5db';

                                return (
                                  <motion.div
                                    key={cellIndex}
                                    initial={
                                      isRecentlyAdded
                                        ? { scale: 0.8, opacity: 0 }
                                        : {}
                                    }
                                    animate={{
                                      scale: 1,
                                      opacity: 1,
                                    }}
                                    transition={{
                                      duration: 0.3,
                                      type: 'spring',
                                      stiffness: 200,
                                    }}
                                    className={cn(
                                      'w-12 h-16 rounded-lg flex items-center justify-center text-xs font-medium border-2 transition-all',
                                      stimulus
                                        ? 'text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-800 border-dashed text-gray-500'
                                    )}
                                    style={{
                                      backgroundColor: cellColor,
                                      borderColor: borderColor,
                                      boxShadow:
                                        stimulus && isRecentlyAdded
                                          ? `0 10px 25px -5px ${cellColor}66`
                                          : stimulus
                                            ? `0 4px 6px -1px ${cellColor}33`
                                            : 'none',
                                    }}
                                    whileHover={{
                                      scale: stimulus ? 1.05 : 1,
                                      boxShadow: stimulus
                                        ? `0 10px 25px -5px ${cellColor}88`
                                        : 'none',
                                    }}
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
                                          <Image className="w-4 h-4 drop-shadow" />
                                        )}
                                        {stimulus.type === 'video' && (
                                          <Video className="w-4 h-4 drop-shadow" />
                                        )}
                                        {stimulus.type === 'audio' && (
                                          <Music className="w-4 h-4 drop-shadow" />
                                        )}
                                        {stimulus.type === 'text' && (
                                          <Type className="w-4 h-4 drop-shadow" />
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
                      <div className="text-center text-gray-500">
                        <p>No grid configuration available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: '#667eea' }}
                    ></div>
                    <span className="text-color-text-secondary">Image</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: '#f093fb' }}
                    ></div>
                    <span className="text-color-text-secondary">Video</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: '#4facfe' }}
                    ></div>
                    <span className="text-color-text-secondary">Audio</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: '#43e97b' }}
                    ></div>
                    <span className="text-color-text-secondary">Text</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded border-2 border-dashed border-gray-400"></div>
                    <span className="text-color-text-secondary">Empty</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Advanced Gallery with Optimized Grid */}
      {stimuli.length > 0 && (
        <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          {/* Modern Gallery Header */}
          <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-separator">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.05) 35px, rgba(0,0,0,.05) 70px)`,
                }}
              />
            </div>

            <div className="relative px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Gallery Icon */}
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Grid3x3 className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-label">
                      Stimuli Gallery
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                            style={{
                              width: `${(stimuli.length / totalCells) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-secondary-label font-medium">
                          {stimuli.length}/{totalCells}
                        </span>
                      </div>

                      {/* Type Indicator */}
                      {lockedType && (
                        <>
                          <div className="w-px h-4 bg-separator" />
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-secondary-label">
                              {lockedType.charAt(0).toUpperCase() +
                                lockedType.slice(1)}{' '}
                              mode
                            </span>
                          </div>
                        </>
                      )}

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

                {/* Apple-style Segmented Control for View Options */}
                <div className="flex items-center gap-3">
                  {selectedStimuli.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeSelectedStimuli}
                      className="text-xs"
                    >
                      Remove ({selectedStimuli.size})
                    </Button>
                  )}

                  {/* Apple-style Segmented Control */}
                  <div className="inline-flex items-center bg-quaternary-fill rounded-lg p-0.5">
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

                  {/* Column Selector - Apple Style */}
                  {galleryView === 'grid' && (
                    <select
                      value={galleryColumns}
                      onChange={e => setGalleryColumns(Number(e.target.value))}
                      className="text-xs px-2 py-1.5 rounded-lg bg-quaternary-fill border-0 
                               text-label focus:ring-2 focus:ring-system-blue focus:outline-none"
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

          {/* Optimized Gallery Container */}
          <div className="relative">
            {/* Gallery Background */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/50 to-gray-100/50 
                          dark:from-transparent dark:via-gray-900/50 dark:to-gray-950/50 pointer-events-none"
            />

            {/* Gallery Content */}
            <div className="relative p-6">
              {/* Quick Actions Bar */}
              {selectedStimuli.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {selectedStimuli.size} item
                      {selectedStimuli.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStimuli(new Set())}
                        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Deselect All
                      </button>
                      <button
                        onClick={() => {
                          const allIds = new Set(stimuli.map((s: any) => s.id));
                          setSelectedStimuli(allIds);
                        }}
                        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimized Gallery Grid */}
              <div
                ref={galleryRef}
                className={cn(
                  'relative rounded-xl',
                  galleryView === 'grid' ? `grid gap-2` : '',
                  galleryView === 'compact'
                    ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'
                    : '',
                  galleryView === 'list' ? 'space-y-1' : '',
                  'max-h-[600px] overflow-y-auto',
                  'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
                  'scroll-smooth'
                )}
                style={{
                  gridTemplateColumns:
                    galleryView === 'grid'
                      ? `repeat(${galleryColumns}, minmax(0, 1fr))`
                      : undefined,
                }}
              >
                <AnimatePresence>
                  {stimuli.map((stimulus, index) => (
                    <motion.div
                      key={stimulus.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                        delay: index * 0.02, // Staggered animation
                      }}
                      className={cn(
                        'relative group overflow-hidden',
                        'bg-white dark:bg-gray-800/80 backdrop-blur-sm',
                        'border border-gray-200 dark:border-gray-700',
                        'rounded-xl transition-all duration-200',
                        'hover:shadow-xl hover:scale-[1.03] hover:z-10',
                        'hover:border-blue-300 dark:hover:border-blue-600',
                        galleryView === 'grid' ? 'aspect-square' : '',
                        galleryView === 'compact' ? 'aspect-[4/3]' : '',
                        galleryView === 'list' ? 'h-16 flex items-center' : '',
                        selectedStimuli.has(stimulus.id) &&
                          'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 dark:bg-blue-900/20'
                      )}
                      onClick={() => toggleStimulusSelection(stimulus.id)}
                      style={{
                        transformOrigin: 'center',
                        willChange: 'transform',
                      }}
                    >
                      {/* Content Container */}
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
                                alt={`Stimulus ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                            {stimulus.type === 'video' && (
                              <div
                                className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 
                                          flex flex-col items-center justify-center"
                              >
                                <Video className="w-12 h-12 text-white mb-2" />
                                <span className="text-xs text-white/70">
                                  Video
                                </span>
                              </div>
                            )}
                            {stimulus.type === 'audio' && (
                              <div
                                className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 
                                          flex flex-col items-center justify-center"
                              >
                                <Music className="w-12 h-12 text-white mb-2" />
                                <span className="text-xs text-white/70">
                                  Audio
                                </span>
                              </div>
                            )}
                            {stimulus.type === 'text' && (
                              <div
                                className="w-full h-full bg-secondary-fill p-4 
                                          flex items-center justify-center"
                              >
                                <p className="text-xs text-label line-clamp-4 text-center font-medium">
                                  {stimulus.editedText || stimulus.content}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* List View Content */}
                        {galleryView === 'list' && (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-quaternary-fill flex items-center justify-center mr-3">
                              {getStimulusIcon(stimulus.type, 'sm')}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-label">
                                {stimulus.title || `Stimulus ${index + 1}`}
                              </p>
                              <p className="text-xs text-secondary-label">
                                {stimulus.type.charAt(0).toUpperCase() +
                                  stimulus.type.slice(1)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Apple-style Action Overlay */}
                      {galleryView !== 'list' && (
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
                                aria-label="Edit text"
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

                      {/* Selection Indicator - Apple Style */}
                      {selectedStimuli.has(stimulus.id) && (
                        <div className="absolute top-2 right-2">
                          <div
                            className="w-6 h-6 bg-system-blue rounded-full flex items-center justify-center
                                      shadow-sm animate-scale-in"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Index Badge - Apple Style */}
                      <div className="absolute top-2 left-2">
                        <div
                          className="px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full
                                    text-white text-[10px] font-semibold"
                        >
                          {index + 1}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Gallery Footer with Stats */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-secondary-label">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-purple-600" />
                      <span>Total: {stimuli.length}</span>
                    </div>
                    {lockedType === 'image' && (
                      <div className="flex items-center gap-1.5">
                        <Image className="w-3 h-3" />
                        <span>Images</span>
                      </div>
                    )}
                    {lockedType === 'video' && (
                      <div className="flex items-center gap-1.5">
                        <Video className="w-3 h-3" />
                        <span>Videos</span>
                      </div>
                    )}
                    {lockedType === 'audio' && (
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3 h-3" />
                        <span>Audio</span>
                      </div>
                    )}
                    {lockedType === 'text' && (
                      <div className="flex items-center gap-1.5">
                        <Type className="w-3 h-3" />
                        <span>Text</span>
                      </div>
                    )}
                  </div>

                  {stimuli.length === totalCells && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Collection Complete
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
