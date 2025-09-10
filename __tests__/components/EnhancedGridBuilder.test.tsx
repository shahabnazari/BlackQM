import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedGridBuilder } from '../../frontend/components/grid/EnhancedGridBuilder';
import { useGridStore } from '../../frontend/lib/stores/grid-store';

// Mock the grid store
jest.mock('../../frontend/lib/stores/grid-store');

describe('EnhancedGridBuilder', () => {
  const mockOnGridChange = jest.fn();
  const mockOnValidationChange = jest.fn();

  const defaultProps = {
    onGridChange: mockOnGridChange,
    onValidationChange: mockOnValidationChange,
    initialConfig: {
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
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGridStore as jest.Mock).mockReturnValue({
      config: defaultProps.initialConfig,
      gridScale: 1,
      gridOverflow: false,
      setConfig: jest.fn(),
      setGridScale: jest.fn(),
      setGridOverflow: jest.fn(),
      updateColumnCells: jest.fn(),
      addColumn: jest.fn(),
      removeColumn: jest.fn(),
      updateColumnLabel: jest.fn(),
      applyDistribution: jest.fn(),
      validateGrid: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      resetGrid: jest.fn(),
    });
  });

  describe('Rendering', () => {
    test('should render grid builder with initial configuration', () => {
      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(screen.getByText('Grid Configuration')).toBeInTheDocument();
      expect(screen.getByText('Range: -3 to 3')).toBeInTheDocument();
      expect(screen.getByText('Total Cards: 20')).toBeInTheDocument();
      expect(screen.getByText('Symmetry: On')).toBeInTheDocument();
    });

    test('should render all columns', () => {
      render(<EnhancedGridBuilder {...defaultProps} />);

      defaultProps.initialConfig.columns.forEach(column => {
        expect(screen.getByText(column.value.toString())).toBeInTheDocument();
      });
    });

    test('should render column labels', () => {
      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(screen.getByText('Most Disagree')).toBeInTheDocument();
      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.getByText('Most Agree')).toBeInTheDocument();
    });

    test('should render control buttons', () => {
      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Zoom In/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zoom Out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Zoom/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Column/i })).toBeInTheDocument();
    });
  });

  describe('Column Cell Updates', () => {
    test('should update column cells on input change', async () => {
      const mockUpdateColumnCells = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        updateColumnCells: mockUpdateColumnCells,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const firstCellInput = screen.getAllByRole('spinbutton')[0];
      await userEvent.clear(firstCellInput);
      await userEvent.type(firstCellInput, '5');

      await waitFor(() => {
        expect(mockUpdateColumnCells).toHaveBeenCalledWith(0, 5);
      });
    });

    test('should call onGridChange when grid is updated', async () => {
      const updatedConfig = {
        ...defaultProps.initialConfig,
        columns: [
          { ...defaultProps.initialConfig.columns[0], cells: 5 },
          ...defaultProps.initialConfig.columns.slice(1),
        ],
        totalCells: 23,
      };

      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        config: updatedConfig,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      await waitFor(() => {
        expect(mockOnGridChange).toHaveBeenCalledWith(updatedConfig);
      });
    });
  });

  describe('Column Management', () => {
    test('should add column at start', () => {
      const mockAddColumn = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        addColumn: mockAddColumn,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const addStartButton = screen.getByRole('button', { name: /Add Start/i });
      fireEvent.click(addStartButton);

      expect(mockAddColumn).toHaveBeenCalledWith('start');
    });

    test('should add column at end', () => {
      const mockAddColumn = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        addColumn: mockAddColumn,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const addEndButton = screen.getByRole('button', { name: /Add End/i });
      fireEvent.click(addEndButton);

      expect(mockAddColumn).toHaveBeenCalledWith('end');
    });

    test('should remove column', () => {
      const mockRemoveColumn = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        removeColumn: mockRemoveColumn,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const removeButtons = screen.getAllByRole('button', { name: /×/i });
      fireEvent.click(removeButtons[0]);

      expect(mockRemoveColumn).toHaveBeenCalledWith(0);
    });

    test('should not show remove button when minimum columns reached', () => {
      const minimalConfig = {
        ...defaultProps.initialConfig,
        columns: [
          { value: -1, cells: 10, label: '' },
          { value: 0, cells: 10, label: '' },
          { value: 1, cells: 10, label: '' },
        ],
      };

      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        config: minimalConfig,
      });

      render(<EnhancedGridBuilder {...defaultProps} initialConfig={minimalConfig} />);

      const removeButtons = screen.queryAllByRole('button', { name: /×/i });
      expect(removeButtons).toHaveLength(0);
    });
  });

  describe('Zoom Controls', () => {
    test('should zoom in when zoom in button clicked', () => {
      const mockSetGridScale = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        setGridScale: mockSetGridScale,
        gridScale: 1,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const zoomInButton = screen.getByRole('button', { name: /Zoom In/i });
      fireEvent.click(zoomInButton);

      expect(mockSetGridScale).toHaveBeenCalledWith(1.1);
    });

    test('should zoom out when zoom out button clicked', () => {
      const mockSetGridScale = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        setGridScale: mockSetGridScale,
        gridScale: 1,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const zoomOutButton = screen.getByRole('button', { name: /Zoom Out/i });
      fireEvent.click(zoomOutButton);

      expect(mockSetGridScale).toHaveBeenCalledWith(0.9);
    });

    test('should reset zoom to 1', () => {
      const mockSetGridScale = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        setGridScale: mockSetGridScale,
        gridScale: 1.5,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset Zoom/i });
      fireEvent.click(resetButton);

      expect(mockSetGridScale).toHaveBeenCalledWith(1);
    });

    test('should display current zoom level', () => {
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        gridScale: 1.5,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(screen.getByText('150%')).toBeInTheDocument();
    });
  });

  describe('Distribution Presets', () => {
    test('should apply normal distribution', () => {
      const mockApplyDistribution = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        applyDistribution: mockApplyDistribution,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const normalButton = screen.getByRole('button', { name: /Normal/i });
      fireEvent.click(normalButton);

      expect(mockApplyDistribution).toHaveBeenCalledWith('normal');
    });

    test('should apply flat distribution', () => {
      const mockApplyDistribution = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        applyDistribution: mockApplyDistribution,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const flatButton = screen.getByRole('button', { name: /Flat/i });
      fireEvent.click(flatButton);

      expect(mockApplyDistribution).toHaveBeenCalledWith('flat');
    });

    test('should apply custom distribution', () => {
      const mockApplyDistribution = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        applyDistribution: mockApplyDistribution,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      const customButton = screen.getByRole('button', { name: /Custom/i });
      fireEvent.click(customButton);

      expect(mockApplyDistribution).toHaveBeenCalledWith('custom');
    });
  });

  describe('Validation', () => {
    test('should show validation errors', () => {
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        validateGrid: jest.fn().mockReturnValue({
          isValid: false,
          errors: [
            'Total cells does not match',
            'Symmetry violation detected',
          ],
        }),
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(screen.getByText(/Total cells does not match/i)).toBeInTheDocument();
      expect(screen.getByText(/Symmetry violation detected/i)).toBeInTheDocument();
    });

    test('should call onValidationChange with validation result', () => {
      const validationResult = {
        isValid: false,
        errors: ['Test error'],
      };

      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        validateGrid: jest.fn().mockReturnValue(validationResult),
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(mockOnValidationChange).toHaveBeenCalledWith(validationResult);
    });

    test('should show success indicator when valid', () => {
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        validateGrid: jest.fn().mockReturnValue({
          isValid: true,
          errors: [],
        }),
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(screen.getByText(/Grid configuration is valid/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('should show overflow indicator when grid overflows', () => {
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        gridOverflow: true,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      expect(screen.getByText(/Scroll to view more columns/i)).toBeInTheDocument();
    });

    test('should apply responsive classes on mobile viewport', () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 640px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { container } = render(<EnhancedGridBuilder {...defaultProps} />);

      expect(container.querySelector('.grid-mobile')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should handle keyboard shortcuts for zoom', () => {
      const mockSetGridScale = jest.fn();
      (useGridStore as jest.Mock).mockReturnValue({
        ...useGridStore(),
        setGridScale: mockSetGridScale,
        gridScale: 1,
      });

      render(<EnhancedGridBuilder {...defaultProps} />);

      fireEvent.keyDown(document, { key: '+', ctrlKey: true });
      expect(mockSetGridScale).toHaveBeenCalledWith(1.1);

      fireEvent.keyDown(document, { key: '-', ctrlKey: true });
      expect(mockSetGridScale).toHaveBeenCalledWith(0.9);

      fireEvent.keyDown(document, { key: '0', ctrlKey: true });
      expect(mockSetGridScale).toHaveBeenCalledWith(1);
    });
  });

  describe('Drag and Drop', () => {
    test('should handle card drag and drop between columns', () => {
      render(<EnhancedGridBuilder {...defaultProps} />);

      const cards = screen.getAllByTestId(/grid-card/i);
      const columns = screen.getAllByTestId(/grid-column/i);

      // Simulate drag start
      fireEvent.dragStart(cards[0]);

      // Simulate drag over another column
      fireEvent.dragOver(columns[2]);

      // Simulate drop
      fireEvent.drop(columns[2]);

      // Verify the card moved (would need to check state update)
      expect(mockOnGridChange).toHaveBeenCalled();
    });
  });
});