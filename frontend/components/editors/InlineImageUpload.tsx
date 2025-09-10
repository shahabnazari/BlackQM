'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, Image as ImageIcon, FileImage } from 'lucide-react';
import { Button } from '@/components/apple-ui/Button';

interface InlineImageUploadProps {
  onImageSelect: (imageData: {
    src: string;
    width: number;
    height: number;
    wrapMode: 'inline' | 'left' | 'right' | 'center' | 'break-text';
    margin: number;
    alt: string;
  }) => void;
  onClose: () => void;
  maxFileSize?: number; // in MB
  recommendedWidth?: number;
  recommendedHeight?: number;
}

const WRAP_MODES = [
  { 
    id: 'inline', 
    label: 'Inline with text', 
    description: 'Image flows with text',
    icon: '⬜',
  },
  { 
    id: 'left', 
    label: 'Wrap text right', 
    description: 'Text wraps on the right side',
    icon: '◧',
  },
  { 
    id: 'right', 
    label: 'Wrap text left', 
    description: 'Text wraps on the left side',
    icon: '◨',
  },
  { 
    id: 'center', 
    label: 'Center', 
    description: 'Center with text above and below',
    icon: '⬛',
  },
  { 
    id: 'break-text', 
    label: 'Break text', 
    description: 'Text breaks around the image',
    icon: '▦',
  },
];

export default function InlineImageUpload({
  onImageSelect,
  onClose,
  maxFileSize = 5,
  recommendedWidth = 800,
  recommendedHeight = 600,
}: InlineImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [wrapMode, setWrapMode] = useState<string>('inline');
  const [imageMargin, setImageMargin] = useState(10);
  const [altText, setAltText] = useState('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      setError(`File size must be less than ${maxFileSize}MB. Your file is ${fileSizeMB.toFixed(2)}MB`);
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview and get dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let finalWidth = img.width;
        let finalHeight = img.height;

        // Resize if larger than recommended
        if (img.width > recommendedWidth || img.height > recommendedHeight) {
          if (img.width / recommendedWidth > img.height / recommendedHeight) {
            finalWidth = recommendedWidth;
            finalHeight = recommendedWidth / aspectRatio;
          } else {
            finalHeight = recommendedHeight;
            finalWidth = recommendedHeight * aspectRatio;
          }
        }

        setImageDimensions({
          width: Math.round(finalWidth),
          height: Math.round(finalHeight),
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, [maxFileSize, recommendedWidth, recommendedHeight]);


  const handleInsert = useCallback(async () => {
    if (!previewUrl) {
      setError('Please select an image first');
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // Upload to server
      const response = await fetch('/api/upload/image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: previewUrl,
          type: 'content',
        }),
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      clearInterval(interval);
      setUploadProgress(100);

      // Insert image with settings
      onImageSelect({
        src: data.url,
        width: imageDimensions.width,
        height: imageDimensions.height,
        wrapMode: wrapMode as any,
        margin: imageMargin,
        alt: altText || 'Content image',
      });
    } catch (err) {
      clearInterval(interval);
      setError('Failed to upload image. Please try again.');
      setUploadProgress(0);
    }
  }, [previewUrl, wrapMode, imageMargin, altText, imageDimensions, onImageSelect]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileImage className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Insert Image</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload and configure image placement</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Upload Area */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Click to upload image
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      PNG, JPG, GIF up to {maxFileSize}MB • Recommended: {recommendedWidth}×{recommendedHeight}px
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Preview */}
                    <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="relative inline-block">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full h-auto rounded-lg shadow-md"
                          style={{ maxHeight: '300px' }}
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            title="Replace image"
                          >
                            <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Dimensions: {imageDimensions.width} × {imageDimensions.height}px
                      </div>
                    </div>

                    {/* Text Wrapping Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Text Wrapping
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {WRAP_MODES.map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setWrapMode(mode.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              wrapMode === mode.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            title={mode.description}
                          >
                            <div className="text-2xl mb-1">{mode.icon}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{mode.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margin Control */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Text Spacing: {imageMargin}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={imageMargin}
                        onChange={(e) => setImageMargin(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Alt Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alt Text (for accessibility)
                      </label>
                      <input
                        type="text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Describe the image..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFile && `Selected: ${selectedFile.name}`}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={uploadProgress > 0 && uploadProgress < 100}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleInsert}
                disabled={!previewUrl || (uploadProgress > 0 && uploadProgress < 100)}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Insert Image
              </Button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}