declare module 'clamscan' {
  interface ClamScanOptions {
    removeInfected?: boolean;
    quarantineInfected?: string | boolean;
    scanLog?: string;
    debugMode?: boolean;
    fileList?: string | null;
    scanRecursively?: boolean;
    clamscan?: {
      path?: string;
      db?: string | null;
      scanArchives?: boolean;
      active?: boolean;
    };
    clamdscan?: {
      socket?: string;
      host?: string;
      port?: number;
      timeout?: number;
      localFallback?: boolean;
      path?: string;
      configFile?: string | null;
      multiscan?: boolean;
      reloadDb?: boolean;
      active?: boolean;
      bypassTest?: boolean;
    };
    preference?: 'clamscan' | 'clamdscan';
  }

  interface ScanResult {
    isInfected: boolean;
    file?: string;
    viruses?: string[];
  }

  class NodeClam {
    init(options?: ClamScanOptions): Promise<ClamScanner>;
  }

  interface ClamScanner {
    isInfected(filePath: string): Promise<ScanResult>;
    scanFile(filePath: string): Promise<ScanResult>;
    scanFiles(filePaths: string[]): Promise<ScanResult[]>;
    scanDir(dirPath: string): Promise<ScanResult>;
    getVersion(): Promise<string>;
  }

  export = NodeClam;
}