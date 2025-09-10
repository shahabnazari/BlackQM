import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { StimuliUploadSystem } from '../../frontend/components/stimuli/StimuliUploadSystem';
import { UploadProgressTracker } from '../../frontend/components/stimuli/UploadProgressTracker';
import { useUploadStore } from '../../frontend/lib/stores/upload-store';

// Mock server setup
const server = setupServer(
  rest.post('/api/upload/stimuli', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          id: 'stim-123',
          filename: 'test.jpg',
          url: 'http://example.com/test.jpg',
          type: 'image',
          metadata: {
            width: 800,
            height: 600,
            size: 150000,
          },
        },
      })
    );
  }),
  
  rest.post('/api/upload/batch', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          uploaded: 3,
          failed: 0,
          results: [
            { id: 'stim-1', filename: 'file1.jpg', url: 'http://example.com/file1.jpg' },
            { id: 'stim-2', filename: 'file2.jpg', url: 'http://example.com/file2.jpg' },
            { id: 'stim-3', filename: 'file3.jpg', url: 'http://example.com/file3.jpg' },
          ],
        },
      })
    );
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Clear store after each test
  useUploadStore.getState().clearQueue();
  useUploadStore.getState().clearError();
  useUploadStore.getState().clearSuccess();
});
afterAll(() => server.close());

