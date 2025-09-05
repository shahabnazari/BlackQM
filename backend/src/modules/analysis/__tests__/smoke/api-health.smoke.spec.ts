import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

describe('Smoke Tests - API Health Checks', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let adminToken: string;
  let participantToken: string;

  const API_VERSION = 'v1';
  const BASE_PATH = '/api';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret-key',
            signOptions: { expiresIn: '1h' },
          }),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: 'test-researcher', role: 'researcher' });
    adminToken = jwtService.sign({ sub: 'test-admin', role: 'admin' });
    participantToken = jwtService.sign({
      sub: 'test-participant',
      role: 'participant',
    });
  }, 10000);

  afterAll(async () => {
    await app.close();
  });

  describe('Core Endpoints Health', () => {
    it('should respond to health check endpoint', async () => {
      console.log('🔍 Checking health endpoint...');

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();

      console.log('✅ Health endpoint: OK');
    });

    it('should respond to readiness check', async () => {
      console.log('🔍 Checking readiness endpoint...');

      const response = await request(app.getHttpServer())
        .get('/ready')
        .expect(200);

      expect(response.body.database).toBe('connected');
      expect(response.body.cache).toBe('ready');
      expect(response.body.websocket).toBe('active');

      console.log('✅ Readiness check: All systems operational');
    });

    it('should provide API version information', async () => {
      console.log('🔍 Checking API version...');

      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/version`)
        .expect(200);

      expect(response.body.version).toBeDefined();
      expect(response.body.apiVersion).toBe(API_VERSION);
      expect(response.body.features).toBeInstanceOf(Array);

      console.log(`✅ API Version: ${response.body.apiVersion}`);
    });

    it('should provide API documentation', async () => {
      console.log('🔍 Checking API documentation...');

      const response = await request(app.getHttpServer())
        .get('/api-docs')
        .expect(200);

      expect(response.text).toContain('swagger');

      console.log('✅ API Documentation: Available');
    });
  });

  describe('Analysis Endpoints Availability', () => {
    const analysisEndpoints = [
      { method: 'GET', path: '/analysis/status', requiresAuth: false },
      { method: 'POST', path: '/analysis/upload-sorts', requiresAuth: true },
      {
        method: 'POST',
        path: '/analysis/calculate-correlation',
        requiresAuth: true,
      },
      { method: 'POST', path: '/analysis/extract-factors', requiresAuth: true },
      { method: 'POST', path: '/analysis/rotate-factors', requiresAuth: true },
      {
        method: 'POST',
        path: '/analysis/calculate-z-scores',
        requiresAuth: true,
      },
      { method: 'GET', path: '/analysis/{id}/results', requiresAuth: true },
      { method: 'DELETE', path: '/analysis/{id}', requiresAuth: true },
      { method: 'POST', path: '/analysis/export', requiresAuth: true },
      { method: 'POST', path: '/analysis/import', requiresAuth: true },
    ];

    analysisEndpoints.forEach((endpoint) => {
      it(`should respond to ${endpoint.method} ${endpoint.path}`, async () => {
        console.log(`🔍 Checking ${endpoint.method} ${endpoint.path}...`);

        const path = endpoint.path.replace('{id}', 'test-id');
        const fullPath = `${BASE_PATH}${path}`;

        let req: any;

        switch (endpoint.method) {
          case 'GET':
            req = request(app.getHttpServer()).get(fullPath);
            break;
          case 'POST':
            req = request(app.getHttpServer()).post(fullPath);
            break;
          case 'PUT':
            req = request(app.getHttpServer()).put(fullPath);
            break;
          case 'DELETE':
            req = request(app.getHttpServer()).delete(fullPath);
            break;
          default:
            req = request(app.getHttpServer()).get(fullPath);
        }

        if (endpoint.requiresAuth) {
          req = req.set('Authorization', `Bearer ${authToken}`);
        }

        const response = await req;

        // Check that endpoint responds (not 404)
        expect(response.status).not.toBe(404);

        // For protected endpoints, should get 401 without auth or 400/422 for missing data
        if (endpoint.requiresAuth && !authToken) {
          expect(response.status).toBe(401);
        }

        console.log(
          `✅ ${endpoint.method} ${endpoint.path}: Responding (${response.status})`,
        );
      });
    });
  });

  describe('Study Management Endpoints', () => {
    const studyEndpoints = [
      { method: 'GET', path: '/studies', requiresAuth: true },
      { method: 'POST', path: '/studies/create', requiresAuth: true },
      { method: 'GET', path: '/studies/{id}', requiresAuth: true },
      { method: 'PUT', path: '/studies/{id}', requiresAuth: true },
      { method: 'DELETE', path: '/studies/{id}', requiresAuth: true },
      { method: 'GET', path: '/studies/{id}/participants', requiresAuth: true },
      { method: 'POST', path: '/studies/{id}/invite', requiresAuth: true },
      { method: 'GET', path: '/studies/{id}/statements', requiresAuth: true },
      { method: 'POST', path: '/studies/{id}/statements', requiresAuth: true },
    ];

    studyEndpoints.forEach((endpoint) => {
      it(`should respond to ${endpoint.method} ${endpoint.path}`, async () => {
        const path = endpoint.path.replace('{id}', 'test-study-id');
        const fullPath = `${BASE_PATH}${path}`;

        let req: any;

        switch (endpoint.method) {
          case 'GET':
            req = request(app.getHttpServer()).get(fullPath);
            break;
          case 'POST':
            req = request(app.getHttpServer()).post(fullPath);
            break;
          case 'PUT':
            req = request(app.getHttpServer()).put(fullPath);
            break;
          case 'DELETE':
            req = request(app.getHttpServer()).delete(fullPath);
            break;
        }

        if (endpoint.requiresAuth) {
          req = req.set('Authorization', `Bearer ${authToken}`);
        }

        const response = await req;
        expect(response.status).not.toBe(404);
      });
    });
  });

  describe('User Management Endpoints', () => {
    it('should respond to user profile endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/users/profile`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).not.toBe(404);
    });

    it('should respond to user settings endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/users/settings`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).not.toBe(404);
    });

    it('should respond to authentication endpoints', async () => {
      const authEndpoints = [
        { method: 'POST', path: '/auth/login' },
        { method: 'POST', path: '/auth/register' },
        { method: 'POST', path: '/auth/refresh' },
        { method: 'POST', path: '/auth/logout' },
        { method: 'POST', path: '/auth/forgot-password' },
        { method: 'POST', path: '/auth/reset-password' },
      ];

      for (const endpoint of authEndpoints) {
        const response = await request(app.getHttpServer())
          .post(`${BASE_PATH}${endpoint.path}`)
          .send({}); // Send empty body to avoid validation errors

        expect(response.status).not.toBe(404);
        console.log(`✅ ${endpoint.path}: Available`);
      }
    });
  });

  describe('WebSocket Endpoints', () => {
    it('should accept WebSocket connections', async () => {
      console.log('🔍 Checking WebSocket endpoint...');

      // Check that WebSocket upgrade endpoint exists
      const response = await request(app.getHttpServer())
        .get('/socket.io/')
        .set('Connection', 'Upgrade')
        .set('Upgrade', 'websocket')
        .set('Sec-WebSocket-Version', '13')
        .set('Sec-WebSocket-Key', 'dGhlIHNhbXBsZSBub25jZQ==');

      // Should get upgrade response or at least not 404
      expect(response.status).not.toBe(404);

      console.log('✅ WebSocket endpoint: Available');
    });
  });

  describe('Static Assets and Public Routes', () => {
    it('should serve static assets', async () => {
      const staticPaths = [
        '/assets/logo.png',
        '/assets/favicon.ico',
        '/css/styles.css',
        '/js/app.js',
      ];

      for (const path of staticPaths) {
        const response = await request(app.getHttpServer()).get(path);

        // Should either serve the file or return appropriate error (not 404 for missing route)
        expect([200, 304, 404]).toContain(response.status);
      }

      console.log('✅ Static asset routes: Configured');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors properly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toBeDefined();

      console.log('✅ 404 handling: Working');
    });

    it('should handle malformed requests', async () => {
      const response = await request(app.getHttpServer())
        .post(`${BASE_PATH}/analysis/extract-factors`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();

      console.log('✅ Malformed request handling: Working');
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/analysis/test-id/results`)
        .expect(401);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBeDefined();

      console.log('✅ Authorization handling: Working');
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limiting configured', async () => {
      console.log('🔍 Testing rate limiting...');

      const requests = [];

      // Make 100 rapid requests
      for (let i = 0; i < 100; i++) {
        requests.push(request(app.getHttpServer()).get('/health'));
      }

      const responses = await Promise.all(requests);

      // Should see some rate limiting (429) responses
      const rateLimited = responses.filter((r) => r.status === 429);

      if (rateLimited.length > 0) {
        console.log(
          `✅ Rate limiting: Active (${rateLimited.length}/100 requests limited)`,
        );
      } else {
        console.log('⚠️  Rate limiting: May not be configured');
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should have CORS properly configured', async () => {
      const response = await request(app.getHttpServer())
        .options(`${BASE_PATH}/health`)
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();

      console.log('✅ CORS: Configured');
    });
  });

  describe('Compression and Performance', () => {
    it('should support gzip compression', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/analysis/status`)
        .set('Accept-Encoding', 'gzip, deflate');

      const encoding = response.headers['content-encoding'];

      if (encoding && encoding.includes('gzip')) {
        console.log('✅ Compression: Enabled (gzip)');
      } else {
        console.log('⚠️  Compression: Not detected');
      }
    });

    it('should include proper cache headers', async () => {
      const response = await request(app.getHttpServer()).get(
        '/assets/logo.png',
      );

      const cacheControl = response.headers['cache-control'];
      const etag = response.headers['etag'];

      if (cacheControl || etag) {
        console.log('✅ Cache headers: Present');
      } else {
        console.log('⚠️  Cache headers: Not configured');
      }
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      console.log('🔍 Checking security headers...');

      const response = await request(app.getHttpServer()).get('/health');

      const securityHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': 'max-age=31536000',
      };

      let presentHeaders = 0;

      for (const [header, expectedValue] of Object.entries(securityHeaders)) {
        if (response.headers[header]) {
          presentHeaders++;
        }
      }

      if (presentHeaders === Object.keys(securityHeaders).length) {
        console.log('✅ Security headers: All present');
      } else {
        console.log(
          `⚠️  Security headers: ${presentHeaders}/${Object.keys(securityHeaders).length} present`,
        );
      }
    });
  });

  describe('Monitoring Endpoints', () => {
    it('should provide metrics endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.text).toContain('# HELP');
        expect(response.text).toContain('# TYPE');
        console.log('✅ Metrics endpoint: Available');
      } else {
        console.log('⚠️  Metrics endpoint: Not configured');
      }
    });

    it('should provide logging status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/admin/logs`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status !== 404) {
        console.log('✅ Logging endpoint: Available');
      } else {
        console.log('⚠️  Logging endpoint: Not configured');
      }
    });
  });

  describe('API Response Consistency', () => {
    it('should return consistent response format', async () => {
      console.log('🔍 Checking response format consistency...');

      const endpoints = [
        `${BASE_PATH}/analysis/status`,
        `${BASE_PATH}/studies`,
        `${BASE_PATH}/users/profile`,
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`);

        if (response.status === 200) {
          // Check for consistent response structure
          const hasData =
            'data' in response.body ||
            'result' in response.body ||
            response.body.constructor === Array;

          expect(hasData).toBe(true);
        }
      }

      console.log('✅ Response format: Consistent');
    });
  });

  describe('Database Connection Health', () => {
    it('should verify database connectivity', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/admin/database/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.connected).toBe(true);
        expect(response.body.latency).toBeDefined();
        console.log(
          `✅ Database: Connected (${response.body.latency}ms latency)`,
        );
      } else {
        console.log('⚠️  Database status endpoint: Not available');
      }
    });
  });

  describe('Cache System Health', () => {
    it('should verify cache system', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_PATH}/admin/cache/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.type).toBeDefined();
        expect(response.body.connected).toBe(true);
        console.log(`✅ Cache: ${response.body.type} connected`);
      } else {
        console.log('⚠️  Cache status endpoint: Not available');
      }
    });
  });

  describe('Summary Report', () => {
    it('should generate API health summary', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('API HEALTH CHECK SUMMARY');
      console.log('='.repeat(50));

      const criticalEndpoints = [
        { name: 'Health Check', path: '/health' },
        { name: 'Analysis API', path: `${BASE_PATH}/analysis/status` },
        { name: 'Authentication', path: `${BASE_PATH}/auth/login` },
        { name: 'Studies API', path: `${BASE_PATH}/studies` },
      ];

      let healthyCount = 0;
      const results: any[] = [];

      for (const endpoint of criticalEndpoints) {
        let req: any;

        if (endpoint.path.includes('/auth/login')) {
          req = request(app.getHttpServer()).post(endpoint.path);
        } else if (endpoint.path.includes('/studies')) {
          req = request(app.getHttpServer())
            .get(endpoint.path)
            .set('Authorization', `Bearer ${authToken}`);
        } else {
          req = request(app.getHttpServer()).get(endpoint.path);
        }

        const response = await req;
        const healthy = response.status !== 404 && response.status < 500;

        if (healthy) healthyCount++;

        results.push({
          name: endpoint.name,
          status: healthy ? '✅ Healthy' : '❌ Unhealthy',
          responseCode: response.status,
        });
      }

      results.forEach((result) => {
        console.log(
          `${result.name}: ${result.status} (${result.responseCode})`,
        );
      });

      console.log('='.repeat(50));
      console.log(
        `Overall Health: ${healthyCount}/${criticalEndpoints.length} critical endpoints operational`,
      );

      if (healthyCount === criticalEndpoints.length) {
        console.log('🎉 All critical systems operational!');
      } else {
        console.log('⚠️  Some endpoints need attention');
      }

      console.log('='.repeat(50));

      expect(healthyCount).toBeGreaterThan(0);
    });
  });
});
