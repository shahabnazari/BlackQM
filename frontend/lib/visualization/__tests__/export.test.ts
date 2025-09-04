import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChartExporter } from '../export';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Mock dependencies
vi.mock('html2canvas', () => ({
  default: vi.fn()
}));

// Create mock functions that persist across test runs
const mockPdfSave = vi.fn();
const mockPdfAddImage = vi.fn();
const mockPdfAddPage = vi.fn();
const mockPdfText = vi.fn();
const mockPdfSetFontSize = vi.fn();

vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    },
    setFontSize: mockPdfSetFontSize,
    text: mockPdfText,
    addPage: mockPdfAddPage,
    addImage: mockPdfAddImage,
    save: mockPdfSave
  }))
}));

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    sheet_to_csv: vi.fn(() => 'csv,data')
  },
  writeFile: vi.fn()
}));

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

describe('ChartExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPdfSave.mockClear();
    mockPdfAddImage.mockClear();
    mockPdfAddPage.mockClear();
    mockPdfText.mockClear();
    mockPdfSetFontSize.mockClear();
  });

  describe('exportToPNG', () => {
    it('should export element to PNG with default options', async () => {
      const mockElement = document.createElement('div');
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(new Blob(['image'], { type: 'image/png' })))
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPNG(mockElement);

      expect(html2canvas).toHaveBeenCalledWith(mockElement, expect.objectContaining({
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      }));
      
      expect(saveAs).toHaveBeenCalled();
    });

    it('should use custom filename when provided', async () => {
      const mockElement = document.createElement('div');
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(new Blob(['image'], { type: 'image/png' })))
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPNG(mockElement, { 
        filename: 'custom-chart',
        includeTimestamp: false 
      });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'custom-chart.png'
      );
    });

    it('should include timestamp when enabled', async () => {
      const mockElement = document.createElement('div');
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(new Blob(['image'], { type: 'image/png' })))
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPNG(mockElement, { 
        filename: 'chart',
        includeTimestamp: true 
      });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/chart_\d{4}-\d{2}-\d{2}\.png/)
      );
    });

    it('should handle export errors gracefully', async () => {
      const mockElement = document.createElement('div');
      vi.mocked(html2canvas).mockRejectedValue(new Error('Canvas error'));

      await expect(ChartExporter.exportToPNG(mockElement)).rejects.toThrow('Failed to export chart to PNG');
    });
  });

  describe('exportToExcel', () => {
    it('should export data to Excel with multiple sheets', () => {
      const data = {
        'Sheet1': [{ id: 1, name: 'Test 1' }, { id: 2, name: 'Test 2' }],
        'Sheet2': [{ value: 10 }, { value: 20 }]
      };

      ChartExporter.exportToExcel(data, { filename: 'test', includeTimestamp: false });

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test.xlsx');
    });

    it('should handle empty data gracefully', () => {
      ChartExporter.exportToExcel({}, { filename: 'empty' });
      
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should add timestamp to filename when enabled', () => {
      const data = { 'Data': [{ test: 'value' }] };
      
      ChartExporter.exportToExcel(data, { 
        filename: 'export',
        includeTimestamp: true 
      });

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/export_\d{4}-\d{2}-\d{2}\.xlsx/)
      );
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV format', () => {
      const data = [
        { id: 1, name: 'Test 1', value: 100 },
        { id: 2, name: 'Test 2', value: 200 }
      ];

      ChartExporter.exportToCSV(data, { filename: 'data', includeTimestamp: false });

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
      expect(XLSX.utils.sheet_to_csv).toHaveBeenCalled();
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'data.csv'
      );
    });

    it('should handle empty array', () => {
      ChartExporter.exportToCSV([], { filename: 'empty' });
      
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
      expect(saveAs).toHaveBeenCalled();
    });
  });

  describe('exportToSVG', () => {
    it('should export SVG element', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.innerHTML = '<circle cx="50" cy="50" r="40" />';

      ChartExporter.exportToSVG(svgElement, { filename: 'chart', includeTimestamp: false });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'chart.svg'
      );
    });

    it('should serialize SVG correctly', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('width', '100');
      svgElement.setAttribute('height', '100');

      ChartExporter.exportToSVG(svgElement, { filename: 'test' });

      const savedBlob = vi.mocked(saveAs).mock.calls[0][0] as Blob;
      expect(savedBlob.type).toBe('image/svg+xml');
    });
  });

  describe('exportToPDF', () => {
    it('should export multiple elements to PDF', async () => {
      const elements = [
        document.createElement('div'),
        document.createElement('div')
      ];

      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,test'),
        width: 800,
        height: 600
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPDF(elements, { 
        filename: 'report',
        includeTitle: true 
      });

      expect(mockPdfSetFontSize).toHaveBeenCalled();
      expect(mockPdfText).toHaveBeenCalled();
      expect(mockPdfAddPage).toHaveBeenCalled();
      expect(mockPdfAddImage).toHaveBeenCalledTimes(2);
      expect(mockPdfSave).toHaveBeenCalled();
    });

    it('should handle single element', async () => {
      const element = document.createElement('div');
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,test'),
        width: 400,
        height: 300
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPDF([element], { 
        filename: 'single',
        includeTitle: false 
      });

      expect(mockPdfAddImage).toHaveBeenCalled();
      expect(mockPdfSave).toHaveBeenCalled();
    });

    it('should handle PDF generation errors', async () => {
      const elements = [document.createElement('div')];
      vi.mocked(html2canvas).mockRejectedValue(new Error('PDF error'));

      await expect(ChartExporter.exportToPDF(elements)).rejects.toThrow('Failed to export charts to PDF');
    });
  });

  describe('exportQMethodologyReport', () => {
    it('should export complete Q-methodology report', async () => {
      const analysisData = {
        eigenvalues: [{ factor: 1, value: 4.5 }],
        factorLoadings: [{ participant: 'P1', loadings: [0.8, 0.2] }],
        distinguishingStatements: [{ id: 'S1', text: 'Statement 1', pValue: 0.01 }]
      };

      const chartElement = document.createElement('div');
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,test'),
        width: 400,
        height: 300
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportQMethodologyReport(
        analysisData,
        [chartElement],
        { filename: 'q-report' }
      );

      // Should export Excel data
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(3);
      expect(XLSX.writeFile).toHaveBeenCalled();

      // Should export PDF charts
      expect(mockPdfSave).toHaveBeenCalled();
    });

    it('should handle report without charts', async () => {
      const analysisData = {
        eigenvalues: [{ factor: 1, value: 4.5 }],
        factorArrays: [[1, 2, 3]]
      };

      await ChartExporter.exportQMethodologyReport(analysisData);

      // Should only export Excel data
      expect(XLSX.writeFile).toHaveBeenCalled();
      expect(new jsPDF().save).not.toHaveBeenCalled();
    });

    it('should handle empty analysis data', async () => {
      await ChartExporter.exportQMethodologyReport({});
      
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });
  });
});