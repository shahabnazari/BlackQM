import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../services/websocket.service';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class GridController {
  private wsService: WebSocketService;

  constructor() {
    this.wsService = WebSocketService.getInstance();
  }

  // Get grid configuration by survey ID
  getGridBySurveyId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { surveyId } = req.params;

      if (!surveyId) {
        return res.status(400).json({
          success: false,
          message: 'Survey ID is required',
        });
      }

      const grid = await prisma.gridConfiguration.findUnique({
        where: { surveyId },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              createdBy: true,
            },
          },
        },
      });

      if (!grid) {
        return res.status(404).json({
          success: false,
          message: 'Grid configuration not found',
        });
      }

      return res.json({
        success: true,
        data: grid,
      });
    } catch (error: any) {
      console.error('Error fetching grid configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch grid configuration',
      });
    }
  };

  // Create grid configuration
  createGrid = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { surveyId } = req.params;

      if (!surveyId) {
        return res.status(400).json({
          success: false,
          message: 'Survey ID is required',
        });
      }

      const {
        rangeMin,
        rangeMax,
        columns,
        symmetry,
        totalCells,
        distribution,
        instructions,
      } = req.body;

      // Check if survey exists and user has permission
      const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
      });

      if (!survey) {
        return res.status(404).json({
          success: false,
          message: 'Survey not found',
        });
      }

      if (survey.createdBy !== (req as AuthRequest).user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      // Check if grid already exists
      const existingGrid = await prisma.gridConfiguration.findUnique({
        where: { surveyId },
      });

      if (existingGrid) {
        return res.status(400).json({
          success: false,
          message: 'Grid configuration already exists for this survey',
        });
      }

      // Create grid configuration
      const grid = await prisma.gridConfiguration.create({
        data: {
          surveyId,
          rangeMin,
          rangeMax,
          columns,
          symmetry,
          totalCells,
          distribution,
          instructions,
        },
      });

      // Emit WebSocket event for real-time updates
      this.wsService.emitToRoom(`survey:${surveyId}`, 'grid:created', {
        gridId: grid.id,
        surveyId,
        grid,
      });

      return res.status(201).json({
        success: true,
        data: grid,
      });
    } catch (error: any) {
      console.error('Error creating grid configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create grid configuration',
      });
    }
  };

  // Update grid configuration
  updateGrid = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Grid ID is required',
        });
      }

      const updates = req.body;

      // Get existing grid to check permissions
      const existingGrid = await prisma.gridConfiguration.findUnique({
        where: { id },
        include: {
          survey: true,
        },
      });

      if (!existingGrid) {
        return res.status(404).json({
          success: false,
          message: 'Grid configuration not found',
        });
      }

      if (existingGrid.survey.createdBy !== (req as AuthRequest).user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      // Update grid configuration
      const grid = await prisma.gridConfiguration.update({
        where: { id },
        data: updates,
      });

      // Emit WebSocket event for real-time updates
      this.wsService.emitToRoom(`survey:${existingGrid.surveyId}`, 'grid:updated', {
        gridId: grid.id,
        surveyId: existingGrid.surveyId,
        updates,
      });

      return res.json({
        success: true,
        data: grid,
      });
    } catch (error: any) {
      console.error('Error updating grid configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update grid configuration',
      });
    }
  };

  // Delete grid configuration
  deleteGrid = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Grid ID is required',
        });
      }

      // Get existing grid to check permissions
      const existingGrid = await prisma.gridConfiguration.findUnique({
        where: { id },
        include: {
          survey: true,
        },
      });

      if (!existingGrid) {
        return res.status(404).json({
          success: false,
          message: 'Grid configuration not found',
        });
      }

      if (existingGrid.survey.createdBy !== (req as AuthRequest).user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied',
        });
      }

      // Delete grid configuration
      await prisma.gridConfiguration.delete({
        where: { id },
      });

      // Emit WebSocket event for real-time updates
      this.wsService.emitToRoom(`survey:${existingGrid.surveyId}`, 'grid:deleted', {
        gridId: id,
        surveyId: existingGrid.surveyId,
      });

      return res.json({
        success: true,
        message: 'Grid configuration deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting grid configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete grid configuration',
      });
    }
  };

  // Validate grid configuration
  validateGrid = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { columns, totalCells, rangeMin, rangeMax } = req.body;

      const errors: string[] = [];

      // Validate range
      if (rangeMin >= rangeMax) {
        errors.push('Range minimum must be less than range maximum');
      }

      if (rangeMin < -6 || rangeMin > -1) {
        errors.push('Range minimum must be between -6 and -1');
      }

      if (rangeMax < 1 || rangeMax > 6) {
        errors.push('Range maximum must be between 1 and 6');
      }

      // Validate columns
      if (!Array.isArray(columns)) {
        errors.push('Columns must be an array');
      } else {
        const actualTotal = columns.reduce((sum: number, col: any) => sum + (col.cells || 0), 0);
        
        if (actualTotal !== totalCells) {
          errors.push(`Cell count mismatch: expected ${totalCells}, got ${actualTotal}`);
        }

        // Check for negative cell counts
        const hasNegativeCells = columns.some((col: any) => col.cells < 0);
        if (hasNegativeCells) {
          errors.push('Cell counts cannot be negative');
        }

        // Check column values match range
        const expectedValues = [];
        for (let i = rangeMin; i <= rangeMax; i++) {
          expectedValues.push(i);
        }

        const columnValues = columns.map((col: any) => col.value);
        const valuesMatch = JSON.stringify(columnValues.sort()) === JSON.stringify(expectedValues.sort());
        
        if (!valuesMatch) {
          errors.push('Column values must match the specified range');
        }
      }

      const isValid = errors.length === 0;

      return res.json({
        success: true,
        data: {
          isValid,
          errors,
          summary: {
            totalColumns: columns.length,
            totalCells: columns.reduce((sum: number, col: any) => sum + (col.cells || 0), 0),
            range: `${rangeMin} to ${rangeMax}`,
          },
        },
      });
    } catch (error: any) {
      console.error('Error validating grid configuration:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate grid configuration',
      });
    }
  };
}