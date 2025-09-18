'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

interface DataUploadSectionProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export default function DataUploadSection({
  onUpload,
  isUploading,
}: DataUploadSectionProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    const validExtensions = ['.csv', '.dat', '.sta', '.json', '.xlsx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      errors.push(
        `Invalid file type. Supported formats: ${validExtensions.join(', ')}`
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      errors.push('File size exceeds 50MB limit');
    }

    return errors;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const errors = validateFile(file);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setUploadedFile(file);
    setValidationErrors([]);

    // Preview file contents
    if (file.type === 'text/csv' || file.name.endsWith('.dat')) {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 5);
      setPreviewData({
        type: 'text',
        content: lines.join('\n'),
        totalLines: text.split('\n').length,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.dat', '.sta'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleUpload = () => {
    if (uploadedFile) {
      onUpload(uploadedFile);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Data Upload Requirements
            </h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Supported formats: CSV, DAT (PQMethod), STA, JSON, XLSX</li>
              <li>
                • Q-sort matrix: Participants as rows, statements as columns
              </li>
              <li>• Values: Q-sort positions (e.g., -4 to +4)</li>
              <li>• Optional: Demographics data in separate sheet/file</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Dropzone */}
      <Card className="p-8">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <motion.div
            animate={{ scale: isDragActive ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />

            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                Drop your file here...
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Drag & drop your Q-sort data file
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse files
                </p>
              </>
            )}
          </motion.div>
        </div>

        {/* Validation Errors */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                      Validation Errors
                    </h4>
                    <ul className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded File Info */}
        <AnimatePresence>
          {uploadedFile && validationErrors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        File ready for upload
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {uploadedFile.name} (
                        {(uploadedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      setUploadedFile(null);
                      setPreviewData(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Preview */}
        {previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Data Preview (First 5 rows)
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                {previewData.content}
              </pre>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Total lines: {previewData.totalLines}
              </p>
            </div>
          </motion.div>
        )}

        {/* Upload Button */}
        {uploadedFile && validationErrors.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex justify-end"
          >
            <Button
              variant="primary"
              size="large"
              onClick={handleUpload}
              loading={isUploading}
              disabled={isUploading}
              className="flex items-center"
            >
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload & Process'}
            </Button>
          </motion.div>
        )}
      </Card>

      {/* Sample Data Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sample Data Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <TableCellsIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                CSV Template
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Standard Q-sort matrix format
              </p>
            </div>
          </button>
          <button className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                PQMethod Template
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Compatible with PQMethod .DAT files
              </p>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}
