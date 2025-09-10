import NodeClam from 'clamscan';
import fs from 'fs/promises';
import path from 'path';

interface ScanResult {
  isInfected: boolean;
  viruses: string[];
  file: string;
  scanTime: number;
}

export class VirusScannerService {
  private static instance: VirusScannerService;
  private clamscan: any;
  private isInitialized: boolean = false;
  private isAvailable: boolean = false;

  private constructor() {}

  public static getInstance(): VirusScannerService {
    if (!VirusScannerService.instance) {
      VirusScannerService.instance = new VirusScannerService();
    }
    return VirusScannerService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // ClamAV configuration
      const clamScanOptions = {
        removeInfected: false, // Don't automatically delete infected files
        quarantineInfected: true, // Move infected files to quarantine
        scanLog: path.join(process.cwd(), 'logs', 'clamscan.log'),
        debugMode: process.env.NODE_ENV === 'development',
        fileList: null,
        scanRecursively: true,
        clamscan: {
          path: '/usr/bin/clamscan', // Path to clamscan binary
          db: null, // Use default virus database
          scanArchives: true,
          active: true,
        },
        clamdscan: {
          path: '/usr/bin/clamdscan', // Path to clamdscan binary
          configFile: null, // Use default config
          multiscan: true,
          reloadDb: false,
          active: true,
          bypassTest: false,
        },
        preference: 'clamdscan' as 'clamdscan', // Prefer clamdscan (faster) over clamscan
      };

      // Initialize ClamAV
      this.clamscan = await new NodeClam().init(clamScanOptions);
      this.isInitialized = true;
      this.isAvailable = true;

      console.log('Virus scanner initialized successfully');
      
      // Test the scanner
      await this.testScanner();
    } catch (error) {
      console.error('Failed to initialize virus scanner:', error);
      console.warn('Virus scanning will be disabled. Files will be accepted without scanning.');
      
      // Set as initialized but not available
      this.isInitialized = true;
      this.isAvailable = false;
    }
  }

  private async testScanner(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      // Create a test file
      const testFile = path.join(process.cwd(), 'uploads', 'temp', 'test-scanner.txt');
      await fs.writeFile(testFile, 'This is a test file for virus scanner');
      
      // Scan the test file
      const { isInfected } = await this.clamscan.isInfected(testFile);
      
      // Clean up
      await fs.unlink(testFile).catch(() => {});
      
      console.log('Virus scanner test completed. Scanner is working correctly.');
    } catch (error) {
      console.error('Virus scanner test failed:', error);
      this.isAvailable = false;
    }
  }

  public async scanFile(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();

    // If scanner is not available, return safe result with warning
    if (!this.isAvailable) {
      console.warn(`File ${filePath} accepted without virus scanning (scanner not available)`);
      return {
        isInfected: false,
        viruses: [],
        file: filePath,
        scanTime: 0,
      };
    }

    try {
      // Ensure file exists
      await fs.access(filePath);

      // Scan the file
      const { isInfected, file, viruses } = await this.clamscan.scanFile(filePath);

      const scanTime = Date.now() - startTime;

      // Log scan result
      console.log(`Scanned file ${filePath} in ${scanTime}ms. Infected: ${isInfected}`);

      if (isInfected) {
        console.error(`VIRUS DETECTED in ${filePath}: ${viruses.join(', ')}`);
        
        // Move to quarantine
        await this.quarantineFile(filePath);
      }

      return {
        isInfected,
        viruses: viruses || [],
        file,
        scanTime,
      };
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
      
      // In case of scan error, treat as potentially infected for safety
      return {
        isInfected: true,
        viruses: ['scan-error'],
        file: filePath,
        scanTime: Date.now() - startTime,
      };
    }
  }

  public async scanDirectory(dirPath: string): Promise<ScanResult[]> {
    if (!this.isAvailable) {
      console.warn(`Directory ${dirPath} accepted without virus scanning (scanner not available)`);
      return [];
    }

    try {
      const files = await fs.readdir(dirPath);
      const results: ScanResult[] = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          const result = await this.scanFile(filePath);
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
      return [];
    }
  }

  private async quarantineFile(filePath: string): Promise<void> {
    try {
      const quarantineDir = path.join(process.cwd(), 'quarantine');
      
      // Ensure quarantine directory exists
      await fs.mkdir(quarantineDir, { recursive: true });

      // Generate quarantine filename with timestamp
      const filename = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const quarantinePath = path.join(quarantineDir, `${timestamp}_${filename}`);

      // Move file to quarantine
      await fs.rename(filePath, quarantinePath);

      // Create quarantine log
      const logEntry = {
        originalPath: filePath,
        quarantinePath,
        timestamp: new Date().toISOString(),
      };

      const logPath = path.join(quarantineDir, 'quarantine.log');
      await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');

      console.log(`File quarantined: ${filePath} -> ${quarantinePath}`);
    } catch (error) {
      console.error('Error quarantining file:', error);
      
      // If quarantine fails, delete the infected file
      try {
        await fs.unlink(filePath);
        console.log(`Infected file deleted: ${filePath}`);
      } catch (deleteError) {
        console.error('Failed to delete infected file:', deleteError);
      }
    }
  }

  public async updateVirusDatabase(): Promise<void> {
    if (!this.isAvailable) {
      console.warn('Virus scanner not available, cannot update database');
      return;
    }

    try {
      console.log('Updating virus database...');
      
      // Run freshclam to update virus database
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      await execPromise('freshclam');
      
      console.log('Virus database updated successfully');
    } catch (error) {
      console.error('Failed to update virus database:', error);
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.isAvailable;
  }

  public async getStats(): Promise<any> {
    if (!this.isAvailable) {
      return {
        available: false,
        message: 'Virus scanner not available',
      };
    }

    try {
      const version = await this.clamscan.getVersion();
      
      return {
        available: true,
        version,
        initialized: this.isInitialized,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const virusScanner = VirusScannerService.getInstance();