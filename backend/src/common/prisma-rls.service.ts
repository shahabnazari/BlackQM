import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

export interface RLSContext {
  userId?: string;
  tenantId?: string;
  role?: string;
}

@Injectable()
export class PrismaRLSService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaRLSService.name);
  private currentContext: RLSContext = {};

  async onModuleInit() {
    await this.$connect();
    this.setupRLSMiddleware();
    this.logger.log('Prisma RLS Service initialized with Row-Level Security');
  }

  /**
   * Set the current RLS context (called per request)
   */
  setContext(context: RLSContext) {
    this.currentContext = context;
  }

  /**
   * Clear the current context
   */
  clearContext() {
    this.currentContext = {};
  }

  /**
   * Get the current context
   */
  getContext(): RLSContext {
    return this.currentContext;
  }

  /**
   * Setup RLS middleware for all Prisma operations
   */
  private setupRLSMiddleware() {
    // Middleware for enforcing tenant isolation
    (this as any).$use(async (params: any, next: any) => {
      const context = this.getContext();
      
      // Skip RLS for certain operations
      if (!context.userId || !context.tenantId) {
        return next(params);
      }

      // Models that should be tenant-scoped
      const tenantScopedModels = [
        'User',
        'Survey',
        'Statement',
        'Response',
        'MediaFile',
        'Collaboration',
        'AuditLog',
      ];

      if (tenantScopedModels.includes(params.model)) {
        // Apply tenant filtering for read operations
        if (['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          
          // Add tenant filter
          if (params.model === 'User') {
            // For User model, ensure we only see users from the same tenant
            params.args.where.tenantId = context.tenantId;
          } else {
            // For other models, filter by user's tenant through relation
            params.args.where = {
              ...params.args.where,
              user: {
                tenantId: context.tenantId,
              },
            };
          }
        }

        // Apply tenant validation for create operations
        if (params.action === 'create') {
          params.args = params.args || {};
          params.args.data = params.args.data || {};
          
          if (params.model === 'User') {
            // Ensure new users are created in the correct tenant
            params.args.data.tenantId = context.tenantId;
          }
        }

        // Apply tenant validation for update operations
        if (['update', 'updateMany'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          
          if (params.model === 'User') {
            // Ensure we only update users in our tenant
            params.args.where.tenantId = context.tenantId;
          } else {
            // For other models, ensure we only update records owned by users in our tenant
            params.args.where = {
              ...params.args.where,
              user: {
                tenantId: context.tenantId,
              },
            };
          }
        }

        // Apply tenant validation for delete operations
        if (['delete', 'deleteMany'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          
          if (params.model === 'User') {
            // Ensure we only delete users in our tenant
            params.args.where.tenantId = context.tenantId;
          } else {
            // For other models, ensure we only delete records owned by users in our tenant
            params.args.where = {
              ...params.args.where,
              user: {
                tenantId: context.tenantId,
              },
            };
          }
        }
      }

      // Additional user-level isolation for certain models
      const userScopedModels = ['Survey', 'Response', 'MediaFile'];
      
      if (userScopedModels.includes(params.model) && context.role !== 'ADMIN') {
        // Non-admin users can only access their own records
        if (['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          params.args.where.userId = context.userId;
        }

        if (params.action === 'create') {
          params.args = params.args || {};
          params.args.data = params.args.data || {};
          params.args.data.userId = context.userId;
        }

        if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          params.args.where.userId = context.userId;
        }
      }

      const result = await next(params);
      return result;
    });

    // Middleware for audit logging
    (this as any).$use(async (params: any, next: any) => {
      const context = this.getContext();
      const startTime = Date.now();
      
      try {
        const result = await next(params);
        
        // Log data modifications
        if (
          context.userId &&
          ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(params.action)
        ) {
          const duration = Date.now() - startTime;
          
          // Create audit log entry (without triggering another middleware)
          if (params.model !== 'AuditLog') {
            await this.$executeRawUnsafe(
              `INSERT INTO "AuditLog" (id, userId, action, resource, resourceId, details, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              this.generateId(),
              context.userId,
              params.action.toUpperCase(),
              params.model,
              result?.id || 'multiple',
              JSON.stringify({
                duration,
                args: this.sanitizeForAudit(params.args),
              }),
              new Date(),
            );
          }
        }
        
        return result;
      } catch (error) {
        // Log failed operations
        if (context.userId && params.model !== 'AuditLog') {
          const duration = Date.now() - startTime;
          
          await this.$executeRawUnsafe(
            `INSERT INTO "AuditLog" (id, userId, action, resource, details, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            this.generateId(),
            context.userId,
            `${params.action.toUpperCase()}_FAILED`,
            params.model,
            JSON.stringify({
              duration,
              error: error instanceof Error ? error.message : String(error),
              args: this.sanitizeForAudit(params.args),
            }),
            new Date(),
          );
        }
        
        throw error;
      }
    });
  }

  /**
   * Generate a unique ID (similar to cuid)
   */
  private generateId(): string {
    return `cl${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Sanitize data for audit logging (remove sensitive information)
   */
  private sanitizeForAudit(data: any): any {
    if (!data) return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'twoFactorSecret', 'refreshToken', 'apiKey'];
    
    const removeSensitive = (obj: any) => {
      for (const key in obj) {
        if (sensitiveFields.includes(key)) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitive(obj[key]);
        }
      }
    };
    
    removeSensitive(sanitized);
    return sanitized;
  }
}

/**
 * Express middleware to set RLS context for each request
 */
export function createRLSMiddleware(prismaService: PrismaRLSService) {
  return (req: Request & { user?: any }, res: any, next: any) => {
    if (req.user) {
      prismaService.setContext({
        userId: req.user.id,
        tenantId: req.user.tenantId || 'default',
        role: req.user.role,
      });
    } else {
      prismaService.clearContext();
    }
    
    // Clear context after response is sent
    res.on('finish', () => {
      prismaService.clearContext();
    });
    
    next();
  };
}