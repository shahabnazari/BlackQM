import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Request } from 'express';

// File type configurations
export const ALLOWED_FILE_TYPES = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  videos: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    extensions: ['.mp4', '.webm', '.ogv', '.mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    extensions: ['.mp3', '.wav', '.ogg', '.weba'],
    maxSize: 20 * 1024 * 1024, // 20MB
  },
  documents: {
    mimeTypes: ['application/pdf', 'text/plain'],
    extensions: ['.pdf', '.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

// Upload directories
const UPLOAD_DIRS = {
  stimuli: 'uploads/stimuli',
  logos: 'uploads/logos',
  temp: 'uploads/temp',
  exports: 'uploads/exports',
};

// Ensure upload directories exist
export async function ensureUploadDirs(): Promise<void> {
  for (const dir of Object.values(UPLOAD_DIRS)) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

// Generate unique filename
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

// Storage configuration for different upload types
export const storageConfigs = {
  stimuli: multer.diskStorage({
    destination: async (req, file, cb) => {
      await ensureUploadDirs();
      cb(null, UPLOAD_DIRS.stimuli);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),

  logos: multer.diskStorage({
    destination: async (req, file, cb) => {
      await ensureUploadDirs();
      cb(null, UPLOAD_DIRS.logos);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),

  temp: multer.diskStorage({
    destination: async (req, file, cb) => {
      await ensureUploadDirs();
      cb(null, UPLOAD_DIRS.temp);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),
};

// File filter for validation
export function createFileFilter(allowedTypes: keyof typeof ALLOWED_FILE_TYPES | 'all') {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if file type is allowed
    if (allowedTypes === 'all') {
      // Allow all configured types
      const allMimeTypes = Object.values(ALLOWED_FILE_TYPES).flatMap(t => t.mimeTypes);
      if (allMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`));
      }
    } else {
      const config = ALLOWED_FILE_TYPES[allowedTypes];
      if (config.mimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed for ${allowedTypes}`));
      }
    }
  };
}

// Create multer instance with configuration
export function createUploadMiddleware(
  type: 'stimuli' | 'logos' | 'temp',
  fileTypes: keyof typeof ALLOWED_FILE_TYPES | 'all' = 'all',
  maxFiles: number = 10
) {
  const storage = storageConfigs[type];
  const fileFilter = createFileFilter(fileTypes);
  
  // Calculate max file size based on type
  let maxFileSize = 10 * 1024 * 1024; // Default 10MB
  if (fileTypes !== 'all' && ALLOWED_FILE_TYPES[fileTypes]) {
    maxFileSize = ALLOWED_FILE_TYPES[fileTypes].maxSize;
  } else if (fileTypes === 'all') {
    // Use the maximum size from all types
    maxFileSize = Math.max(...Object.values(ALLOWED_FILE_TYPES).map(t => t.maxSize));
  }

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
  });
}

// Cleanup old temporary files
export async function cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
  try {
    const tempDir = UPLOAD_DIRS.temp;
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const maxAge = olderThanHours * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        console.log(`Deleted old temp file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}

// File metadata extraction
export async function extractFileMetadata(filePath: string, mimeType: string): Promise<any> {
  const stats = await fs.stat(filePath);
  const metadata: any = {
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };

  // Add type-specific metadata extraction here
  // For images: dimensions using sharp
  // For videos: duration using ffprobe
  // For audio: duration using music-metadata

  return metadata;
}

// Move file from temp to permanent storage
export async function moveFromTemp(
  tempFilename: string,
  destination: 'stimuli' | 'logos'
): Promise<string> {
  const tempPath = path.join(UPLOAD_DIRS.temp, tempFilename);
  const destPath = path.join(UPLOAD_DIRS[destination], tempFilename);
  
  await fs.rename(tempPath, destPath);
  
  return destPath;
}

// Delete uploaded file
export async function deleteUploadedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', filePath, error);
  }
}

// Get file URL for serving
export function getFileUrl(filePath: string, baseUrl: string): string {
  const relativePath = filePath.replace(/^uploads\//, '');
  return `${baseUrl}/uploads/${relativePath}`;
}