import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadProgressTracker } from '../../frontend/components/stimuli/UploadProgressTracker';
import { useUploadStore } from '../../frontend/lib/stores/upload-store';

// Mock the upload store
jest.mock('../../frontend/lib/stores/upload-store');

describe('UploadProgressTracker', () => {
  const mockStore = {
    queue: [],
    getOverallProgress: jest.fn(),
    getActiveUploads: jest.fn(),
    getCompletedUploads: jest.fn(),
    getFailedUploads: jest.fn(),
    removeFromQueue: jest.fn(),
    clearQueue: jest.fn(),
    retryUpload: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUploadStore as jest.Mock).mockReturnValue(mockStore);
  });

  describe('Empty State', () => {
    test('should show empty state when no uploads in queue', () => {
      mockStore.queue = [];
      mockStore.getOverallProgress.mockReturnValue(0);
      mockStore.getActiveUploads.mockReturnValue(0);
      mockStore.getCompletedUploads.mockReturnValue(0);
      mockStore.getFailedUploads.mockReturnValue(0);

      render(<UploadProgressTracker />);

      expect(screen.getByText('No uploads in progress')).toBeInTheDocument();
    });

    test('should not render when minimized and queue is empty', () => {
      mockStore.queue = [];
      
      const { container } = render(<UploadProgressTracker minimized />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Upload Queue Display', () => {
    test('should display uploading files with progress', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 45,
          url: null,
          error: null,
        },
        {
          id: '2',
          file: new File(['test2'], 'image2.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 75,
          url: null,
          error: null,
        },
      ];
      mockStore.getOverallProgress.mockReturnValue(60);
      mockStore.getActiveUploads.mockReturnValue(2);
      mockStore.getCompletedUploads.mockReturnValue(0);
      mockStore.getFailedUploads.mockReturnValue(0);

      render(<UploadProgressTracker />);

      expect(screen.getByText('image1.jpg')).toBeInTheDocument();
      expect(screen.getByText('image2.jpg')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    test('should display completed files', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'completed.jpg', { type: 'image/jpeg' }),
          status: 'complete',
          progress: 100,
          url: 'http://example.com/completed.jpg',
          error: null,
        },
      ];
      mockStore.getOverallProgress.mockReturnValue(100);
      mockStore.getActiveUploads.mockReturnValue(0);
      mockStore.getCompletedUploads.mockReturnValue(1);
      mockStore.getFailedUploads.mockReturnValue(0);

      render(<UploadProgressTracker />);

      expect(screen.getByText('completed.jpg')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /✓/i })).toBeInTheDocument();
    });

    test('should display failed files with error message', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'failed.jpg', { type: 'image/jpeg' }),
          status: 'error',
          progress: 0,
          url: null,
          error: 'Upload failed: Network error',
        },
      ];
      mockStore.getOverallProgress.mockReturnValue(0);
      mockStore.getActiveUploads.mockReturnValue(0);
      mockStore.getCompletedUploads.mockReturnValue(0);
      mockStore.getFailedUploads.mockReturnValue(1);

      render(<UploadProgressTracker />);

      expect(screen.getByText('failed.jpg')).toBeInTheDocument();
      expect(screen.getByText('Upload failed: Network error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    test('should display pending files', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'pending.jpg', { type: 'image/jpeg' }),
          status: 'pending',
          progress: 0,
          url: null,
          error: null,
        },
      ];
      mockStore.getOverallProgress.mockReturnValue(0);
      mockStore.getActiveUploads.mockReturnValue(0);
      mockStore.getCompletedUploads.mockReturnValue(0);
      mockStore.getFailedUploads.mockReturnValue(0);

      render(<UploadProgressTracker />);

      expect(screen.getByText('pending.jpg')).toBeInTheDocument();
      expect(screen.getByText('Waiting...')).toBeInTheDocument();
    });
  });

  describe('Overall Progress', () => {
    test('should display overall progress bar', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test1'], 'file1.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
        {
          id: '2',
          file: new File(['test2'], 'file2.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 30,
          url: null,
          error: null,
        },
      ];
      mockStore.getOverallProgress.mockReturnValue(40);
      mockStore.getActiveUploads.mockReturnValue(2);

      render(<UploadProgressTracker />);

      expect(screen.getByText('Overall Progress: 40%')).toBeInTheDocument();
      
      const progressBar = screen.getByTestId('overall-progress-bar');
      expect(progressBar).toHaveStyle({ width: '40%' });
    });

    test('should show upload statistics', () => {
      mockStore.queue = Array(10).fill(null).map((_, i) => ({
        id: String(i),
        file: new File([`test${i}`], `file${i}.jpg`, { type: 'image/jpeg' }),
        status: i < 3 ? 'complete' : i < 6 ? 'uploading' : i === 9 ? 'error' : 'pending',
        progress: i < 3 ? 100 : i < 6 ? 50 : 0,
        url: i < 3 ? `http://example.com/file${i}.jpg` : null,
        error: i === 9 ? 'Failed' : null,
      }));
      
      mockStore.getOverallProgress.mockReturnValue(45);
      mockStore.getActiveUploads.mockReturnValue(3);
      mockStore.getCompletedUploads.mockReturnValue(3);
      mockStore.getFailedUploads.mockReturnValue(1);

      render(<UploadProgressTracker />);

      expect(screen.getByText('3 Active')).toBeInTheDocument();
      expect(screen.getByText('3 Completed')).toBeInTheDocument();
      expect(screen.getByText('1 Failed')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should remove file from queue when remove button clicked', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'removable.jpg', { type: 'image/jpeg' }),
          status: 'complete',
          progress: 100,
          url: 'http://example.com/removable.jpg',
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      const removeButton = screen.getByRole('button', { name: /✓/i });
      fireEvent.click(removeButton);

      expect(mockStore.removeFromQueue).toHaveBeenCalledWith('1');
    });

    test('should retry failed upload when retry button clicked', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'failed.jpg', { type: 'image/jpeg' }),
          status: 'error',
          progress: 0,
          url: null,
          error: 'Network error',
        },
      ];
      mockStore.getFailedUploads.mockReturnValue(1);

      render(<UploadProgressTracker />);

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      expect(mockStore.retryUpload).toHaveBeenCalledWith('1');
    });

    test('should clear all completed uploads', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test1'], 'complete1.jpg', { type: 'image/jpeg' }),
          status: 'complete',
          progress: 100,
          url: 'http://example.com/complete1.jpg',
          error: null,
        },
        {
          id: '2',
          file: new File(['test2'], 'complete2.jpg', { type: 'image/jpeg' }),
          status: 'complete',
          progress: 100,
          url: 'http://example.com/complete2.jpg',
          error: null,
        },
      ];
      mockStore.getCompletedUploads.mockReturnValue(2);

      render(<UploadProgressTracker />);

      const clearButton = screen.getByRole('button', { name: /Clear Completed/i });
      fireEvent.click(clearButton);

      expect(mockStore.removeFromQueue).toHaveBeenCalledTimes(2);
      expect(mockStore.removeFromQueue).toHaveBeenCalledWith('1');
      expect(mockStore.removeFromQueue).toHaveBeenCalledWith('2');
    });

    test('should cancel all uploads when cancel all clicked', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test1'], 'file1.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
        {
          id: '2',
          file: new File(['test2'], 'file2.jpg', { type: 'image/jpeg' }),
          status: 'pending',
          progress: 0,
          url: null,
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      const cancelButton = screen.getByRole('button', { name: /Cancel All/i });
      fireEvent.click(cancelButton);

      expect(mockStore.clearQueue).toHaveBeenCalled();
    });
  });

  describe('Minimized State', () => {
    test('should show minimized view when minimized prop is true', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'file.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 60,
          url: null,
          error: null,
        },
      ];
      mockStore.getOverallProgress.mockReturnValue(60);
      mockStore.getActiveUploads.mockReturnValue(1);

      render(<UploadProgressTracker minimized />);

      expect(screen.getByText('1 upload in progress (60%)')).toBeInTheDocument();
      expect(screen.queryByText('file.jpg')).not.toBeInTheDocument();
    });

    test('should toggle between minimized and expanded', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'file.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 60,
          url: null,
          error: null,
        },
      ];
      mockStore.getOverallProgress.mockReturnValue(60);

      const { rerender } = render(<UploadProgressTracker minimized={false} />);

      expect(screen.getByText('file.jpg')).toBeInTheDocument();

      rerender(<UploadProgressTracker minimized={true} />);

      expect(screen.queryByText('file.jpg')).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar Animations', () => {
    test('should animate progress bar changes', async () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'file.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 0,
          url: null,
          error: null,
        },
      ];

      const { rerender } = render(<UploadProgressTracker />);

      const progressBar = screen.getByTestId('file-progress-1');
      expect(progressBar).toHaveStyle({ width: '0%' });

      // Update progress
      mockStore.queue[0].progress = 50;
      rerender(<UploadProgressTracker />);

      await waitFor(() => {
        expect(progressBar).toHaveStyle({ width: '50%' });
      });

      // Complete upload
      mockStore.queue[0].progress = 100;
      mockStore.queue[0].status = 'complete';
      rerender(<UploadProgressTracker />);

      await waitFor(() => {
        expect(progressBar).toHaveStyle({ width: '100%' });
      });
    });

    test('should show pulsing animation for active uploads', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'file.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      const progressBar = screen.getByTestId('file-progress-1');
      expect(progressBar).toHaveClass('animate-pulse');
    });
  });

  describe('File Type Icons', () => {
    test('should display correct icon for image files', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'image.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      expect(screen.getByTestId('icon-image')).toBeInTheDocument();
    });

    test('should display correct icon for video files', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'video.mp4', { type: 'video/mp4' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      expect(screen.getByTestId('icon-video')).toBeInTheDocument();
    });

    test('should display correct icon for audio files', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'audio.mp3', { type: 'audio/mpeg' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      expect(screen.getByTestId('icon-audio')).toBeInTheDocument();
    });

    test('should display generic icon for unknown file types', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'document.pdf', { type: 'application/pdf' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      expect(screen.getByTestId('icon-file')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'file.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 50,
          url: null,
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      expect(screen.getByRole('progressbar', { name: /file.jpg upload progress/i })).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: /overall upload progress/i })).toBeInTheDocument();
    });

    test('should announce status changes to screen readers', () => {
      mockStore.queue = [
        {
          id: '1',
          file: new File(['test'], 'file.jpg', { type: 'image/jpeg' }),
          status: 'complete',
          progress: 100,
          url: 'http://example.com/file.jpg',
          error: null,
        },
      ];

      render(<UploadProgressTracker />);

      const statusAnnouncement = screen.getByRole('status');
      expect(statusAnnouncement).toHaveTextContent('file.jpg upload complete');
    });
  });
});