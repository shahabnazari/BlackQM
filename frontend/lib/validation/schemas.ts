/**
 * Comprehensive Zod validation schemas for type-safe runtime validation
 * Implements enterprise-grade validation with custom error messages
 */

import { z } from 'zod';

/**
 * Custom error messages for common validation scenarios
 */
const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  min: (min: number) => `Must be at least ${min} characters`,
  max: (max: number) => `Must be at most ${max} characters`,
  pattern: 'Invalid format',
  number: 'Must be a valid number',
  positive: 'Must be a positive number',
  integer: 'Must be a whole number',
} as const;

/**
 * Common validation patterns
 */
const patterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2}$/i,
  phone:
    /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

/**
 * Base schemas for common types
 */
export const baseSchemas = {
  /**
   * Email schema with validation
   */
  email: z
    .string({ message: errorMessages.required })
    .email(errorMessages.email)
    .toLowerCase()
    .trim(),

  /**
   * Password schema with complexity requirements
   */
  password: z
    .string({ message: errorMessages.required })
    .min(8, errorMessages.min(8))
    .regex(
      patterns.password,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  /**
   * Phone number schema
   */
  phone: z
    .string({ message: errorMessages.required })
    .regex(patterns.phone, 'Please enter a valid phone number')
    .optional(),

  /**
   * URL schema
   */
  url: z
    .string({ message: errorMessages.required })
    .url(errorMessages.url)
    .trim(),

  /**
   * UUID schema
   */
  uuid: z
    .string({ message: errorMessages.required })
    .regex(patterns.uuid, 'Invalid ID format'),

  /**
   * Slug schema
   */
  slug: z
    .string({ message: errorMessages.required })
    .regex(patterns.slug, 'Invalid slug format')
    .min(1, errorMessages.min(1))
    .max(100, errorMessages.max(100)),

  /**
   * Date schemas
   */
  date: z.coerce.date({
    message: 'Invalid date',
  }),

  futureDate: z.coerce.date().refine((date: any) => date > new Date(), {
    message: 'Date must be in the future',
  }),

  pastDate: z.coerce.date().refine((date: any) => date < new Date(), {
    message: 'Date must be in the past',
  }),

  /**
   * Numeric schemas
   */
  positiveInt: z
    .number({ message: errorMessages.required })
    .int(errorMessages.integer)
    .positive(errorMessages.positive),

  percentage: z
    .number({ message: errorMessages.required })
    .min(0, 'Must be at least 0')
    .max(100, 'Must be at most 100'),

  currency: z
    .number({ message: errorMessages.required })
    .positive(errorMessages.positive)
    .multipleOf(0.01, 'Invalid currency format'),
} as const;

/**
 * User authentication schemas
 */
export const authSchemas = {
  /**
   * Login schema
   */
  login: z.object({
    email: baseSchemas.email,
    password: z.string({ message: errorMessages.required }).min(1),
    rememberMe: z.boolean().optional().default(false),
  }),

  /**
   * Registration schema
   */
  register: z
    .object({
      firstName: z
        .string({ message: errorMessages.required })
        .min(2, errorMessages.min(2))
        .max(50, errorMessages.max(50)),
      lastName: z
        .string({ message: errorMessages.required })
        .min(2, errorMessages.min(2))
        .max(50, errorMessages.max(50)),
      email: baseSchemas.email,
      password: baseSchemas.password,
      confirmPassword: z.string({ message: errorMessages.required }),
      acceptTerms: z.boolean().refine((val: any) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
    })
    .refine((data: any) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),

  /**
   * Password reset request schema
   */
  forgotPassword: z.object({
    email: baseSchemas.email,
  }),

  /**
   * Password reset schema
   */
  resetPassword: z
    .object({
      token: z.string({ message: errorMessages.required }),
      password: baseSchemas.password,
      confirmPassword: z.string({ message: errorMessages.required }),
    })
    .refine((data: any) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),

  /**
   * Profile update schema
   */
  updateProfile: z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    email: baseSchemas.email.optional(),
    phone: baseSchemas.phone,
    bio: z.string().max(500).optional(),
    avatar: baseSchemas.url.optional(),
  }),
} as const;

/**
 * Study and research schemas
 */
export const studySchemas = {
  /**
   * Study creation schema
   */
  createStudy: z
    .object({
      title: z
        .string({ message: errorMessages.required })
        .min(5, errorMessages.min(5))
        .max(200, errorMessages.max(200)),
      description: z
        .string({ message: errorMessages.required })
        .min(10, errorMessages.min(10))
        .max(2000, errorMessages.max(2000)),
      type: z.enum(['qsort', 'survey', 'interview', 'mixed'], {
        message: 'Please select a study type',
      }),
      visibility: z.enum(['public', 'private', 'unlisted']).default('private'),
      startDate: baseSchemas.futureDate.optional(),
      endDate: baseSchemas.futureDate.optional(),
      maxParticipants: baseSchemas.positiveInt.optional(),
      compensation: z
        .object({
          type: z
            .enum(['none', 'monetary', 'gift_card', 'other'])
            .default('none'),
          amount: z.number().positive().optional(),
          currency: z.string().length(3).optional(),
          description: z.string().max(200).optional(),
        })
        .optional(),
      tags: z.array(z.string()).max(10).optional(),
      ethicsApproval: z
        .object({
          required: z.boolean(),
          number: z.string().optional(),
          institution: z.string().optional(),
          expiryDate: baseSchemas.date.optional(),
        })
        .optional(),
    })
    .refine(
      (data: any) =>
        !data.endDate || !data.startDate || data.endDate > data.startDate,
      {
        message: 'End date must be after start date',
        path: ['endDate'],
      }
    ),

  /**
   * Participant schema
   */
  participant: z.object({
    id: baseSchemas.uuid.optional(),
    email: baseSchemas.email,
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    status: z.enum(['invited', 'active', 'completed', 'withdrawn']),
    consentGiven: z.boolean().default(false),
    consentDate: baseSchemas.date.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    demographics: z
      .object({
        age: baseSchemas.positiveInt.optional(),
        gender: z.string().optional(),
        location: z.string().optional(),
        education: z.string().optional(),
        occupation: z.string().optional(),
      })
      .optional(),
  }),

  /**
   * Bulk participant import schema
   */
  bulkImport: z.object({
    participants: z
      .array(
        z.object({
          email: baseSchemas.email,
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        })
      )
      .min(1, 'At least one participant is required')
      .max(1000, 'Maximum 1000 participants at once'),
    sendInvitations: z.boolean().default(false),
    customMessage: z.string().max(500).optional(),
  }),
} as const;

