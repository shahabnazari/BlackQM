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
      // Check if we're in development mode
      const isDevelopment = this.configService.get<string>('NODE_ENV', 'development') === 'development';
      const enableVirusScanning = this.configService.get<boolean>('ENABLE_VIRUS_SCANNING', !isDevelopment);
      
      if (!enableVirusScanning) {
        this.logger.warn('Virus scanning is disabled in configuration');
        this.isInitialized = false;
        return;
      }

      const clamScanOptions = {
        removeInfected: false, // Don't automatically remove infected files
        quarantineInfected: './quarantine', // Move infected files here
        scanLog: './logs/virus-scan.log',
        debugMode: this.configService.get<boolean>('DEBUG_MODE', false),
        fileList: null,
        scanRecursively: true,
        clamscan: {
          path: '/usr/local/bin/clamscan', // Try common macOS path first
          db: null, // Path to virus database
          scanArchives: true,
          active: true,
        },
        clamdscan: {
          socket: false, // Disable socket connection to avoid errors
          host: false, // Disable TCP connection
          port: false,
          timeout: 60000, // Timeout in milliseconds
          localFallback: true, // Use local clamscan if daemon fails
          path: '/usr/local/bin/clamdscan', // Try common macOS path
          configFile: null,
          multiscan: true,
          reloadDb: false,
          active: false, // Disable clamdscan, use clamscan only
          bypassTest: false,
        },
        preference: 'clamscan' as 'clamscan', // Prefer clamscan over clamdscan
      };

      this.clamscan = await new NodeClam().init(clamScanOptions);
      this.isInitialized = true;
      this.logger.log('Virus scanner initialized successfully');
    } catch (error) {
      this.logger.warn('Virus scanner not available - continuing without virus scanning');
      this.logger.debug('Scanner initialization error:', error);
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
      this.logger.debug('Virus scanner not initialized, skipping scan for:', filePath);
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