'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '@/lib/stores/upload-store';
import {
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Image,
  Video,
  Music,
  File,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';

interface UploadProgressTrackerProps {
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({
  className = '',
  compact = false,
  showDetails = true
}) => {
  const {
    uploadQueue,
    activeUploads,
    totalUploaded,
    totalFailed,
    uploadProgress,
    isUploading,
    successMessage,
    errorMessage,
    warningMessage,
    removeFromQueue,
    clearMessages
  } = useUploadStore();

  const [isPaused, setIsPaused] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  useEffect(() => {
    // Show tracker when there are uploads or messages
    setShowTracker(
      uploadQueue.length > 0 || 
      isUploading || 
      successMessage !== null || 
      errorMessage !== null || 
      warningMessage !== null
    );
  }, [uploadQueue, isUploading, successMessage, errorMessage, warningMessage]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mimeType === 'text/plain') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!showTracker && !compact) return null;

  if (compact) {
    // Compact mode - just a small indicator
    return (
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-3 flex items-center gap-2 ${className}`}
          >
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium">
              {activeUploads} uploading...
            </span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {showTracker && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className={`fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Upload Progress</h3>
            </div>
            <div className="flex items-center gap-2">
              {isUploading && (
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => setShowTracker(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-start gap-2"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-start gap-2"
              >
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {warningMessage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">{warningMessage}</p>
                </div>
                <button
                  onClick={clearMessages}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overall Progress */}
          {uploadQueue.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{activeUploads} active</span>
                <span>{totalUploaded} completed</span>
                {totalFailed > 0 && (
                  <span className="text-red-500">{totalFailed} failed</span>
                )}
              </div>
            </div>
          )}

          {/* File List */}
          {showDetails && uploadQueue.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {uploadQueue.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(file.file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        {getStatusIcon(file.status)}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.file.size)}
                        </span>
                        {file.status === 'uploading' && (
                          <span className="text-xs font-medium text-blue-600">
                            {file.progress}%
                          </span>
                        )}
                      </div>
                      {file.status === 'uploading' && (
                        <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                      {file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                    {file.status !== 'uploading' && (
                      <button
                        onClick={() => removeFromQueue(file.id)}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Stats Footer */}
          {(totalUploaded > 0 || totalFailed > 0) && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center text-xs">
                <div className="flex gap-4">
                  <span className="text-green-600">
                    ✓ {totalUploaded} uploaded
                  </span>
                  {totalFailed > 0 && (
                    <span className="text-red-600">
                      ✗ {totalFailed} failed
                    </span>
                  )}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry Failed
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};