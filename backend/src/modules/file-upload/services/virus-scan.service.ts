import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const NodeClam = require('clamscan');
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class VirusScanService {
  private readonly logger = new Logger(VirusScanService.name);
  private clamscan: any;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeScanner();
  }

  /**
   * Initialize ClamAV scanner
   */
  private async initializeScanner() {
    try {
      const clamScanOptions = {
        removeInfected: true, // Automatically remove infected files
        quarantineInfected: './quarantine', // Move infected files here
        scanLog: './logs/virus-scan.log',
        debugMode: this.configService.get<boolean>('DEBUG_MODE', false),
        fileList: null,
        scanRecursively: true,
        clamscan: {
          path: '/usr/bin/clamscan', // Path to clamscan binary
          db: null, // Path to virus database
          scanArchives: true,
          active: true,
        },
        clamdscan: {
          socket: '/var/run/clamd.scan/clamd.sock', // Socket file for clamdscan
          host: '127.0.0.1', // IP of clamd server
          port: 3310, // Port of clamd server
          timeout: 60000, // Timeout in milliseconds
          localFallback: true, // Use local clamscan if daemon fails
          path: '/usr/bin/clamdscan', // Path to clamdscan binary
          configFile: null,
          multiscan: true,
          reloadDb: false,
          active: true,
          bypassTest: false,
        },
        preference: 'clamdscan' as 'clamdscan', // Prefer clamdscan over clamscan
      };

      this.clamscan = await new NodeClam().init(clamScanOptions);
      this.isInitialized = true;
      this.logger.log('Virus scanner initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize virus scanner:', error);
      // Don't throw - allow the service to work without virus scanning in development
      this.isInitialized = false;
    }
  }

  /**
   * Scan a file for viruses
   */
  async scanFile(filePath: string): Promise<{
    isClean: boolean;
    viruses?: string[];
    error?: string;
  }> {
    // If scanner not initialized, log warning and allow file
    if (!this.isInitialized) {
      this.logger.warn('Virus scanner not initialized, skipping scan');
      return { isClean: true };
    }

    try {
      const { isInfected, file, viruses } = await this.clamscan.isInfected(filePath);
      
      if (isInfected) {
        this.logger.warn(`Virus detected in file ${filePath}: ${viruses}`);
        return {
          isClean: false,
          viruses: viruses || ['Unknown virus'],
        };
      }

      return { isClean: true };
    } catch (error) {
      this.logger.error(`Error scanning file ${filePath}:`, error);
      return {
        isClean: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Scan multiple files
   */
  async scanFiles(filePaths: string[]): Promise<Map<string, { isClean: boolean; viruses?: string[] }>> {
    const results = new Map();
    
    for (const filePath of filePaths) {
      const result = await this.scanFile(filePath);
      results.set(filePath, result);
    }
    
    return results;
  }

  /**
   * Check if file is EICAR test file (for testing)
   */
  isEicarTestFile(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const eicarSignature = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
      return content.includes(eicarSignature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate file hash for integrity checking
   */
  generateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * Verify file integrity
   */
  verifyFileIntegrity(filePath: string, expectedHash: string): boolean {
    const actualHash = this.generateFileHash(filePath);
    return actualHash === expectedHash;
  }
}