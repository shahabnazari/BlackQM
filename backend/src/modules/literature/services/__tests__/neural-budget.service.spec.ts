/**
 * Neural Budget Service Tests
 * Phase 10.112 Week 3: Netflix-Grade Dynamic Resource Management
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NeuralBudgetService, BudgetRequest, RequestPriority } from '../neural-budget.service';

describe('NeuralBudgetService', () => {
  let service: NeuralBudgetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NeuralBudgetService],
    }).compile();

    service = module.get<NeuralBudgetService>(NeuralBudgetService);
    service.resetStats();
  });

  afterEach(() => {
    service.resetStats();
  });

  describe('getSystemLoad', () => {
    it('should return valid system load metrics', () => {
      const load = service.getSystemLoad();

      expect(load).toHaveProperty('cpuUsage');
      expect(load).toHaveProperty('memoryUsage');
      expect(load).toHaveProperty('heapUsed');
      expect(load).toHaveProperty('heapTotal');
      expect(load).toHaveProperty('activeRequests');
      expect(load).toHaveProperty('queueDepth');
      expect(load).toHaveProperty('loadAverage');

      // Validate ranges
      expect(load.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(load.cpuUsage).toBeLessThanOrEqual(100);
      expect(load.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(load.memoryUsage).toBeLessThanOrEqual(100);
      expect(load.heapUsed).toBeGreaterThan(0);
      expect(load.heapTotal).toBeGreaterThan(0);
      expect(load.activeRequests).toBeGreaterThanOrEqual(0);
      expect(load.queueDepth).toBeGreaterThanOrEqual(0);
    });
  });

  describe('requestBudget', () => {
    const normalRequest: BudgetRequest = {
      priority: 'normal',
      estimatedPapers: 500,
      requiresNeuralReranking: true,
      requiresEmbeddings: true,
    };

    it('should return a valid budget allocation', () => {
      const budget = service.requestBudget(normalRequest);

      expect(budget).toHaveProperty('maxConcurrentRequests');
      expect(budget).toHaveProperty('batchSize');
      expect(budget).toHaveProperty('timeoutMs');
      expect(budget).toHaveProperty('qualityLevel');
      expect(budget).toHaveProperty('skipNeuralReranking');
      expect(budget).toHaveProperty('skipEmbeddings');
      expect(budget).toHaveProperty('reason');

      expect(budget.maxConcurrentRequests).toBeGreaterThan(0);
      expect(budget.batchSize).toBeGreaterThan(0);
      expect(budget.timeoutMs).toBeGreaterThan(0);
      expect(['full', 'standard', 'reduced', 'minimal']).toContain(budget.qualityLevel);
    });

    it('should increment total requests counter', () => {
      const metricsBefore = service.getMetrics();
      service.requestBudget(normalRequest);
      const metricsAfter = service.getMetrics();

      expect(metricsAfter.totalRequests).toBe(metricsBefore.totalRequests + 1);
    });

    it('should allocate full quality for high priority under normal load', () => {
      const highPriorityRequest: BudgetRequest = {
        priority: 'high',
        estimatedPapers: 100,
        requiresNeuralReranking: true,
        requiresEmbeddings: true,
      };

      const budget = service.requestBudget(highPriorityRequest);
      // Under normal load, high priority should get full or standard quality
      expect(['full', 'standard']).toContain(budget.qualityLevel);
    });

    it('should not skip embeddings for high priority requests', () => {
      const highPriorityRequest: BudgetRequest = {
        priority: 'high',
        estimatedPapers: 100,
        requiresNeuralReranking: true,
        requiresEmbeddings: true,
      };

      const budget = service.requestBudget(highPriorityRequest);
      // High priority should not skip embeddings unless under extreme load
      // Under normal test conditions, this should be false
      expect(budget.skipEmbeddings).toBe(false);
    });

    it('should respect estimated paper count in batch size', () => {
      const smallRequest: BudgetRequest = {
        priority: 'normal',
        estimatedPapers: 10,
        requiresNeuralReranking: false,
        requiresEmbeddings: false,
      };

      const budget = service.requestBudget(smallRequest);
      expect(budget.batchSize).toBeLessThanOrEqual(10);
    });
  });

  describe('startRequest and endRequest', () => {
    it('should track active requests', () => {
      const loadBefore = service.getSystemLoad();
      service.startRequest();
      const loadDuring = service.getSystemLoad();
      service.endRequest();
      const loadAfter = service.getSystemLoad();

      expect(loadDuring.activeRequests).toBe(loadBefore.activeRequests + 1);
      expect(loadAfter.activeRequests).toBe(loadBefore.activeRequests);
    });

    it('should not go below zero active requests', () => {
      service.endRequest();
      service.endRequest();
      service.endRequest();

      const load = service.getSystemLoad();
      expect(load.activeRequests).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMetrics', () => {
    it('should return valid metrics object', () => {
      const metrics = service.getMetrics();

      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('grantedRequests');
      expect(metrics).toHaveProperty('throttledRequests');
      expect(metrics).toHaveProperty('shedRequests');
      expect(metrics).toHaveProperty('averageBatchSize');
      expect(metrics).toHaveProperty('averageQualityLevel');
      expect(metrics).toHaveProperty('currentLoad');
    });

    it('should track granted requests', () => {
      service.requestBudget({
        priority: 'normal',
        estimatedPapers: 100,
        requiresNeuralReranking: true,
        requiresEmbeddings: true,
      });

      const metrics = service.getMetrics();
      expect(metrics.grantedRequests).toBeGreaterThanOrEqual(1);
    });
  });

  describe('resetStats', () => {
    it('should reset all counters', () => {
      // Make some requests
      service.requestBudget({
        priority: 'normal',
        estimatedPapers: 100,
        requiresNeuralReranking: true,
        requiresEmbeddings: true,
      });
      service.startRequest();
      service.startRequest();

      // Reset
      service.resetStats();

      const metrics = service.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.grantedRequests).toBe(0);
      expect(metrics.throttledRequests).toBe(0);
      expect(metrics.shedRequests).toBe(0);
      expect(metrics.currentLoad.activeRequests).toBe(0);
      expect(metrics.currentLoad.queueDepth).toBe(0);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status under normal conditions', () => {
      const health = service.getHealthStatus();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('load');

      // Under test conditions, system should be healthy
      expect(health.healthy).toBe(true);
      expect(health.status).toContain('OK');
    });
  });

  describe('Priority handling', () => {
    it('should handle all priority levels', () => {
      const priorities: RequestPriority[] = ['high', 'normal', 'low', 'background'];

      for (const priority of priorities) {
        const budget = service.requestBudget({
          priority,
          estimatedPapers: 100,
          requiresNeuralReranking: true,
          requiresEmbeddings: true,
        });

        expect(budget).toBeDefined();
        expect(budget.qualityLevel).toBeDefined();
      }
    });

    it('should give better quality to higher priority', () => {
      const qualityOrder = { full: 4, standard: 3, reduced: 2, minimal: 1 };

      const highBudget = service.requestBudget({
        priority: 'high',
        estimatedPapers: 100,
        requiresNeuralReranking: true,
        requiresEmbeddings: true,
      });

      const backgroundBudget = service.requestBudget({
        priority: 'background',
        estimatedPapers: 100,
        requiresNeuralReranking: true,
        requiresEmbeddings: true,
      });

      // High priority should have equal or better quality than background
      expect(qualityOrder[highBudget.qualityLevel]).toBeGreaterThanOrEqual(
        qualityOrder[backgroundBudget.qualityLevel]
      );
    });
  });

  describe('Timeout configuration', () => {
    it('should set appropriate timeout based on quality level', () => {
      const budget = service.requestBudget({
        priority: 'normal',
        estimatedPapers: 100,
        requiresNeuralReranking: true,
        requiresEmbeddings: true,
      });

      // Timeout should be positive and reasonable
      expect(budget.timeoutMs).toBeGreaterThan(0);
      expect(budget.timeoutMs).toBeLessThanOrEqual(60000); // Max 60 seconds
    });
  });
});
