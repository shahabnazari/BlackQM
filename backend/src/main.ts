import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { SentryConfig } from './config/sentry.config';
import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  Sentry.captureException(reason);
  // Don't exit - log and continue
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  Sentry.captureException(error);
  // Don't exit - log and continue
  // In production, you might want to exit and restart via process manager
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing server gracefully');
  process.exit(0);
});

async function bootstrap() {
  // Initialize Sentry before creating the app
  const sentryConfig = new SentryConfig({
    get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
  } as any);
  sentryConfig.init();

  const app = await NestFactory.create(AppModule, {
    bodyParser: true, // Enable body parser
  });

  // Increase body size limit for large theme extraction requests
  // Default is 100kb, but we need more for 30+ themes with full source data
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  // Security middleware - relaxed for development
  if (process.env.NODE_ENV === 'production') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
      }),
    );
  } else {
    // In development, use more relaxed security settings
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );
  }

  // Compression middleware
  app.use(compression());

  // Cookie parser middleware
  app.use(cookieParser());

  // Dynamic CORS configuration
  // Phase 10.943: Reduced CORS logging - only log rejections to reduce noise
  const corsOrigin = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow any localhost port
    if (process.env.NODE_ENV !== 'production') {
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (localhostRegex.test(origin)) {
        callback(null, true);
        return;
      }
    }

    // In production, check against allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://vqmethod.com',
      'https://www.vqmethod.com',
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Phase 10.943: Only log CORS rejections (important security events)
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  };

  // Enable CORS
  // Phase 10.106: Added X-Dev-Auth-Bypass header for development auth bypass
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-ID',
      'X-Dev-Auth-Bypass', // Phase 10.106: Allow dev auth bypass header (development only)
    ],
    exposedHeaders: ['X-Correlation-ID'], // Phase 10.943: Expose correlation ID to frontend
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('VQMethod API')
    .setDescription('Advanced Q Methodology Research Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Backend server running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(
    `📊 Performance Monitoring: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled (Set SENTRY_DSN)'}`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  Sentry.captureException(error);
  process.exit(1);
});
