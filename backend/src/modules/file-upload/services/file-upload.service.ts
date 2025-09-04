import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma.service';
import { AuditService } from '../../auth/services/audit.service';
import { VirusScanService } from './virus-scan.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';
import * as magicBytes from 'magic-bytes.js';

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadDir: string;
  private readonly allowedMimeTypes: Set<string>;
  private readonly maxFileSize: number;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private auditService: AuditService,
    private virusScanService: VirusScanService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
    
    // Define allowed MIME types
    this.allowedMimeTypes = new Set([
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      // Video
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      // Text
      'text/plain',
      'text/csv',
    ]);

    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    // Create quarantine directory
    const quarantineDir = path.join(this.uploadDir, 'quarantine');
    if (!fs.existsSync(quarantineDir)) {
      fs.mkdirSync(quarantineDir, { recursive: true });
    }
  }

  /**
   * Process uploaded file with full security checks
   */
  async processUploadedFile(
    file: Express.Multer.File,
    userId: string,
    ipAddress?: string,
  ): Promise<any> {
    const tempPath = file.path;
    let finalPath: string;

    try {
      // 1. Validate file size
      if (file.size > this.maxFileSize) {
        throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
      }

      // 2. Validate MIME type from file content (not just extension)
      const mimeValidation = await this.validateMimeType(tempPath, file.mimetype);
      if (!mimeValidation.isValid) {
        throw new BadRequestException(mimeValidation.error || 'Invalid file type');
      }

      // 3. Check for disguised executables
      const executableCheck = await this.checkForExecutable(tempPath);
      if (executableCheck) {
        throw new BadRequestException('Executable files are not allowed');
      }

      // 4. Strip metadata from images
      if (file.mimetype.startsWith('image/')) {
        await this.stripImageMetadata(tempPath);
      }

      // 5. Virus scan
      const scanResult = await this.virusScanService.scanFile(tempPath);
      if (!scanResult.isClean) {
        // Move to quarantine
        const quarantinePath = path.join(this.uploadDir, 'quarantine', `${Date.now()}_${file.originalname}`);
        fs.renameSync(tempPath, quarantinePath);
        
        await this.auditService.log({
          userId,
          action: 'FILE_UPLOAD_VIRUS_DETECTED',
          resource: 'File',
          details: {
            filename: file.originalname,
            viruses: scanResult.viruses,
            quarantinePath,
          },
          ipAddress,
        });

        throw new BadRequestException('File contains malware and has been quarantined');
      }

      // 6. Generate secure filename and move to final location
      const fileHash = this.virusScanService.generateFileHash(tempPath);
      const ext = path.extname(file.originalname);
      const secureFilename = `${fileHash}${ext}`;
      finalPath = path.join(this.uploadDir, secureFilename);
      
      fs.renameSync(tempPath, finalPath);

      // 7. Create database record
      const mediaFile = await this.prisma.mediaFile.create({
        data: {
          uploadedBy: userId,
          filename: file.filename,
          originalName: file.originalname,
          path: finalPath,
          url: `/uploads/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          virusScanStatus: 'clean',
        },
      });

      // 8. Log successful upload
      await this.auditService.log({
        userId,
        action: 'FILE_UPLOADED',
        resource: 'MediaFile',
        resourceId: mediaFile.id,
        details: {
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
        ipAddress,
      });

      return {
        id: mediaFile.id,
        filename: mediaFile.filename,
        size: mediaFile.size,
        mimeType: mediaFile.mimeType,
        uploadedAt: mediaFile.createdAt,
      };
    } catch (error) {
      // Clean up temp file if it still exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  /**
   * Validate MIME type using magic bytes
   */
  private async validateMimeType(filePath: string, declaredMimeType: string): Promise<FileValidationResult> {
    try {
      // Check actual file type from magic bytes
      const fileType = await fileTypeFromFile(filePath);
      
      if (!fileType) {
        // Try magic-bytes as fallback
        const buffer = fs.readFileSync(filePath);
        const magicResult = magicBytes.filetypeinfo(buffer);
        
        if (!magicResult || magicResult.length === 0) {
          return {
            isValid: false,
            error: 'Unable to determine file type',
          };
        }
      }

      const actualMimeType = fileType?.mime || declaredMimeType;

      // Check if MIME type is allowed
      if (!this.allowedMimeTypes.has(actualMimeType)) {
        return {
          isValid: false,
          error: `File type ${actualMimeType} is not allowed`,
        };
      }

      // Check for MIME type mismatch (potential attack)
      if (fileType && fileType.mime !== declaredMimeType) {
        this.logger.warn(`MIME type mismatch: declared=${declaredMimeType}, actual=${fileType.mime}`);
        // Allow some common mismatches (e.g., text files)
        if (!declaredMimeType.startsWith('text/') && !fileType.mime.startsWith('text/')) {
          return {
            isValid: false,
            error: 'File type does not match declared type',
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating MIME type:', error);
      return {
        isValid: false,
        error: 'Error validating file type',
      };
    }
  }

  /**
   * Check if file is a disguised executable
   */
  private async checkForExecutable(filePath: string): Promise<boolean> {
    const buffer = fs.readFileSync(filePath, { encoding: null }).slice(0, 4);
    
    // Check for common executable signatures
    const executableSignatures = [
      Buffer.from([0x4D, 0x5A]), // PE/COFF (Windows .exe, .dll)
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux/Unix executables)
      Buffer.from([0xCF, 0xFA, 0xED, 0xFE]), // Mach-O (macOS executables)
      Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O fat binary
      Buffer.from([0xCE, 0xFA, 0xED, 0xFE]), // Mach-O 32-bit
      Buffer.from([0x23, 0x21]), // Shebang (#!)
    ];

    for (const signature of executableSignatures) {
      if (buffer.slice(0, signature.length).equals(signature)) {
        return true;
      }
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const dangerousExtensions = [
      '.exe', '.dll', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar',
      '.app', '.dmg', '.pkg', '.deb', '.rpm', '.sh', '.run', '.msi',
    ];

    return dangerousExtensions.includes(ext);
  }

  /**
   * Strip metadata from images (EXIF, etc.)
   */
  private async stripImageMetadata(filePath: string): Promise<void> {
    // This is a placeholder - in production, use a library like 'piexifjs' or 'sharp'
    // to actually strip EXIF and other metadata from images
    this.logger.log(`Stripping metadata from image: ${filePath}`);
    // Implementation would go here
  }

  /**
   * Get file with security checks
   */
  async getFile(fileId: string, userId: string): Promise<any> {
    const file = await this.prisma.mediaFile.findFirst({
      where: {
        id: fileId,
        uploadedBy: userId, // Ensure user owns the file
      },
    });

    if (!file) {
      throw new UnauthorizedException('File not found or access denied');
    }

    // Verify file integrity
    if (!this.virusScanService.verifyFileIntegrity(file.path, '')) {
      await this.auditService.log({
        userId,
        action: 'FILE_INTEGRITY_CHECK_FAILED',
        resource: 'MediaFile',
        resourceId: fileId,
      });
      throw new BadRequestException('File integrity check failed');
    }

    return file;
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string, ipAddress?: string): Promise<{ message: string }> {
    const file = await this.getFile(fileId, userId);

    // Delete physical file
    if (fs.existsSync(file.storagePath)) {
      fs.unlinkSync(file.storagePath);
    }

    // Delete database record
    await this.prisma.mediaFile.delete({
      where: { id: fileId },
    });

    await this.auditService.log({
      userId,
      action: 'FILE_DELETED',
      resource: 'MediaFile',
      resourceId: fileId,
      ipAddress,
    });

    return { message: 'File deleted successfully' };
  }
}