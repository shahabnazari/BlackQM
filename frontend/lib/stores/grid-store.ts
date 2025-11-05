'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface GridColumn {
  value: number;
  label: string;
  customLabel?: string;
  cells: number;
  maxCells?: number;
  minCells?: number;
}

interface GridCell {
  id: string;
  columnIndex: number;
  rowIndex: number;
  stimulusId?: string;
  locked?: boolean;
}

interface GridConfiguration {
  rangeMin: number;
  rangeMax: number;
  columns: GridColumn[];
  symmetry: boolean;
  totalCells: number;
  distribution: 'bell' | 'flat' | 'custom';
  instructions?: string;
  allowAddColumns?: boolean;
  allowRemoveColumns?: boolean;
  allowCellAdjustment?: boolean;
  maxColumns?: number;
  responsive?: boolean;
}

interface GridState {
  // Grid Configuration
  config: GridConfiguration | null;
  cells: GridCell[];

  // UI State
  selectedCell: string | null;
  hoveredColumn: number | null;
  isDragging: boolean;
  isResizing: boolean;
  gridScale: number;
  showGridLines: boolean;
  showLabels: boolean;

  // Validation
  isValid: boolean;
  validationErrors: string[];

  // Responsive State
  viewportWidth: number;
  isMobile: boolean;
  isTablet: boolean;
  gridOverflow: boolean;

  // Actions - Configuration
  setConfig: (config: GridConfiguration) => void;
  updateRange: (min: number, max: number) => void;
  addColumn: (position?: 'start' | 'end') => void;
  removeColumn: (index: number) => void;
  updateColumnCells: (index: number, cells: number) => void;
  updateColumnLabel: (index: number, label: string) => void;

  // Actions - Cell Management
  addCellToColumn: (columnIndex: number) => void;
  removeCellFromColumn: (columnIndex: number) => void;
  assignStimulusToCell: (cellId: string, stimulusId: string) => void;
  clearCell: (cellId: string) => void;
  swapCells: (cellId1: string, cellId2: string) => void;

  // Actions - Distribution
  applyDistribution: (type: 'bell' | 'flat') => void;
  autoBalance: () => void;
  redistributeCells: (totalCells: number) => void;

  // Actions - UI
  selectCell: (cellId: string | null) => void;
  hoverColumn: (columnIndex: number | null) => void;
  setGridScale: (scale: number) => void;
  toggleGridLines: () => void;
  toggleLabels: () => void;

  // Actions - Responsive
  updateViewport: (width: number) => void;
  calculateGridOverflow: () => void;
  adjustForMobile: () => void;

  // Actions - Validation
  validateGrid: () => boolean;
  getValidationErrors: () => string[];

  // Actions - Persistence
  saveGrid: () => void;
  loadGrid: (studyId: string) => void;
  resetGrid: () => void;

  // Getters
  getTotalCells: () => number;
  getColumnByIndex: (index: number) => GridColumn | undefined;
  getCellById: (id: string) => GridCell | undefined;
  getEmptyCells: () => GridCell[];
  getFilledCells: () => GridCell[];
}

// Default config - reserved for future use
// const defaultConfig: GridConfiguration = {
//   rangeMin: -3,
//   rangeMax: 3,
//   columns: [],
//   symmetry: true,
//   totalCells: 0,
//   distribution: 'bell',
//   instructions: 'Please sort the items according to your level of agreement.',
//   allowAddColumns: true,
//   allowRemoveColumns: true,
//   allowCellAdjustment: true,
//   maxColumns: 13,
//   responsive: true,
// };

