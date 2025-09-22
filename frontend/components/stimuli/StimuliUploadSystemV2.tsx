'use client';

import { getUploadQueue, resetUploadQueue } from '@/lib/services/upload-queue.service';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle,
    Edit2,
    File,
    FileText,
    Image,
    Loader2,
    Music,
    RefreshCw,
    Upload,
    Video,
    XCircle
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

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
  };
  position?: number;
  uploadStatus: 'pending' | 'processing' | 'complete' | 'failed';
  uploadProgress?: number;
  uploadTaskId?: string;
}

interface GridConfiguration {
  columns: Array<{
    value: number;
    label: string;
    cells: number;
  }>;
  totalCells: number;
}

interface StimuliUploadSystemV2Props {
  studyId?: string;
  grid: GridConfiguration;
  onStimuliComplete?: (stimuli: Stimulus[]) => void;
  initialStimuli?: Stimulus[];
}

interface UploadQueueStatus {
  total: number;
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
  progress: number;
}

export const StimuliUploadSystemV2: React.FC<StimuliUploadSystemV2Props> = ({
  studyId,
  grid,
  onStimuliComplete,
  initialStimuli = []
}) => {
  const [stimuli, setStimuli] = useState<Stimulus[]>(initialStimuli);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [wordLimit] = useState(100);
  const [_selectedStimulus, _setSelectedStimulus] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<UploadQueueStatus>({
    total: 0,
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
    progress: 0
  });
  const [_isPaused, _setIsPaused] = useState(false);
  const completionNotified = useRef(false);
  const uploadQueue = useRef(getUploadQueue({
    maxConcurrent: 3,
    maxRetries: 3,
    retryDelay: 1000,
    chunkSize: 1024 * 1024, // 1MB chunks
    onProgress: (task) => {
      setStimuli(prev => prev.map((s: any) => 
        s.uploadTaskId === task.id 
          ? { ...s, uploadProgress: task.progress }
          : s
      ));
    },
    onComplete: (task) => {
      setStimuli(prev => prev.map((s: any) => 
        s.uploadTaskId === task.id 
          ? { ...s, uploadStatus: 'complete', uploadProgress: 100 }
          : s
      ));
    },
    onError: (task, error) => {
      console.error(`Upload failed for task ${task.id}:`, error);
      setStimuli(prev => prev.map((s: any) => 
        s.uploadTaskId === task.id 
          ? { ...s, uploadStatus: 'failed' }
          : s
      ));
    },
    onQueueUpdate: (_queue) => {
      // Get status from the upload queue service instance
      const queueService = getUploadQueue();
      const status = queueService.getQueueStatus();
      setQueueStatus(status);
    }
  })).current;
  
  const totalCells = grid.totalCells;

  useEffect(() => {
    if (onStimuliComplete && stimuli.length === totalCells && !completionNotified.current) {
      completionNotified.current = true;
      onStimuliComplete(stimuli);
    }
    
    if (stimuli.length < totalCells && completionNotified.current) {
      completionNotified.current = false;
    }
  }, [stimuli, totalCells, onStimuliComplete]);
  
  useEffect(() => {
    return () => {
      resetUploadQueue();
      completionNotified.current = false;
    };
  }, [studyId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate total files won't exceed grid capacity
    if (stimuli.length + acceptedFiles.length > totalCells) {
      const allowedCount = totalCells - stimuli.length;
      acceptedFiles = acceptedFiles.slice(0, allowedCount);
      console.warn(`Only uploading ${allowedCount} files to fit grid capacity`);
    }
    
    // Create temporary stimuli entries
    const newStimuli: Stimulus[] = acceptedFiles.map((file: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      type: getFileType(file),
      content: URL.createObjectURL(file),
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      metadata: {
        fileSize: file.size,
        mimeType: file.type
      },
      uploadStatus: 'pending' as const,
      uploadProgress: 0,
      uploadTaskId: ''
    }));
    
    // Add to state immediately for visual feedback
    setStimuli(prev => [...prev, ...newStimuli]);
    
    // Add files to upload queue
    const taskIds = await uploadQueue.addFiles(acceptedFiles);
    
    // Update stimuli with task IDs
    setStimuli(prev => {
      const updated = [...prev];
      const startIndex = updated.length - newStimuli.length;
      taskIds.forEach((taskId, index) => {
        const item = updated[startIndex + index];
        if (item) {
          item.uploadTaskId = taskId;
          item.uploadStatus = 'processing';
        }
      });
      return updated;
    });
  }, [stimuli.length, totalCells]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 50 * 1024 * 1024, // 50MB per file
    disabled: stimuli.length >= totalCells
  });

  const getFileType = (file: File): Stimulus['type'] => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  };

  const getStimulusIcon = (type: Stimulus['type'], size = 'w-4 h-4') => {
    switch (type) {
      case 'TEXT': return <FileText className={size} />;
      case 'IMAGE': return <Image className={size} />;
      case 'VIDEO': return <Video className={size} />;
      case 'AUDIO': return <Music className={size} />;
      default: return <File className={size} />;
    }
  };

  const saveTextStimulus = async () => {
    if (!textContent.trim()) return;
    
    const wordCount = textContent.split(/\s+/).filter((w: any) => w.length > 0).length;
    
    const newStimulus: Stimulus = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'TEXT',
      content: textContent,
      metadata: { wordCount },
      uploadStatus: 'complete'
    };
    
    if (studyId) {
      const formData = new FormData();
      formData.append('type', 'TEXT');
      formData.append('content', textContent);
      
      try {
        const response = await fetch(`/api/studies/${studyId}/stimuli`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          newStimulus.id = data.data.id;
        }
      } catch (error: any) {
        console.error('Failed to save text stimulus:', error);
      }
    }
    
    setStimuli(prev => [...prev, newStimulus]);
    setTextContent('');
    setShowTextEditor(false);
  };

  const removeStimulus = async (id: string, taskId?: string) => {
    // Cancel upload if in progress
    if (taskId) {
      uploadQueue.cancelUpload(taskId);
    }
    
    if (studyId) {
      try {
        await fetch(`/api/studies/${studyId}/stimuli?stimulusId=${id}`, {
          method: 'DELETE'
        });
      } catch (error: any) {
        console.error('Failed to delete stimulus:', error);
      }
    }
    
    setStimuli(prev => prev.filter((s: any) => s.id !== id));
  };

  const retryFailedUploads = () => {
    uploadQueue.retryFailed();
    setStimuli(prev => prev.map((s: any) => 
      s.uploadStatus === 'failed' 
        ? { ...s, uploadStatus: 'pending', uploadProgress: 0 }
        : s
    ));
  };

  const cancelAllUploads = () => {
    uploadQueue.cancelAll();
    setStimuli(prev => prev.filter((s: any) => s.uploadStatus !== 'processing'));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  return (
    <div className="stimuli-upload-system-v2 max-w-6xl mx-auto p-6">
      {/* Header with Queue Status */}
      <div className="upload-header mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Upload Stimuli</h2>
            <p className="text-gray-600">
              Upload {totalCells} items to fill your Q-sort grid. 
              Supports bulk uploads with automatic queue management.
            </p>
          </div>
          
          {/* Queue Status Badge */}
          {queueStatus.total > 0 && (
            <div className="queue-status bg-white rounded-lg shadow-sm border p-3">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">Queue:</span>
                  <div className="flex gap-2 mt-1">
                    {queueStatus.uploading > 0 && (
                      <span className="text-blue-600">
                        {queueStatus.uploading} uploading
                      </span>
                    )}
                    {queueStatus.pending > 0 && (
                      <span className="text-yellow-600">
                        {queueStatus.pending} pending
                      </span>
                    )}
                    {queueStatus.failed > 0 && (
                      <span className="text-red-600">
                        {queueStatus.failed} failed
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Queue Actions */}
                <div className="flex gap-2">
                  {queueStatus.failed > 0 && (
                    <button
                      onClick={retryFailedUploads}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Retry failed uploads"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {(queueStatus.uploading > 0 || queueStatus.pending > 0) && (
                    <button
                      onClick={cancelAllUploads}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel all uploads"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Grid Preview with Live Updates */}
      <div className="grid-preview-section mb-8">
        <div className="grid-preview flex gap-2 justify-center p-6 bg-gray-50 rounded-xl">
          {grid.columns.map((column, colIndex) => (
            <div key={colIndex} className="preview-column flex flex-col items-center">
              <div className="column-header text-sm font-medium mb-2">
                {column.value > 0 ? '+' : ''}{column.value}
              </div>
              <div className="column-cells flex flex-col-reverse gap-1">
                {Array.from({ length: column.cells }).map((_, cellIndex) => {
                  const globalIndex = getGlobalCellIndex(colIndex, cellIndex);
                  const stimulus = stimuli[globalIndex];
                  
                  return (
                    <motion.div
                      key={cellIndex}
                      className={`preview-cell w-12 h-16 border-2 rounded-lg flex items-center justify-center transition-all duration-300 relative ${
                        stimulus 
                          ? stimulus.uploadStatus === 'complete'
                            ? 'bg-green-100 border-green-500' 
                            : stimulus.uploadStatus === 'processing'
                            ? 'bg-blue-100 border-blue-500'
                            : stimulus.uploadStatus === 'failed'
                            ? 'bg-red-100 border-red-500'
                            : 'bg-yellow-100 border-yellow-500'
                          : 'bg-gray-100 border-gray-300 border-dashed'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {stimulus && (
                        <>
                          {stimulus.uploadStatus === 'processing' && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                          {stimulus.uploadStatus === 'complete' && (
                            <div className="text-green-600">
                              {getStimulusIcon(stimulus.type)}
                            </div>
                          )}
                          {stimulus.uploadStatus === 'failed' && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          {stimulus.uploadStatus === 'pending' && (
                            <div className="text-yellow-600">
                              {getStimulusIcon(stimulus.type)}
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Bar */}
        <div className="progress-section mt-6">
          <div className="progress-header flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">
              {stimuli.filter((s: any) => s.uploadStatus === 'complete').length} / {totalCells} completed
            </span>
          </div>
          <div className="progress-bar-container w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="progress-bar h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(stimuli.filter((s: any) => s.uploadStatus === 'complete').length / totalCells) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Upload Queue Progress */}
          {queueStatus.total > 0 && (
            <div className="queue-progress mt-2">
              <div className="text-xs text-gray-500 mb-1">
                Upload Queue: {Math.round(queueStatus.progress)}% complete
              </div>
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  animate={{ width: `${queueStatus.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
          
          {stimuli.filter((s: any) => s.uploadStatus === 'complete').length === totalCells && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 text-sm mt-2 flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              All stimuli uploaded successfully! Ready to proceed.
            </motion.p>
          )}
        </div>
      </div>
      
      {/* Upload Area */}
      <div className="upload-area">
        <div
          {...getRootProps()}
          className={`dropzone border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            stimuli.length >= totalCells
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              : isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {stimuli.length >= totalCells ? (
              <p className="text-lg font-medium text-gray-500 mb-2">
                Grid is full - Remove items to upload more
              </p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop multiple files'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse (max 50MB per file)
                </p>
                <div className="bulk-upload-badge inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                  <CheckCircle className="w-4 h-4" />
                  Bulk upload supported - Drop all files at once!
                </div>
                <div className="supported-formats flex justify-center gap-2">
                  <span className="format-badge inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    Images
                  </span>
                  <span className="format-badge inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    Videos
                  </span>
                  <span className="format-badge inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    Audio
                  </span>
                  <span className="format-badge inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                    PDF
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Text Stimulus Button */}
        <button
          onClick={() => setShowTextEditor(true)}
          disabled={stimuli.length >= totalCells}
          className={`create-text-btn mt-4 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            stimuli.length >= totalCells
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-50'
          }`}
        >
          <Edit2 className="w-5 h-5" />
          Add Text Stimulus
        </button>
        
        {/* Text Editor Modal */}
        <AnimatePresence>
          {showTextEditor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowTextEditor(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-lg w-full"
                onClick={(e: any) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Create Text Stimulus</h3>
                <textarea
                  value={textContent}
                  onChange={(e: any) => {
                    const words = e.target.value.split(/\s+/).filter((w: any) => w.length > 0);
                    if (words.length <= wordLimit) {
                      setTextContent(e.target.value);
                    }
                  }}
                  placeholder="Enter your text stimulus..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="word-count text-sm text-gray-500 mt-2">
                  {textContent.split(/\s+/).filter((w: any) => w.length > 0).length}/{wordLimit} words
                </div>
                <div className="text-actions flex gap-2 mt-4">
                  <button
                    onClick={saveTextStimulus}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save Text
                  </button>
                  <button
                    onClick={() => {
                      setShowTextEditor(false);
                      setTextContent('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Enhanced Stimuli Gallery */}
      {stimuli.length > 0 && (
        <div className="stimuli-gallery mt-8">
          <h3 className="text-lg font-semibold mb-4">
            Uploaded Stimuli ({stimuli.length}/{totalCells})
          </h3>
          <div className="gallery-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <AnimatePresence>
              {stimuli.map((stimulus, index) => (
                <motion.div
                  key={stimulus.id}
                  className={`gallery-item relative bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                    stimulus.uploadStatus === 'failed' 
                      ? 'border-red-300' 
                      : stimulus.uploadStatus === 'processing'
                      ? 'border-blue-300'
                      : stimulus.uploadStatus === 'pending'
                      ? 'border-yellow-300'
                      : 'border-gray-200'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                >
                  <div className="item-number absolute top-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">
                    {index + 1}
                  </div>
                  
                  {/* Upload Progress Overlay */}
                  {stimulus.uploadStatus === 'processing' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-20">
                      <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                      <div className="text-white text-sm font-medium">
                        {Math.round(stimulus.uploadProgress || 0)}%
                      </div>
                      <div className="w-3/4 h-1 bg-gray-700 rounded-full mt-2">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-300"
                          style={{ width: `${stimulus.uploadProgress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Pending Overlay */}
                  {stimulus.uploadStatus === 'pending' && (
                    <div className="absolute inset-0 bg-yellow-500 bg-opacity-20 flex items-center justify-center z-20">
                      <div className="text-yellow-700 text-sm font-medium">
                        Queued
                      </div>
                    </div>
                  )}
                  
                  {/* Failed Overlay */}
                  {stimulus.uploadStatus === 'failed' && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex flex-col items-center justify-center z-20">
                      <XCircle className="w-8 h-8 text-red-600 mb-1" />
                      <div className="text-red-700 text-sm font-medium">
                        Failed
                      </div>
                      <button
                        onClick={() => uploadQueue.retryFailed()}
                        className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  
                  {/* Stimulus Preview */}
                  <div className="preview-container h-32 bg-gray-50 flex items-center justify-center">
                    {stimulus.type === 'IMAGE' && stimulus.thumbnail && (
                      <img src={stimulus.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                    {stimulus.type === 'VIDEO' && (
                      <div className="video-preview relative w-full h-full flex items-center justify-center">
                        {stimulus.thumbnail ? (
                          <img src={stimulus.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Video className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    )}
                    {stimulus.type === 'AUDIO' && (
                      <Music className="w-12 h-12 text-gray-400" />
                    )}
                    {stimulus.type === 'TEXT' && (
                      <div className="text-preview p-3 text-xs text-gray-600 line-clamp-4">
                        {stimulus.content}
                      </div>
                    )}
                    {stimulus.type === 'DOCUMENT' && (
                      <File className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Status Indicator */}
                  {stimulus.uploadStatus === 'complete' && (
                    <div className="absolute top-2 right-2 text-green-500">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                  
                  {/* File Info & Actions */}
                  <div className="item-info p-2">
                    {stimulus.metadata?.fileSize && (
                      <div className="text-xs text-gray-500 mb-1">
                        {formatFileSize(stimulus.metadata.fileSize)}
                      </div>
                    )}
                    <div className="item-actions flex gap-1">
                      <button
                        onClick={() => removeStimulus(stimulus.id, stimulus.uploadTaskId)}
                        className="action-btn flex-1 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Helper Messages */}
      <div className="helper-messages mt-6">
        {stimuli.length === 0 && (
          <div className="message-card flex items-start p-4 rounded-lg bg-blue-50 text-blue-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">
                Bulk Upload Supported!
              </p>
              <p className="text-sm">
                Drag and drop multiple files at once. The system will automatically queue and process them with up to 3 concurrent uploads for optimal speed.
              </p>
            </div>
          </div>
        )}
        
        {stimuli.length > 0 && stimuli.length < totalCells && (
          <div className="message-card flex items-start p-4 rounded-lg bg-yellow-50 text-yellow-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              You need {totalCells - stimuli.length} more {totalCells - stimuli.length === 1 ? 'stimulus' : 'stimuli'} to complete your set.
              {queueStatus.uploading > 0 && ` (${queueStatus.uploading} currently uploading)`}
            </p>
          </div>
        )}
        
        {queueStatus.failed > 0 && (
          <div className="message-card flex items-start p-4 rounded-lg bg-red-50 text-red-700">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">
                {queueStatus.failed} upload{queueStatus.failed > 1 ? 's' : ''} failed. 
              </p>
              <button
                onClick={retryFailedUploads}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                Retry all failed uploads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};