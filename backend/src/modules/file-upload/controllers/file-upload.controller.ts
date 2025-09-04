import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Req,
  Res,
  Ip,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { FileUploadService } from '../services/file-upload.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../../rate-limiting/guards/rate-limit.guard';
import { FileUploadRateLimit } from '../../rate-limiting/decorators/rate-limit.decorator';

@ApiTags('File Upload')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseGuards(RateLimitGuard)
  @FileUploadRateLimit()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          // Generate temporary filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `temp-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        // Basic extension check (more thorough check in service)
        const allowedExtensions = [
          '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx',
          '.xls', '.xlsx', '.mp3', '.mp4', '.wav', '.txt', '.csv',
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return cb(new BadRequestException('File type not allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file with virus scanning' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or virus detected' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.fileUploadService.processUploadedFile(
      file,
      req.user.id,
      ipAddress,
    );
  }

  @Post('upload-multiple')
  @UseGuards(RateLimitGuard)
  @FileUploadRateLimit()
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `temp-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
      fileFilter: (req, file, cb) => {
        const allowedExtensions = [
          '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx',
          '.xls', '.xlsx', '.mp3', '.mp4', '.wav', '.txt', '.csv',
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return cb(new BadRequestException('File type not allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files with virus scanning' })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid files or virus detected' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.fileUploadService.processUploadedFile(
          file,
          req.user.id,
          ipAddress,
        );
        results.push(result);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      uploaded: results,
      failed: errors,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileMetadata(@Param('id') id: string, @Req() req: any) {
    return this.fileUploadService.getFile(id, req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  @ApiResponse({ status: 200, description: 'File downloaded' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const file = await this.fileUploadService.getFile(id, req.user.id);
    
    if (!fs.existsSync(file.storagePath)) {
      throw new BadRequestException('File not found on disk');
    }

    res.download(file.storagePath, file.filename);
  }



  @Post('test/eicar')
  @ApiOperation({ summary: 'Upload EICAR test file for virus scanning validation' })
  @ApiResponse({ status: 400, description: 'EICAR test file detected (expected behavior)' })
  async testEicarUpload(@Req() req: any, @Ip() ipAddress: string) {
    // Create EICAR test file
    const eicarContent = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const tempPath = path.join('./uploads/temp', `eicar-test-${Date.now()}.txt`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempPath, eicarContent);
    
    const testFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'eicar-test.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      destination: './uploads/temp',
      filename: path.basename(tempPath),
      path: tempPath,
      size: Buffer.byteLength(eicarContent),
      stream: null as any,
      buffer: null as any,
    };

    try {
      await this.fileUploadService.processUploadedFile(testFile, req.user.id, ipAddress);
      return { message: 'Warning: EICAR test file was not detected!' };
    } catch (error) {
      return {
        message: 'Success: EICAR test file was properly detected and blocked',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    return this.fileUploadService.deleteFile(id, req.user.id, ipAddress);
  }
}