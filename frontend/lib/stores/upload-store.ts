'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'failed';
  error?: string;
  url?: string;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    fileSize: number;
    mimeType: string;
  };
}

interface UploadState {
  // Upload queue
  uploadQueue: UploadFile[];
  activeUploads: number;
  maxConcurrent: number;
  
  // Upload statistics
  totalUploaded: number;
  totalFailed: number;
  totalSize: number;
  
  // Upload limits
  maxFileSize: number;
  maxTotalSize: number;
  allowedTypes: string[];
  
  // UI State
  showUploadModal: boolean;
  uploadProgress: number;
  isUploading: boolean;
  
  // Messages
  successMessage: string | null;
  errorMessage: string | null;
  warningMessage: string | null;
  messageShown: boolean;
  
  // Actions
  addToQueue: (files: File[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  updateFileProgress: (id: string, progress: number) => void;
  updateFileStatus: (id: string, status: UploadFile['status'], error?: string) => void;
  setFileUrl: (id: string, url: string, thumbnailUrl?: string) => void;
  
  // UI Actions
  setShowUploadModal: (show: boolean) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  clearMessages: () => void;
  
  // Upload Actions
  startUpload: (id: string) => void;
  completeUpload: (id: string, url: string) => void;
  failUpload: (id: string, error: string) => void;
  
  // Validation
  validateFile: (file: File) => { valid: boolean; error?: string };
  canAddMoreFiles: (count: number) => boolean;
  
  // Reset
  reset: () => void;
}

const initialState = {
  uploadQueue: [],
  activeUploads: 0,
  maxConcurrent: 3,
  totalUploaded: 0,
  totalFailed: 0,
  totalSize: 0,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  showUploadModal: false,
  uploadProgress: 0,
  isUploading: false,
  successMessage: null,
  errorMessage: null,
  warningMessage: null,
  messageShown: false,
};

export const useUploadStore = create<UploadState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        addToQueue: (files) => {
          const newFiles: UploadFile[] = files.map((file: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: 'pending' as const,
            metadata: {
              fileSize: file.size,
              mimeType: file.type,
            },
          }));
          
          set((state) => ({
            uploadQueue: [...state.uploadQueue, ...newFiles],
            totalSize: state.totalSize + files.reduce((sum, f) => sum + f.size, 0),
          }));
        },
        
        removeFromQueue: (id) => {
          set((state) => {
            const file = state.uploadQueue.find(f => f.id === id);
            if (!file) return state;
            
            return {
              uploadQueue: state.uploadQueue.filter((f: any) => f.id !== id),
              totalSize: state.totalSize - file.file.size,
            };
          });
        },
        
        clearQueue: () => {
          set({ uploadQueue: [], totalSize: 0 });
        },
        
        updateFileProgress: (id, progress) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.map((f: any) =>
              f.id === id ? { ...f, progress } : f
            ),
            uploadProgress: Math.round(
              state.uploadQueue.reduce((sum, f) => sum + (f.id === id ? progress : f.progress), 0) /
              state.uploadQueue.length
            ),
          }));
        },
        
        updateFileStatus: (id, status, error) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.map((f: any) =>
              f.id === id ? { ...f, status, error } : f
            ),
            activeUploads: status === 'uploading'
              ? state.activeUploads + 1
              : status === 'complete' || status === 'failed'
              ? Math.max(0, state.activeUploads - 1)
              : state.activeUploads,
            isUploading: status === 'uploading' || state.activeUploads > 0,
          }));
        },
        
        setFileUrl: (id, url, thumbnailUrl) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.map((f: any) =>
              f.id === id ? { ...f, url, thumbnailUrl } : f
            ),
          }));
        },
        
        setShowUploadModal: (show) => {
          set({ showUploadModal: show });
        },
        
        showSuccess: (message) => {
          // Prevent duplicate messages
          const state = get();
          if (state.successMessage === message && state.messageShown) {
            return;
          }
          
          set({ 
            successMessage: message, 
            errorMessage: null, 
            warningMessage: null,
            messageShown: true 
          });
          
          // Auto-clear after 5 seconds
          setTimeout(() => {
            const currentState = get();
            if (currentState.successMessage === message) {
              set({ successMessage: null, messageShown: false });
            }
          }, 5000);
        },
        
        showError: (message) => {
          set({ 
            errorMessage: message, 
            successMessage: null, 
            warningMessage: null,
            messageShown: true 
          });
          
          // Auto-clear after 7 seconds
          setTimeout(() => {
            const currentState = get();
            if (currentState.errorMessage === message) {
              set({ errorMessage: null, messageShown: false });
            }
          }, 7000);
        },
        
        showWarning: (message) => {
          set({ 
            warningMessage: message, 
            successMessage: null, 
            errorMessage: null,
            messageShown: true 
          });
          
          // Auto-clear after 5 seconds
          setTimeout(() => {
            const currentState = get();
            if (currentState.warningMessage === message) {
              set({ warningMessage: null, messageShown: false });
            }
          }, 5000);
        },
        
        clearMessages: () => {
          set({ 
            successMessage: null, 
            errorMessage: null, 
            warningMessage: null,
            messageShown: false 
          });
        },
        
        startUpload: (id) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.map((f: any) =>
              f.id === id ? { ...f, status: 'uploading' as const, progress: 0 } : f
            ),
            activeUploads: state.activeUploads + 1,
            isUploading: true,
          }));
        },
        
        completeUpload: (id, url) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.map((f: any) =>
              f.id === id ? { ...f, status: 'complete' as const, progress: 100, url } : f
            ),
            activeUploads: Math.max(0, state.activeUploads - 1),
            totalUploaded: state.totalUploaded + 1,
            isUploading: state.activeUploads > 1,
          }));
        },
        
        failUpload: (id, error) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.map((f: any) =>
              f.id === id ? { ...f, status: 'failed' as const, error } : f
            ),
            activeUploads: Math.max(0, state.activeUploads - 1),
            totalFailed: state.totalFailed + 1,
            isUploading: state.activeUploads > 1,
          }));
        },
        
        validateFile: (file) => {
          const state = get();
          
          // Check file size
          if (file.size > state.maxFileSize) {
            return { 
              valid: false, 
              error: `File size exceeds ${state.maxFileSize / 1024 / 1024}MB limit` 
            };
          }
          
          // Check total size
          if (state.totalSize + file.size > state.maxTotalSize) {
            return { 
              valid: false, 
              error: `Total upload size would exceed ${state.maxTotalSize / 1024 / 1024}MB limit` 
            };
          }
          
          // Check file type
          const isAllowed = state.allowedTypes.some(type => {
            if (type.endsWith('/*')) {
              const category = type.slice(0, -2);
              return file.type.startsWith(category);
            }
            return file.type === type;
          });
          
          if (!isAllowed) {
            return { 
              valid: false, 
              error: 'File type not allowed' 
            };
          }
          
          return { valid: true };
        },
        
        canAddMoreFiles: (count) => {
          const state = get();
          return state.uploadQueue.length + count <= 100; // Max 100 files in queue
        },
        
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'upload-storage',
        partialize: (state) => ({
          maxFileSize: state.maxFileSize,
          maxTotalSize: state.maxTotalSize,
          allowedTypes: state.allowedTypes,
        }),
      }
    )
  )
);