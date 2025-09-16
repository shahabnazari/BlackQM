'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '@/lib/stores/upload-store';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Music, 
  File, 
  X, 
  Edit2, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

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
}

interface GridConfiguration {
  columns: Array<{
    value: number;
    label: string;
    cells: number;
  }>;
  totalCells: number;
}

interface StimuliUploadSystemProps {
  studyId?: string;
  grid: GridConfiguration;
  onStimuliComplete?: (stimuli: Stimulus[]) => void;
  initialStimuli?: Stimulus[];
}

export const StimuliUploadSystem: React.FC<StimuliUploadSystemProps> = ({
  studyId,
  grid,
  onStimuliComplete,
  initialStimuli = []
}) => {
  const [stimuli, setStimuli] = useState<Stimulus[]>(initialStimuli);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [wordLimit] = useState(100);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [selectedStimulus, setSelectedStimulus] = useState<string | null>(null);
  const completionNotified = useRef(false);
  
  // Use upload store for notifications
  const { showSuccess, showError, showWarning, clearMessages } = useUploadStore();
  
  const totalCells = grid.totalCells;
  const progress = (stimuli.length / totalCells) * 100;

  useEffect(() => {
    // Only notify once when all stimuli are uploaded
    if (onStimuliComplete && stimuli.length === totalCells && !completionNotified.current) {
      completionNotified.current = true;
      onStimuliComplete(stimuli);
      showSuccess('All stimuli uploaded successfully!');
    }
    
    // Reset flag when stimuli count changes from complete to incomplete
    if (stimuli.length < totalCells && completionNotified.current) {
      completionNotified.current = false;
    }
  }, [stimuli, totalCells, onStimuliComplete, showSuccess]);
  
  // Clear messages when component unmounts or studyId changes
  useEffect(() => {
    return () => {
      clearMessages();
      completionNotified.current = false;
    };
  }, [studyId, clearMessages]);

  const uploadFile = async (file: File): Promise<Stimulus> => {
    const tempId = Math.random().toString(36).substr(2, 9);
    
    // Create temporary stimulus
    const tempStimulus: Stimulus = {
      id: tempId,
      type: getFileType(file),
      content: URL.createObjectURL(file),
      thumbnail: URL.createObjectURL(file),
      metadata: {
        fileSize: file.size,
        mimeType: file.type
      },
      uploadStatus: 'processing',
      uploadProgress: 0
    };

    // Add to state immediately
    setStimuli(prev => [...prev, tempStimulus]);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', getFileType(file));
    
    try {
      // Simulate upload progress
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
      
      // Upload file
      const response = await fetch(`/api/studies/${studyId}/stimuli`, {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      
      // Update stimulus with server response
      setStimuli(prev => prev.map(s => 
        s.id === tempId 
          ? { ...data.data, uploadStatus: 'complete', uploadProgress: 100 }
          : s
      ));
      
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      
      return data.data;
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update stimulus to failed state
      setStimuli(prev => prev.map(s => 
        s.id === tempId 
          ? { ...s, uploadStatus: 'failed' }
          : s
      ));
      
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Calculate how many more stimuli can be uploaded
    const remainingSlots = totalCells - stimuli.length;
    
    if (remainingSlots <= 0) {
      showError(`Cannot upload more stimuli. Your grid has ${totalCells} cells and all are filled.`);
      return;
    }
    
    if (acceptedFiles.length > remainingSlots) {
      showWarning(
        `You can only upload ${remainingSlots} more ${remainingSlots === 1 ? 'stimulus' : 'stimuli'}. ` +
        `Your grid has ${totalCells} cells total, and ${stimuli.length} ${stimuli.length === 1 ? 'is' : 'are'} already uploaded. ` +
        `Each cell in the grid must match exactly one stimulus.`
      );
      
      // Only process files that fit within the limit
      acceptedFiles = acceptedFiles.slice(0, remainingSlots);
    }
    
    for (const file of acceptedFiles) {
      try {
        await uploadFile(file);
      } catch (error: any) {
        console.error('Failed to upload file:', file.name);
        showError(`Failed to upload ${file.name}. Please try again.`);
      }
    }
  }, [studyId, stimuli.length, totalCells, showError, showWarning]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: stimuli.length >= totalCells // Disable dropzone when limit reached
  });

  const getFileType = (file: File): Stimulus['type'] => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  };

  const getStimulusIcon = (type: Stimulus['type']) => {
    switch (type) {
      case 'TEXT': return <FileText className="w-4 h-4" />;
      case 'IMAGE': return <Image className="w-4 h-4" />;
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'AUDIO': return <Music className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const saveTextStimulus = async () => {
    if (!textContent.trim()) return;
    
    // Check if we can add more stimuli
    const remainingSlots = totalCells - stimuli.length;
    if (remainingSlots <= 0) {
      showError(`Cannot add more stimuli. Your grid has ${totalCells} cells and all are filled.`);
      return;
    }
    
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    
    const newStimulus: Stimulus = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'TEXT',
      content: textContent,
      metadata: { wordCount },
      uploadStatus: 'complete'
    };
    
    if (studyId) {
      // Save to backend
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

  const removeStimulus = async (id: string) => {
    if (studyId) {
      try {
        await fetch(`/api/studies/${studyId}/stimuli?stimulusId=${id}`, {
          method: 'DELETE'
        });
      } catch (error: any) {
        console.error('Failed to delete stimulus:', error);
      }
    }
    
    setStimuli(prev => prev.filter(s => s.id !== id));
  };

  const getGlobalCellIndex = (colIndex: number, cellIndex: number): number => {
    let index = 0;
    for (let i = 0; i < colIndex; i++) {
      index += grid.columns[i].cells;
    }
    return index + cellIndex;
  };

  return (
    <div className="stimuli-upload-system max-w-6xl mx-auto p-6">
      {/* Header with Upload Status */}
      <div className="upload-header mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Upload Stimuli</h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {stimuli.length} / {totalCells}
              </div>
              <div className="text-xs text-gray-500">
                {totalCells - stimuli.length > 0 
                  ? `${totalCells - stimuli.length} more needed`
                  : 'All stimuli uploaded'}
              </div>
            </div>
            {stimuli.length === totalCells && (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-900 font-medium">
                Important: Each cell in your grid needs exactly one stimulus
              </p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• Your grid has {grid.columns.length} columns with {totalCells} total cells</li>
                <li>• You've uploaded {stimuli.length} {stimuli.length === 1 ? 'stimulus' : 'stimuli'} so far</li>
                <li>• {totalCells - stimuli.length > 0 
                  ? `You need to upload ${totalCells - stimuli.length} more ${totalCells - stimuli.length === 1 ? 'stimulus' : 'stimuli'}` 
                  : 'All stimuli have been uploaded!'}</li>
              </ul>
              {stimuli.length < totalCells && (
                <p className="text-blue-600 text-sm mt-3 font-medium">
                  Supported formats: Images (PNG, JPG, GIF), Videos (MP4, MOV), Audio (MP3, WAV), PDFs, or create text stimuli
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Upload Limit Warning */}
        {stimuli.length === totalCells && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-900 font-medium">
                  Perfect! You've uploaded exactly {totalCells} stimuli
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Your stimuli match your grid configuration. You can now proceed to the next step,
                  or you can replace existing stimuli by removing them first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Grid Preview with Progress */}
      <div className="grid-preview-section mb-8">
        <h3 className="text-lg font-semibold mb-3">Grid Preview - Fill Each Cell</h3>
        <div className="grid-preview flex gap-2 justify-center p-6 bg-gray-50 rounded-xl">
          {grid.columns.map((column, colIndex) => (
            <div key={colIndex} className="preview-column flex flex-col items-center">
              <div className="column-header text-center mb-2">
                <div className="text-sm font-bold text-gray-800">
                  {column.value > 0 ? '+' : ''}{column.value}
                </div>
                {column.label && (
                  <div className="text-xs text-gray-600 mt-1 max-w-[80px] truncate">
                    {column.label}
                  </div>
                )}
              </div>
              <div className="column-cells flex flex-col-reverse gap-1">
                {Array.from({ length: column.cells }).map((_, cellIndex) => {
                  const globalIndex = getGlobalCellIndex(colIndex, cellIndex);
                  const stimulus = stimuli[globalIndex];
                  
                  return (
                    <motion.div
                      key={cellIndex}
                      className={`preview-cell w-12 h-16 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        stimulus 
                          ? 'bg-green-100 border-green-500' 
                          : 'bg-gray-100 border-gray-300 border-dashed'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      animate={{
                        backgroundColor: stimulus ? '#10b981' : '#f3f4f6',
                        borderColor: stimulus ? '#10b981' : '#d1d5db'
                      }}
                    >
                      {stimulus && (
                        <div className="stimulus-indicator text-white">
                          {getStimulusIcon(stimulus.type)}
                        </div>
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
            <span className="text-sm font-medium">Upload Progress</span>
            <span className="text-sm text-gray-600">
              {stimuli.length} / {totalCells} stimuli
            </span>
          </div>
          <div className="progress-bar-container w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="progress-bar h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {stimuli.length === totalCells && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 text-sm mt-2 flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              All stimuli uploaded! Ready to proceed.
            </motion.p>
          )}
        </div>
      </div>
      
      {/* Upload Area */}
      <div className="upload-area">
        {stimuli.length < totalCells ? (
          <>
            <div
              {...getRootProps()}
              className={`dropzone border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="dropzone-content">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  or click to browse
                </p>
                <p className="text-sm font-medium text-blue-600 mb-4">
                  You can upload {totalCells - stimuli.length} more {totalCells - stimuli.length === 1 ? 'stimulus' : 'stimuli'}
                </p>
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
              </div>
            </div>
            
            {/* Text Stimulus Button */}
            <button
              onClick={() => setShowTextEditor(true)}
              className="create-text-btn mt-4 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Add Text Stimulus
            </button>
          </>
        ) : (
          <div className="upload-complete-message border-2 border-green-300 bg-green-50 rounded-xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              Upload Complete!
            </h3>
            <p className="text-green-700 mb-4">
              You have uploaded exactly {totalCells} stimuli, matching your grid configuration.
            </p>
            <p className="text-sm text-green-600">
              Each cell in your grid now has a corresponding stimulus. You can remove stimuli below if you need to make changes.
            </p>
          </div>
        )}
        
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
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Create Text Stimulus</h3>
                <textarea
                  value={textContent}
                  onChange={(e) => {
                    const words = e.target.value.split(/\s+/).filter(w => w.length > 0);
                    if (words.length <= wordLimit) {
                      setTextContent(e.target.value);
                    }
                  }}
                  placeholder="Enter your text stimulus..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="word-count text-sm text-gray-500 mt-2">
                  {textContent.split(/\s+/).filter(w => w.length > 0).length}/{wordLimit} words
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
      
      {/* Stimuli Gallery */}
      {stimuli.length > 0 && (
        <div className="stimuli-gallery mt-8">
          <h3 className="text-lg font-semibold mb-4">Uploaded Stimuli</h3>
          <div className="gallery-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <AnimatePresence>
              {stimuli.map((stimulus, index) => (
                <motion.div
                  key={stimulus.id}
                  className="gallery-item relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                >
                  <div className="item-number absolute top-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">
                    {index + 1}
                  </div>
                  
                  {/* Upload Progress */}
                  {stimulus.uploadStatus === 'processing' && uploadingFiles.has(stimulus.id) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                      <div className="text-white text-sm">
                        {uploadingFiles.get(stimulus.id)}%
                      </div>
                    </div>
                  )}
                  
                  {/* Stimulus Preview */}
                  <div className="preview-container h-32 bg-gray-50 flex items-center justify-center">
                    {stimulus.type === 'IMAGE' && stimulus.thumbnail && (
                      <img src={stimulus.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                    {stimulus.type === 'VIDEO' && (
                      <div className="video-preview relative">
                        {stimulus.thumbnail && (
                          <img src={stimulus.thumbnail} alt="" className="w-full h-full object-cover" />
                        )}
                        <div className="play-overlay absolute inset-0 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
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
                  {stimulus.uploadStatus === 'failed' && (
                    <div className="absolute top-2 right-2 text-red-500">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                  {stimulus.uploadStatus === 'complete' && (
                    <div className="absolute top-2 right-2 text-green-500">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="item-actions flex gap-1 p-2">
                    <button
                      onClick={() => setSelectedStimulus(stimulus.id)}
                      className="action-btn flex-1 py-1 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeStimulus(stimulus.id)}
                      className="action-btn flex-1 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
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
                Ready to start uploading
              </p>
              <p className="text-sm">
                You need to upload exactly {totalCells} stimuli to match your grid configuration.
                Each stimulus will occupy one cell in the grid shown above.
              </p>
            </div>
          </div>
        )}
        
        {stimuli.length > 0 && stimuli.length < totalCells && (
          <div className="message-card flex items-start p-4 rounded-lg bg-yellow-50 text-yellow-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">
                {totalCells - stimuli.length} more {(totalCells - stimuli.length) === 1 ? 'stimulus' : 'stimuli'} needed
              </p>
              <p className="text-sm">
                You've uploaded {stimuli.length} of {totalCells} required stimuli. 
                Continue uploading to fill all grid cells.
              </p>
            </div>
          </div>
        )}
        
        {stimuli.length > totalCells && (
          <div className="message-card flex items-start p-4 rounded-lg bg-red-50 text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">
                Too many stimuli uploaded
              </p>
              <p className="text-sm">
                You have {stimuli.length - totalCells} extra {(stimuli.length - totalCells) === 1 ? 'stimulus' : 'stimuli'}.
                Please remove the extras to match your grid configuration of {totalCells} cells.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};