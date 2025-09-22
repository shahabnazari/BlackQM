'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '@/lib/stores/upload-store';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { ProgressBar } from '@/components/apple-ui/ProgressBar';
import {
  Upload,
  FileText,
  File,
  X,
  Edit3,
  Trash2,
  CheckCircle,
  Loader2,
  Info,
  Grid3X3,
  Type,
  Film,
  Mic,
  FileImage,
  Sparkles,
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
  isEditable?: boolean; // Only true for text stimuli
}

interface GridConfiguration {
  columns: Array<{
    value: number;
    label: string;
    cells: number;
  }>;
  totalCells: number;
}

interface StimuliUploadSystemV3Props {
  studyId?: string;
  grid: GridConfiguration;
  onStimuliComplete?: (stimuli: Stimulus[]) => void;
  initialStimuli?: Stimulus[];
}

export const StimuliUploadSystemV3: React.FC<StimuliUploadSystemV3Props> = ({
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
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');
  const completionNotified = useRef(false);

  const { showSuccess, showError, showWarning, clearMessages } =
    useUploadStore();

  const totalCells = grid.totalCells;
  const progress = (stimuli.length / totalCells) * 100;
  const remainingSlots = totalCells - stimuli.length;

  useEffect(() => {
    if (
      onStimuliComplete &&
      stimuli.length === totalCells &&
      !completionNotified.current
    ) {
      completionNotified.current = true;
      onStimuliComplete(stimuli);
      showSuccess('Perfect! All stimuli uploaded successfully.');
    }

    if (stimuli.length < totalCells && completionNotified.current) {
      completionNotified.current = false;
    }
  }, [stimuli, totalCells, onStimuliComplete, showSuccess]);

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
      // Update existing text stimulus
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
      // Create new text stimulus
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
    showSuccess('Stimulus removed');
  };

  const editTextStimulus = (stimulus: Stimulus) => {
    if (stimulus.type !== 'TEXT') return;
    setEditingStimulus(stimulus);
    setTextContent(stimulus.content);
    setShowTextEditor(true);
  };

  const getGlobalCellIndex = (colIndex: number, cellIndex: number): number => {
    let index = 0;
    for (let i = 0; i < colIndex; i++) {
      const column = grid.columns[i];
      if (column) {
        index += column.cells;
      }
    }
    return index + cellIndex;
  };

  const getStimulusIcon = (type: Stimulus['type']) => {
    switch (type) {
      case 'IMAGE':
        return <FileImage className="w-4 h-4" />;
      case 'VIDEO':
        return <Film className="w-4 h-4" />;
      case 'AUDIO':
        return <Mic className="w-4 h-4" />;
      case 'TEXT':
        return <Type className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
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

  return (
    <div className="stimuli-upload-system-v3 w-full">
      {/* Header Section */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-label mb-1">
                Upload Stimuli
              </h2>
              <p className="text-secondary-label text-sm">
                Each stimulus will be assigned to one cell in your Q-sort grid
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-label">
                {stimuli.length}/{totalCells}
              </div>
              <div className="text-xs text-tertiary-label">
                {remainingSlots > 0
                  ? `${remainingSlots} remaining`
                  : 'Complete'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            value={progress}
            max={100}
            variant={progress === 100 ? 'success' : 'default'}
            className="mb-4"
          />

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{grid.columns.length} columns</Badge>
            <Badge
              variant={stimuli.length === totalCells ? 'success' : 'secondary'}
            >
              {stimuli.length} uploaded
            </Badge>
            {remainingSlots > 0 && (
              <Badge variant="warning">{remainingSlots} needed</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Grid Preview - Full Width */}
      <Card className="mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-label flex items-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              Grid Configuration Preview
            </h3>
            <Badge variant="secondary">Fill each cell with a stimulus</Badge>
          </div>

          {/* Full Width Grid Preview with Consistent Spacing */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-max mx-auto">
              <div className="flex justify-center gap-4 p-6 bg-secondary-fill rounded-xl">
                {grid.columns.map((column, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex flex-col items-center min-w-[80px]"
                  >
                    {/* Column Header - Fixed Height */}
                    <div className="mb-3 text-center h-16 flex flex-col justify-end">
                      <div className="text-lg font-bold text-label">
                        {column.value > 0 ? '+' : ''}
                        {column.value}
                      </div>
                      {column.label && (
                        <div className="text-xs text-secondary-label mt-1 max-w-[100px] line-clamp-2">
                          {column.label}
                        </div>
                      )}
                    </div>

                    {/* Column Cells - Uniform Size */}
                    <div className="flex flex-col-reverse gap-2">
                      {Array.from({ length: column.cells }).map(
                        (_, cellIndex) => {
                          const globalIndex = getGlobalCellIndex(
                            colIndex,
                            cellIndex
                          );
                          const stimulus = stimuli[globalIndex];

                          return (
                            <motion.div
                              key={cellIndex}
                              className={`
                              w-16 h-20 rounded-lg flex items-center justify-center
                              transition-all duration-200 shadow-sm
                              ${
                                stimulus
                                  ? 'bg-green-500 text-white border-2 border-green-600'
                                  : 'bg-white border-2 border-dashed border-separator'
                              }
                            `}
                              whileHover={{ scale: 1.05 }}
                              animate={{
                                backgroundColor: stimulus
                                  ? '#10b981'
                                  : '#ffffff',
                                borderColor: stimulus ? '#059669' : '#e5e7eb',
                              }}
                            >
                              {stimulus ? (
                                <div className="flex flex-col items-center gap-1">
                                  {getStimulusIcon(stimulus.type)}
                                  <span className="text-xs font-medium">
                                    {globalIndex + 1}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-tertiary-label">
                                  {globalIndex + 1}
                                </span>
                              )}
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Area */}
      {remainingSlots > 0 && (
        <Card className="mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-200
                  ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-separator bg-secondary-fill hover:border-blue-400 hover:bg-blue-50/50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-secondary-label mx-auto mb-3" />
                <p className="text-label font-medium mb-1">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files'}
                </p>
                <p className="text-sm text-secondary-label mb-3">
                  or click to browse
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Images', 'Videos', 'Audio', 'PDF'].map((format: any) => (
                    <Badge key={format} variant="secondary" size="sm">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Text Stimulus */}
              <button
                onClick={() => setShowTextEditor(true)}
                className={`
                  border-2 border-dashed rounded-xl p-8
                  transition-all duration-200 cursor-pointer
                  border-separator bg-secondary-fill hover:border-blue-400 hover:bg-blue-50/50
                  flex flex-col items-center justify-center
                `}
              >
                <Type className="w-12 h-12 text-secondary-label mb-3" />
                <p className="text-label font-medium mb-1">
                  Create Text Stimulus
                </p>
                <p className="text-sm text-secondary-label mb-3">
                  Write custom text content
                </p>
                <Badge variant="info" size="sm">
                  {Q_METHOD_TEXT_LIMITS.minWords}-
                  {Q_METHOD_TEXT_LIMITS.maxWords} words
                </Badge>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Stimuli Gallery */}
      {stimuli.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-label">
                Uploaded Stimuli ({stimuli.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={selectedView === 'grid' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedView('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedView === 'list' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedView('list')}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div
              className={
                selectedView === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
                  : 'space-y-2'
              }
            >
              <AnimatePresence>
                {stimuli.map((stimulus, index) => (
                  <motion.div
                    key={stimulus.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                  >
                    {selectedView === 'grid' ? (
                      <Card className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative">
                          {/* Item Number */}
                          <div className="absolute top-2 left-2 z-10">
                            <Badge variant="default" size="sm">
                              {index + 1}
                            </Badge>
                          </div>

                          {/* Upload Progress */}
                          {stimulus.uploadStatus === 'processing' && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                              <div className="text-white">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <div className="text-sm mt-1">
                                  {uploadingFiles.get(stimulus.id) || 0}%
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Preview */}
                          <div className="h-32 bg-secondary-fill flex items-center justify-center">
                            {stimulus.type === 'IMAGE' &&
                              stimulus.thumbnail && (
                                <img
                                  src={stimulus.thumbnail}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            {stimulus.type === 'VIDEO' && (
                              <Film className="w-12 h-12 text-secondary-label" />
                            )}
                            {stimulus.type === 'AUDIO' && (
                              <Mic className="w-12 h-12 text-secondary-label" />
                            )}
                            {stimulus.type === 'TEXT' && (
                              <div className="p-3 text-xs text-secondary-label line-clamp-4">
                                {stimulus.content}
                              </div>
                            )}
                            {stimulus.type === 'DOCUMENT' && (
                              <File className="w-12 h-12 text-secondary-label" />
                            )}
                          </div>

                          {/* Actions - Only show Edit for TEXT */}
                          <div className="p-2 flex gap-1">
                            {stimulus.type === 'TEXT' &&
                              stimulus.isEditable && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => editTextStimulus(stimulus)}
                                  className="flex-1"
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeStimulus(stimulus.id)}
                              className={
                                stimulus.type === 'TEXT' ? '' : 'flex-1'
                              }
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="default" size="sm">
                            {index + 1}
                          </Badge>
                          <div className="flex-1 flex items-center gap-3">
                            {getStimulusIcon(stimulus.type)}
                            <span className="text-sm text-label truncate">
                              {stimulus.type === 'TEXT'
                                ? stimulus.content.substring(0, 50) + '...'
                                : stimulus.metadata?.fileName || 'File'}
                            </span>
                            {stimulus.metadata?.wordCount && (
                              <Badge variant="secondary" size="sm">
                                {stimulus.metadata.wordCount} words
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {stimulus.type === 'TEXT' &&
                              stimulus.isEditable && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => editTextStimulus(stimulus)}
                                >
                                  Edit
                                </Button>
                              )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeStimulus(stimulus.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                ))}
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
                    <h3 className="text-xl font-semibold text-label">
                      {editingStimulus ? 'Edit' : 'Create'} Text Stimulus
                    </h3>
                    <button
                      onClick={() => {
                        setShowTextEditor(false);
                        setEditingStimulus(null);
                        setTextContent('');
                      }}
                      className="text-secondary-label hover:text-label transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Q-Method Guidelines */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Q-Methodology Text Guidelines
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>
                            • Minimum: {Q_METHOD_TEXT_LIMITS.minWords} words
                          </li>
                          <li>
                            • Maximum: {Q_METHOD_TEXT_LIMITS.maxWords} words
                          </li>
                          <li>
                            • Recommended: ~
                            {Q_METHOD_TEXT_LIMITS.recommendedWords} words for
                            optimal readability
                          </li>
                          <li>
                            • Keep statements clear, concise, and focused on a
                            single idea
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={textContent}
                    onChange={e => {
                      const text = e.target.value;
                      if (text.length <= Q_METHOD_TEXT_LIMITS.maxCharacters) {
                        setTextContent(text);
                      }
                    }}
                    placeholder="Enter your text stimulus here..."
                    className="w-full px-4 py-3 border border-separator rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                             resize-none text-label bg-fill"
                    rows={6}
                  />

                  {/* Word Count and Character Count */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-sm">
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
                      <span className="text-secondary-label">
                        {textContent.length}/
                        {Q_METHOD_TEXT_LIMITS.maxCharacters} characters
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
                          Optimal length
                        </Badge>
                      )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="primary"
                      onClick={saveTextStimulus}
                      disabled={
                        textContent.split(/\s+/).filter((w: any) => w.length > 0)
                          .length < Q_METHOD_TEXT_LIMITS.minWords
                      }
                      className="flex-1"
                    >
                      {editingStimulus ? 'Update' : 'Add'} Text Stimulus
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

      {/* Completion Message */}
      {stimuli.length === totalCells && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="bg-green-50 border-green-200">
            <div className="p-6 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-1">
                  Perfect! All stimuli uploaded
                </h4>
                <p className="text-sm text-green-700">
                  You've successfully uploaded {totalCells} stimuli matching
                  your grid configuration. Each participant will sort these
                  stimuli into the grid during the study.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
