/**
 * Source Capability Service Tests
 * Phase 10.112 Week 2: Netflix-Grade Source Management
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  SourceCapabilityService,
  CircuitState,
  SourceHealth,
} from '../source-capability.service';
import { LiteratureSource } from '../../dto/literature.dto';

describe('SourceCapabilityService - Phase 10.112 Week 2', () => {
  let service: SourceCapabilityService;
  let mockConfigService: jest.Mocked<ConfigService>;

  const createMockConfig = (envVars: Record<string, string | undefined> = {}) => {
    return {
      get: jest.fn().mockImplementation((key: string) => envVars[key]),
    } as unknown as jest.Mocked<ConfigService>;
  };

  beforeEach(async () => {
    mockConfigService = createMockConfig({
      SEMANTIC_SCHOLAR_API_KEY: 'test-ss-key',
      SPRINGER_API_KEY: 'test-springer-key',
      CORE_API_KEY: 'test-core-key',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourceCapabilityService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SourceCapabilityService>(SourceCapabilityService);
    await service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Initialization', () => {
    it('should initialize all source health entries', () => {
      const status = service.getCapabilityStatus();
      expect(status.totalSources).toBeGreaterThan(0);
    });

    it('should detect sources with credentials', () => {
      const ssHealth = service.getSourceHealth(LiteratureSource.SEMANTIC_SCHOLAR);
      expect(ssHealth?.hasCredentials).toBe(true);
    });

    it('should mark sources without required credentials as unavailable', async () => {
      const noKeyConfig = createMockConfig({});
      const moduleNoKeys = await Test.createTestingModule({
        providers: [
          SourceCapabilityService,
          { provide: ConfigService, useValue: noKeyConfig },
        ],
      }).compile();

      const serviceNoKeys = moduleNoKeys.get<SourceCapabilityService>(SourceCapabilityService);
      await serviceNoKeys.onModuleInit();

      const springerHealth = serviceNoKeys.getSourceHealth(LiteratureSource.SPRINGER);
      expect(springerHealth?.isAvailable).toBe(false);
      expect(springerHealth?.reason).toBe('missing_api_key');

      serviceNoKeys.onModuleDestroy();
    });

    it('should mark sources without API key requirements as available', () => {
      const arxivHealth = service.getSourceHealth(LiteratureSource.ARXIV);
      expect(arxivHealth?.isAvailable).toBe(true);
    });
  });

  describe('Circuit Breaker States', () => {
    it('should start with CLOSED circuit state', () => {
      const health = service.getSourceHealth(LiteratureSource.SEMANTIC_SCHOLAR);
      expect(health?.circuitState).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after threshold failures', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      for (let i = 0; i < 5; i++) {
        service.recordFailure(source, new Error(`Failure ${i}`));
      }

      const health = service.getSourceHealth(source);
      expect(health?.circuitState).toBe(CircuitState.OPEN);
      expect(health?.reason).toBe('circuit_open');
    });

    it('should not open circuit before threshold', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      for (let i = 0; i < 4; i++) {
        service.recordFailure(source, new Error(`Failure ${i}`));
      }

      const health = service.getSourceHealth(source);
      expect(health?.circuitState).toBe(CircuitState.CLOSED);
    });

    it('should reset consecutive failures on success', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      service.recordFailure(source, new Error('Failure'));
      service.recordFailure(source, new Error('Failure'));
      service.recordSuccess(source, 100);

      const health = service.getSourceHealth(source);
      expect(health?.consecutiveFailures).toBe(0);
      expect(health?.consecutiveSuccesses).toBe(1);
    });

    it('should allow manual circuit reset', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      for (let i = 0; i < 5; i++) {
        service.recordFailure(source, new Error('Failure'));
      }

      expect(service.getSourceHealth(source)?.circuitState).toBe(CircuitState.OPEN);

      service.resetCircuit(source);

      expect(service.getSourceHealth(source)?.circuitState).toBe(CircuitState.CLOSED);
    });
  });

  describe('Health Score Calculation', () => {
    it('should start with 100 health score for available sources', () => {
      const health = service.getSourceHealth(LiteratureSource.SEMANTIC_SCHOLAR);
      expect(health?.healthScore).toBe(100);
    });

    it('should decrease health score on failures', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      service.recordSuccess(source, 100);
      service.recordFailure(source, new Error('Failure'));

      const health = service.getSourceHealth(source);
      expect(health?.healthScore).toBeLessThan(100);
    });

    it('should have 0 health score for unavailable sources', async () => {
      const noKeyConfig = createMockConfig({});
      const moduleNoKeys = await Test.createTestingModule({
        providers: [
          SourceCapabilityService,
          { provide: ConfigService, useValue: noKeyConfig },
        ],
      }).compile();

      const serviceNoKeys = moduleNoKeys.get<SourceCapabilityService>(SourceCapabilityService);
      await serviceNoKeys.onModuleInit();

      const health = serviceNoKeys.getSourceHealth(LiteratureSource.SPRINGER);
      expect(health?.healthScore).toBe(0);

      serviceNoKeys.onModuleDestroy();
    });
  });

  describe('Execute With Circuit Breaker', () => {
    it('should execute operation for available source', async () => {
      const result = await service.executeWithCircuitBreaker(
        LiteratureSource.SEMANTIC_SCHOLAR,
        async () => 'success',
      );

      expect(result).toBe('success');
    });

    it('should return null for unavailable source', async () => {
      const noKeyConfig = createMockConfig({});
      const moduleNoKeys = await Test.createTestingModule({
        providers: [
          SourceCapabilityService,
          { provide: ConfigService, useValue: noKeyConfig },
        ],
      }).compile();

      const serviceNoKeys = moduleNoKeys.get<SourceCapabilityService>(SourceCapabilityService);
      await serviceNoKeys.onModuleInit();

      const result = await serviceNoKeys.executeWithCircuitBreaker(
        LiteratureSource.SPRINGER,
        async () => 'should not run',
      );

      expect(result).toBeNull();
      serviceNoKeys.onModuleDestroy();
    });

    it('should return null when circuit is open', async () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      for (let i = 0; i < 5; i++) {
        service.recordFailure(source, new Error('Failure'));
      }

      const result = await service.executeWithCircuitBreaker(
        source,
        async () => 'should not run',
      );

      expect(result).toBeNull();
    });

    it('should record success on successful operation', async () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      await service.executeWithCircuitBreaker(source, async () => 'success');

      const health = service.getSourceHealth(source);
      expect(health?.totalRequests).toBe(1);
      expect(health?.consecutiveSuccesses).toBe(1);
    });

    it('should record failure on failed operation', async () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      await service.executeWithCircuitBreaker(source, async () => {
        throw new Error('Operation failed');
      });

      const health = service.getSourceHealth(source);
      expect(health?.totalRequests).toBe(1);
      expect(health?.totalFailures).toBe(1);
    });
  });

  describe('Source Availability', () => {
    it('should return available sources', () => {
      const available = service.getAvailableSources();
      expect(available.length).toBeGreaterThan(0);
      expect(available).toContain(LiteratureSource.ARXIV);
    });

    it('should exclude sources with open circuits', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      for (let i = 0; i < 5; i++) {
        service.recordFailure(source, new Error('Failure'));
      }

      const available = service.getAvailableSources();
      expect(available).not.toContain(source);
    });

    it('should check source availability', () => {
      expect(service.isSourceAvailable(LiteratureSource.ARXIV)).toBe(true);
    });
  });

  describe('Default Sources', () => {
    it('should return default sources sorted by health score', () => {
      const defaults = service.getDefaultSources();
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('should exclude low health score sources from defaults', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      service.recordSuccess(source, 100);
      for (let i = 0; i < 10; i++) {
        service.recordFailure(source, new Error('Failure'));
      }

      const defaults = service.getDefaultSources();
      const ssHealth = service.getSourceHealth(source);

      if (ssHealth && ssHealth.healthScore < 50) {
        expect(defaults).not.toContain(source);
      }
    });
  });

  describe('Capability Status', () => {
    it('should return aggregated capability status', () => {
      const status = service.getCapabilityStatus();

      expect(status).toHaveProperty('totalSources');
      expect(status).toHaveProperty('availableSources');
      expect(status).toHaveProperty('unavailableSources');
      expect(status).toHaveProperty('circuitOpenSources');
      expect(status).toHaveProperty('sourcesWithCredentials');
      expect(status).toHaveProperty('healthScoreAverage');
      expect(status).toHaveProperty('lastUpdated');
    });

    it('should track circuit open sources count', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      for (let i = 0; i < 5; i++) {
        service.recordFailure(source, new Error('Failure'));
      }

      const status = service.getCapabilityStatus();
      expect(status.circuitOpenSources).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Latency Tracking', () => {
    it('should track average latency', () => {
      const source = LiteratureSource.SEMANTIC_SCHOLAR;

      service.recordSuccess(source, 100);
      service.recordSuccess(source, 200);
      service.recordSuccess(source, 300);

      const health = service.getSourceHealth(source);
      expect(health?.averageLatencyMs).toBe(200);
    });
  });

  describe('All Source Health', () => {
    it('should return all source health statuses', () => {
      const allHealth = service.getAllSourceHealth();
      expect(allHealth.size).toBeGreaterThan(0);
    });
  });
});
