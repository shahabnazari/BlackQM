interface UploadTask {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  retryCount: number;
  startTime?: number;
  endTime?: number;
  abortController?: AbortController;
}

interface UploadQueueOptions {
  maxConcurrent?: number;
  maxRetries?: number;
  retryDelay?: number;
  chunkSize?: number;
  onProgress?: (task: UploadTask) => void;
  onComplete?: (task: UploadTask) => void;
  onError?: (task: UploadTask, error: Error) => void;
  onQueueUpdate?: (queue: UploadTask[]) => void;
}

export class UploadQueueService {
  private queue: Map<string, UploadTask> = new Map();
  private activeUploads: Set<string> = new Set();
  private options: Required<UploadQueueOptions>;
  private processing = false;

  constructor(options: UploadQueueOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      chunkSize: options.chunkSize || 1024 * 1024, // 1MB chunks
      onProgress: options.onProgress || (() => {}),
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || (() => {}),
      onQueueUpdate: options.onQueueUpdate || (() => {}),
    };
  }

  async addFiles(files: File[]): Promise<string[]> {
    const taskIds: string[] = [];

    for (const file of files) {
      const taskId = this.generateTaskId();
      const task: UploadTask = {
        id: taskId,
        file,
        status: 'pending',
        progress: 0,
        retryCount: 0,
      };

      this.queue.set(taskId, task);
      taskIds.push(taskId);
    }

    this.notifyQueueUpdate();
    this.processQueue();

    return taskIds;
  }

  async addFile(file: File): Promise<string> {
    const [taskId] = await this.addFiles([file]);
    if (!taskId) {
      throw new Error('Failed to add file to upload queue');
    }
    return taskId;
  }

  cancelUpload(taskId: string): boolean {
    const task = this.queue.get(taskId);
    if (!task) return false;

    if (task.status === 'uploading' && task.abortController) {
      task.abortController.abort();
    }

    task.status = 'cancelled';
    this.activeUploads.delete(taskId);
    this.queue.delete(taskId);
    this.notifyQueueUpdate();
    this.processQueue();

    return true;
  }

  cancelAll(): void {
    for (const [_taskId, task] of this.queue) {
      if (task.status === 'uploading' && task.abortController) {
        task.abortController.abort();
      }
      task.status = 'cancelled';
    }

    this.activeUploads.clear();
    this.queue.clear();
    this.notifyQueueUpdate();
  }

  retryFailed(): void {
    for (const task of this.queue.values()) {
      if (task.status === 'failed') {
        task.status = 'pending';
        task.retryCount = 0;
        task.progress = 0;
      }
    }

    this.notifyQueueUpdate();
    this.processQueue();
  }

  getQueueStatus(): {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
    progress: number;
  } {
    let pending = 0;
    let uploading = 0;
    let completed = 0;
    let failed = 0;
    let totalProgress = 0;

    for (const task of this.queue.values()) {
      switch (task.status) {
        case 'pending':
          pending++;
          break;
        case 'uploading':
          uploading++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
      totalProgress += task.progress;
    }

    const total = this.queue.size;
    const progress = total > 0 ? totalProgress / total : 0;

    return { total, pending, uploading, completed, failed, progress };
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.hasWork()) {
      // Wait if we're at max concurrent uploads
      if (this.activeUploads.size >= this.options.maxConcurrent) {
        await this.waitForSlot();
      }

      // Get next pending task
      const task = this.getNextPendingTask();
      if (!task) break;

      // Start upload
      this.uploadTask(task);
    }

    this.processing = false;
  }

  private hasWork(): boolean {
    return Array.from(this.queue.values()).some(t => t.status === 'pending');
  }

  private getNextPendingTask(): UploadTask | null {
    for (const task of this.queue.values()) {
      if (task.status === 'pending') {
        return task;
      }
    }
    return null;
  }

  private async waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.activeUploads.size < this.options.maxConcurrent) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private async uploadTask(task: UploadTask): Promise<void> {
    task.status = 'uploading';
    task.startTime = Date.now();
    task.abortController = new AbortController();
    this.activeUploads.add(task.id);
    this.notifyQueueUpdate();

    try {
      // For large files, use chunked upload
      if (task.file.size > this.options.chunkSize * 5) {
        await this.uploadChunked(task);
      } else {
        await this.uploadSimple(task);
      }

      task.status = 'completed';
      task.progress = 100;
      task.endTime = Date.now();
      this.options.onComplete(task);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        task.status = 'cancelled';
      } else {
        task.error = error.message;

        if (task.retryCount < this.options.maxRetries) {
          task.retryCount++;
          task.status = 'pending';
          task.progress = 0;

          // Exponential backoff
          const delay =
            this.options.retryDelay * Math.pow(2, task.retryCount - 1);
          setTimeout(() => this.processQueue(), delay);
        } else {
          task.status = 'failed';
          this.options.onError(task, error);
        }
      }
    } finally {
      this.activeUploads.delete(task.id);

      // Remove completed tasks after a delay
      if (task.status === 'completed') {
        setTimeout(() => {
          this.queue.delete(task.id);
          this.notifyQueueUpdate();
        }, 5000);
      }

      this.notifyQueueUpdate();

      // Continue processing queue
      if (!this.processing) {
        this.processQueue();
      }
    }
  }

  private async uploadSimple(task: UploadTask): Promise<void> {
    const formData = new FormData();
    formData.append('file', task.file);
    formData.append('type', this.getFileType(task.file));

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e: any) => {
      if (e.lengthComputable) {
        task.progress = (e.loaded / e.total) * 100;
        this.options.onProgress(task);
        this.notifyQueueUpdate();
      }
    });

    // Handle abort
    task.abortController?.signal.addEventListener('abort', () => {
      xhr.abort();
    });

    return new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Get study ID from URL or context
      const studyId = this.getStudyId();
      xhr.open('POST', `/api/studies/${studyId}/stimuli`);
      xhr.send(formData);
    });
  }

  private async uploadChunked(task: UploadTask): Promise<void> {
    const chunks = Math.ceil(task.file.size / this.options.chunkSize);
    const fileId = this.generateTaskId();

    for (let i = 0; i < chunks; i++) {
      if (task.abortController?.signal.aborted) {
        throw new Error('Upload cancelled');
      }

      const start = i * this.options.chunkSize;
      const end = Math.min(start + this.options.chunkSize, task.file.size);
      const chunk = task.file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', chunks.toString());
      formData.append('fileId', fileId);
      formData.append('fileName', task.file.name);
      formData.append('fileType', task.file.type || 'application/octet-stream');

      const studyId = this.getStudyId();
      const fetchOptions: RequestInit = {
        method: 'PATCH',
        body: formData,
      };
      if (task.abortController) {
        fetchOptions.signal = task.abortController.signal;
      }
      const response = await fetch(
        `/api/studies/${studyId}/stimuli`,
        fetchOptions
      );

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }

      // Update progress
      task.progress = ((i + 1) / chunks) * 100;
      this.options.onProgress(task);
      this.notifyQueueUpdate();
    }
  }

  private getFileType(file: File): string {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }

  private getStudyId(): string {
    // Get from URL or context
    const pathParts = window.location.pathname.split('/');
    const studyIndex = pathParts.indexOf('studies');
    if (studyIndex !== -1) {
      const studyId = pathParts[studyIndex + 1];
      if (studyId) {
        return studyId;
      }
    }
    return 'default';
  }

  private generateTaskId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyQueueUpdate(): void {
    this.options.onQueueUpdate(Array.from(this.queue.values()));
  }
}

// Singleton instance
let uploadQueueInstance: UploadQueueService | null = null;

export function getUploadQueue(
  options?: UploadQueueOptions
): UploadQueueService {
  if (!uploadQueueInstance) {
    uploadQueueInstance = new UploadQueueService(options);
  }
  return uploadQueueInstance;
}

export function resetUploadQueue(): void {
  if (uploadQueueInstance) {
    uploadQueueInstance.cancelAll();
    uploadQueueInstance = null;
  }
}
