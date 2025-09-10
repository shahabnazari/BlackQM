import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractiveGridBuilder } from '@/components/grid/InteractiveGridBuilder';
import { StimuliUploadSystem } from '@/components/stimuli/StimuliUploadSystem';
import { ResizableImage } from '@/components/editors/ResizableImage';
import { useStudyBuilderStore } from '@/lib/stores/study-builder-store';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Phase 6.85 - Interactive Grid Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('InteractiveGridBuilder renders with default configuration', () => {
    render(<InteractiveGridBuilder totalStatements={25} />);
    
    // Check for grid instructions input
    expect(screen.getByPlaceholderText(/sort the statements/i)).toBeInTheDocument();
    
    // Check for range selector
    expect(screen.getByText('Grid Range:')).toBeInTheDocument();
    
    // Check for distribution presets
    expect(screen.getByText('Bell Curve')).toBeInTheDocument();
    expect(screen.getByText('Flat Distribution')).toBeInTheDocument();
    expect(screen.getByText('Forced Choice')).toBeInTheDocument();
  });

  test('Grid range can be changed', () => {
    render(<InteractiveGridBuilder totalStatements={25} />);
    
    const rangeSelect = screen.getByRole('combobox');
    fireEvent.change(rangeSelect, { target: { value: '4' } });
    
    // Check if grid updated to show -4 to +4
    expect(screen.getByText('+4')).toBeInTheDocument();
    expect(screen.getByText('-4')).toBeInTheDocument();
  });

  test('Distribution presets update grid cells', () => {
    render(<InteractiveGridBuilder totalStatements={25} />);
    
    const flatButton = screen.getByText('Flat Distribution');
    fireEvent.click(flatButton);
    
    // Flat distribution should be selected
    expect(flatButton).toHaveClass('bg-blue-500');
  });

  test('Symmetry toggle maintains mirror balance', () => {
    render(<InteractiveGridBuilder totalStatements={16} />);
    
    const symmetryCheckbox = screen.getByRole('checkbox');
    expect(symmetryCheckbox).toBeChecked(); // Default is true
    
    // Toggle symmetry off
    fireEvent.click(symmetryCheckbox);
    expect(symmetryCheckbox).not.toBeChecked();
  });
});

