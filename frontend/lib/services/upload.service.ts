/**
 * Enterprise-grade Upload Service
 * Handles all file uploads with proper error handling, validation, and optimization
 */

export interface UploadOptions {
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  quality?: number; // for image compression (0-100)
  maxWidth?: number;
  maxHeight?: number;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

class UploadService {
  private readonly DEFAULT_MAX_SIZE = 10; // 10MB
  private readonly DEFAULT_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp'
  ];

  /**
   * Upload a logo image
   */
  async uploadLogo(file: File, options?: UploadOptions): Promise<UploadResult> {
    const maxSize = options?.maxSize || 2; // 2MB for logos
    const acceptedTypes = options?.acceptedTypes || this.DEFAULT_IMAGE_TYPES;

    // Validate file
    this.validateFile(file, maxSize, acceptedTypes);

    // Create form data
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await this.fetchWithTimeout('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload logo');
      }

      const result = await response.json();
      console.log('Logo uploaded successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Logo upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload a signature image (file or base64)
   */
  async uploadSignature(
    data: File | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const formData = new FormData();

    if (data instanceof File) {
      const maxSize = options?.maxSize || 2; // 2MB for signatures
      const acceptedTypes = options?.acceptedTypes || this.DEFAULT_IMAGE_TYPES;
      this.validateFile(data, maxSize, acceptedTypes);
      formData.append('signature', data);
    } else {
      // Base64 data from canvas
      formData.append('base64', data);
    }

    try {
      const response = await this.fetchWithTimeout('/api/upload/signature', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload signature');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Signature upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload a general image with processing
   */
  async uploadImage(
    file: File,
    type: string = 'general',
    options?: UploadOptions
  ): Promise<UploadResult> {
    const maxSize = options?.maxSize || this.DEFAULT_MAX_SIZE;
    const acceptedTypes = options?.acceptedTypes || this.DEFAULT_IMAGE_TYPES;

    // Validate file
    this.validateFile(file, maxSize, acceptedTypes);

    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    formData.append('maxWidth', String(options?.maxWidth || 1200));
    formData.append('maxHeight', String(options?.maxHeight || 800));
    formData.append('quality', String(options?.quality || 85));

    try {
      const response = await this.fetchWithProgress(
        '/api/upload/image',
        {
          method: 'POST',
          body: formData,
        },
        options?.onProgress
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload edited image (base64) from image editor
   */
  async uploadEditedImage(base64Data: string, type: string = 'edited'): Promise<UploadResult> {
    try {
      const response = await this.fetchWithTimeout('/api/upload/image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save edited image');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Edited image upload failed:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File, maxSizeMB: number, acceptedTypes: string[]): void {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
      );
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(
        `File size too large. Maximum size is ${maxSizeMB}MB`
      );
    }
  }

  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout - please try again');
      }
      throw error;
    }
  }

  /**
   * Fetch with progress tracking (for large files)
   */
  private async fetchWithProgress(
    url: string,
    options: RequestInit,
    _onProgress?: (progress: number) => void
  ): Promise<Response> {
    // For now, just use regular fetch
    // In production, you might want to use XMLHttpRequest for progress tracking
    return this.fetchWithTimeout(url, options);
  }

  /**
   * Compress image before upload (client-side)
   */
  async compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 800,
    quality: number = 0.85
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  }

  /**
   * Delete uploaded file (for cleanup)
   */
  async deleteFile(url: string): Promise<void> {
    try {
      const response = await this.fetchWithTimeout('/api/upload/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        console.error('Failed to delete file');
      }
    } catch (error: any) {
      console.error('Delete file error:', error);
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService();

// Export convenience functions
export const uploadLogo = uploadService.uploadLogo.bind(uploadService);
export const uploadSignature = uploadService.uploadSignature.bind(uploadService);
export const uploadImage = uploadService.uploadImage.bind(uploadService);
export const uploadEditedImage = uploadService.uploadEditedImage.bind(uploadService);
export const compressImage = uploadService.compressImage.bind(uploadService);