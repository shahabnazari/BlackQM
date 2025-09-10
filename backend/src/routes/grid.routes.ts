import { Router } from 'express';
import { GridController } from '../controllers/grid.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();
const gridController = new GridController();

// Validation rules
const gridValidation = {
  create: [
    body('rangeMin').isInt({ min: -6, max: -1 }).withMessage('Range minimum must be between -6 and -1'),
    body('rangeMax').isInt({ min: 1, max: 6 }).withMessage('Range maximum must be between 1 and 6'),
    body('columns').isArray().withMessage('Columns must be an array'),
    body('totalCells').isInt({ min: 1 }).withMessage('Total cells must be at least 1'),
    body('distribution').isIn(['bell', 'flat', 'forced', 'custom']).withMessage('Invalid distribution type'),
    body('symmetry').isBoolean().withMessage('Symmetry must be a boolean'),
  ],
  update: [
    param('id').isString().withMessage('Grid ID is required'),
    body('columns').optional().isArray().withMessage('Columns must be an array'),
    body('totalCells').optional().isInt({ min: 1 }).withMessage('Total cells must be at least 1'),
  ],
};

// Routes
router.use(authMiddleware);

// Get grid configuration for a survey
router.get('/surveys/:surveyId/grid', gridController.getGridBySurveyId);

// Create grid configuration
router.post(
  '/surveys/:surveyId/grid',
  ...gridValidation.create,
  validateRequest,
  gridController.createGrid
);

// Update grid configuration
router.put(
  '/grids/:id',
  ...gridValidation.update,
  validateRequest,
  gridController.updateGrid
);

// Delete grid configuration
router.delete('/grids/:id', gridController.deleteGrid);

// Validate grid configuration
router.post('/grids/validate', gridController.validateGrid);

export default router;