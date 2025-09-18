import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportOptions {
  filename?: string;
  quality?: number;
  includeTitle?: boolean;
  includeTimestamp?: boolean;
}

export class ChartExporter {
  /**
   * Export a DOM element to PNG image
   */
  static async exportToPNG(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      filename = 'chart',
      quality = 2,
      includeTimestamp = true,
    } = options;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: quality,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = includeTimestamp
            ? `${filename}_${new Date().toISOString().split('T')[0]}.png`
            : `${filename}.png`;
          saveAs(blob, fileName);
        }
      });
    } catch (error: any) {
      console.error('Error exporting to PNG:', error);
      throw new Error('Failed to export chart to PNG');
    }
  }

  /**
   * Export multiple DOM elements to a single PDF
   */
  static async exportToPDF(
    elements: HTMLElement[],
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      filename = 'report',
      includeTitle = true,
      includeTimestamp = true,
    } = options;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Add title page if requested
      if (includeTitle) {
        pdf.setFontSize(24);
        pdf.text('Q-Methodology Analysis Report', pageWidth / 2, 30, {
          align: 'center',
        });
        
        pdf.setFontSize(12);
        pdf.text(
          `Generated: ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          40,
          { align: 'center' }
        );
        
        pdf.addPage();
      }

      // Process each element
      for (let i = 0; i < elements.length; i++) {
        if (i > 0 && !includeTitle) {
          pdf.addPage();
        }

        const canvas = await html2canvas(elements[i], {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if image fits on page
        if (imgHeight > pageHeight - 2 * margin) {
          // Scale down to fit
          const scaleFactor = (pageHeight - 2 * margin) / imgHeight;
          pdf.addImage(
            imgData,
            'PNG',
            margin,
            margin,
            imgWidth * scaleFactor,
            imgHeight * scaleFactor
          );
        } else {
          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        }
      }

      const fileName = includeTimestamp
        ? `${filename}_${new Date().toISOString().split('T')[0]}.pdf`
        : `${filename}.pdf`;
      
      pdf.save(fileName);
    } catch (error: any) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export charts to PDF');
    }
  }

  /**
   * Export data to Excel format
   */
  static exportToExcel(
    data: Record<string, any[]>,
    options: ExportOptions = {}
  ): void {
    const {
      filename = 'data',
      includeTimestamp = true,
    } = options;

    try {
      const wb = XLSX.utils.book_new();

      // Add each dataset as a separate sheet
      Object.entries(data).forEach(([sheetName, sheetData]) => {
        const ws = XLSX.utils.json_to_sheet(sheetData);
        
        // Auto-size columns
        const colWidths = Object.keys(sheetData[0] || {}).map(() => ({
          wch: 15,
        }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const fileName = includeTimestamp
        ? `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `${filename}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data to Excel');
    }
  }

  /**
   * Export data to CSV format
   */
  static exportToCSV(
    data: any[],
    options: ExportOptions = {}
  ): void {
    const {
      filename = 'data',
      includeTimestamp = true,
    } = options;

    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const fileName = includeTimestamp
        ? `${filename}_${new Date().toISOString().split('T')[0]}.csv`
        : `${filename}.csv`;
      
      saveAs(blob, fileName);
    } catch (error: any) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export data to CSV');
    }
  }

  /**
   * Export chart as SVG
   */
  static exportToSVG(
    svgElement: SVGElement,
    options: ExportOptions = {}
  ): void {
    const {
      filename = 'chart',
      includeTimestamp = true,
    } = options;

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const fileName = includeTimestamp
        ? `${filename}_${new Date().toISOString().split('T')[0]}.svg`
        : `${filename}.svg`;
      
      saveAs(blob, fileName);
    } catch (error: any) {
      console.error('Error exporting to SVG:', error);
      throw new Error('Failed to export chart to SVG');
    }
  }

  /**
   * Export Q-methodology specific report
   */
  static async exportQMethodologyReport(
    analysisData: {
      eigenvalues?: any[];
      factorLoadings?: any[];
      factorArrays?: any[];
      distinguishingStatements?: any[];
      correlationMatrix?: any[];
      participantData?: any[];
    },
    charts?: HTMLElement[],
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      filename = 'q-methodology-report',
    } = options;

    // Prepare Excel workbook with all data
    const workbookData: Record<string, any[]> = {};
    
    if (analysisData.eigenvalues) {
      workbookData['Eigenvalues'] = analysisData.eigenvalues;
    }
    if (analysisData.factorLoadings) {
      workbookData['Factor Loadings'] = analysisData.factorLoadings;
    }
    if (analysisData.factorArrays) {
      workbookData['Factor Arrays'] = analysisData.factorArrays;
    }
    if (analysisData.distinguishingStatements) {
      workbookData['Distinguishing Statements'] = analysisData.distinguishingStatements;
    }
    if (analysisData.correlationMatrix) {
      workbookData['Correlation Matrix'] = analysisData.correlationMatrix;
    }
    if (analysisData.participantData) {
      workbookData['Participants'] = analysisData.participantData;
    }

    // Export Excel data
    this.exportToExcel(workbookData, { filename: `${filename}_data` });

    // Export PDF report with charts if provided
    if (charts && charts.length > 0) {
      await this.exportToPDF(charts, {
        filename: `${filename}_charts`,
        includeTitle: true,
      });
    }
  }
}