describe('Upload Flow Integration Tests', () => {
  const defaultProps = {
    studyId: 'study-123',
    totalCells: 20,
    onUploadComplete: jest.fn(),
    onError: jest.fn(),
  };

  describe('Single File Upload', () => {
    test('should complete single file upload successfully', async () => {
      const user = userEvent.setup();
      const onUploadComplete = jest.fn();

      render(
        <>
          <StimuliUploadSystem 
            {...defaultProps}
            onUploadComplete={onUploadComplete}
          />
          <UploadProgressTracker />
        </>
      );

      // Create a test file
      const file = new File(['test content'], 'test-image.jpg', { 
        type: 'image/jpeg' 
      });

      // Find file input and upload file
      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, file);

      // Wait for upload to start
      await waitFor(() => {
        expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      });

      // Check progress is shown
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText(/complete/i)).toBeInTheDocument();
      });

      // Verify callback was called
      expect(onUploadComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'stim-123',
          filename: 'test.jpg',
          url: 'http://example.com/test.jpg',
        })
      );

      // Verify success message
      expect(useUploadStore.getState().successMessage).toBeTruthy();
    });

    test('should handle upload failure gracefully', async () => {
      // Override server to return error
      server.use(
        rest.post('/api/upload/stimuli', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              error: 'Upload failed: Server error',
            })
          );
        })
      );

      const user = userEvent.setup();
      const onError = jest.fn();

      render(
        <>
          <StimuliUploadSystem 
            {...defaultProps}
            onError={onError}
          />
          <UploadProgressTracker />
        </>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, file);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });

      // Verify error callback
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Server error')
      );

      // Check retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    test('should validate file type before upload', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          onError={onError}
          acceptedFileTypes={['image/jpeg', 'image/png']}
        />
      );

      // Try to upload invalid file type
      const file = new File(['test'], 'document.pdf', { 
        type: 'application/pdf' 
      });

      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, file);

      // Should show validation error
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('File type not allowed')
        );
      });

      // File should not be added to queue
      expect(useUploadStore.getState().queue).toHaveLength(0);
    });

    test('should enforce file size limits', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          onError={onError}
          maxFileSize={1024} // 1KB limit
        />
      );

      // Create large file
      const largeContent = new Array(2000).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { 
        type: 'image/jpeg' 
      });

      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, file);

      // Should show size error
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('File size exceeds limit')
        );
      });
    });
  });

  describe('Multiple File Upload', () => {
    test('should handle batch upload successfully', async () => {
      const user = userEvent.setup();
      const onUploadComplete = jest.fn();

      render(
        <>
          <StimuliUploadSystem 
            {...defaultProps}
            onUploadComplete={onUploadComplete}
            allowMultiple
          />
          <UploadProgressTracker />
        </>
      );

      // Create multiple files
      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
        new File(['content3'], 'file3.jpg', { type: 'image/jpeg' }),
      ];

      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, files);

      // Wait for all files to appear
      await waitFor(() => {
        expect(screen.getByText('file1.jpg')).toBeInTheDocument();
        expect(screen.getByText('file2.jpg')).toBeInTheDocument();
        expect(screen.getByText('file3.jpg')).toBeInTheDocument();
      });

      // Check overall progress
      expect(screen.getByText(/overall progress/i)).toBeInTheDocument();

      // Wait for batch completion
      await waitFor(() => {
        expect(screen.getAllByText(/complete/i)).toHaveLength(3);
      });

      // Verify success message for batch
      expect(screen.getByText(/3 files uploaded successfully/i)).toBeInTheDocument();
    });

    test('should handle partial batch failure', async () => {
      let callCount = 0;
      server.use(
        rest.post('/api/upload/stimuli', (req, res, ctx) => {
          callCount++;
          // Fail every second upload
          if (callCount % 2 === 0) {
            return res(
              ctx.status(500),
              ctx.json({ success: false, error: 'Server error' })
            );
          }
          return res(
            ctx.json({
              success: true,
              data: {
                id: `stim-${callCount}`,
                filename: `file${callCount}.jpg`,
                url: `http://example.com/file${callCount}.jpg`,
              },
            })
          );
        })
      );

      const user = userEvent.setup();
      const onError = jest.fn();

      render(
        <>
          <StimuliUploadSystem 
            {...defaultProps}
            onError={onError}
            allowMultiple
          />
          <UploadProgressTracker />
        </>
      );

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
        new File(['content3'], 'file3.jpg', { type: 'image/jpeg' }),
      ];

      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, files);

      // Wait for processing
      await waitFor(() => {
        expect(screen.getByText(/1 failed/i)).toBeInTheDocument();
      });

      // Check mixed results
      expect(screen.getByText(/2 completed/i)).toBeInTheDocument();
      expect(screen.getByText(/1 failed/i)).toBeInTheDocument();

      // Retry button should be available for failed files
      const retryButtons = screen.getAllByRole('button', { name: /retry/i });
      expect(retryButtons.length).toBeGreaterThan(0);
    });

    test('should respect concurrent upload limits', async () => {
      const uploadPromises: Promise<any>[] = [];
      let activeUploads = 0;
      let maxConcurrent = 0;

      server.use(
        rest.post('/api/upload/stimuli', async (req, res, ctx) => {
          activeUploads++;
          maxConcurrent = Math.max(maxConcurrent, activeUploads);
          
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          activeUploads--;
          return res(
            ctx.json({
              success: true,
              data: { id: 'stim-1', filename: 'file.jpg', url: 'http://example.com/file.jpg' },
            })
          );
        })
      );

      const user = userEvent.setup();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          allowMultiple
          maxConcurrentUploads={2}
        />
      );

      // Create 5 files
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([`content${i}`], `file${i}.jpg`, { type: 'image/jpeg' })
      );

      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, files);

      // Wait for all uploads to complete
      await waitFor(() => {
        expect(useUploadStore.getState().getCompletedUploads()).toBe(5);
      }, { timeout: 2000 });

      // Verify concurrent limit was respected
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('Upload Progress Tracking', () => {
    test('should track individual file progress accurately', async () => {
      server.use(
        rest.post('/api/upload/stimuli', async (req, res, ctx) => {
          // Simulate progress updates
          const progressSteps = [0, 25, 50, 75, 100];
          for (const progress of progressSteps) {
            // In real implementation, this would be done via progress events
            useUploadStore.getState().updateProgress('file-1', progress);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          return res(
            ctx.json({
              success: true,
              data: { id: 'stim-1', filename: 'file.jpg', url: 'http://example.com/file.jpg' },
            })
          );
        })
      );

      const user = userEvent.setup();

      render(
        <>
          <StimuliUploadSystem {...defaultProps} />
          <UploadProgressTracker />
        </>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload stimuli/i);
      
      // Mock the file ID assignment
      const originalAddToQueue = useUploadStore.getState().addToQueue;
      useUploadStore.getState().addToQueue = (file) => {
        originalAddToQueue(file);
        // Override the ID for testing
        useUploadStore.getState().queue[0].id = 'file-1';
      };

      await user.upload(fileInput, file);

      // Verify progress updates
      await waitFor(() => expect(screen.getByText('25%')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('50%')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('75%')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText(/complete/i)).toBeInTheDocument());
    });

    test('should calculate overall progress for multiple files', async () => {
      const user = userEvent.setup();

      render(
        <>
          <StimuliUploadSystem 
            {...defaultProps}
            allowMultiple
          />
          <UploadProgressTracker />
        </>
      );

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
      ];

      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, files);

      // Simulate different progress for each file
      const queue = useUploadStore.getState().queue;
      useUploadStore.getState().updateProgress(queue[0].id, 60);
      useUploadStore.getState().updateProgress(queue[1].id, 40);

      // Overall should be average: (60 + 40) / 2 = 50
      expect(useUploadStore.getState().getOverallProgress()).toBe(50);
      
      await waitFor(() => {
        expect(screen.getByText('Overall Progress: 50%')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop Upload', () => {
    test('should handle drag and drop file upload', async () => {
      const onUploadComplete = jest.fn();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          onUploadComplete={onUploadComplete}
          enableDragDrop
        />
      );

      const dropZone = screen.getByTestId('drop-zone');
      
      // Create file for drop
      const file = new File(['test'], 'dropped.jpg', { type: 'image/jpeg' });
      const dataTransfer = {
        files: [file],
        items: [{ kind: 'file', getAsFile: () => file }],
        types: ['Files'],
      };

      // Simulate drag enter
      fireEvent.dragEnter(dropZone, { dataTransfer });
      expect(dropZone).toHaveClass('drag-over');

      // Simulate drop
      fireEvent.drop(dropZone, { dataTransfer });

      // File should be uploaded
      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalled();
      });
    });

    test('should reject invalid files on drop', async () => {
      const onError = jest.fn();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          onError={onError}
          acceptedFileTypes={['image/jpeg']}
          enableDragDrop
        />
      );

      const dropZone = screen.getByTestId('drop-zone');
      
      // Drop invalid file type
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const dataTransfer = {
        files: [file],
        items: [{ kind: 'file', getAsFile: () => file }],
        types: ['Files'],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('File type not allowed')
        );
      });
    });
  });

  describe('Upload Completion', () => {
    test('should show completion message when all cells filled', async () => {
      const user = userEvent.setup();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          totalCells={2}
          allowMultiple
        />
      );

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
      ];

      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, files);

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/all stimuli uploaded successfully/i)).toBeInTheDocument();
      });

      // Should disable further uploads
      expect(fileInput).toBeDisabled();
    });

    test('should prevent duplicate completion messages', async () => {
      const user = userEvent.setup();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          totalCells={1}
        />
      );

      const file = new File(['content'], 'file.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, file);

      // Wait for completion message
      await waitFor(() => {
        expect(screen.getByText(/all stimuli uploaded successfully/i)).toBeInTheDocument();
      });

      // Try to trigger completion again
      useUploadStore.getState().showSuccess('All stimuli uploaded successfully!');

      // Should still only have one success message
      const successMessages = screen.getAllByText(/all stimuli uploaded successfully/i);
      expect(successMessages).toHaveLength(1);
    });
  });

  describe('Error Recovery', () => {
    test('should allow retry after network failure', async () => {
      let attemptCount = 0;
      server.use(
        rest.post('/api/upload/stimuli', (req, res, ctx) => {
          attemptCount++;
          if (attemptCount === 1) {
            return res.networkError('Connection failed');
          }
          return res(
            ctx.json({
              success: true,
              data: { id: 'stim-1', filename: 'file.jpg', url: 'http://example.com/file.jpg' },
            })
          );
        })
      );

      const user = userEvent.setup();

      render(
        <>
          <StimuliUploadSystem {...defaultProps} />
          <UploadProgressTracker />
        </>
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, file);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText(/complete/i)).toBeInTheDocument();
      });
    });

    test('should clear errors when starting new upload', async () => {
      const user = userEvent.setup();

      render(
        <StimuliUploadSystem 
          {...defaultProps}
          onError={jest.fn()}
        />
      );

      // Set an error state
      useUploadStore.getState().setError('Previous error');
      expect(useUploadStore.getState().error).toBe('Previous error');

      // Start new upload
      const file = new File(['test'], 'new.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/upload stimuli/i);
      await user.upload(fileInput, file);

      // Error should be cleared
      expect(useUploadStore.getState().error).toBeNull();
    });
  });
});