'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
} from 'lucide-react';

/**
 * Instagram Manual Upload Component
 *
 * Enterprise-grade Instagram video upload interface with legal compliance
 * Implements manual upload workflow to respect Instagram ToS
 *
 * Features:
 * - Instagram URL validation
 * - Manual download instructions
 * - File upload with drag-and-drop
 * - Progress tracking
 * - Legal disclaimer
 * - Results display
 *
 * Phase 9 Day 19 Task 2 - Frontend Implementation
 */

interface InstagramManualUploadProps {
  onAnalysisComplete?: (result: any) => void;
  researchContext?: string;
  className?: string;
}

interface UploadStatus {
  step:
    | 'url_input'
    | 'download_instructions'
    | 'file_upload'
    | 'processing'
    | 'complete'
    | 'error';
  message: string;
  progress?: number;
  data?: any;
}

export default function InstagramManualUpload({
  onAnalysisComplete,
  researchContext,
  className = '',
}: InstagramManualUploadProps) {
  const [instagramUrl, setInstagramUrl] = useState('');
  const [status, setStatus] = useState<UploadStatus>({
    step: 'url_input',
    message: 'Enter Instagram video URL to begin',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle URL submission
  const handleUrlSubmit = useCallback(async () => {
    if (!instagramUrl.trim()) {
      setStatus({
        step: 'error',
        message: 'Please enter a valid Instagram URL',
      });
      return;
    }

    setStatus({
      step: 'processing',
      message: 'Validating Instagram URL...',
      progress: 25,
    });

    try {
      const response = await fetch('/api/literature/instagram/validate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: instagramUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid Instagram URL');
      }

      if (data.status === 'already_processed') {
        setStatus({
          step: 'complete',
          message: 'This video has already been processed!',
          data: data,
        });
        setAnalysisResult(data);
        if (onAnalysisComplete) {
          onAnalysisComplete(data);
        }
      } else {
        setStatus({
          step: 'download_instructions',
          message: 'URL validated. Please download the video manually.',
          data: data,
        });
      }
    } catch (error: any) {
      setStatus({
        step: 'error',
        message: error.message || 'Failed to validate URL',
      });
    }
  }, [instagramUrl, onAnalysisComplete]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(
      f => f.type.startsWith('video/') || f.name.match(/\.(mp4|mov|avi|mkv)$/i)
    );

    if (videoFile) {
      setUploadedFile(videoFile);
      setStatus({
        step: 'file_upload',
        message: `File ready: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    } else {
      setStatus({
        step: 'error',
        message: 'Please upload a valid video file (.mp4, .mov, .avi, .mkv)',
      });
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedFile(file);
        setStatus({
          step: 'file_upload',
          message: `File ready: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        });
      }
    },
    []
  );

  // Handle file upload and processing
  const handleFileUpload = useCallback(async () => {
    if (!uploadedFile || !acceptedDisclaimer) {
      setStatus({
        step: 'error',
        message: 'Please accept the legal disclaimer before uploading',
      });
      return;
    }

    setStatus({
      step: 'processing',
      message: 'Uploading and processing video...',
      progress: 0,
    });

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('url', instagramUrl);
      if (researchContext) {
        formData.append('context', researchContext);
      }

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 50; // Upload is 50% of progress
          setStatus(prev => ({
            ...prev,
            message: 'Uploading video...',
            progress: percentComplete,
          }));
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setStatus({
            step: 'complete',
            message: 'Analysis complete!',
            progress: 100,
            data: result,
          });
          setAnalysisResult(result);
          if (onAnalysisComplete) {
            onAnalysisComplete(result);
          }
        } else {
          throw new Error(
            JSON.parse(xhr.responseText).message || 'Upload failed'
          );
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });

      xhr.open('POST', '/api/literature/instagram/upload');
      xhr.send(formData);

      // Update status to transcription after upload
      setTimeout(() => {
        if (
          status.step === 'processing' &&
          status.progress &&
          status.progress < 100
        ) {
          setStatus(prev => ({
            ...prev,
            message: 'Transcribing audio with OpenAI Whisper...',
            progress: 60,
          }));
        }
      }, 2000);

      setTimeout(() => {
        if (
          status.step === 'processing' &&
          status.progress &&
          status.progress < 100
        ) {
          setStatus(prev => ({
            ...prev,
            message: 'Extracting themes with GPT-4...',
            progress: 80,
          }));
        }
      }, 5000);
    } catch (error: any) {
      setStatus({
        step: 'error',
        message: error.message || 'Failed to process video',
      });
    }
  }, [
    uploadedFile,
    instagramUrl,
    researchContext,
    acceptedDisclaimer,
    onAnalysisComplete,
    status,
  ]);

  // Reset to start
  const handleReset = useCallback(() => {
    setInstagramUrl('');
    setUploadedFile(null);
    setAnalysisResult(null);
    setAcceptedDisclaimer(false);
    setStatus({
      step: 'url_input',
      message: 'Enter Instagram video URL to begin',
    });
  }, []);

  return (
    <div className={`instagram-manual-upload ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Instagram Video Analysis</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload Instagram videos for transcription and theme extraction
        </p>
      </div>

      {/* Status Indicator */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          {status.step === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          ) : status.step === 'complete' ? (
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">{status.message}</p>
            {status.progress !== undefined && (
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 1: URL Input */}
      {status.step === 'url_input' && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Instagram Video URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/ABC123/"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              onKeyPress={e => e.key === 'Enter' && handleUrlSubmit()}
            />
            <button
              onClick={handleUrlSubmit}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Validate
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Supported formats: /p/, /reel/, /tv/
          </p>
        </div>
      )}

      {/* Step 2: Download Instructions */}
      {status.step === 'download_instructions' && status.data && (
        <div className="mb-6 space-y-4">
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              {status.data.instructions.step1}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">
                  {status.data.instructions.step2}
                </p>
                {status.data.instructions.tools.map(
                  (tool: any, idx: number) => (
                    <div
                      key={idx}
                      className="ml-4 mb-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {tool.description}
                      </p>
                      {tool.chrome && (
                        <a
                          href={tool.chrome}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                        >
                          Chrome Web Store <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {tool.examples && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Examples: {tool.examples.join(', ')}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>

              <p className="font-medium">{status.data.instructions.step3}</p>
            </div>
          </div>

          {/* Move to file upload */}
          <button
            onClick={() =>
              setStatus({
                step: 'file_upload',
                message: 'Ready to upload video file',
              })
            }
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            I've Downloaded the Video - Ready to Upload
          </button>
        </div>
      )}

      {/* Step 3: File Upload */}
      {status.step === 'file_upload' && (
        <div className="space-y-4">
          {/* Legal Disclaimer */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="font-semibold mb-2 text-red-900 dark:text-red-100">
              Legal Notice
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              By uploading a video, you confirm that you have the legal right to
              use this content for research purposes and will comply with
              Instagram's Terms of Service and all applicable copyright laws.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedDisclaimer}
                onChange={e => setAcceptedDisclaimer(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">
                I accept the legal disclaimer
              </span>
            </label>
          </div>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {uploadedFile ? (
              <div>
                <p className="font-medium mb-1">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="mt-2 text-sm text-red-500 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-2">Drag and drop your video here, or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mp4,.mov,.avi,.mkv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Max file size: 500 MB
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {uploadedFile && acceptedDisclaimer && (
            <button
              onClick={handleFileUpload}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload and Analyze Video
            </button>
          )}
        </div>
      )}

      {/* Step 4: Results */}
      {status.step === 'complete' && analysisResult && (
        <div className="space-y-4">
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Analysis Complete
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Video ID
                </p>
                <p className="font-mono">{analysisResult.videoId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Themes Extracted
                </p>
                <p className="font-semibold">
                  {analysisResult.themes?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transcript Confidence
                </p>
                <p className="font-semibold">
                  {((analysisResult.transcript?.confidence || 0) * 100).toFixed(
                    1
                  )}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Relevance Score
                </p>
                <p className="font-semibold">
                  {(analysisResult.relevanceScore || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Start Over Button */}
          <button
            onClick={handleReset}
            className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Analyze Another Video
          </button>
        </div>
      )}

      {/* Error State */}
      {status.step === 'error' && (
        <button
          onClick={handleReset}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