export const useGridStore = create<GridState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        config: null,
        cells: [],
        selectedCell: null,
        hoveredColumn: null,
        isDragging: false,
        isResizing: false,
        gridScale: 1,
        showGridLines: true,
        showLabels: true,
        isValid: true,
        validationErrors: [],
        viewportWidth: 1200,
        isMobile: false,
        isTablet: false,
        gridOverflow: false,

        // Configuration Actions
        setConfig: config => {
          const cells: GridCell[] = [];
          config.columns.forEach((column, columnIndex) => {
            for (let rowIndex = 0; rowIndex < column.cells; rowIndex++) {
              cells.push({
                id: `cell-${columnIndex}-${rowIndex}`,
                columnIndex,
                rowIndex,
              });
            }
          });

          set({ config, cells });
          get().validateGrid();
          get().calculateGridOverflow();
        },

        updateRange: (min, max) => {
          const state = get();
          if (!state.config) return;

          const newColumns = generateColumns(
            min,
            max,
            state.config.distribution,
            state.config.totalCells
          );
          const newConfig = {
            ...state.config,
            rangeMin: min,
            rangeMax: max,
            columns: newColumns,
          };

          get().setConfig(newConfig);
        },

        addColumn: (position = 'end') => {
          const state = get();
          if (!state.config) return;

          if (state.config.columns.length >= (state.config.maxColumns || 13)) {
            return;
          }

          const newColumn: GridColumn = {
            value:
              position === 'start'
                ? state.config.rangeMin - 1
                : state.config.rangeMax + 1,
            label: `Position ${position === 'start' ? state.config.rangeMin - 1 : state.config.rangeMax + 1}`,
            cells: 1,
          };

          const newColumns =
            position === 'start'
              ? [newColumn, ...state.config.columns]
              : [...state.config.columns, newColumn];

          const newConfig = {
            ...state.config,
            columns: newColumns,
            rangeMin:
              position === 'start'
                ? state.config.rangeMin - 1
                : state.config.rangeMin,
            rangeMax:
              position === 'end'
                ? state.config.rangeMax + 1
                : state.config.rangeMax,
            totalCells: state.config.totalCells + 1,
          };

          get().setConfig(newConfig);
        },

        removeColumn: index => {
          const state = get();
          if (!state.config || !state.config.allowRemoveColumns) return;

          const column = state.config.columns[index];
          if (!column) return;

          const newColumns = state.config.columns.filter((_, i) => i !== index);
          const removedCells = column.cells;

          const newConfig = {
            ...state.config,
            columns: newColumns,
            totalCells: state.config.totalCells - removedCells,
          };

          get().setConfig(newConfig);
        },

        updateColumnCells: (index, cells) => {
          const state = get();
          if (!state.config || !state.config.allowCellAdjustment) return;

          const column = state.config.columns[index];
          if (!column) return;

          const newColumns = [...state.config.columns];
          newColumns[index] = { ...column, cells };

          // Maintain symmetry if enabled
          if (state.config.symmetry) {
            const mirrorIndex = newColumns.length - 1 - index;
            if (mirrorIndex !== index && mirrorIndex >= 0) {
              const mirrorColumn = newColumns[mirrorIndex];
              if (mirrorColumn) {
                newColumns[mirrorIndex] = { ...mirrorColumn, cells };
              }
            }
          }

          // Calculate total cells from all columns
          const newTotalCells = newColumns.reduce(
            (sum, col) => sum + col.cells,
            0
          );

          const newConfig = {
            ...state.config,
            columns: newColumns,
            totalCells: newTotalCells,
          };

          get().setConfig(newConfig);
          get().validateGrid(); // Validate after updating
        },

        updateColumnLabel: (index, label) => {
          const state = get();
          if (!state.config) return;

          const column = state.config.columns[index];
          if (!column) return;

          const newColumns = [...state.config.columns];
          newColumns[index] = { ...column, customLabel: label };

          set(state => ({
            config: state.config
              ? { ...state.config, columns: newColumns }
              : null,
          }));
        },

        // Cell Management Actions
        addCellToColumn: columnIndex => {
          const state = get();
          if (!state.config) return;

          const column = state.config.columns[columnIndex];
          if (!column) return;

          get().updateColumnCells(columnIndex, column.cells + 1);
        },

        removeCellFromColumn: columnIndex => {
          const state = get();
          if (!state.config) return;

          const column = state.config.columns[columnIndex];
          if (!column) return;

          const currentCells = column.cells;
          if (currentCells > 0) {
            get().updateColumnCells(columnIndex, currentCells - 1);
          }
        },

        assignStimulusToCell: (cellId, stimulusId) => {
          set(state => ({
            cells: state.cells.map((cell: any) =>
              cell.id === cellId ? { ...cell, stimulusId } : cell
            ),
          }));
        },

        clearCell: cellId => {
          set(state => ({
            cells: state.cells.map((cell: any) =>
              cell.id === cellId ? { ...cell, stimulusId: undefined } : cell
            ),
          }));
        },

        swapCells: (cellId1, cellId2) => {
          set(state => {
            const cell1 = state.cells.find(c => c.id === cellId1);
            const cell2 = state.cells.find(c => c.id === cellId2);

            if (!cell1 || !cell2) return state;

            return {
              cells: state.cells.map((cell: any) => {
                if (cell.id === cellId1) {
                  return { ...cell, stimulusId: cell2.stimulusId };
                }
                if (cell.id === cellId2) {
                  return { ...cell, stimulusId: cell1.stimulusId };
                }
                return cell;
              }),
            };
          });
        },

        // Distribution Actions
        applyDistribution: type => {
          const state = get();
          if (!state.config) return;

          const newColumns = generateColumns(
            state.config.rangeMin,
            state.config.rangeMax,
            type,
            state.config.totalCells
          );

          const newConfig = {
            ...state.config,
            columns: newColumns,
            distribution: type,
          };

          get().setConfig(newConfig);
        },

        autoBalance: () => {
          const state = get();
          if (!state.config) return;

          const totalColumns = state.config.columns.length;
          const targetCells = state.config.totalCells;
          const basePerColumn = Math.floor(targetCells / totalColumns);
          const remainder = targetCells % totalColumns;

          const newColumns = state.config.columns.map((column, index) => ({
            ...column,
            cells: basePerColumn + (index < remainder ? 1 : 0),
          }));

          const newConfig = {
            ...state.config,
            columns: newColumns,
            distribution: 'custom' as const,
          };

          get().setConfig(newConfig);
        },

        redistributeCells: totalCells => {
          const state = get();
          if (!state.config) return;

          const newColumns = generateColumns(
            state.config.rangeMin,
            state.config.rangeMax,
            state.config.distribution,
            totalCells
          );

          const newConfig = {
            ...state.config,
            columns: newColumns,
            totalCells,
          };

          get().setConfig(newConfig);
        },

        // UI Actions
        selectCell: cellId => {
          set({ selectedCell: cellId });
        },

        hoverColumn: columnIndex => {
          set({ hoveredColumn: columnIndex });
        },

        setGridScale: scale => {
          set({ gridScale: Math.max(0.5, Math.min(2, scale)) });
        },

        toggleGridLines: () => {
          set(state => ({ showGridLines: !state.showGridLines }));
        },

        toggleLabels: () => {
          set(state => ({ showLabels: !state.showLabels }));
        },

        // Responsive Actions
        updateViewport: width => {
          const isMobile = width < 768;
          const isTablet = width >= 768 && width < 1024;

          set({
            viewportWidth: width,
            isMobile,
            isTablet,
          });

          get().calculateGridOverflow();

          if (isMobile) {
            get().adjustForMobile();
          }
        },

        calculateGridOverflow: () => {
          const state = get();
          if (!state.config) return;

          const columnWidth = 80; // Approximate width per column in pixels
          const totalWidth = state.config.columns.length * columnWidth;
          const overflow = totalWidth > state.viewportWidth - 100; // 100px for padding

          set({ gridOverflow: overflow });

          if (overflow && state.config.responsive) {
            // Auto-adjust scale if overflow
            const optimalScale = (state.viewportWidth - 100) / totalWidth;
            get().setGridScale(Math.max(0.5, Math.min(1, optimalScale)));
          }
        },

        adjustForMobile: () => {
          const state = get();
          if (!state.config || !state.isMobile) return;

          // Adjust grid scale for mobile
          get().setGridScale(0.7);

          // Hide labels on very small screens
          if (state.viewportWidth < 480) {
            set({ showLabels: false });
          }
        },

        // Validation Actions
        validateGrid: () => {
          const state = get();
          const errors: string[] = [];

          if (!state.config) {
            errors.push('No grid configuration found');
          } else {
            if (state.config.columns.length === 0) {
              errors.push('Grid must have at least one column');
            }

            const actualTotal = state.config.columns.reduce(
              (sum, col) => sum + col.cells,
              0
            );

            if (actualTotal === 0) {
              errors.push('Grid must have at least one cell');
            }

            // Don't need to check mismatch since we always keep totalCells in sync
            // Just update totalCells if there's a discrepancy
            if (actualTotal !== state.config.totalCells) {
              // Auto-fix the totalCells
              set(state => ({
                config: state.config
                  ? { ...state.config, totalCells: actualTotal }
                  : null,
              }));
            }

            if (state.config.columns.length > (state.config.maxColumns || 13)) {
              errors.push(
                `Too many columns: maximum is ${state.config.maxColumns || 13}`
              );
            }
          }

          const isValid = errors.length === 0;
          set({ isValid, validationErrors: errors });

          return isValid;
        },

        getValidationErrors: () => {
          return get().validationErrors;
        },

        // Persistence Actions
        saveGrid: () => {
          const state = get();
          if (!state.config || !state.isValid) return;

          // Save to localStorage for now
          localStorage.setItem('grid-config', JSON.stringify(state.config));
        },

        loadGrid: _studyId => {
          // Load from localStorage for now
          // studyId will be used when backend integration is complete
          const saved = localStorage.getItem('grid-config');
          if (saved) {
            const config = JSON.parse(saved);
            get().setConfig(config);
          }
        },

        resetGrid: () => {
          set({
            config: null,
            cells: [],
            selectedCell: null,
            hoveredColumn: null,
            isValid: true,
            validationErrors: [],
          });
        },

        // Getters
        getTotalCells: () => {
          const state = get();
          return state.config?.totalCells || 0;
        },

        getColumnByIndex: index => {
          const state = get();
          return state.config?.columns[index];
        },

        getCellById: id => {
          const state = get();
          return state.cells.find(cell => cell.id === id);
        },

        getEmptyCells: () => {
          const state = get();
          return state.cells.filter((cell: any) => !cell.stimulusId);
        },

        getFilledCells: () => {
          const state = get();
          return state.cells.filter((cell: any) => cell.stimulusId);
        },
      }),
      {
        name: 'grid-storage',
        partialize: state => ({
          config: state.config,
          gridScale: state.gridScale,
          showGridLines: state.showGridLines,
          showLabels: state.showLabels,
        }),
      }
    )
  )
);

