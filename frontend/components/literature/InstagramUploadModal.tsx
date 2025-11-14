/**
 * InstagramUploadModal Component
 * Phase 10.8 Day 7: Instagram Integration
 * Enterprise-grade upload modal with drag-drop, validation, and progress tracking
 *
 * Features:
 * - Drag and drop file upload
 * - URL input for Instagram videos
 * - File validation (size, format)
 * - Upload progress tracking
 * - Metadata entry (username, caption, hashtags)
 * - Error handling with user-friendly messages
 * - Success state with preview
 *
 * @module InstagramUploadModal
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Link, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface InstagramUploadData {
  file?: File | undefined;
  url?: string | undefined;
  username: string;
  caption: string;
  hashtags: string[];
  uploadDate?: string | undefined;
}

export interface InstagramUploadModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for modal close */
  onClose: () => void;
  /** Handler for successful upload */
  onUploadSuccess: (data: InstagramUploadData) => void;
  /** Whether upload is in progress */
  uploading?: boolean;
  /** Upload progress (0-100) */
  uploadProgress?: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm'];
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.webm'];

// ============================================================================
// Component
// ============================================================================

export function InstagramUploadModal({
  open,
  onClose,
  onUploadSuccess,
  uploading = false,
  uploadProgress = 0,
}: InstagramUploadModalProps) {
  // State
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 500MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    // Check file format
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ALLOWED_FORMATS.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension || '')) {
      return `Invalid file format. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    return null;
  }, []);

  const validateUrl = useCallback((url: string): string | null => {
    if (!url.trim()) {
      return 'Please enter a valid Instagram URL';
    }

    // Instagram URL patterns
    const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;
    if (!instagramPattern.test(url)) {
      return 'Invalid Instagram URL. Please provide a link to an Instagram post, reel, or video';
    }

    return null;
  }, []);

  // ============================================================================
  // File Upload Handlers
  // ============================================================================

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    toast.success(`File selected: ${selectedFile.name}`);
  }, [validateFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  // ============================================================================
  // Form Submission
  // ============================================================================

  const handleSubmit = useCallback(() => {
    setError(null);

    // Validate based on upload method
    if (uploadMethod === 'file') {
      if (!file) {
        setError('Please select a video file to upload');
        return;
      }
    } else {
      const urlError = validateUrl(url);
      if (urlError) {
        setError(urlError);
        return;
      }
    }

    // Validate metadata
    if (!username.trim()) {
      setError('Please enter the Instagram username');
      return;
    }

    // Parse hashtags
    const hashtags = hashtagsInput
      .split(/[,\s]+/)
      .filter(tag => tag.trim())
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

    // Prepare upload data
    const uploadData: InstagramUploadData = {
      ...(uploadMethod === 'file' ? { file: file || undefined } : { url }),
      username: username.trim(),
      caption: caption.trim(),
      hashtags,
      uploadDate: uploadDate || undefined,
    };

    // Call success handler
    onUploadSuccess(uploadData);
    setSuccess(true);

    // Reset form after 2 seconds
    setTimeout(() => {
      handleReset();
    }, 2000);
  }, [uploadMethod, file, url, username, caption, hashtagsInput, uploadDate, onUploadSuccess, validateUrl]);

  // ============================================================================
  // Reset & Cleanup
  // ============================================================================

  const handleReset = useCallback(() => {
    setFile(null);
    setUrl('');
    setUsername('');
    setCaption('');
    setHashtagsInput('');
    setUploadDate('');
    setError(null);
    setSuccess(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            Upload Instagram Video
          </DialogTitle>
          <DialogDescription>
            Upload Instagram videos for AI transcription, theme extraction, and sentiment analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Upload Method Selection */}
          <div className="flex gap-2">
            <Button
              variant={uploadMethod === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMethod('file')}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
            <Button
              variant={uploadMethod === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadMethod('url')}
              className="flex-1"
            >
              <Link className="w-4 h-4 mr-2" />
              Instagram URL
            </Button>
          </div>

          {/* File Upload Area */}
          {uploadMethod === 'file' && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } ${file ? 'border-green-500 bg-green-50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {previewUrl && (
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-xs mx-auto rounded-lg shadow-md"
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="font-medium">Drag and drop video file here</p>
                  <p className="text-sm text-gray-500">
                    or click to browse (max 500MB, MP4/MOV/WebM)
                  </p>
                  <input
                    type="file"
                    accept={ALLOWED_FORMATS.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" type="button" className="cursor-pointer">
                      Browse Files
                    </Button>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* URL Input */}
          {uploadMethod === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="instagram-url">Instagram Video URL</Label>
              <Input
                id="instagram-url"
                type="url"
                placeholder="https://www.instagram.com/p/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Paste the link to an Instagram post, reel, or IGTV video
              </p>
            </div>
          )}

          {/* Metadata Fields */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Video Metadata</h4>

            <div className="space-y-2">
              <Label htmlFor="username">
                Instagram Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                placeholder="Video caption or description..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags (Optional)</Label>
              <Input
                id="hashtags"
                placeholder="#research #science #education"
                value={hashtagsInput}
                onChange={(e) => setHashtagsInput(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Separate hashtags with spaces or commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-date">Upload Date (Optional)</Label>
              <Input
                id="upload-date"
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Upload successful! Processing video...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || success}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

