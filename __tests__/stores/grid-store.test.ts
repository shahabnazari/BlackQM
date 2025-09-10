import { renderHook, act } from '@testing-library/react';
import { useGridStore } from '../../frontend/lib/stores/grid-store';

describe('GridStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useGridStore());
    act(() => {
      result.current.resetGrid();
    });
  });

  describe('Grid Configuration', () => {
    test('should set grid configuration', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -3,
        rangeMax: 3,
        totalCells: 20,
        symmetry: true,
        distribution: 'normal' as const,
        columns: [
          { value: -3, cells: 2, label: 'Most Disagree' },
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 4, label: '' },
          { value: 0, cells: 2, label: 'Neutral' },
          { value: 1, cells: 4, label: '' },
          { value: 2, cells: 3, label: '' },
          { value: 3, cells: 2, label: 'Most Agree' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
      });

      expect(result.current.config).toEqual(config);
    });

    test('should validate grid configuration', () => {
      const { result } = renderHook(() => useGridStore());
      const validConfig = {
        rangeMin: -3,
        rangeMax: 3,
        totalCells: 20,
        symmetry: true,
        distribution: 'normal' as const,
        columns: [
          { value: -3, cells: 2, label: '' },
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 4, label: '' },
          { value: 0, cells: 2, label: '' },
          { value: 1, cells: 4, label: '' },
          { value: 2, cells: 3, label: '' },
          { value: 3, cells: 2, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(validConfig);
      });

      const validation = result.current.validateGrid();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid cell count', () => {
      const { result } = renderHook(() => useGridStore());
      const invalidConfig = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 20,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 4, label: '' },
          { value: 0, cells: 5, label: '' },
          { value: 1, cells: 4, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(invalidConfig);
      });

      const validation = result.current.validateGrid();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Total cells (19) does not match expected (20)');
    });

    test('should detect missing columns', () => {
      const { result } = renderHook(() => useGridStore());
      const invalidConfig = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 15,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 4, label: '' },
          { value: 1, cells: 4, label: '' },
          { value: 2, cells: 4, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(invalidConfig);
      });

      const validation = result.current.validateGrid();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Column values do not match range');
    });

    test('should detect symmetry violations', () => {
      const { result } = renderHook(() => useGridStore());
      const asymmetricConfig = {
        rangeMin: -3,
        rangeMax: 3,
        totalCells: 20,
        symmetry: true,
        distribution: 'normal' as const,
        columns: [
          { value: -3, cells: 2, label: '' },
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 4, label: '' },
          { value: 0, cells: 2, label: '' },
          { value: 1, cells: 5, label: '' }, // Different from -1
          { value: 2, cells: 3, label: '' },
          { value: 3, cells: 1, label: '' }, // Different from -3
        ],
      };

      act(() => {
        result.current.setConfig(asymmetricConfig);
      });

      const validation = result.current.validateGrid();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Symmetry violation'))).toBe(true);
    });
  });

  describe('Column Management', () => {
    test('should update column cells', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 20,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 5, label: '' },
          { value: 0, cells: 4, label: '' },
          { value: 1, cells: 5, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.updateColumnCells(1, 6);
      });

      expect(result.current.config?.columns[1].cells).toBe(6);
      expect(result.current.config?.totalCells).toBe(21);
    });

    test('should update column cells with symmetry', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 20,
        symmetry: true,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 5, label: '' },
          { value: 0, cells: 4, label: '' },
          { value: 1, cells: 5, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.updateColumnCells(0, 4); // Update -2 to 4 cells
      });

      expect(result.current.config?.columns[0].cells).toBe(4); // -2 updated
      expect(result.current.config?.columns[4].cells).toBe(4); // 2 also updated (symmetry)
      expect(result.current.config?.totalCells).toBe(22);
    });

    test('should add column at start', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 20,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 4, label: '' },
          { value: -1, cells: 5, label: '' },
          { value: 0, cells: 3, label: '' },
          { value: 1, cells: 5, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.addColumn('start');
      });

      expect(result.current.config?.columns).toHaveLength(6);
      expect(result.current.config?.columns[0].value).toBe(-3);
      expect(result.current.config?.columns[0].cells).toBe(0);
      expect(result.current.config?.rangeMin).toBe(-3);
    });

    test('should add column at end', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 20,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 4, label: '' },
          { value: -1, cells: 5, label: '' },
          { value: 0, cells: 3, label: '' },
          { value: 1, cells: 5, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.addColumn('end');
      });

      expect(result.current.config?.columns).toHaveLength(6);
      expect(result.current.config?.columns[5].value).toBe(3);
      expect(result.current.config?.columns[5].cells).toBe(0);
      expect(result.current.config?.rangeMax).toBe(3);
    });

    test('should remove column', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 20,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 4, label: '' },
          { value: -1, cells: 5, label: '' },
          { value: 0, cells: 3, label: '' },
          { value: 1, cells: 5, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.removeColumn(2); // Remove middle column (0)
      });

      expect(result.current.config?.columns).toHaveLength(4);
      expect(result.current.config?.totalCells).toBe(17);
      expect(result.current.config?.columns.find(c => c.value === 0)).toBeUndefined();
    });
  });

  describe('Display Properties', () => {
    test('should update grid scale', () => {
      const { result } = renderHook(() => useGridStore());

      act(() => {
        result.current.setGridScale(1.5);
      });

      expect(result.current.gridScale).toBe(1.5);
    });

    test('should constrain grid scale to valid range', () => {
      const { result } = renderHook(() => useGridStore());

      act(() => {
        result.current.setGridScale(0.3); // Below minimum
      });

      expect(result.current.gridScale).toBe(0.5);

      act(() => {
        result.current.setGridScale(2.5); // Above maximum
      });

      expect(result.current.gridScale).toBe(2);
    });

    test('should detect grid overflow', () => {
      const { result } = renderHook(() => useGridStore());
      const wideConfig = {
        rangeMin: -6,
        rangeMax: 6,
        totalCells: 50,
        symmetry: false,
        distribution: 'normal' as const,
        columns: Array.from({ length: 13 }, (_, i) => ({
          value: i - 6,
          cells: i === 6 ? 8 : 3,
          label: '',
        })),
      };

      act(() => {
        result.current.setConfig(wideConfig);
        result.current.setGridOverflow(true);
      });

      expect(result.current.gridOverflow).toBe(true);
    });

    test('should update column label', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 15,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 3, label: '' },
          { value: 0, cells: 3, label: '' },
          { value: 1, cells: 3, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.updateColumnLabel(0, 'Strongly Disagree');
        result.current.updateColumnLabel(4, 'Strongly Agree');
      });

      expect(result.current.config?.columns[0].label).toBe('Strongly Disagree');
      expect(result.current.config?.columns[4].label).toBe('Strongly Agree');
    });
  });

  describe('Distribution Presets', () => {
    test('should apply normal distribution', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -3,
        rangeMax: 3,
        totalCells: 30,
        symmetry: true,
        distribution: 'flat' as const,
        columns: Array.from({ length: 7 }, (_, i) => ({
          value: i - 3,
          cells: 4,
          label: '',
        })),
      };

      act(() => {
        result.current.setConfig(config);
        result.current.applyDistribution('normal');
      });

      // Check for bell curve shape
      const cells = result.current.config?.columns.map(c => c.cells) || [];
      expect(cells[3]).toBeGreaterThan(cells[0]); // Center > edges
      expect(cells[3]).toBeGreaterThan(cells[6]); // Center > edges
    });

    test('should apply flat distribution', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 25,
        symmetry: false,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 6, label: '' },
          { value: 0, cells: 7, label: '' },
          { value: 1, cells: 6, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.applyDistribution('flat');
      });

      const cells = result.current.config?.columns.map(c => c.cells) || [];
      expect(cells.every(c => c === 5)).toBe(true);
    });
  });

  describe('Grid Reset', () => {
    test('should reset grid to initial state', () => {
      const { result } = renderHook(() => useGridStore());
      const config = {
        rangeMin: -2,
        rangeMax: 2,
        totalCells: 15,
        symmetry: true,
        distribution: 'normal' as const,
        columns: [
          { value: -2, cells: 3, label: '' },
          { value: -1, cells: 3, label: '' },
          { value: 0, cells: 3, label: '' },
          { value: 1, cells: 3, label: '' },
          { value: 2, cells: 3, label: '' },
        ],
      };

      act(() => {
        result.current.setConfig(config);
        result.current.setGridScale(1.5);
        result.current.setGridOverflow(true);
        result.current.resetGrid();
      });

      expect(result.current.config).toBeNull();
      expect(result.current.gridScale).toBe(1);
      expect(result.current.gridOverflow).toBe(false);
    });
  });
});