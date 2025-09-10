import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import csurf from 'csurf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: any;

  constructor(private configService: ConfigService) {
    // Configure CSRF protection
    this.csrfProtection = csurf({
      cookie: {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'strict',
      },
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for API endpoints that use JWT authentication
    if (req.path.startsWith('/api/') && req.headers.authorization) {
      return next();
    }

    // Skip CSRF for health check endpoints
    if (req.path === '/health' || 
        req.path === '/' || 
        req.path.startsWith('/api/health') ||
        req.path === '/api') {
      return next();
    }

    // Apply CSRF protection
    this.csrfProtection(req, res, (err: any) => {
      if (err) {
        if (err.code === 'EBADCSRFTOKEN') {
          return res.status(403).json({
            error: 'Invalid CSRF token',
            message: 'Form submission rejected due to invalid security token',
          });
        }
        return next(err);
      }

      // Add CSRF token to response locals
      res.locals.csrfToken = (req as any).csrfToken();
      
      // Set CSRF token header for client access
      res.setHeader('X-CSRF-Token', res.locals.csrfToken);
      
      next();
    });
  }
}