/**
 * Questionnaire schemas
 */
export const questionnaireSchemas: any = {
  /**
   * Question validation rule schema
   */
  validationRule: z.object({
    type: z.enum(['required', 'min', 'max', 'pattern', 'custom']),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    message: z.string().optional(),
  }),

  /**
   * Question option schema
   */
  option: z.object({
    id: baseSchemas.uuid,
    label: z.string().min(1),
    value: z.union([z.string(), z.number()]),
    order: z.number().int().min(0),
  }),

  /**
   * Base question schema
   */
  question: z.object({
    id: baseSchemas.uuid,
    type: z.enum([
      'text',
      'textarea',
      'number',
      'select',
      'multiselect',
      'radio',
      'checkbox',
      'scale',
      'matrix',
      'ranking',
      'date',
      'time',
      'file',
    ]),
    title: z.string().min(1).max(500),
    description: z.string().max(1000).optional(),
    required: z.boolean().default(false),
    order: z.number().int().min(0),
    validation: z
      .array(z.lazy(() => questionnaireSchemas.validationRule))
      .optional(),
    options: z.array(z.lazy(() => questionnaireSchemas.option)).optional(),
    logic: z
      .object({
        conditions: z
          .array(
            z.object({
              questionId: baseSchemas.uuid,
              operator: z.enum([
                'equals',
                'not_equals',
                'contains',
                'greater_than',
                'less_than',
              ]),
              value: z.unknown(),
            })
          )
          .optional(),
        action: z.enum(['show', 'hide', 'skip_to']).optional(),
        target: baseSchemas.uuid.optional(),
      })
      .optional(),
  }),

  /**
   * Questionnaire schema
   */
  questionnaire: z.object({
    id: baseSchemas.uuid.optional(),
    title: z.string().min(5).max(200),
    description: z.string().max(2000).optional(),
    version: z.number().int().positive().default(1),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    questions: z.array(z.lazy(() => questionnaireSchemas.question)),
    settings: z
      .object({
        randomizeQuestions: z.boolean().default(false),
        showProgressBar: z.boolean().default(true),
        allowBackNavigation: z.boolean().default(true),
        requiredMessage: z.string().default('This field is required'),
        submitButtonText: z.string().default('Submit'),
        completionMessage: z.string().optional(),
      })
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
} as const;

/**
 * API response schemas
 */
export const apiSchemas = {
  /**
   * Pagination schema
   */
  pagination: z.object({
    page: baseSchemas.positiveInt.default(1),
    limit: baseSchemas.positiveInt
      .default(20)
      .refine((val: any) => val <= 100, {
        message: 'Limit cannot exceed 100',
      }),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),

  /**
   * Sort schema
   */
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),

  /**
   * Filter schema
   */
  filter: z.object({
    field: z.string(),
    operator: z.enum([
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'in',
      'nin',
      'like',
    ]),
    value: z.unknown(),
  }),

  /**
   * Success response schema
   */
  successResponse: <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
      success: z.literal(true),
      data: dataSchema,
      message: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),

  /**
   * Error response schema
   */
  errorResponse: z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
      timestamp: z.string().datetime(),
    }),
  }),

  /**
   * Paginated response schema
   */
  paginatedResponse: <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
      success: z.literal(true),
      data: z.array(itemSchema),
      pagination: apiSchemas.pagination,
      sort: apiSchemas.sort.optional(),
      filters: z.array(apiSchemas.filter).optional(),
    }),
} as const;

/**
 * Type exports for TypeScript inference
 */
export type LoginInput = z.infer<typeof authSchemas.login>;
export type RegisterInput = z.infer<typeof authSchemas.register>;
export type CreateStudyInput = z.infer<typeof studySchemas.createStudy>;
export type ParticipantInput = z.infer<typeof studySchemas.participant>;
export type QuestionInput = z.infer<typeof questionnaireSchemas.question>;
export type QuestionnaireInput = z.infer<
  typeof questionnaireSchemas.questionnaire
>;

/**
 * Validation helper functions
 */
export const validate = {
  /**
   * Validate data against schema with detailed error messages
   */
  parse: <T extends z.ZodTypeAny>(
    schema: T,
    data: unknown
  ):
    | { success: true; data: z.infer<T> }
    | { success: false; errors: ValidationError[] } => {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        };
      }
      throw error;
    }
  },

  /**
   * Safe parse without throwing
   */
  safeParse: <T extends z.ZodTypeAny>(schema: T, data: unknown) => {
    return schema.safeParse(data);
  },

  /**
   * Check if data is valid without parsing
   */
  isValid: <T extends z.ZodTypeAny>(schema: T, data: unknown): boolean => {
    return schema.safeParse(data).success;
  },
};

/**
 * Validation error interface
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
}
