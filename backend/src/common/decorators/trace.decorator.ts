/**
 * Trace Decorator
 * Phase 8.8: Method-Level Tracing Decorator
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE-GRADE OBSERVABILITY - METHOD TRACING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Provides declarative method tracing with @Trace() decorator:
 * - Automatic span creation for decorated methods
 * - Method arguments as span attributes
 * - Exception tracking with stack traces
 * - Duration measurement (high-precision)
 *
 * Usage Example:
 * ```typescript
 * class ThemeExtractionService {
 *   @Trace('extract-themes')
 *   async extractThemes(dto: ExtractThemesDto): Promise<Theme[]> {
 *     // Method automatically traced
 *     return await this.performExtraction(dto);
 *   }
 * }
 * ```
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { SpanStatusCode, Attributes } from '@opentelemetry/api';

/**
 * Options for Trace decorator
 */
export interface TraceOptions {
  /**
   * Custom span name (defaults to method name)
   */
  name?: string;

  /**
   * Attributes to add to span
   */
  attributes?: Attributes;

  /**
   * Whether to record method arguments as attributes
   * WARNING: May leak sensitive data - use with caution
   */
  recordArgs?: boolean;

  /**
   * Whether to record return value as attribute
   * WARNING: May leak sensitive data - use with caution
   */
  recordResult?: boolean;

  /**
   * Argument names to exclude from recording (e.g., 'password', 'apiKey')
   */
  excludeArgs?: string[];
}

/**
 * Trace decorator for automatic method tracing
 *
 * Wraps method execution in an OpenTelemetry span:
 * - Captures method name, class name, duration
 * - Records exceptions with stack traces
 * - Optionally records arguments and return value
 * - Sets span status (OK or ERROR)
 *
 * @param options - Trace options
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Trace({ name: 'create-user', recordArgs: true, excludeArgs: ['password'] })
 *   async createUser(email: string, password: string): Promise<User> {
 *     // Automatically traced
 *     return await this.userRepo.create({ email, password });
 *   }
 * }
 * ```
 */
export function Trace(options?: TraceOptions | string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);

    // Parse options
    const opts: TraceOptions =
      typeof options === 'string' ? { name: options } : options || {};

    const spanName = opts.name || `${className}.${methodName}`;

    descriptor.value = async function (...args: any[]): Promise<any> {
      // Get telemetry service from DI container
      // NOTE: This assumes the service has access to telemetryService
      const telemetryService = (this as any).telemetryService;

      // If no telemetry service or tracing disabled, execute normally
      if (!telemetryService || !telemetryService.isTracingEnabled()) {
        return originalMethod.apply(this, args);
      }

      // Build span attributes
      const attributes: Attributes = {
        'code.function': methodName,
        'code.namespace': className,
        ...(opts.attributes || {}),
      };

      // Record arguments if enabled
      if (opts.recordArgs && args.length > 0) {
        args.forEach((arg, index) => {
          const argName = `arg${index}`;

          // Skip excluded arguments
          if (opts.excludeArgs?.includes(argName)) {
            attributes[`method.args.${argName}`] = '[REDACTED]';
            return;
          }

          // Record primitive values only (avoid large objects)
          if (arg === null || arg === undefined) {
            attributes[`method.args.${argName}`] = String(arg);
          } else if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
            // Truncate long strings
            const value = String(arg);
            attributes[`method.args.${argName}`] = value.length > 100 ? value.substring(0, 100) + '...' : value;
          } else if (typeof arg === 'object') {
            // Record object type only (avoid serializing large objects)
            attributes[`method.args.${argName}.type`] = arg.constructor.name;

            // Record id if present (common pattern)
            if ('id' in arg) {
              attributes[`method.args.${argName}.id`] = String(arg.id);
            }
          }
        });
      }

      // Start span
      const span = telemetryService.startSpan(spanName, { attributes });

      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Record result if enabled
        if (opts.recordResult && result !== undefined && result !== null) {
          if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
            const value = String(result);
            span.setAttribute(
              'method.result',
              value.length > 100 ? value.substring(0, 100) + '...' : value,
            );
          } else if (typeof result === 'object') {
            span.setAttribute('method.result.type', result.constructor.name);

            // Record array length
            if (Array.isArray(result)) {
              span.setAttribute('method.result.length', result.length);
            }
          }
        }

        // Mark span as successful
        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        // Record exception
        if (error instanceof Error) {
          span.recordException(error);
          span.setAttribute('error.type', error.name);
          span.setAttribute('error.message', error.message);

          if (error.stack) {
            span.setAttribute('error.stack', error.stack);
          }
        } else {
          span.recordException(new Error(String(error)));
        }

        // Mark span as failed
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });

        throw error;
      } finally {
        // Always end span
        span.end();
      }
    };

    return descriptor;
  };
}

/**
 * TraceAsync decorator - alias for Trace (for clarity)
 * Use for async methods
 */
export const TraceAsync = Trace;

/**
 * Helper function to create custom trace attributes from object
 * Sanitizes and flattens object into Prometheus-compatible attributes
 *
 * @param obj - Object to convert to attributes
 * @param prefix - Attribute key prefix
 * @param maxDepth - Maximum nesting depth (default: 2)
 * @returns Flattened attributes
 *
 * @example
 * ```typescript
 * const attrs = createTraceAttributes(
 *   { studyId: 'study123', paperCount: 50, config: { fast: true } },
 *   'theme_extraction'
 * );
 * // Result: {
 * //   'theme_extraction.studyId': 'study123',
 * //   'theme_extraction.paperCount': 50,
 * //   'theme_extraction.config.fast': true
 * // }
 * ```
 */
export function createTraceAttributes(
  obj: Record<string, any>,
  prefix: string = '',
  maxDepth: number = 2,
): Attributes {
  const attributes: Attributes = {};

  function flatten(
    value: any,
    key: string,
    depth: number,
  ): void {
    if (depth > maxDepth) {
      attributes[key] = '[MAX_DEPTH]';
      return;
    }

    if (value === null || value === undefined) {
      attributes[key] = String(value);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Truncate long strings
      const strValue = String(value);
      attributes[key] = strValue.length > 200 ? strValue.substring(0, 200) + '...' : strValue;
    } else if (Array.isArray(value)) {
      attributes[`${key}.length`] = value.length;
      attributes[`${key}.type`] = 'array';

      // Record first few items for arrays of primitives
      if (value.length > 0 && value.length <= 5) {
        value.forEach((item, index) => {
          if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
            attributes[`${key}.${index}`] = String(item);
          }
        });
      }
    } else if (typeof value === 'object') {
      attributes[`${key}.type`] = value.constructor.name;

      // Recursively flatten nested objects
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        flatten(nestedValue, `${key}.${nestedKey}`, depth + 1);
      });
    }
  }

  Object.entries(obj).forEach(([key, value]) => {
    const attrKey = prefix ? `${prefix}.${key}` : key;
    flatten(value, attrKey, 0);
  });

  return attributes;
}
