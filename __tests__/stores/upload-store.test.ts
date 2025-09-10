import { renderHook, act } from '@testing-library/react';
import { useUploadStore } from '../../frontend/lib/stores/upload-store';

describe('UploadStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUploadStore());
    act(() => {
      result.current.clearQueue();
      result.current.clearError();
      result.current.clearSuccess();
    });
  });

  describe('Queue Management', () => {
    test('should add file to upload queue', () => {
      const { result } = renderHook(() => useUploadStore());
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.addToQueue(file);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].file).toBe(file);
      expect(result.current.queue[0].status).toBe('pending');
      expect(result.current.queue[0].progress).toBe(0);
    });

    test('should add multiple files to queue', () => {
      const { result } = renderHook(() => useUploadStore());
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.addMultipleToQueue(files);
      });

      expect(result.current.queue).toHaveLength(3);
      expect(result.current.queue[0].file.name).toBe('test1.jpg');
      expect(result.current.queue[2].file.name).toBe('test3.jpg');
    });

    test('should remove file from queue', () => {
      const { result } = renderHook(() => useUploadStore());
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.addToQueue(file);
      });

      const fileId = result.current.queue[0].id;

      act(() => {
        result.current.removeFromQueue(fileId);
      });

      expect(result.current.queue).toHaveLength(0);
    });

    test('should clear entire queue', () => {
      const { result } = renderHook(() => useUploadStore());
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.addMultipleToQueue(files);
        result.current.clearQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });
  });

  describe('Upload Progress', () => {
    test('should update file progress', () => {
      const { result } = renderHook(() => useUploadStore());
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.addToQueue(file);
      });

      const fileId = result.current.queue[0].id;

      act(() => {
        result.current.updateProgress(fileId, 50);
      });

      expect(result.current.queue[0].progress).toBe(50);
      expect(result.current.queue[0].status).toBe('uploading');
    });

    test('should mark file as complete', () => {
      const { result } = renderHook(() => useUploadStore());
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.addToQueue(file);
      });

      const fileId = result.current.queue[0].id;

      act(() => {
        result.current.markComplete(fileId, 'http://example.com/test.jpg');
      });

      expect(result.current.queue[0].status).toBe('complete');
      expect(result.current.queue[0].progress).toBe(100);
      expect(result.current.queue[0].url).toBe('http://example.com/test.jpg');
    });

    test('should mark file as failed', () => {
      const { result } = renderHook(() => useUploadStore());
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.addToQueue(file);
      });

      const fileId = result.current.queue[0].id;

      act(() => {
        result.current.markFailed(fileId, 'Upload failed');
      });

      expect(result.current.queue[0].status).toBe('error');
      expect(result.current.queue[0].error).toBe('Upload failed');
    });
  });

  describe('Overall Progress', () => {
    test('should calculate overall progress correctly', () => {
      const { result } = renderHook(() => useUploadStore());
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.addMultipleToQueue(files);
      });

      const [id1, id2] = result.current.queue.map(f => f.id);

      act(() => {
        result.current.updateProgress(id1, 50);
        result.current.updateProgress(id2, 30);
      });

      expect(result.current.getOverallProgress()).toBe(40);
    });

    test('should return 100 when all files complete', () => {
      const { result } = renderHook(() => useUploadStore());
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.addMultipleToQueue(files);
      });

      const [id1, id2] = result.current.queue.map(f => f.id);

      act(() => {
        result.current.markComplete(id1, 'url1');
        result.current.markComplete(id2, 'url2');
      });

      expect(result.current.getOverallProgress()).toBe(100);
    });

    test('should return 0 for empty queue', () => {
      const { result } = renderHook(() => useUploadStore());
      
      expect(result.current.getOverallProgress()).toBe(0);
    });
  });

  describe('Message Management', () => {
    test('should prevent duplicate success messages', () => {
      const { result } = renderHook(() => useUploadStore());
      
      act(() => {
        result.current.showSuccess('Upload complete!');
      });

      expect(result.current.successMessage).toBe('Upload complete!');
      expect(result.current.messageShown).toBe(true);

      act(() => {
        result.current.showSuccess('Upload complete!');
      });

      // Should not change anything if same message
      expect(result.current.successMessage).toBe('Upload complete!');
    });

    test('should allow different success messages', () => {
      const { result } = renderHook(() => useUploadStore());
      
      act(() => {
        result.current.showSuccess('First upload complete!');
      });

      expect(result.current.successMessage).toBe('First upload complete!');

      act(() => {
        result.current.showSuccess('Second upload complete!');
      });

      expect(result.current.successMessage).toBe('Second upload complete!');
    });

    test('should set and clear error messages', () => {
      const { result } = renderHook(() => useUploadStore());
      
      act(() => {
        result.current.setError('Upload failed');
      });

      expect(result.current.error).toBe('Upload failed');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    test('should clear success message', () => {
      const { result } = renderHook(() => useUploadStore());
      
      act(() => {
        result.current.showSuccess('Upload complete!');
        result.current.clearSuccess();
      });

      expect(result.current.successMessage).toBeNull();
      expect(result.current.messageShown).toBe(false);
    });
  });

  describe('Active Uploads', () => {
    test('should track active uploads correctly', () => {
      const { result } = renderHook(() => useUploadStore());
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.addMultipleToQueue(files);
      });

      const [id1, id2, id3] = result.current.queue.map(f => f.id);

      act(() => {
        result.current.updateProgress(id1, 50);
        result.current.updateProgress(id2, 30);
      });

      expect(result.current.getActiveUploads()).toBe(2);

      act(() => {
        result.current.markComplete(id1, 'url1');
      });

      expect(result.current.getActiveUploads()).toBe(1);

      act(() => {
        result.current.markFailed(id2, 'Failed');
      });

      expect(result.current.getActiveUploads()).toBe(0);
    });
  });

  describe('Upload Statistics', () => {
    test('should get correct completed uploads count', () => {
      const { result } = renderHook(() => useUploadStore());
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.addMultipleToQueue(files);
      });

      const [id1, id2] = result.current.queue.map(f => f.id);

      act(() => {
        result.current.markComplete(id1, 'url1');
      });

      expect(result.current.getCompletedUploads()).toBe(1);

      act(() => {
        result.current.markComplete(id2, 'url2');
      });

      expect(result.current.getCompletedUploads()).toBe(2);
    });

    test('should get correct failed uploads count', () => {
      const { result } = renderHook(() => useUploadStore());
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      act(() => {
        result.current.addMultipleToQueue(files);
      });

      const [id1, id2] = result.current.queue.map(f => f.id);

      act(() => {
        result.current.markFailed(id1, 'Error 1');
        result.current.markFailed(id2, 'Error 2');
      });

      expect(result.current.getFailedUploads()).toBe(2);
    });
  });
});