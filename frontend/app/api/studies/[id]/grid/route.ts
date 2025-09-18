import { NextRequest, NextResponse } from 'next/server';

// Type definitions for Grid Configuration
interface GridColumn {
  value: number;
  label: string;
  customLabel?: string;
  cells: number;
}

interface GridConfiguration {
  rangeMin: number;
  rangeMax: number;
  columns: GridColumn[];
  symmetry: boolean;
  totalCells: number;
  distribution: 'bell' | 'flat' | 'forced';
  instructions?: string;
}

// Mock database for now (replace with Prisma later)
const gridConfigurations = new Map<string, GridConfiguration>();

// GET /api/studies/[id]/grid - Get grid configuration for a study
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    
    // Get existing configuration or return default
    const config = gridConfigurations.get(studyId) || getDefaultGridConfiguration();
    
    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('Error fetching grid configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grid configuration' },
      { status: 500 }
    );
  }
}

// POST /api/studies/[id]/grid - Create grid configuration for a study
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    const body: GridConfiguration = await request.json();
    
    // Validate grid configuration
    const validation = validateGridConfiguration(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    // Save configuration
    gridConfigurations.set(studyId, body);
    
    // In production, emit WebSocket event for real-time sync
    // emitGridUpdate(studyId, body);
    
    return NextResponse.json({
      success: true,
      data: body,
      message: 'Grid configuration saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving grid configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save grid configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/studies/[id]/grid - Update grid configuration for a study
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    const body: Partial<GridConfiguration> = await request.json();
    
    // Get existing configuration
    const existing = gridConfigurations.get(studyId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Grid configuration not found' },
        { status: 404 }
      );
    }
    
    // Merge with existing
    const updated = { ...existing, ...body };
    
    // Validate updated configuration
    const validation = validateGridConfiguration(updated);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    // Save updated configuration
    gridConfigurations.set(studyId, updated);
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Grid configuration updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating grid configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update grid configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/studies/[id]/grid - Delete grid configuration for a study
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id;
    
    if (!gridConfigurations.has(studyId)) {
      return NextResponse.json(
        { success: false, error: 'Grid configuration not found' },
        { status: 404 }
      );
    }
    
    gridConfigurations.delete(studyId);
    
    return NextResponse.json({
      success: true,
      message: 'Grid configuration deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting grid configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete grid configuration' },
      { status: 500 }
    );
  }
}

// Helper function to get default grid configuration
function getDefaultGridConfiguration(): GridConfiguration {
  return {
    rangeMin: -3,
    rangeMax: 3,
    columns: [
      { value: -3, label: 'Most Disagree', cells: 1 },
      { value: -2, label: 'Disagree', cells: 2 },
      { value: -1, label: 'Slightly Disagree', cells: 3 },
      { value: 0, label: 'Neutral', cells: 4 },
      { value: 1, label: 'Slightly Agree', cells: 3 },
      { value: 2, label: 'Agree', cells: 2 },
      { value: 3, label: 'Most Agree', cells: 1 }
    ],
    symmetry: true,
    totalCells: 16,
    distribution: 'bell',
    instructions: 'Please sort the statements according to your level of agreement.'
  };
}

// Helper function to validate grid configuration
function validateGridConfiguration(config: GridConfiguration): { valid: boolean; error?: string } {
  // Check if range is valid
  if (config.rangeMin >= config.rangeMax) {
    return { valid: false, error: 'Range minimum must be less than maximum' };
  }
  
  // Check if range is within limits
  if (Math.abs(config.rangeMin) > 6 || Math.abs(config.rangeMax) > 6) {
    return { valid: false, error: 'Range cannot exceed -6 to +6' };
  }
  
  // Check if columns match range
  const expectedColumns = config.rangeMax - config.rangeMin + 1;
  if (config.columns.length !== expectedColumns) {
    return { valid: false, error: 'Number of columns must match the range' };
  }
  
  // Check if total cells match sum of column cells
  const sumCells = config.columns.reduce((sum, col) => sum + col.cells, 0);
  if (sumCells !== config.totalCells) {
    return { valid: false, error: 'Sum of column cells must equal total cells' };
  }
  
  // Check symmetry if enabled
  if (config.symmetry) {
    const midPoint = Math.floor(config.columns.length / 2);
    for (let i = 0; i < midPoint; i++) {
      const mirrorIndex = config.columns.length - 1 - i;
      const column = config.columns[i];
      const mirrorColumn = config.columns[mirrorIndex];
      if (column && mirrorColumn && column.cells !== mirrorColumn.cells) {
        return { valid: false, error: 'Grid must be symmetric when symmetry is enabled' };
      }
    }
  }
  
  // Check instructions length
  if (config.instructions && config.instructions.length > 500) {
    return { valid: false, error: 'Instructions cannot exceed 500 characters' };
  }
  
  return { valid: true };
}