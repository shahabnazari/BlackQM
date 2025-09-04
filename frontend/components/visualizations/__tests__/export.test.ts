import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChartExporter } from '../../../lib/visualization/export';
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
    json_to_sheet: vi.fn(() => ({ '!cols': [] })),
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

  afterEach(() => {
    vi.restoreAllMocks();
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

    it('should use custom quality setting', async () => {
      const mockElement = document.createElement('div');
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(new Blob(['image'], { type: 'image/png' })))
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPNG(mockElement, { quality: 3 });

      expect(html2canvas).toHaveBeenCalledWith(
        mockElement,
        expect.objectContaining({
          scale: 3
        })
      );
    });

    it('should handle null blob gracefully', async () => {
      const mockElement = document.createElement('div');
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(null))
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPNG(mockElement);

      expect(saveAs).not.toHaveBeenCalled();
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

    it('should set column widths for sheets', () => {
      const data = {
        'TestSheet': [{ col1: 'value1', col2: 'value2' }]
      };

      ChartExporter.exportToExcel(data);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      // Column widths should be set on the worksheet
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    });

    it('should handle data with different structures', () => {
      const data = {
        'Numbers': [{ count: 1 }, { count: 2 }],
        'Strings': [{ text: 'hello' }, { text: 'world' }],
        'Mixed': [{ id: 1, name: 'test', active: true }]
      };

      ChartExporter.exportToExcel(data);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(3);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3);
    });

    it('should handle errors during Excel export', () => {
      vi.mocked(XLSX.writeFile).mockImplementation(() => {
        throw new Error('Excel write error');
      });

      expect(() => {
        ChartExporter.exportToExcel({ 'Data': [] });
      }).toThrow('Failed to export data to Excel');
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

    it('should include timestamp in filename', () => {
      const data = [{ test: 'value' }];
      
      ChartExporter.exportToCSV(data, {
        filename: 'export',
        includeTimestamp: true
      });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/export_\d{4}-\d{2}-\d{2}\.csv/)
      );
    });

    it('should create CSV blob with correct MIME type', () => {
      const data = [{ test: 'value' }];
      
      ChartExporter.exportToCSV(data);

      const blobCall = vi.mocked(saveAs).mock.calls[0];
      const blob = blobCall[0] as Blob;
      
      expect(blob.type).toBe('text/csv;charset=utf-8');
    });

    it('should handle errors during CSV conversion', () => {
      vi.mocked(XLSX.utils.sheet_to_csv).mockImplementation(() => {
        throw new Error('CSV conversion error');
      });

      expect(() => {
        ChartExporter.exportToCSV([]);
      }).toThrow('Failed to export data to CSV');
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

    it('should handle complex SVG structures', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.innerHTML = `
        <g>
          <rect x="10" y="10" width="50" height="50" fill="blue" />
          <circle cx="75" cy="35" r="20" fill="red" />
          <path d="M10,90 Q90,90 90,45" stroke="green" fill="none" />
        </g>
      `;

      ChartExporter.exportToSVG(svgElement);

      expect(saveAs).toHaveBeenCalled();
    });

    it('should include timestamp when requested', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      ChartExporter.exportToSVG(svgElement, {
        filename: 'chart',
        includeTimestamp: true
      });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/chart_\d{4}-\d{2}-\d{2}\.svg/)
      );
    });

    it('should handle serialization errors', () => {
      // Mock XMLSerializer to throw error
      const originalXMLSerializer = global.XMLSerializer;
      global.XMLSerializer = vi.fn(() => ({
        serializeToString: vi.fn(() => {
          throw new Error('Serialization error');
        })
      })) as any;

      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      expect(() => {
        ChartExporter.exportToSVG(svgElement);
      }).toThrow('Failed to export chart to SVG');

      // Restore original XMLSerializer
      global.XMLSerializer = originalXMLSerializer;
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

    it('should scale images to fit PDF page', async () => {
      const element = document.createElement('div');
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,test'),
        width: 2000, // Very wide image
        height: 1500  // Very tall image
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPDF([element]);

      // Should scale the image down to fit the page
      expect(mockPdfAddImage).toHaveBeenCalled();
    });

    it('should add title page when requested', async () => {
      const elements = [document.createElement('div')];
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,test'),
        width: 400,
        height: 300
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPDF(elements, { includeTitle: true });

      expect(mockPdfText).toHaveBeenCalledWith(
        'Q-Methodology Analysis Report',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' })
      );
    });

    it('should include timestamp in filename', async () => {
      const elements = [document.createElement('div')];
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,test'),
        width: 400,
        height: 300
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPDF(elements, { 
        filename: 'report',
        includeTimestamp: true 
      });

      expect(mockPdfSave).toHaveBeenCalledWith(
        expect.stringMatching(/report_\d{4}-\d{2}-\d{2}\.pdf/)
      );
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
      expect(mockPdfSave).not.toHaveBeenCalled();
    });

    it('should handle empty analysis data', async () => {
      await ChartExporter.exportQMethodologyReport({});
      
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should include all available data types', async () => {
      const analysisData = {
        eigenvalues: [{ factor: 1, value: 4.5 }],
        factorLoadings: [{ participant: 'P1' }],
        factorArrays: [[1, 2, 3]],
        distinguishingStatements: [{ id: 'S1' }],
        correlationMatrix: [[1, 0.5], [0.5, 1]],
        participantData: [{ id: 'P1', name: 'John' }]
      };

      await ChartExporter.exportQMethodologyReport(analysisData);

      // Should create sheets for all data types
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(6);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(6);
    });

    it('should use custom filename for both Excel and PDF exports', async () => {
      const analysisData = { eigenvalues: [] };
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
        { filename: 'custom-report' }
      );

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('custom-report_data')
      );
      
      expect(mockPdfSave).toHaveBeenCalledWith(
        expect.stringContaining('custom-report_charts')
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle DOM elements that cannot be converted to canvas', async () => {
      const element = document.createElement('div');
      vi.mocked(html2canvas).mockRejectedValue(new Error('Cannot convert element'));

      await expect(ChartExporter.exportToPNG(element)).rejects.toThrow();
    });

    it('should handle very large datasets in Excel export', () => {
      const largeData = {
        'LargeSheet': Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          value: Math.random() * 1000,
          text: `Item ${i}`
        }))
      };

      expect(() => {
        ChartExporter.exportToExcel(largeData);
      }).not.toThrow();

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(largeData.LargeSheet);
    });

    it('should handle special characters in filenames', async () => {
      const element = document.createElement('div');
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(new Blob(['image'], { type: 'image/png' })))
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      await ChartExporter.exportToPNG(element, {
        filename: 'chart with spaces & symbols!',
        includeTimestamp: false
      });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'chart with spaces & symbols!.png'
      );
    });

    it('should handle null/undefined data in analysis export', async () => {
      const analysisData = {
        eigenvalues: null,
        factorLoadings: undefined,
        distinguishingStatements: []
      };

      await ChartExporter.exportQMethodologyReport(analysisData);

      // Should still create workbook and export
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle concurrent export operations', async () => {
      const element = document.createElement('div');
      const mockCanvas = {
        toBlob: vi.fn((callback) => callback(new Blob(['image'], { type: 'image/png' })))
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      // Start multiple exports simultaneously
      const exports = [
        ChartExporter.exportToPNG(element, { filename: 'chart1' }),
        ChartExporter.exportToPNG(element, { filename: 'chart2' }),
        ChartExporter.exportToPNG(element, { filename: 'chart3' })
      ];

      await Promise.all(exports);

      expect(html2canvas).toHaveBeenCalledTimes(3);
      expect(saveAs).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Tests', () => {
    it('should export large SVG efficiently', () => {
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // Create a complex SVG with many elements
      for (let i = 0; i < 1000; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', (Math.random() * 800).toString());
        circle.setAttribute('cy', (Math.random() * 600).toString());
        circle.setAttribute('r', '5');
        svgElement.appendChild(circle);
      }

      const start = performance.now();
      ChartExporter.exportToSVG(svgElement);
      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      expect(saveAs).toHaveBeenCalled();
    });

    it('should handle memory efficiently during large PDF export', async () => {
      const elements = Array.from({ length: 50 }, () => document.createElement('div'));
      const mockCanvas = {
        toDataURL: vi.fn(() => 'data:image/png;base64,test'),
        width: 800,
        height: 600
      };
      
      vi.mocked(html2canvas).mockResolvedValue(mockCanvas as any);

      const start = performance.now();
      await ChartExporter.exportToPDF(elements);
      const end = performance.now();

      expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockPdfSave).toHaveBeenCalled();
    });
  });
});