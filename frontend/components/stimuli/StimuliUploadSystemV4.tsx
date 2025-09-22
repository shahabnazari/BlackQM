'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '@/lib/stores/upload-store';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { ProgressBar } from '@/components/apple-ui/ProgressBar';
import {
  Upload,
  File,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  Loader2,
  Info,
  Grid3X3,
  Type,
  Film,
  Mic,
  FileImage,
  Sparkles,
  LayoutGrid,
  Square,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Q-methodology best practices for text stimuli
const Q_METHOD_TEXT_LIMITS = {
  minWords: 50,
  maxWords: 150,
  recommendedWords: 100,
  maxCharacters: 750,
};

interface Stimulus {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  content: string;
  thumbnail?: string;
  metadata?: {
    duration?: number;
    wordCount?: number;
    dimensions?: { width: number; height: number };
    fileSize?: number;
    mimeType?: string;
    fileName?: string;
  };
  position?: number;
  uploadStatus: 'pending' | 'processing' | 'complete' | 'failed';
  uploadProgress?: number;
  isEditable?: boolean;
  selected?: boolean;
}

interface GridConfiguration {
  columns: Array<{
    value: number;
    label: string;
    cells: number;
  }>;
  totalCells: number;
}

interface StimuliUploadSystemV4Props {
  studyId?: string;
  grid: GridConfiguration;
  onStimuliComplete?: (stimuli: Stimulus[]) => void;
  initialStimuli?: Stimulus[];
}

export const StimuliUploadSystemV4: React.FC<StimuliUploadSystemV4Props> = ({
  studyId,
  grid,
  onStimuliComplete,
  initialStimuli = [],
}) => {
  const [stimuli, setStimuli] = useState<Stimulus[]>(initialStimuli);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingStimulus, setEditingStimulus] = useState<Stimulus | null>(null);
  const [textContent, setTextContent] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(
    new Map()
  );
  const [galleryView, setGalleryView] = useState<'grid' | 'compact' | 'list'>(
    'grid'
  );
  const [selectedStimuli, setSelectedStimuli] = useState<Set<string>>(
    new Set()
  );
  const [showGridPreview, setShowGridPreview] = useState(true);
  const [previewStimulus, setPreviewStimulus] = useState<Stimulus | null>(null);
  const [galleryColumns, setGalleryColumns] = useState(4);
  const completionNotified = useRef(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const { showSuccess, showError, showWarning, clearMessages } =
    useUploadStore();

  const totalCells = grid.totalCells;
  const progress = (stimuli.length / totalCells) * 100;
  const remainingSlots = totalCells - stimuli.length;
  const isComplete = stimuli.length === totalCells;

  useEffect(() => {
    if (onStimuliComplete && isComplete && !completionNotified.current) {
      completionNotified.current = true;
      onStimuliComplete(stimuli);
      showSuccess('Perfect! All stimuli uploaded successfully.');
    }

    if (!isComplete && completionNotified.current) {
      completionNotified.current = false;
    }
  }, [stimuli, isComplete, onStimuliComplete, showSuccess, totalCells]);

  useEffect(() => {
    return () => {
      clearMessages();
      completionNotified.current = false;
    };
  }, [studyId, clearMessages]);

  const getFileType = (file: File): Stimulus['type'] => {
    const mimeType = file.type.toLowerCase();
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  };

  const uploadFile = async (file: File): Promise<Stimulus> => {
    const tempId = Math.random().toString(36).substr(2, 9);

    const tempStimulus: Stimulus = {
      id: tempId,
      type: getFileType(file),
      content: URL.createObjectURL(file),
      thumbnail: URL.createObjectURL(file),
      metadata: {
        fileSize: file.size,
        mimeType: file.type,
        fileName: file.name,
      },
      uploadStatus: 'processing',
      uploadProgress: 0,
      isEditable: false,
    };

    setStimuli(prev => [...prev, tempStimulus]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', getFileType(file));

    try {
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(tempId) || 0;
          if (current < 90) {
            newMap.set(tempId, current + 10);
          }
          return newMap;
        });
      }, 200);

      const response = await fetch(`/api/studies/${studyId}/stimuli`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      setStimuli(prev =>
        prev.map((s: any) =>
          s.id === tempId
            ? {
                ...data.data,
                uploadStatus: 'complete',
                uploadProgress: 100,
                isEditable: false,
              }
            : s
        )
      );

      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });

      return data.data;
    } catch (error: any) {
      console.error('Upload error:', error);

      setStimuli(prev =>
        prev.map((s: any) => (s.id === tempId ? { ...s, uploadStatus: 'failed' } : s))
      );

      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (remainingSlots <= 0) {
        showError(`Grid is full. Remove existing stimuli to add new ones.`);
        return;
      }

      if (acceptedFiles.length > remainingSlots) {
        showWarning(
          `Only ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} available. Uploading first ${remainingSlots} file${remainingSlots === 1 ? '' : 's'}.`
        );
        acceptedFiles = acceptedFiles.slice(0, remainingSlots);
      }

      for (const file of acceptedFiles) {
        try {
          await uploadFile(file);
        } catch (error: any) {
          showError(`Failed to upload ${file.name}`);
        }
      }
    },
    [remainingSlots, showError, showWarning, studyId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'application/pdf': ['.pdf'],
    },
    disabled: isComplete,
  });

  const saveTextStimulus = () => {
    const wordCount = textContent
      .trim()
      .split(/\s+/)
      .filter((w: any) => w.length > 0).length;

    if (wordCount < Q_METHOD_TEXT_LIMITS.minWords) {
      showError(
        `Text must be at least ${Q_METHOD_TEXT_LIMITS.minWords} words (currently ${wordCount})`
      );
      return;
    }

    if (editingStimulus) {
      setStimuli(prev =>
        prev.map((s: any) =>
          s.id === editingStimulus.id
            ? {
                ...s,
                content: textContent.trim(),
                metadata: { ...s.metadata, wordCount },
              }
            : s
        )
      );
      showSuccess('Text stimulus updated');
    } else {
      const newStimulus: Stimulus = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'TEXT',
        content: textContent.trim(),
        metadata: { wordCount },
        uploadStatus: 'complete',
        isEditable: true,
      };
      setStimuli(prev => [...prev, newStimulus]);
      showSuccess('Text stimulus added');
    }

    setShowTextEditor(false);
    setEditingStimulus(null);
    setTextContent('');
  };

  const removeStimulus = (id: string) => {
    setStimuli(prev => prev.filter((s: any) => s.id !== id));
    setSelectedStimuli(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    showSuccess('Stimulus removed');
  };

  const removeSelectedStimuli = () => {
    setStimuli(prev => prev.filter((s: any) => !selectedStimuli.has(s.id)));
    setSelectedStimuli(new Set());
    showSuccess(`${selectedStimuli.size} stimuli removed`);
  };

  const editTextStimulus = (stimulus: Stimulus) => {
    if (stimulus.type !== 'TEXT') return;
    setEditingStimulus(stimulus);
    setTextContent(stimulus.content);
    setShowTextEditor(true);
  };

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

  const getGlobalCellIndex = (colIndex: number, cellIndex: number): number => {
    let index = 0;
    for (let i = 0; i < colIndex; i++) {
      index += grid.columns[i]?.cells || 0;
    }
    return index + cellIndex;
  };

  const getStimulusIcon = (
    type: Stimulus['type'],
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const sizeClass =
      size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6';
    switch (type) {
      case 'IMAGE':
        return <FileImage className={sizeClass} />;
      case 'VIDEO':
        return <Film className={sizeClass} />;
      case 'AUDIO':
        return <Mic className={sizeClass} />;
      case 'TEXT':
        return <Type className={sizeClass} />;
      default:
        return <File className={sizeClass} />;
    }
  };

  const getWordCountColor = (count: number) => {
    if (count < Q_METHOD_TEXT_LIMITS.minWords) return 'text-red-600';
    if (count > Q_METHOD_TEXT_LIMITS.maxWords) return 'text-orange-600';
    if (
      count >= Q_METHOD_TEXT_LIMITS.recommendedWords - 10 &&
      count <= Q_METHOD_TEXT_LIMITS.recommendedWords + 10
    )
      return 'text-green-600';
    return 'text-blue-600';
  };

  // Instagram-style gallery item renderer
  const renderGalleryItem = (stimulus: Stimulus, index: number) => {
    const isSelected = selectedStimuli.has(stimulus.id);
    const isProcessing = stimulus.uploadStatus === 'processing';

    return (
      <motion.div
        key={stimulus.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        layout
        className={`
          relative group cursor-pointer overflow-hidden rounded-lg
          ${galleryView === 'grid' ? 'aspect-square' : ''}
          ${galleryView === 'compact' ? 'aspect-[4/3]' : ''}
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        `}
        onClick={() => toggleStimulusSelection(stimulus.id)}
        onDoubleClick={() => setPreviewStimulus(stimulus)}
      >
        {/* Background/Preview */}
        <div
          className={`
          w-full h-full bg-gray-100 
          ${galleryView === 'list' ? 'h-20' : ''}
        `}
        >
          {stimulus.type === 'IMAGE' && stimulus.thumbnail && (
            <img
              src={stimulus.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {stimulus.type === 'VIDEO' && (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <Film className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
          {stimulus.type === 'AUDIO' && (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mic className="w-12 h-12 text-white" />
            </div>
          )}
          {stimulus.type === 'TEXT' && (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 p-4 flex items-center justify-center">
              <p className="text-xs text-gray-700 line-clamp-3 text-center">
                {stimulus.content}
              </p>
            </div>
          )}
          {stimulus.type === 'DOCUMENT' && (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <File className="w-12 h-12 text-gray-600" />
            </div>
          )}
        </div>

        {/* Overlay on hover */}
        <div
          className={`
          absolute inset-0 bg-black/0 group-hover:bg-black/40 
          transition-all duration-200 flex items-center justify-center
          ${galleryView === 'list' ? 'hidden' : ''}
        `}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            {stimulus.type === 'TEXT' && stimulus.isEditable && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  editTextStimulus(stimulus);
                }}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-gray-700" />
              </button>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                setPreviewStimulus(stimulus);
              }}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                removeStimulus(stimulus.id);
              }}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Upload progress */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
            <span className="text-white text-sm">
              {uploadingFiles.get(stimulus.id) || 0}%
            </span>
          </div>
        )}

        {/* Index badge */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-white text-xs font-medium">{index + 1}</span>
        </div>

        {/* Type indicator for list view */}
        {galleryView === 'list' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {getStimulusIcon(stimulus.type, 'md')}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="stimuli-upload-system-v4 w-full max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="mb-4 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Stimuli
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {stimuli.length}
              </span>
              <span className="text-sm text-gray-500">of {totalCells}</span>
              {isComplete && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>

          {/* Compact Progress Bar */}
          <div className="flex-1 max-w-xs mx-4">
            <ProgressBar
              value={progress}
              max={100}
              variant={isComplete ? 'success' : 'default'}
              className="h-2"
            />
          </div>

          {/* Status Badges */}
          <div className="flex gap-2">
            {remainingSlots > 0 && (
              <Badge variant="warning" size="sm">
                {remainingSlots} needed
              </Badge>
            )}
            {isComplete && (
              <Badge variant="success" size="sm">
                Complete
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Upload Section (Now at the top) */}
      {!isComplete && (
        <Card className="mb-4">
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Drag & Drop Area */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                  transition-all duration-200 group
                  ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isDragActive
                    ? 'Drop files here'
                    : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-gray-500">
                  Images, Videos, Audio, PDF supported
                </p>
              </div>

              {/* Text Stimulus Button */}
              <button
                onClick={() => setShowTextEditor(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 hover:bg-gray-50 transition-all duration-200 group"
              >
                <Type className="w-10 h-10 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Create Text Stimulus
                </p>
                <p className="text-xs text-gray-500">
                  50-150 words recommended
                </p>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Collapsible Grid Preview */}
      <Card className="mb-4">
        <button
          onClick={() => setShowGridPreview(!showGridPreview)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">
              Grid Configuration
            </span>
            <Badge variant="secondary" size="sm">
              {grid.columns.length} columns × {totalCells} cells
            </Badge>
          </div>
          {showGridPreview ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        <AnimatePresence>
          {showGridPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <div className="w-full overflow-x-auto">
                  <div className="flex justify-center gap-3 min-w-fit p-4 bg-gray-50 rounded-lg">
                    {grid.columns.map((column, colIndex) => (
                      <div
                        key={colIndex}
                        className="flex flex-col items-center"
                      >
                        <div className="text-center mb-2 h-12 flex flex-col justify-end">
                          <div className="text-sm font-bold text-gray-800">
                            {column.value > 0 ? '+' : ''}
                            {column.value}
                          </div>
                          {column.label && (
                            <div className="text-xs text-gray-500 line-clamp-1 max-w-[60px]">
                              {column.label}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col-reverse gap-1">
                          {Array.from({ length: column.cells }).map(
                            (_, cellIndex) => {
                              const globalIndex = getGlobalCellIndex(
                                colIndex,
                                cellIndex
                              );
                              const stimulus = stimuli[globalIndex];

                              return (
                                <div
                                  key={cellIndex}
                                  className={`
                                  w-10 h-12 rounded flex items-center justify-center text-xs
                                  transition-all duration-200
                                  ${
                                    stimulus
                                      ? 'bg-green-500 text-white'
                                      : 'bg-white border border-gray-300'
                                  }
                                `}
                                >
                                  {stimulus
                                    ? getStimulusIcon(stimulus.type, 'sm')
                                    : globalIndex + 1}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Instagram-Style Gallery */}
      {stimuli.length > 0 && (
        <Card>
          <div className="p-4">
            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-gray-900">
                  Gallery ({stimuli.length})
                </h3>
                {selectedStimuli.size > 0 && (
                  <Badge variant="default">
                    {selectedStimuli.size} selected
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedStimuli.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeSelectedStimuli}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove Selected
                  </Button>
                )}

                {/* View Options */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setGalleryView('grid')}
                    className={`p-1.5 rounded ${galleryView === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGalleryView('compact')}
                    className={`p-1.5 rounded ${galleryView === 'compact' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGalleryView('list')}
                    className={`p-1.5 rounded ${galleryView === 'list' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Control for Grid View */}
                {galleryView === 'grid' && (
                  <select
                    value={galleryColumns}
                    onChange={e => setGalleryColumns(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                  >
                    <option value={3}>3 columns</option>
                    <option value={4}>4 columns</option>
                    <option value={5}>5 columns</option>
                    <option value={6}>6 columns</option>
                  </select>
                )}
              </div>
            </div>

            {/* Gallery Grid */}
            <div
              ref={galleryRef}
              className={`
                ${galleryView === 'grid' ? `grid grid-cols-${galleryColumns} gap-2` : ''}
                ${galleryView === 'compact' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2' : ''}
                ${galleryView === 'list' ? 'space-y-2' : ''}
                max-h-[600px] overflow-y-auto custom-scrollbar
              `}
              style={{
                gridTemplateColumns:
                  galleryView === 'grid'
                    ? `repeat(${galleryColumns}, 1fr)`
                    : undefined,
              }}
            >
              <AnimatePresence>
                {stimuli.map((stimulus, index) =>
                  renderGalleryItem(stimulus, index)
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      )}

      {/* Text Editor Modal */}
      <AnimatePresence>
        {showTextEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowTextEditor(false);
              setEditingStimulus(null);
              setTextContent('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <Card className="max-w-2xl w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingStimulus ? 'Edit' : 'Create'} Text Stimulus
                    </h3>
                    <button
                      onClick={() => {
                        setShowTextEditor(false);
                        setEditingStimulus(null);
                        setTextContent('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="flex-1 text-xs text-blue-700">
                        <p className="font-medium mb-1">Q-Method Guidelines:</p>
                        <p>
                          • {Q_METHOD_TEXT_LIMITS.minWords}-
                          {Q_METHOD_TEXT_LIMITS.maxWords} words (optimal: ~
                          {Q_METHOD_TEXT_LIMITS.recommendedWords})
                        </p>
                        <p>• Keep statements clear and focused</p>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={textContent}
                    onChange={e => {
                      if (
                        e.target.value.length <=
                        Q_METHOD_TEXT_LIMITS.maxCharacters
                      ) {
                        setTextContent(e.target.value);
                      }
                    }}
                    placeholder="Enter your text stimulus here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                             resize-none text-sm"
                    rows={5}
                  />

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span
                        className={getWordCountColor(
                          textContent.split(/\s+/).filter((w: any) => w.length > 0)
                            .length
                        )}
                      >
                        {
                          textContent.split(/\s+/).filter((w: any) => w.length > 0)
                            .length
                        }{' '}
                        words
                      </span>
                      <span className="text-gray-500">
                        {textContent.length}/
                        {Q_METHOD_TEXT_LIMITS.maxCharacters} chars
                      </span>
                    </div>
                    {textContent.split(/\s+/).filter((w: any) => w.length > 0)
                      .length >=
                      Q_METHOD_TEXT_LIMITS.recommendedWords - 10 &&
                      textContent.split(/\s+/).filter((w: any) => w.length > 0)
                        .length <=
                        Q_METHOD_TEXT_LIMITS.recommendedWords + 10 && (
                        <Badge variant="success" size="sm">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Optimal
                        </Badge>
                      )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="primary"
                      onClick={saveTextStimulus}
                      disabled={
                        textContent.split(/\s+/).filter((w: any) => w.length > 0)
                          .length < Q_METHOD_TEXT_LIMITS.minWords
                      }
                      className="flex-1"
                    >
                      {editingStimulus ? 'Update' : 'Add'} Stimulus
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowTextEditor(false);
                        setEditingStimulus(null);
                        setTextContent('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewStimulus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewStimulus(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStimulusIcon(previewStimulus.type)}
                  <span className="font-medium">Stimulus Preview</span>
                  {previewStimulus.metadata?.fileName && (
                    <span className="text-sm text-gray-500">
                      {previewStimulus.metadata.fileName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setPreviewStimulus(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {previewStimulus.type === 'IMAGE' && (
                  <img
                    src={previewStimulus.content}
                    alt=""
                    className="max-w-full max-h-[70vh] mx-auto"
                  />
                )}
                {previewStimulus.type === 'TEXT' && (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">
                      {previewStimulus.content}
                    </p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Word count: {previewStimulus.metadata?.wordCount || 0}
                      </p>
                    </div>
                  </div>
                )}
                {previewStimulus.type === 'VIDEO' && (
                  <video controls className="max-w-full max-h-[70vh] mx-auto">
                    <source src={previewStimulus.content} />
                  </video>
                )}
                {previewStimulus.type === 'AUDIO' && (
                  <audio controls className="w-full">
                    <source src={previewStimulus.content} />
                  </audio>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};