describe('Phase 6.85 - Stimuli Upload System', () => {
  const mockGrid = {
    columns: [
      { value: -2, label: 'Disagree', cells: 2 },
      { value: 0, label: 'Neutral', cells: 3 },
      { value: 2, label: 'Agree', cells: 2 }
    ],
    totalCells: 7
  };

  test('StimuliUploadSystem renders with grid preview', () => {
    render(<StimuliUploadSystem grid={mockGrid} />);
    
    // Check header
    expect(screen.getByText('Upload Stimuli')).toBeInTheDocument();
    expect(screen.getByText(/Upload 7 items/)).toBeInTheDocument();
    
    // Check grid preview columns
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  test('Progress bar shows upload progress', () => {
    render(<StimuliUploadSystem grid={mockGrid} />);
    
    // Check initial progress
    expect(screen.getByText('0 / 7 stimuli')).toBeInTheDocument();
  });

  test('Text stimulus editor can be opened', () => {
    render(<StimuliUploadSystem grid={mockGrid} />);
    
    const addTextButton = screen.getByText('Add Text Stimulus');
    fireEvent.click(addTextButton);
    
    // Modal should appear
    expect(screen.getByText('Create Text Stimulus')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your text stimulus/)).toBeInTheDocument();
  });

  test('Dropzone accepts file drops', () => {
    render(<StimuliUploadSystem grid={mockGrid} />);
    
    const dropzone = screen.getByText(/Drag & drop files here/);
    expect(dropzone).toBeInTheDocument();
  });
});

describe('Phase 6.85 - Resizable Image', () => {
  test('ResizableImage renders with controls', () => {
    render(
      <ResizableImage 
        src="/test-image.jpg"
        alt="Test Image"
        initialSize={{ width: 300, height: 200 }}
      />
    );
    
    // Image should be rendered
    const img = screen.getByAltText('Test Image');
    expect(img).toBeInTheDocument();
  });

  test('Non-editable image renders without controls', () => {
    render(
      <ResizableImage 
        src="/test-image.jpg"
        alt="Test Image"
        editable={false}
      />
    );
    
    const img = screen.getByAltText('Test Image');
    expect(img).toBeInTheDocument();
    
    // Should not have resizable wrapper
    expect(screen.queryByClassName('react-rnd')).not.toBeInTheDocument();
  });
});

describe('Phase 6.85 - Study Builder Store', () => {
  beforeEach(() => {
    useStudyBuilderStore.setState({
      studyMetadata: { title: '', description: '' },
      gridConfiguration: {
        rangeMin: -3,
        rangeMax: 3,
        columns: [],
        symmetry: true,
        totalCells: 0,
        distribution: 'bell'
      },
      stimuli: [],
      isDirty: false,
      validationErrors: []
    });
  });

  test('Store updates study metadata', () => {
    const { setStudyMetadata } = useStudyBuilderStore.getState();
    
    setStudyMetadata({ 
      title: 'Test Study',
      description: 'Test Description'
    });
    
    const { studyMetadata, isDirty } = useStudyBuilderStore.getState();
    expect(studyMetadata.title).toBe('Test Study');
    expect(studyMetadata.description).toBe('Test Description');
    expect(isDirty).toBe(true);
  });

  test('Store updates grid configuration', () => {
    const { updateGrid } = useStudyBuilderStore.getState();
    
    updateGrid({
      rangeMin: -4,
      rangeMax: 4,
      totalCells: 25
    });
    
    const { gridConfiguration, isDirty } = useStudyBuilderStore.getState();
    expect(gridConfiguration.rangeMin).toBe(-4);
    expect(gridConfiguration.rangeMax).toBe(4);
    expect(gridConfiguration.totalCells).toBe(25);
    expect(isDirty).toBe(true);
  });

  test('Store adds and removes stimuli', () => {
    const { addStimulus, removeStimulus } = useStudyBuilderStore.getState();
    
    const testStimulus = {
      id: 'test-1',
      type: 'TEXT' as const,
      content: 'Test stimulus',
      uploadStatus: 'complete' as const
    };
    
    addStimulus(testStimulus);
    
    let { stimuli } = useStudyBuilderStore.getState();
    expect(stimuli).toHaveLength(1);
    expect(stimuli[0].id).toBe('test-1');
    
    removeStimulus('test-1');
    
    stimuli = useStudyBuilderStore.getState().stimuli;
    expect(stimuli).toHaveLength(0);
  });

  test('Store validates study correctly', () => {
    const { validateStudy, setStudyMetadata, updateGrid } = useStudyBuilderStore.getState();
    
    // Should fail without title
    let isValid = validateStudy();
    expect(isValid).toBe(false);
    
    // Add title
    setStudyMetadata({ title: 'Test Study' });
    
    // Update grid
    updateGrid({ totalCells: 10 });
    
    // Should still fail due to stimuli mismatch
    isValid = validateStudy();
    expect(isValid).toBe(false);
    
    const { validationErrors } = useStudyBuilderStore.getState();
    expect(validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'stimuli',
        message: expect.stringContaining('must match grid cells')
      })
    );
  });
});

describe('Phase 6.85 - API Integration', () => {
  beforeEach(() => {
    (global.fetch as any).mockReset();
  });

  test('Grid configuration saves to API', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} })
    });

    const response = await fetch('/api/studies/test-id/grid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rangeMin: -3,
        rangeMax: 3,
        columns: [],
        symmetry: true,
        totalCells: 16,
        distribution: 'bell'
      })
    });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/studies/test-id/grid',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  test('Stimuli upload sends correct data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: { id: 'stim-1', type: 'TEXT', content: 'Test' }
      })
    });

    const formData = new FormData();
    formData.append('type', 'TEXT');
    formData.append('content', 'Test stimulus');

    const response = await fetch('/api/studies/test-id/stimuli', {
      method: 'POST',
      body: formData
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.type).toBe('TEXT');
  });
});