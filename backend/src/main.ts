import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { SentryConfig } from './config/sentry.config';

async function bootstrap() {
  // Initialize Sentry before creating the app
  const sentryConfig = new SentryConfig({
    get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
  } as any);
  sentryConfig.init();
  
  const app = await NestFactory.create(AppModule);
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression middleware
  app.use(compression());
  
  // Cookie parser middleware (required for CSRF)
  app.use(cookieParser());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
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
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend server running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`📊 Performance Monitoring: ${process.env.SENTRY_DSN ? 'Enabled' : 'Disabled (Set SENTRY_DSN)'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  Sentry.captureException(error);
  process.exit(1);
});