// Helper function to generate columns
function generateColumns(
  min: number,
  max: number,
  distribution: 'bell' | 'flat' | 'custom',
  totalCells: number
): GridColumn[] {
  // const columnCount = max - min + 1; // Will be used for distribution calculations
  const columns: GridColumn[] = [];

  for (let i = min; i <= max; i++) {
    columns.push({
      value: i,
      label: getDefaultLabel(i),
      cells: getCellsForColumn(i, min, max, distribution, totalCells),
    });
  }

  return columns;
}

function getCellsForColumn(
  value: number,
  min: number,
  max: number,
  distribution: string,
  totalCells: number
): number {
  const range = max - min + 1;
  const position = value - min;

  if (distribution === 'bell') {
    // Improved bell curve with proper balance
    const center = (range - 1) / 2;
    const distance = Math.abs(position - center);
    const maxCells = Math.ceil((totalCells / range) * 2);
    const bellFactor = Math.exp(-(distance * distance) / (range / 3));
    return Math.max(1, Math.round(maxCells * bellFactor));
  } else if (distribution === 'flat') {
    // Fixed flat distribution - equal cells per column
    const baseCells = Math.floor(totalCells / range);
    const remainder = totalCells % range;
    // Distribute remainder evenly from center outward
    const center = Math.floor(range / 2);
    const distanceFromCenter = Math.abs(position - center);
    const shouldGetExtra = distanceFromCenter < remainder / 2;
    return baseCells + (shouldGetExtra ? 1 : 0);
  }

  // Default to flat distribution
  return Math.floor(totalCells / range);
}

function getDefaultLabel(value: number): string {
  const labels: Record<number, string> = {
    '-6': 'Strongly Disagree',
    '-5': 'Disagree',
    '-4': 'Moderately Disagree',
    '-3': 'Slightly Disagree',
    '-2': 'Somewhat Disagree',
    '-1': 'Mildly Disagree',
    '0': 'Neutral',
    '1': 'Mildly Agree',
    '2': 'Somewhat Agree',
    '3': 'Slightly Agree',
    '4': 'Moderately Agree',
    '5': 'Agree',
    '6': 'Strongly Agree',
  };

  return labels[value] || `Position ${value}`;
}
