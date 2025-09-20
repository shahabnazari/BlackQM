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

async function bootstrap() {
  // Initialize Sentry before creating the app
  const sentryConfig = new SentryConfig({
    get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
  } as any);
  sentryConfig.init();

  const app = await NestFactory.create(AppModule);

  // Security middleware
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

  // Compression middleware
  app.use(compression());

  // Cookie parser middleware
  app.use(cookieParser());

  // Dynamic CORS configuration
  console.log('[CORS] Initializing with NODE_ENV:', process.env.NODE_ENV);

  const corsOrigin = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    console.log('[CORS] Checking origin:', origin);
    console.log('[CORS] NODE_ENV:', process.env.NODE_ENV);

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      console.log('[CORS] No origin - allowing');
      callback(null, true);
      return;
    }

    // In development, allow any localhost port
    if (process.env.NODE_ENV !== 'production') {
      // Allow localhost with any port, or 127.0.0.1 with any port
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      const isLocalhost = localhostRegex.test(origin);
      console.log('[CORS] Development mode - localhost test:', isLocalhost);

      if (isLocalhost) {
        console.log('[CORS] Allowing localhost origin:', origin);
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

    console.log('[CORS] Checking production origins:', allowedOrigins);
    if (allowedOrigins.includes(origin)) {
      console.log('[CORS] Allowing production origin:', origin);
      callback(null, true);
    } else {
      console.log('[CORS] Rejecting origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  };

  // Enable CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
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
