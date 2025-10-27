import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
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

      canvas.toBlob(blob => {
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
        const element = elements[i];
        if (!element) continue;

        if (i > 0 && !includeTitle) {
          pdf.addPage();
        }

        const canvas = await html2canvas(element, {
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
  static async exportToExcel(
    data: Record<string, any[]>,
    options: ExportOptions = {}
  ): Promise<void> {
    const { filename = 'data', includeTimestamp = true } = options;

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'VQMethod';
      workbook.created = new Date();

      // Add each dataset as a separate sheet
      Object.entries(data).forEach(([sheetName, sheetData]) => {
        const worksheet = workbook.addWorksheet(sheetName);

        // Add headers if data exists
        if (sheetData.length > 0) {
          const headers = Object.keys(sheetData[0]);
          worksheet.columns = headers.map(header => ({
            header: header,
            key: header,
            width: 15,
          }));

          // Add data rows
          sheetData.forEach(row => {
            worksheet.addRow(row);
          });

          // Style the header row
          worksheet.getRow(1).font = { bold: true };
        }
      });

      const fileName = includeTimestamp
        ? `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `${filename}.xlsx`;

      // Generate buffer and save
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, fileName);
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data to Excel');
    }
  }

  /**
   * Export data to CSV format
   */
  static exportToCSV(data: any[], options: ExportOptions = {}): void {
    const { filename = 'data', includeTimestamp = true } = options;

    try {
      // Convert data to CSV manually
      let csv = '';

      if (data.length > 0) {
        // Add headers
        const headers = Object.keys(data[0]);
        csv = headers.join(',') + '\n';

        // Add data rows
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            // Escape values containing commas or quotes
            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          });
          csv += values.join(',') + '\n';
        });
      }

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
    const { filename = 'chart', includeTimestamp = true } = options;

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
    const { filename = 'q-methodology-report' } = options;

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
      workbookData['Distinguishing Statements'] =
        analysisData.distinguishingStatements;
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
